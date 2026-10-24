/**
 * Security Headers Assessment Check
 * Evaluates HTTP response headers against OWASP secure header recommendations.
 */
export function checkSecurityHeaders(response, context) {
  const findings = [];
  const headers = response.headers || {};
  const isHttps = context.targetUrl.startsWith('https://');

  // 1. Content-Security-Policy (CSP)
  const csp = headers['content-security-policy'];
  if (!csp) {
    findings.push({
      ruleId: 'SEC-HDR-CSP-MISSING',
      title: 'Missing Content-Security-Policy (CSP) Header',
      category: 'headers',
      severity: 'Medium',
      confidence: 'High',
      description: 'The response does not include a Content-Security-Policy header. CSP restricts the origins from which scripts, styles, images, and other resources can be loaded, mitigating Cross-Site Scripting (XSS) and data injection attacks.',
      evidence: {
        headerChecked: 'Content-Security-Policy',
        observedValue: null,
        url: response.finalUrl
      },
      impact: 'Without CSP, the browser has no origin restrictions on injected inline or remote scripts, increasing the risk and impact of XSS vulnerabilities.',
      remediation: {
        summary: 'Implement a Content-Security-Policy header defining allowed resource sources.',
        steps: [
          'Audit resource dependencies (scripts, styles, fonts, frames, connect origins).',
          'Deploy a baseline CSP such as: default-src \'self\'; script-src \'self\'; object-src \'none\'; base-uri \'self\';',
          'Avoid \'unsafe-inline\' and \'unsafe-eval\' where feasible, or use cryptographic nonces/hashes.'
        ],
        configSnippet: "Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'self'; base-uri 'self';",
        checklist: [
          'Set default-src fallback',
          'Restrict object-src to \'none\'',
          'Enforce frame-ancestors',
          'Test policy with Content-Security-Policy-Report-Only first'
        ]
      },
      references: [
        { title: 'OWASP CSP Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html' },
        { title: 'MDN: Content-Security-Policy', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy' }
      ]
    });
  } else {
    // Check for risky directives in CSP
    if (csp.includes("'unsafe-inline'") && !csp.includes('nonce-') && !csp.includes('sha256-')) {
      findings.push({
        ruleId: 'SEC-HDR-CSP-UNSAFE-INLINE',
        title: "Content-Security-Policy Contains 'unsafe-inline'",
        category: 'headers',
        severity: 'Low',
        confidence: 'High',
        description: "The Content-Security-Policy header includes 'unsafe-inline' without a nonce or hash, permitting the execution of inline JavaScript and diminishing XSS protection.",
        evidence: {
          headerChecked: 'Content-Security-Policy',
          observedValue: csp.length > 250 ? csp.substring(0, 250) + '...' : csp,
          url: response.finalUrl
        },
        impact: 'Inline scripts can execute without origin constraints, reducing protection against stored or reflected XSS.',
        remediation: {
          summary: "Remove 'unsafe-inline' and migrate to external scripts or nonce-based CSP.",
          steps: [
            'Move inline event handlers and <script> tags to external files.',
            'If dynamic inline scripts are required, use cryptographically random per-request nonces (nonce-***).'
          ],
          configSnippet: "Content-Security-Policy: script-src 'self' 'nonce-{RANDOM_VALUE}';",
          checklist: ['Audit inline event handlers', 'Adopt nonce or hash for dynamic scripts']
        },
        references: [
          { title: 'Google Web Fundamentals: CSP Unsafe Inline', url: 'https://web.dev/articles/strict-csp' }
        ]
      });
    }

    if (csp.includes("'unsafe-eval'")) {
      findings.push({
        ruleId: 'SEC-HDR-CSP-UNSAFE-EVAL',
        title: "Content-Security-Policy Contains 'unsafe-eval'",
        category: 'headers',
        severity: 'Low',
        confidence: 'High',
        description: "The Content-Security-Policy permits 'unsafe-eval', allowing string-to-code execution APIs such as eval() and Function().",
        evidence: {
          headerChecked: 'Content-Security-Policy',
          observedValue: csp.length > 250 ? csp.substring(0, 250) + '...' : csp,
          url: response.finalUrl
        },
        impact: 'Attacker-controlled input passed to eval-like functions can lead to arbitrary JavaScript execution.',
        remediation: {
          summary: "Refactor code to avoid eval(), setTimeout(string), and Function() constructs.",
          steps: ['Audit dependencies using eval', 'Refactor JSON string parsing to JSON.parse()'],
          configSnippet: "Remove 'unsafe-eval' from script-src directive.",
          checklist: ['Verify build tools generate ahead-of-time code without eval']
        },
        references: [
          { title: 'MDN script-src eval', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src' }
        ]
      });
    }
  }

  // 2. Strict-Transport-Security (HSTS)
  const hsts = headers['strict-transport-security'];
  if (isHttps) {
    if (!hsts) {
      findings.push({
        ruleId: 'SEC-HDR-HSTS-MISSING',
        title: 'Missing HTTP Strict-Transport-Security (HSTS) Header',
        category: 'headers',
        severity: 'Medium',
        confidence: 'High',
        description: 'The HTTPS response does not specify a Strict-Transport-Security header. HSTS instructs browsers to communicate exclusively over HTTPS, protecting against SSL-stripping man-in-the-middle attacks.',
        evidence: {
          headerChecked: 'Strict-Transport-Security',
          observedValue: null,
          url: response.finalUrl
        },
        impact: 'Users making initial HTTP requests can be intercepted or downgraded to cleartext HTTP before an HTTPS redirect completes.',
        remediation: {
          summary: 'Send Strict-Transport-Security header with a long max-age on all HTTPS responses.',
          steps: [
            'Ensure entire application and all subdomains support HTTPS.',
            'Deploy header with max-age of at least 180 days (15552000 seconds), preferably 1 year (31536000 seconds).',
            'Consider adding includeSubDomains and preload once verified.'
          ],
          configSnippet: 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
          checklist: ['Enforce HTTPS across all routes', 'Set max-age >= 15552000', 'Include subdomains if applicable']
        },
        references: [
          { title: 'OWASP HSTS Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html' }
        ]
      });
    } else {
      const maxAgeMatch = hsts.match(/max-age=(\d+)/i);
      const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
      if (maxAge < 15552000) {
        findings.push({
          ruleId: 'SEC-HDR-HSTS-LOW-MAXAGE',
          title: 'HSTS max-age Duration Too Short',
          category: 'headers',
          severity: 'Low',
          confidence: 'High',
          description: `The HSTS max-age is set to ${maxAge} seconds (less than the recommended 180 days / 15552000 seconds).`,
          evidence: {
            headerChecked: 'Strict-Transport-Security',
            observedValue: hsts,
            parsedMaxAgeSeconds: maxAge
          },
          impact: 'Short HSTS expiry leaves users unprotected if they visit the site after the brief period expires.',
          remediation: {
            summary: 'Increase HSTS max-age to at least 15552000 (180 days) or 31536000 (1 year).',
            steps: ['Update web server configuration for HSTS max-age'],
            configSnippet: 'Strict-Transport-Security: max-age=31536000; includeSubDomains',
            checklist: ['Validate SSL cert renewal automation before setting 1-year max-age']
          },
          references: [
            { title: 'MDN HSTS', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security' }
          ]
        });
      }
    }
  }

  // 3. X-Content-Type-Options
  const xcto = headers['x-content-type-options'];
  if (!xcto || xcto.toLowerCase() !== 'nosniff') {
    findings.push({
      ruleId: 'SEC-HDR-XCTO-MISSING',
      title: 'Missing or Invalid X-Content-Type-Options Header',
      category: 'headers',
      severity: 'Low',
      confidence: 'High',
      description: "The response is missing 'X-Content-Type-Options: nosniff'. This header instructs browsers not to MIME-sniff the response away from the declared Content-Type.",
      evidence: {
        headerChecked: 'X-Content-Type-Options',
        observedValue: xcto || null,
        url: response.finalUrl
      },
      impact: 'Browsers may interpret non-executable MIME types (e.g., text/plain, images) as HTML or JavaScript if malicious content is embedded, facilitating cross-site scripting.',
      remediation: {
        summary: "Set 'X-Content-Type-Options: nosniff' header on all responses.",
        steps: ['Add nosniff header in reverse proxy or web application framework middleware.'],
        configSnippet: 'X-Content-Type-Options: nosniff',
        checklist: ['Verify all static assets and API routes return correct Content-Type with nosniff']
      },
      references: [
        { title: 'MDN X-Content-Type-Options', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options' }
      ]
    });
  }

  // 4. Clickjacking Defense: CSP frame-ancestors OR X-Frame-Options
  const xfo = headers['x-frame-options'];
  const hasFrameAncestors = csp && /frame-ancestors\s+/i.test(csp);
  if (!hasFrameAncestors && !xfo) {
    findings.push({
      ruleId: 'SEC-HDR-CLICKJACKING-DEFENSE-MISSING',
      title: 'Missing Clickjacking Defense (CSP frame-ancestors or X-Frame-Options)',
      category: 'headers',
      severity: 'Medium',
      confidence: 'High',
      description: 'Neither CSP frame-ancestors nor X-Frame-Options is configured on the response. The application may be framed inside an iframe by an attacker.',
      evidence: {
        headersChecked: ['X-Frame-Options', 'Content-Security-Policy (frame-ancestors)'],
        xFrameOptionsValue: xfo || null,
        cspValue: csp || null,
        url: response.finalUrl
      },
      impact: 'Attackers can render the target application inside a transparent iframe on a malicious website, tricking users into clicking invisible controls or buttons (Clickjacking).',
      remediation: {
        summary: "Add CSP 'frame-ancestors' and 'X-Frame-Options' to restrict embedding.",
        steps: [
          "If the site should never be embedded in iframes, set X-Frame-Options: DENY and CSP frame-ancestors 'none'.",
          "If the site is only framed by itself, set X-Frame-Options: SAMEORIGIN and CSP frame-ancestors 'self'."
        ],
        configSnippet: "X-Frame-Options: SAMEORIGIN\nContent-Security-Policy: frame-ancestors 'self';",
        checklist: ['Identify if legitimate framing is needed', 'Apply frame-ancestors restriction']
      },
      references: [
        { title: 'OWASP Clickjacking Defense Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html' }
      ]
    });
  }

  // 5. Referrer-Policy
  const refPolicy = headers['referrer-policy'];
  if (!refPolicy) {
    findings.push({
      ruleId: 'SEC-HDR-REFERRER-POLICY-MISSING',
      title: 'Missing Referrer-Policy Header',
      category: 'headers',
      severity: 'Low',
      confidence: 'High',
      description: 'The Referrer-Policy header is omitted. Setting this header governs what referrer information is sent when users navigate away or fetch external assets.',
      evidence: {
        headerChecked: 'Referrer-Policy',
        observedValue: null,
        url: response.finalUrl
      },
      impact: 'Sensitive query parameters, internal paths, or user identifiers in URLs might leak to third-party domains via the Referer header.',
      remediation: {
        summary: "Configure Referrer-Policy to 'strict-origin-when-cross-origin' or 'no-referrer'.",
        steps: ['Set Referrer-Policy: strict-origin-when-cross-origin on all responses.'],
        configSnippet: 'Referrer-Policy: strict-origin-when-cross-origin',
        checklist: ['Configure header in reverse proxy or Helmet middleware']
      },
      references: [
        { title: 'MDN Referrer-Policy', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy' }
      ]
    });
  } else if (refPolicy.toLowerCase().includes('unsafe-url')) {
    findings.push({
      ruleId: 'SEC-HDR-REFERRER-POLICY-UNSAFE',
      title: "Insecure Referrer-Policy 'unsafe-url' Detected",
      category: 'headers',
      severity: 'Medium',
      confidence: 'High',
      description: "The Referrer-Policy is set to 'unsafe-url', sending the entire URL including path and query string to all origins on cross-site requests.",
      evidence: {
        headerChecked: 'Referrer-Policy',
        observedValue: refPolicy,
        url: response.finalUrl
      },
      impact: 'Internal URL tokens, sessions, or sensitive URL parameters leak across cleartext HTTP and third-party origins.',
      remediation: {
        summary: "Change Referrer-Policy to 'strict-origin-when-cross-origin' or 'no-referrer'.",
        steps: ["Replace 'unsafe-url' with 'strict-origin-when-cross-origin'"],
        configSnippet: 'Referrer-Policy: strict-origin-when-cross-origin',
        checklist: ['Update server config']
      },
      references: [
        { title: 'MDN Referrer-Policy', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy' }
      ]
    });
  }

  // 6. Permissions-Policy
  const permPolicy = headers['permissions-policy'] || headers['feature-policy'];
  if (!permPolicy) {
    findings.push({
      ruleId: 'SEC-HDR-PERMISSIONS-POLICY-MISSING',
      title: 'Missing Permissions-Policy Header',
      category: 'headers',
      severity: 'Informational',
      confidence: 'High',
      description: 'The Permissions-Policy header (formerly Feature-Policy) is not defined. This header allows sites to disable sensitive browser APIs such as geolocation, camera, microphone, and payment.',
      evidence: {
        headerChecked: 'Permissions-Policy',
        observedValue: null,
        url: response.finalUrl
      },
      impact: 'Embedded iframes or compromised dependencies may request access to device hardware without host site restrictions.',
      remediation: {
        summary: 'Define Permissions-Policy explicitly disabling unused browser features.',
        steps: ['Add Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()'],
        configSnippet: 'Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()',
        checklist: ['Review necessary APIs', 'Disable unnecessary device access']
      },
      references: [
        { title: 'W3C Permissions Policy', url: 'https://www.w3.org/TR/permissions-policy-1/' }
      ]
    });
  }

  return {
    checkId: 'check-security-headers',
    name: 'Security Headers Inspection',
    category: 'headers',
    status: findings.length === 0 ? 'passed' : findings.some(f => f.severity === 'High') ? 'failed' : 'warning',
    message: findings.length === 0 ? 'All standard security headers are appropriately configured.' : `Identified ${findings.length} header configuration recommendation(s).`,
    findings
  };
}
