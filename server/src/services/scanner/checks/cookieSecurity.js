/**
 * Cookie Security Assessment Check
 * Inspects Set-Cookie headers for Secure, HttpOnly, and SameSite attributes,
 * as well as overly broad Domain or Path specifications.
 */
export function checkCookieSecurity(response, context) {
  const findings = [];
  const rawCookies = response.headers['set-cookie'];
  const isHttps = context.targetUrl.startsWith('https://');

  if (!rawCookies || (Array.isArray(rawCookies) && rawCookies.length === 0)) {
    return {
      checkId: 'check-cookie-security',
      name: 'Cookie Security Attributes',
      category: 'cookies',
      status: 'passed',
      message: 'No cookies are set in the base response.',
      findings: []
    };
  }

  const cookieList = Array.isArray(rawCookies) ? rawCookies : [rawCookies];

  for (const cookieHeader of cookieList) {
    const parts = cookieHeader.split(';').map(p => p.trim());
    const nameValue = parts[0] || '';
    const cookieName = nameValue.split('=')[0] || 'unknown_cookie';

    const lowerParts = parts.map(p => p.toLowerCase());
    const hasSecure = lowerParts.some(p => p === 'secure');
    const hasHttpOnly = lowerParts.some(p => p === 'httponly');
    const sameSitePart = lowerParts.find(p => p.startsWith('samesite='));
    const sameSiteVal = sameSitePart ? sameSitePart.split('=')[1] : null;
    const domainPart = lowerParts.find(p => p.startsWith('domain='));
    const domainVal = domainPart ? domainPart.split('=')[1] : null;

    // 1. Missing Secure flag on HTTPS
    if (isHttps && !hasSecure) {
      findings.push({
        ruleId: 'COOKIE-MISSING-SECURE',
        title: `Cookie '${cookieName}' Missing 'Secure' Flag`,
        category: 'cookies',
        severity: 'Medium',
        confidence: 'High',
        description: `The cookie '${cookieName}' is set without the 'Secure' directive over an HTTPS connection.`,
        evidence: {
          cookieName,
          observedHeader: cookieHeader.substring(0, 150),
          url: response.finalUrl
        },
        impact: 'Without the Secure flag, user agents may transmit this cookie over cleartext HTTP if the user clicks an unencrypted link, exposing it to eavesdroppers.',
        remediation: {
          summary: "Add the 'Secure' attribute to the cookie definition.",
          steps: ['Update your session/cookie middleware to ensure secure: true is enabled in production.'],
          configSnippet: `Set-Cookie: ${cookieName}=...; Secure; HttpOnly; SameSite=Lax`,
          checklist: ['Enforce Secure flag on all session cookies in production']
        },
        references: [
          { title: 'OWASP Session Management: Cookies', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html#cookies' }
        ]
      });
    }

    // 2. Missing HttpOnly flag
    if (!hasHttpOnly) {
      findings.push({
        ruleId: 'COOKIE-MISSING-HTTPONLY',
        title: `Cookie '${cookieName}' Missing 'HttpOnly' Flag`,
        category: 'cookies',
        severity: 'Low',
        confidence: 'High',
        description: `The cookie '${cookieName}' is accessible to client-side JavaScript because the 'HttpOnly' attribute is absent.`,
        evidence: {
          cookieName,
          observedHeader: cookieHeader.substring(0, 150),
          url: response.finalUrl
        },
        impact: 'If an attacker succeeds with a Cross-Site Scripting (XSS) attack, they can access document.cookie to steal this cookie.',
        remediation: {
          summary: "Set 'HttpOnly' on all cookies unless client-side JavaScript legitimately requires access.",
          steps: ['Configure session management middleware with httpOnly: true.'],
          configSnippet: `Set-Cookie: ${cookieName}=...; HttpOnly; Secure; SameSite=Lax`,
          checklist: ['Verify if cookie is intended for JavaScript or authentication session']
        },
        references: [
          { title: 'MDN Set-Cookie: HttpOnly', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie' }
        ]
      });
    }

    // 3. SameSite evaluation
    if (!sameSiteVal) {
      findings.push({
        ruleId: 'COOKIE-MISSING-SAMESITE',
        title: `Cookie '${cookieName}' Missing 'SameSite' Attribute`,
        category: 'cookies',
        severity: 'Low',
        confidence: 'High',
        description: `The cookie '${cookieName}' does not explicitly declare a SameSite attribute (Lax or Strict).`,
        evidence: {
          cookieName,
          observedHeader: cookieHeader.substring(0, 150),
          url: response.finalUrl
        },
        impact: 'Explicit SameSite protection protects against Cross-Site Request Forgery (CSRF). Depending on default browser behavior, older browsers may send cookies on cross-origin requests.',
        remediation: {
          summary: "Explicitly declare SameSite=Lax or SameSite=Strict.",
          steps: ['Add SameSite=Lax for general session cookies or SameSite=Strict for sensitive action cookies.'],
          configSnippet: `Set-Cookie: ${cookieName}=...; SameSite=Lax; Secure; HttpOnly`,
          checklist: ['Set SameSite=Lax for web navigation or SameSite=Strict']
        },
        references: [
          { title: 'OWASP CSRF Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html' }
        ]
      });
    } else if (sameSiteVal === 'none' && !hasSecure) {
      findings.push({
        ruleId: 'COOKIE-SAMESITE-NONE-WITHOUT-SECURE',
        title: `Cookie '${cookieName}' Has SameSite=None Without Secure`,
        category: 'cookies',
        severity: 'Medium',
        confidence: 'High',
        description: `Cookie '${cookieName}' sets SameSite=None but lacks the Secure attribute. Modern browsers will reject this cookie outright.`,
        evidence: {
          cookieName,
          observedHeader: cookieHeader.substring(0, 150)
        },
        impact: 'The cookie will be rejected by modern browsers, potentially breaking user authentication or session persistence.',
        remediation: {
          summary: "Always pair SameSite=None with the 'Secure' attribute.",
          steps: ['Add Secure flag alongside SameSite=None.'],
          configSnippet: `Set-Cookie: ${cookieName}=...; SameSite=None; Secure`,
          checklist: ['Enforce Secure attribute whenever SameSite=None is specified']
        },
        references: [
          { title: 'MDN SameSite cookies', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite' }
        ]
      });
    }

    // 4. Overly broad domain
    if (domainVal && (domainVal.startsWith('.') || domainVal === 'localhost')) {
      findings.push({
        ruleId: 'COOKIE-OVERBROAD-DOMAIN',
        title: `Cookie '${cookieName}' Sets Overly Broad Domain (${domainVal})`,
        category: 'cookies',
        severity: 'Informational',
        confidence: 'High',
        description: `The cookie domain is explicitly scoped to '${domainVal}', sharing this cookie across all subdomains.`,
        evidence: {
          cookieName,
          domainVal,
          observedHeader: cookieHeader.substring(0, 150)
        },
        impact: 'Any compromised or vulnerable sibling subdomain can read and modify this cookie.',
        remediation: {
          summary: 'Omit the Domain attribute to restrict the cookie to the exact origin host.',
          steps: ['Remove Domain attribute from cookie configuration if subdomain sharing is not necessary.'],
          configSnippet: `Set-Cookie: ${cookieName}=...; Path=/; Secure; HttpOnly`,
          checklist: ['Restrict cookie scope to host origin']
        },
        references: [
          { title: 'RFC 6265 Section 4.1.2.3: Domain Attribute', url: 'https://datatracker.ietf.org/doc/html/rfc6265#section-4.1.2.3' }
        ]
      });
    }
  }

  return {
    checkId: 'check-cookie-security',
    name: 'Cookie Security Attributes',
    category: 'cookies',
    status: findings.length === 0 ? 'passed' : findings.some(f => f.severity === 'Medium') ? 'failed' : 'warning',
    message: findings.length === 0 ? 'All cookies have appropriate security flags.' : `Identified ${findings.length} cookie configuration observation(s).`,
    findings
  };
}
