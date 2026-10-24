import http from 'http';
import https from 'https';
import { validateTargetUrl } from './targetValidator.js';

const DEFAULT_TIMEOUT_MS = 10000;
const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 512 * 1024; // 512 KB cap to prevent DOS / memory bloat
const USER_AGENT = 'TraceGuard-Security-Auditor/1.0 (+https://traceguard.dev/bot-info)';

/**
 * Performs a single safe HTTP/S request with SSRF validation, size limiting,
 * and timeout enforcement.
 */
function rawSafeRequest(urlObj, options = {}) {
  return new Promise(async (resolve, reject) => {
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

    const reqOptions = {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: (urlObj.pathname || '/') + (urlObj.search || ''),
      method: options.method || 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/json,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'close',
        ...(options.headers || {})
      },
      timeout: timeoutMs,
      // Retain full certificate chain verification
      rejectUnauthorized: options.rejectUnauthorized !== undefined ? options.rejectUnauthorized : true
    };

    let totalBytes = 0;
    let bodyBuffer = [];
    let isAborted = false;
    let startTime = Date.now();

    const req = client.request(reqOptions, (res) => {
      const responseTimeMs = Date.now() - startTime;

      res.on('data', (chunk) => {
        totalBytes += chunk.length;
        if (totalBytes > MAX_BODY_BYTES) {
          isAborted = true;
          req.destroy(new Error(`Response exceeded maximum permitted size of ${MAX_BODY_BYTES} bytes`));
          return;
        }
        bodyBuffer.push(chunk);
      });

      res.on('end', () => {
        if (isAborted) return;
        const fullBody = Buffer.concat(bodyBuffer).toString('utf-8');
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          rawHeaders: res.rawHeaders,
          body: fullBody,
          bodyTruncated: totalBytes >= MAX_BODY_BYTES,
          responseTimeMs,
          httpVersion: res.httpVersion,
          socket: res.socket
        });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Executes an HTTP request safely following redirects up to MAX_REDIRECTS,
 * revalidating every redirect target against SSRF rules before connection.
 *
 * @param {string} initialUrl - Starting URL
 * @param {object} options - Options (method, headers, maxRedirects, followRedirects)
 * @returns {Promise<object>} Result containing finalUrl, redirectChain, headers, body, statusCode
 */
export async function safeFetch(initialUrl, options = {}) {
  let currentUrl = initialUrl;
  const redirectChain = [];
  let redirectsRemaining = options.maxRedirects !== undefined ? options.maxRedirects : MAX_REDIRECTS;
  const follow = options.followRedirects !== undefined ? options.followRedirects : true;

  while (true) {
    // 1. Re-validate URL destination on EVERY hop to prevent SSRF via open redirect
    const validation = await validateTargetUrl(currentUrl);
    if (!validation.isValid) {
      throw new Error(`SSRF blocked request to ${currentUrl}: ${validation.error}`);
    }

    const parsed = validation.parsedUrl;
    const response = await rawSafeRequest(parsed, options);

    redirectChain.push({
      url: currentUrl,
      statusCode: response.statusCode,
      location: response.headers.location || null
    });

    // Check for redirect status codes
    const isRedirect = [301, 302, 303, 307, 308].includes(response.statusCode);
    const locationHeader = response.headers.location;

    if (follow && isRedirect && locationHeader && redirectsRemaining > 0) {
      redirectsRemaining--;
      // Resolve relative redirect against current URL
      try {
        const nextUrlObj = new URL(locationHeader, currentUrl);
        currentUrl = nextUrlObj.toString();
      } catch (err) {
        throw new Error(`Malformed redirect Location header: "${locationHeader}"`);
      }
      continue;
    }

    // Finished redirect chain or not redirecting
    return {
      finalUrl: currentUrl,
      initialUrl,
      statusCode: response.statusCode,
      statusMessage: response.statusMessage,
      headers: response.headers,
      body: response.body,
      responseTimeMs: response.responseTimeMs,
      redirectChain,
      redirectCount: redirectChain.length - 1,
      httpVersion: response.httpVersion
    };
  }
}
