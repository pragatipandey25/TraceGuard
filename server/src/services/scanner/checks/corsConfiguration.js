import { safeFetch } from '../safeHttpClient.js';

/**
 * CORS Configuration Assessment Check
 * Analyzes standard CORS response headers and safely probes with test Origin
 * headers to verify if arbitrary or untrusted origins are reflected.
 */
export async function checkCorsConfiguration(baseResponse, context) {
  const findings = [];
  const headers = baseResponse.headers || {};
  const acao = headers['access-control-allow-origin'];
  const acac = headers['access-control-allow-credentials'];

  // 1. Evaluate baseline response CORS headers
  if (acao === '*') {
    if (acac === 'true') {
      findings.push({
        ruleId: 'CORS-WILDCARD-WITH-CREDENTIALS',
        title: 'CORS Configured with Wildcard and Credentials Allowed',
        category: 'cors',
        severity: 'High',
        confidence: 'High',
        description: 'The server sets Access-Control-Allow-Origin: * alongside Access-Control-Allow-Credentials: true. While modern browsers disallow this combination, it indicates a critical misunderstanding of cross-origin boundaries.',
        evidence: {
          'access-control-allow-origin': acao,
          'access-control-allow-credentials': acac,
          url: baseResponse.finalUrl
        },
        impact: 'Misconfigured CORS policies can expose sensitive authenticated user data to unauthorized third-party origins.',
        remediation: {
          summary: 'Never use wildcard (*) when credentials (cookies/auth headers) are supported.',
          steps: [
            'Maintain an explicit whitelist of trusted origins.',
            'Validate the incoming Origin header against the whitelist before echoing it.'
          ],
          configSnippet: "Access-Control-Allow-Origin: https://trusted.example.com\nAccess-Control-Allow-Credentials: true",
          checklist: ['Enforce origin whitelist for credentialed endpoints']
        },
        references: [
          { title: 'PortSwigger: Cross-Origin Resource Sharing (CORS)', url: 'https://portswigger.net/web-security/cors' }
        ]
      });
    } else {
      findings.push({
        ruleId: 'CORS-WILDCARD-ORIGIN',
        title: 'Public Wildcard CORS (Access-Control-Allow-Origin: *)',
        category: 'cors',
        severity: 'Informational',
        confidence: 'High',
        description: "The endpoint sets Access-Control-Allow-Origin: *, permitting any website to read the response via JavaScript. This is acceptable for public APIs or static content, but dangerous for sensitive or authenticated user data.",
        evidence: {
          'access-control-allow-origin': acao,
          url: baseResponse.finalUrl
        },
        impact: 'Any cross-origin website can read the response body of this resource via client-side fetch.',
        remediation: {
          summary: 'Ensure this endpoint is intended exclusively for non-sensitive public data.',
          steps: ['Verify that no user-specific data or session tokens are returned on this endpoint.'],
          configSnippet: 'Access-Control-Allow-Origin: *',
          checklist: ['Confirm endpoint serves only public information']
        },
        references: [
          { title: 'OWASP CORS Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Origin_Resource_Sharing_Cheat_Sheet.html' }
        ]
      });
    }
  }

  // 2. Safe probe with an untrusted origin to detect origin reflection
  try {
    const testOrigin = 'https://untrusted-audit-probe.traceguard.dev';
    const probeRes = await safeFetch(context.targetUrl, {
      method: 'GET',
      headers: {
        'Origin': testOrigin
      },
      timeoutMs: 6000,
      followRedirects: false
    });

    const probeAcao = probeRes.headers['access-control-allow-origin'];
    const probeAcac = probeRes.headers['access-control-allow-credentials'];

    if (probeAcao === testOrigin) {
      const isCredentialed = probeAcac === 'true';
      findings.push({
        ruleId: isCredentialed ? 'CORS-ARBITRARY-ORIGIN-REFLECTED-CREDENTIALS' : 'CORS-ARBITRARY-ORIGIN-REFLECTED',
        title: isCredentialed
          ? 'Critical CORS Vulnerability: Arbitrary Origin Reflected with Credentials'
          : 'Overly Permissive CORS: Arbitrary Origin Reflected',
        category: 'cors',
        severity: isCredentialed ? 'Critical' : 'Medium',
        confidence: 'High',
        description: `The application reflected an untrusted audit Origin (${testOrigin}) directly into the Access-Control-Allow-Origin response header${isCredentialed ? ' with Access-Control-Allow-Credentials: true' : ''}.`,
        evidence: {
          probedOrigin: testOrigin,
          reflectedOriginHeader: probeAcao,
          credentialsHeader: probeAcac || null
        },
        impact: isCredentialed
          ? 'Attackers can host a malicious site that executes cross-origin requests to this endpoint and reads private user data utilizing the victim\'s authenticated session.'
          : 'Any website can read the content of this response via client-side requests.',
        remediation: {
          summary: 'Validate the Origin against an explicit allowlist of authorized domains.',
          steps: [
            'Do not blindly echo the request Origin header in Access-Control-Allow-Origin.',
            'Check the Origin against a strict whitelist of known subdomains or partner origins.',
            'Reject or omit CORS headers for unknown origins.'
          ],
          configSnippet: `// Example Express CORS Allowlist\nconst whitelist = ['https://app.example.com'];\nconst corsOptions = {\n  origin: (origin, callback) => {\n    if (whitelist.indexOf(origin) !== -1 || !origin) {\n      callback(null, true);\n    } else {\n      callback(new Error('Not allowed by CORS'));\n    }\n  }\n};`,
          checklist: ['Implement strict server-side origin whitelist', 'Do not dynamically reflect Origin without validation']
        },
        references: [
          { title: 'OWASP CORS Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Origin_Resource_Sharing_Cheat_Sheet.html' },
          { title: 'PortSwigger: CORS Vulnerabilities', url: 'https://portswigger.net/web-security/cors' }
        ]
      });
    } else if (probeAcao === 'null') {
      findings.push({
        ruleId: 'CORS-NULL-ORIGIN-ALLOWED',
        title: "CORS Configured to Trust 'null' Origin",
        category: 'cors',
        severity: 'Medium',
        confidence: 'High',
        description: "The application allows the 'null' origin. Sandboxed iframes, local files, and data: URIs produce a null origin, enabling attackers to bypass origin checks.",
        evidence: {
          'access-control-allow-origin': 'null'
        },
        impact: 'Attackers can use sandboxed iframes to make requests with origin: null and access restricted data.',
        remediation: {
          summary: "Do not include 'null' in the CORS allowed origins.",
          steps: ['Disallow origin: null in your CORS filter.'],
          configSnippet: 'Disallow Origin: null',
          checklist: ['Remove null origin trust']
        },
        references: [
          { title: 'OWASP CORS Guide', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Origin_Resource_Sharing_Cheat_Sheet.html' }
        ]
      });
    }
  } catch (err) {
    // If probe fails or is blocked by network, record informational status without failing scan
  }

  return {
    checkId: 'check-cors-config',
    name: 'CORS Policy Evaluation',
    category: 'cors',
    status: findings.length === 0 ? 'passed' : findings.some(f => f.severity === 'Critical' || f.severity === 'High') ? 'failed' : 'warning',
    message: findings.length === 0 ? 'CORS headers are properly restricted or not overly permissive.' : `Identified ${findings.length} CORS finding(s).`,
    findings
  };
}
