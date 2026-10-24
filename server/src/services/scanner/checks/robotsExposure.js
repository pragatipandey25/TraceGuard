import { safeFetch } from '../safeHttpClient.js';

/**
 * robots.txt Exposure Assessment Check
 * Requests robots.txt, parses Disallow directives, and notes administrative
 * or sensitive endpoints exposed in public crawler instructions.
 * NOTE: Discovered paths are recorded for informational auditing only.
 * TraceGuard strictly DOES NOT crawl or access discovered paths.
 */
export async function checkRobotsExposure(context) {
  const findings = [];
  const parsedTarget = new URL(context.targetUrl);
  const robotsUrl = `${parsedTarget.protocol}//${parsedTarget.host}/robots.txt`;

  try {
    const res = await safeFetch(robotsUrl, {
      method: 'GET',
      followRedirects: true,
      maxRedirects: 3,
      timeoutMs: 6000
    });

    if (res.statusCode === 200 && res.body && typeof res.body === 'string') {
      const lines = res.body.split('\n');
      const disallowPaths = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.toLowerCase().startsWith('disallow:')) {
          const path = trimmed.substring(9).trim();
          if (path && path !== '/' && !path.startsWith('#')) {
            disallowPaths.push(path);
          }
        }
      }

      // Check if administrative or sensitive words are listed in robots.txt
      const sensitiveKeywords = ['admin', 'backup', 'config', 'api/internal', 'secret', 'private', 'dashboard', 'staging'];
      const flaggedPaths = disallowPaths.filter(path =>
        sensitiveKeywords.some(keyword => path.toLowerCase().includes(keyword))
      );

      if (flaggedPaths.length > 0) {
        findings.push({
          ruleId: 'ROBOTS-SENSITIVE-PATHS-DISCLOSED',
          title: 'Sensitive Path Disclosures in robots.txt',
          category: 'info_disclosure',
          severity: 'Informational',
          confidence: 'Medium',
          description: `robots.txt reveals potentially sensitive or internal paths (${flaggedPaths.slice(0, 5).join(', ')}). While robots.txt instructs legitimate crawlers, it provides an enumeration roadmap for adversaries.`,
          evidence: {
            robotsUrl,
            discoveredPaths: flaggedPaths.slice(0, 10),
            totalDisallowedPaths: disallowPaths.length
          },
          impact: 'Adversaries routinely review robots.txt to identify unlinked administrative panels, private directories, and backup folders.',
          remediation: {
            summary: 'Do not rely on robots.txt for access control. Enforce strong authentication and IP whitelisting on sensitive routes.',
            steps: [
              'Enforce strict authentication and authorization checks on all private administrative endpoints.',
              'Remove sensitive paths from robots.txt if obscurity is not accompanied by real authorization.'
            ],
            configSnippet: '# Rely on HTTP 401/403 controls, not robots.txt obscurity',
            checklist: ['Ensure all listed admin paths require authentication', 'Do not disclose private staging or internal URLs']
          },
          references: [
            { title: 'OWASP Information Gathering: robots.txt', url: 'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/01-Conduct_Search_Engine_Discovery_Reconnaissance_for_Information_Leakage' }
          ]
        });
      }

      return {
        checkId: 'check-robots-exposure',
        name: 'robots.txt Information Exposure',
        category: 'info_disclosure',
        status: findings.length === 0 ? 'passed' : 'warning',
        message: `robots.txt discovered with ${disallowPaths.length} disallowed path(s).`,
        findings
      };
    }

    return {
      checkId: 'check-robots-exposure',
      name: 'robots.txt Information Exposure',
      category: 'info_disclosure',
      status: 'passed',
      message: 'No robots.txt file found or returned non-200 status.',
      findings: []
    };
  } catch (err) {
    return {
      checkId: 'check-robots-exposure',
      name: 'robots.txt Information Exposure',
      category: 'info_disclosure',
      status: 'passed',
      message: 'robots.txt not accessible or not present.',
      findings: []
    };
  }
}
