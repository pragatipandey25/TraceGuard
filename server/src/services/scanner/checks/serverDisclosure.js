/**
 * Server & Technology Stack Disclosure Check
 * Checks response headers for detailed version information and technology signatures
 * that assist attackers in reconnaissance and targeted vulnerability exploitation.
 */
export function checkServerDisclosure(response, context) {
  const findings = [];
  const headers = response.headers || {};

  // 1. X-Powered-By
  const xPoweredBy = headers['x-powered-by'];
  if (xPoweredBy) {
    findings.push({
      ruleId: 'DISCLOSURE-X-POWERED-BY',
      title: `Technology Fingerprint Disclosed via X-Powered-By (${xPoweredBy})`,
      category: 'info_disclosure',
      severity: 'Low',
      confidence: 'High',
      description: `The application leaks backend technology stack details via the 'X-Powered-By: ${xPoweredBy}' header.`,
      evidence: {
        headerChecked: 'X-Powered-By',
        observedValue: xPoweredBy,
        url: response.finalUrl
      },
      impact: 'Revealing specific frameworks (Express, PHP, ASP.NET) narrows down attacker exploitation attempts to version-specific known CVEs.',
      remediation: {
        summary: 'Disable the X-Powered-By header in web application configuration or framework middleware.',
        steps: [
          'In Express: app.disable(\'x-powered-by\') or use helmet().',
          'In PHP: expose_php = Off in php.ini.',
          'In ASP.NET: remove X-Powered-By in web.config.'
        ],
        configSnippet: '// In Express.js:\napp.disable("x-powered-by");\n// or\napp.use(helmet.hidePoweredBy());',
        checklist: ['Remove X-Powered-By header']
      },
      references: [
        { title: 'OWASP Fingerprint Web Server', url: 'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/02-Fingerprint_Web_Server' }
      ]
    });
  }

  // 2. Server Header Version Leak
  const serverHeader = headers['server'];
  if (serverHeader) {
    // Check if server header leaks specific versions (e.g., Apache/2.4.41, nginx/1.18.0)
    const hasDetailedVersion = /\d+\.\d+/.test(serverHeader);
    if (hasDetailedVersion) {
      findings.push({
        ruleId: 'DISCLOSURE-SERVER-VERSION',
        title: `Server Header Exposes Specific Version (${serverHeader})`,
        category: 'info_disclosure',
        severity: 'Low',
        confidence: 'High',
        description: `The 'Server' header exposes exact software and version numbers (${serverHeader}).`,
        evidence: {
          headerChecked: 'Server',
          observedValue: serverHeader,
          url: response.finalUrl
        },
        impact: 'Precise software versions allow attackers to quickly match the host against published CVE vulnerability databases.',
        remediation: {
          summary: 'Configure web server / reverse proxy to suppress detailed version banners.',
          steps: [
            'In Nginx: set server_tokens off;',
            'In Apache: set ServerTokens Prod and ServerSignature Off.'
          ],
          configSnippet: '# In Nginx configuration:\nserver_tokens off;\n\n# In Apache configuration:\nServerTokens Prod\nServerSignature Off',
          checklist: ['Suppress version numbers in server response headers']
        },
        references: [
          { title: 'OWASP Security Headers', url: 'https://owasp.org/www-project-secure-headers/' }
        ]
      });
    }
  }

  // 3. ASP.NET specific version headers
  if (headers['x-aspnet-version'] || headers['x-aspnetmvc-version']) {
    findings.push({
      ruleId: 'DISCLOSURE-ASPNET-VERSION',
      title: 'ASP.NET Version Disclosure Header Present',
      category: 'info_disclosure',
      severity: 'Low',
      confidence: 'High',
      description: 'The server returns X-AspNet-Version or X-AspNetMvc-Version headers revealing exact .NET Framework version.',
      evidence: {
        'x-aspnet-version': headers['x-aspnet-version'] || null,
        'x-aspnetmvc-version': headers['x-aspnetmvc-version'] || null
      },
      impact: 'Aids attackers in crafting targeted attacks for the specified .NET Framework version.',
      remediation: {
        summary: 'Disable ASP.NET version headers in web.config.',
        steps: ['Set enableVersionHeader="false" under <httpRuntime> in web.config.'],
        configSnippet: '<httpRuntime enableVersionHeader="false" />',
        checklist: ['Disable ASP.NET version header']
      },
      references: [
        { title: 'Microsoft Docs: Securing ASP.NET', url: 'https://learn.microsoft.com/en-us/previous-versions/aspnet/ms228057(v=vs.100)' }
      ]
    });
  }

  return {
    checkId: 'check-server-disclosure',
    name: 'Server & Stack Information Disclosure',
    category: 'info_disclosure',
    status: findings.length === 0 ? 'passed' : 'warning',
    message: findings.length === 0 ? 'No unnecessary technology banner headers disclosed.' : `Identified ${findings.length} server disclosure finding(s).`,
    findings
  };
}
