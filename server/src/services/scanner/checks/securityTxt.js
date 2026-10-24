import { safeFetch } from '../safeHttpClient.js';

/**
 * RFC 9116 security.txt Standard Check
 * Checks if the target hosts a security.txt file at /.well-known/security.txt
 * or /security.txt to facilitate coordinated vulnerability disclosure.
 */
export async function checkSecurityTxt(context) {
  const findings = [];
  const parsedTarget = new URL(context.targetUrl);
  const primaryUrl = `${parsedTarget.protocol}//${parsedTarget.host}/.well-known/security.txt`;
  const fallbackUrl = `${parsedTarget.protocol}//${parsedTarget.host}/security.txt`;

  let foundUrl = null;
  let bodyContent = null;

  try {
    const resPrimary = await safeFetch(primaryUrl, {
      method: 'GET',
      followRedirects: true,
      maxRedirects: 3,
      timeoutMs: 6000
    });

    if (resPrimary.statusCode === 200 && resPrimary.body && /contact:/i.test(resPrimary.body)) {
      foundUrl = primaryUrl;
      bodyContent = resPrimary.body;
    } else {
      const resFallback = await safeFetch(fallbackUrl, {
        method: 'GET',
        followRedirects: true,
        maxRedirects: 3,
        timeoutMs: 6000
      });
      if (resFallback.statusCode === 200 && resFallback.body && /contact:/i.test(resFallback.body)) {
        foundUrl = fallbackUrl;
        bodyContent = resFallback.body;
      }
    }
  } catch (err) {
    // Probe error handled below
  }

  if (!foundUrl) {
    findings.push({
      ruleId: 'POLICY-SECURITY-TXT-MISSING',
      title: 'Missing RFC 9116 security.txt Vulnerability Disclosure Policy',
      category: 'policy',
      severity: 'Informational',
      confidence: 'High',
      description: 'The target domain does not publish a security.txt file at /.well-known/security.txt. RFC 9116 specifies security.txt as a standard way for organizations to define security contact channels and vulnerability disclosure policies.',
      evidence: {
        checkedLocations: [primaryUrl, fallbackUrl],
        status: 'Not found or missing Contact directive'
      },
      impact: 'Security researchers discovering valid vulnerabilities in your application may struggle to locate your security contacts, potentially delaying critical patches.',
      remediation: {
        summary: 'Deploy a security.txt file at /.well-known/security.txt following RFC 9116.',
        steps: [
          'Create a text file containing Contact: mailto:security@yourdomain.com and Expires: <date>.',
          'Deploy the file at /.well-known/security.txt with text/plain content type.'
        ],
        configSnippet: "Contact: mailto:security@example.com\nExpires: 2027-12-31T23:59:59.000Z\nPreferred-Languages: en\nPolicy: https://example.com/security-policy",
        checklist: ['Create security.txt', 'Place in /.well-known/ directory', 'Set Expires timestamp']
      },
      references: [
        { title: 'RFC 9116: A File Format to Aid in Security Vulnerability Disclosure', url: 'https://datatracker.ietf.org/doc/html/rfc9116' },
        { title: 'securitytxt.org', url: 'https://securitytxt.org/' }
      ]
    });

    return {
      checkId: 'check-security-txt',
      name: 'RFC 9116 security.txt Discovery',
      category: 'policy',
      status: 'warning',
      message: 'security.txt is not implemented on this domain.',
      findings
    };
  }

  // Check if Expires directive is present and valid
  const hasExpires = /expires:\s*([^\r\n]+)/i.test(bodyContent);
  if (!hasExpires) {
    findings.push({
      ruleId: 'POLICY-SECURITY-TXT-EXPIRES-MISSING',
      title: "RFC 9116 security.txt Missing Mandatory 'Expires' Directive",
      category: 'policy',
      severity: 'Informational',
      confidence: 'High',
      description: 'The security.txt file was found, but it omits the mandatory Expires field required by RFC 9116.',
      evidence: {
        location: foundUrl
      },
      impact: 'Automated scanners and researchers cannot verify whether the security contact details are actively maintained.',
      remediation: {
        summary: "Add an 'Expires' directive with an ISO 8601 timestamp to security.txt.",
        steps: ['Append Expires: YYYY-MM-DDTHH:MM:SS.000Z to security.txt.'],
        configSnippet: 'Expires: 2027-12-31T23:59:59.000Z',
        checklist: ['Add Expires timestamp', 'Set calendar reminder to update prior to expiration']
      },
      references: [
        { title: 'RFC 9116 Section 2.5.5', url: 'https://datatracker.ietf.org/doc/html/rfc9116#section-2.5.5' }
      ]
    });
  }

  return {
    checkId: 'check-security-txt',
    name: 'RFC 9116 security.txt Discovery',
    category: 'policy',
    status: findings.length === 0 ? 'passed' : 'warning',
    message: `Valid security.txt discovered at ${foundUrl}.`,
    findings
  };
}
