import { safeFetch } from '../safeHttpClient.js';

/**
 * HTTPS Redirection & Downgrade Check
 * Tests whether plain HTTP requests automatically redirect to secure HTTPS,
 * and verifies that no redirect chain downgrades to unencrypted protocols.
 */
export async function checkHttpsRedirect(context) {
  const findings = [];
  const parsedTarget = new URL(context.targetUrl);

  // Construct plain HTTP URL for testing redirect behavior
  const httpTestUrl = `http://${parsedTarget.hostname}${parsedTarget.port && parsedTarget.port !== '443' && parsedTarget.port !== '80' ? `:${parsedTarget.port}` : ''}${parsedTarget.pathname || '/'}`;

  try {
    const res = await safeFetch(httpTestUrl, {
      method: 'GET',
      followRedirects: true,
      maxRedirects: 5,
      timeoutMs: 8000
    });

    const redirectChain = res.redirectChain || [];
    const finalUrl = res.finalUrl;
    const finalParsed = new URL(finalUrl);

    // 1. Did HTTP redirect to HTTPS?
    if (finalParsed.protocol !== 'https:') {
      findings.push({
        ruleId: 'REDIRECT-HTTP-TO-HTTPS-MISSING',
        title: 'Plain HTTP Requests Do Not Redirect to HTTPS',
        category: 'redirect',
        severity: 'High',
        confidence: 'High',
        description: `Requests to cleartext HTTP (${httpTestUrl}) remained on HTTP without upgrading to HTTPS (ended at ${finalUrl}).`,
        evidence: {
          initialHttpUrl: httpTestUrl,
          finalUrl: finalUrl,
          statusCode: res.statusCode,
          redirectCount: redirectChain.length - 1
        },
        impact: 'Users who do not type https:// manually remain vulnerable to eavesdropping, credential interception, and MitM packet injection.',
        remediation: {
          summary: 'Configure a 301 Permanent Redirect from HTTP (port 80) to HTTPS (port 443).',
          steps: [
            'Add an HTTP-to-HTTPS redirect rule in your reverse proxy (Nginx/Apache/Cloudflare).',
            'Ensure all traffic automatically upgrades before serving cookies or accepting logins.'
          ],
          configSnippet: '// Example Nginx HTTP->HTTPS Redirect\nserver {\n  listen 80;\n  server_name example.com;\n  return 301 https://$host$request_uri;\n}',
          checklist: ['Enforce 301 redirect from port 80 to 443', 'Verify complete path and query preservation']
        },
        references: [
          { title: 'OWASP Transport Layer Protection Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html' }
        ]
      });
    }

    // 2. Check for insecure downgrade hops in redirect chain
    let foundDowngrade = false;
    for (let i = 0; i < redirectChain.length - 1; i++) {
      const current = new URL(redirectChain[i].url);
      const next = new URL(redirectChain[i + 1].url);
      if (current.protocol === 'https:' && next.protocol === 'http:') {
        foundDowngrade = true;
        break;
      }
    }

    if (foundDowngrade) {
      findings.push({
        ruleId: 'REDIRECT-HTTPS-DOWNGRADE-DETECTED',
        title: 'Insecure Protocol Downgrade in Redirect Chain',
        category: 'redirect',
        severity: 'High',
        confidence: 'High',
        description: 'During redirection, an HTTPS request was redirected down to an unencrypted HTTP destination.',
        evidence: {
          redirectChain: redirectChain.map(r => ({ url: r.url, status: r.statusCode }))
        },
        impact: 'Any encrypted session tokens or headers transmitted up to that point can be leaked over cleartext HTTP.',
        remediation: {
          summary: 'Eliminate downgrade hops in redirection rules.',
          steps: ['Audit web application redirect configurations and enforce HTTPS consistently.'],
          configSnippet: 'Always redirect to https:// destinations only.',
          checklist: ['Eliminate all plain HTTP destination URLs in redirect logic']
        },
        references: [
          { title: 'OWASP Transport Layer Protection', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html' }
        ]
      });
    }

    return {
      checkId: 'check-https-redirect',
      name: 'HTTPS Redirection & Downgrade Check',
      category: 'redirect',
      status: findings.length === 0 ? 'passed' : 'failed',
      message: findings.length === 0 ? 'HTTP correctly redirects to HTTPS with no downgrade hops observed.' : `Identified ${findings.length} redirect posture issue(s).`,
      findings
    };
  } catch (err) {
    // If connection to port 80 failed (e.g. port 80 closed, HTTPS only port open)
    return {
      checkId: 'check-https-redirect',
      name: 'HTTPS Redirection & Downgrade Check',
      category: 'redirect',
      status: 'warning',
      message: `Could not verify HTTP-to-HTTPS redirect: ${err.message}`,
      findings: []
    };
  }
}
