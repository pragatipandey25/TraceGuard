import tls from 'tls';
import { validateTargetUrl } from '../targetValidator.js';

/**
 * TLS Configuration Assessment Check
 * Connects securely to the target's TLS port, evaluates certificate validity,
 * expiration timeline, subject alternative names, and cipher protocol.
 */
export async function checkTlsConfiguration(context) {
  const findings = [];
  const targetUrl = context.targetUrl;

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch (err) {
    return {
      checkId: 'check-tls-config',
      name: 'TLS / SSL Configuration',
      category: 'tls',
      status: 'error',
      message: 'Invalid target URL supplied',
      findings: []
    };
  }

  // If not HTTPS, evaluate whether HTTPS is even offered
  if (parsed.protocol !== 'https:') {
    findings.push({
      ruleId: 'TLS-HTTPS-NOT-USED',
      title: 'Target Base URL Does Not Use HTTPS',
      category: 'tls',
      severity: 'High',
      confidence: 'High',
      description: 'The target application is configured with plain HTTP. Traffic is transmitted unencrypted across the network.',
      evidence: {
        protocol: parsed.protocol,
        url: targetUrl
      },
      impact: 'All HTTP traffic including credentials, session tokens, and personal data can be intercepted or manipulated in transit via Man-in-the-Middle (MitM) attacks.',
      remediation: {
        summary: 'Obtain an SSL/TLS certificate and mandate HTTPS.',
        steps: [
          'Provision a trusted TLS certificate (e.g., via Let\'s Encrypt or your cloud provider).',
          'Configure web server / load balancer to listen on port 443 with modern TLS ciphers.',
          'Redirect all HTTP (port 80) requests to HTTPS.'
        ],
        configSnippet: 'Redirect permanent / https://yourdomain.com/',
        checklist: ['Install trusted certificate', 'Enable port 443', 'Enforce HTTP to HTTPS redirection']
      },
      references: [
        { title: 'OWASP Transport Layer Protection', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html' }
      ]
    });

    return {
      checkId: 'check-tls-config',
      name: 'TLS / SSL Configuration',
      category: 'tls',
      status: 'failed',
      message: 'Application target is not using HTTPS.',
      findings
    };
  }

  const hostname = parsed.hostname;
  const port = parsed.port ? parseInt(parsed.port, 10) : 443;

  // Revalidate destination before TLS socket connection
  const validation = await validateTargetUrl(targetUrl);
  if (!validation.isValid) {
    return {
      checkId: 'check-tls-config',
      name: 'TLS / SSL Configuration',
      category: 'tls',
      status: 'skipped',
      message: `TLS check skipped: ${validation.error}`,
      findings: []
    };
  }

  return new Promise((resolve) => {
    let socket;
    const timeoutTimer = setTimeout(() => {
      if (socket) socket.destroy();
      resolve({
        checkId: 'check-tls-config',
        name: 'TLS / SSL Configuration',
        category: 'tls',
        status: 'error',
        message: 'TLS connection handshake timed out after 8000ms',
        findings: []
      });
    }, 8000);

    const socketOptions = {
      host: hostname,
      port: port,
      servername: hostname, // SNI
      rejectUnauthorized: true
    };

    socket = tls.connect(socketOptions, () => {
      clearTimeout(timeoutTimer);
      const cert = socket.getPeerCertificate(true);
      const protocol = socket.getProtocol();
      const cipher = socket.getCipher();

      if (!cert || Object.keys(cert).length === 0) {
        socket.destroy();
        return resolve({
          checkId: 'check-tls-config',
          name: 'TLS / SSL Configuration',
          category: 'tls',
          status: 'failed',
          message: 'Unable to retrieve peer TLS certificate.',
          findings: [{
            ruleId: 'TLS-CERT-RETRIEVAL-FAILED',
            title: 'TLS Peer Certificate Not Provided',
            category: 'tls',
            severity: 'High',
            confidence: 'High',
            description: 'The server completed TLS negotiation but did not provide peer certificate details.',
            evidence: { hostname, port },
            impact: 'Authentication of the remote host cannot be verified.',
            remediation: {
              summary: 'Check TLS server configuration and certificate chain binding.',
              steps: ['Ensure web server has valid certificate chain configured.'],
              configSnippet: '',
              checklist: ['Verify SSL certificate bundle in server config']
            },
            references: [{ title: 'Mozilla SSL Configuration Generator', url: 'https://ssl-config.mozilla.org/' }]
          }]
        });
      }

      const validTo = new Date(cert.valid_to);
      const validFrom = new Date(cert.valid_from);
      const now = new Date();
      const daysUntilExpiration = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));

      // 1. Check expiration
      if (now > validTo) {
        findings.push({
          ruleId: 'TLS-CERT-EXPIRED',
          title: 'TLS Certificate Is Expired',
          category: 'tls',
          severity: 'Critical',
          confidence: 'High',
          description: `The TLS certificate for ${hostname} expired on ${validTo.toISOString()}. Browsers will present security warning interstitials to visitors.`,
          evidence: {
            subject: cert.subject?.CN || hostname,
            issuer: cert.issuer?.O || cert.issuer?.CN,
            validTo: cert.valid_to,
            daysRemaining: daysUntilExpiration
          },
          impact: 'Visitors will be blocked by browser security alerts. Trust is broken and automated clients will fail.',
          remediation: {
            summary: 'Renew the SSL/TLS certificate immediately.',
            steps: ['Request and install an updated certificate from your certificate authority.', 'Set up automated renewal (e.g. Certbot/ACME).'],
            configSnippet: 'certbot renew',
            checklist: ['Renew certificate immediately', 'Verify automatic renewal cron job']
          },
          references: [{ title: 'Let\'s Encrypt Documentation', url: 'https://letsencrypt.org/docs/' }]
        });
      } else if (daysUntilExpiration <= 30) {
        findings.push({
          ruleId: 'TLS-CERT-EXPIRING-SOON',
          title: `TLS Certificate Expiring in ${daysUntilExpiration} Day(s)`,
          category: 'tls',
          severity: daysUntilExpiration <= 7 ? 'High' : 'Medium',
          confidence: 'High',
          description: `The TLS certificate for ${hostname} will expire on ${validTo.toISOString()} (${daysUntilExpiration} days remaining).`,
          evidence: {
            subject: cert.subject?.CN || hostname,
            issuer: cert.issuer?.O || cert.issuer?.CN,
            validTo: cert.valid_to,
            daysRemaining: daysUntilExpiration
          },
          impact: 'If not renewed before expiration, the application will experience service disruption for all users.',
          remediation: {
            summary: 'Trigger TLS certificate renewal prior to expiration.',
            steps: ['Trigger automated renewal or contact your certificate provider.', 'Verify automated renewal pipeline is operational.'],
            configSnippet: 'certbot renew --dry-run',
            checklist: ['Confirm automated renewal works before expiry']
          },
          references: [{ title: 'Let\'s Encrypt Documentation', url: 'https://letsencrypt.org/docs/' }]
        });
      }

      // 2. Protocol check (legacy TLS 1.0 / 1.1)
      if (protocol === 'TLSv1' || protocol === 'TLSv1.1') {
        findings.push({
          ruleId: 'TLS-DEPRECATED-PROTOCOL',
          title: `Deprecated TLS Protocol (${protocol}) Negotiated`,
          category: 'tls',
          severity: 'High',
          confidence: 'High',
          description: `The connection negotiated ${protocol}, which has been formally deprecated (RFC 8996) due to cryptographic weaknesses.`,
          evidence: {
            protocolNegotiated: protocol,
            cipherNegotiated: cipher?.name
          },
          impact: 'Deprecated protocols are susceptible to padding oracle attacks (POODLE, BEAST) and lack modern cipher defenses.',
          remediation: {
            summary: 'Disable TLS 1.0 and TLS 1.1; enforce TLS 1.2 and TLS 1.3.',
            steps: ['Update web server configuration to only permit TLSv1.2 and TLSv1.3.'],
            configSnippet: 'ssl_protocols TLSv1.2 TLSv1.3;',
            checklist: ['Disable legacy protocols in Nginx/Apache/Cloudflare']
          },
          references: [{ title: 'RFC 8996 Deprecating TLS 1.0 and 1.1', url: 'https://datatracker.ietf.org/doc/html/rfc8996' }]
        });
      }

      socket.destroy();

      resolve({
        checkId: 'check-tls-config',
        name: 'TLS / SSL Configuration',
        category: 'tls',
        status: findings.length === 0 ? 'passed' : findings.some(f => f.severity === 'Critical' || f.severity === 'High') ? 'failed' : 'warning',
        message: findings.length === 0
          ? `TLS certificate is valid (${protocol}, expires in ${daysUntilExpiration} days).`
          : `Identified ${findings.length} TLS/SSL observation(s).`,
        findings
      });
    });

    socket.on('error', (err) => {
      clearTimeout(timeoutTimer);
      // Analyze TLS connection failure
      let ruleId = 'TLS-HANDSHAKE-FAILED';
      let title = 'TLS Handshake Failed';
      let severity = 'High';

      if (err.code === 'CERT_HAS_EXPIRED') {
        ruleId = 'TLS-CERT-EXPIRED';
        title = 'TLS Certificate Has Expired';
        severity = 'Critical';
      } else if (err.code === 'DEPTH_ZERO_SELF_SIGNED_CERT' || err.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
        ruleId = 'TLS-SELF-SIGNED-CERT';
        title = 'Self-Signed or Untrusted TLS Certificate';
        severity = 'High';
      } else if (err.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
        ruleId = 'TLS-HOSTNAME-MISMATCH';
        title = 'TLS Certificate Hostname Mismatch';
        severity = 'High';
      }

      findings.push({
        ruleId,
        title,
        category: 'tls',
        severity,
        confidence: 'High',
        description: `TLS handshake with ${hostname}:${port} failed: ${err.message}`,
        evidence: {
          errorCode: err.code,
          errorMessage: err.message,
          hostname,
          port
        },
        impact: 'Users and clients attempting to connect over HTTPS will receive security warnings and cannot verify the server identity.',
        remediation: {
          summary: 'Resolve the SSL/TLS certificate trust issue.',
          steps: [
            'Ensure certificate matches the domain hostname exactly (or via valid wildcard).',
            'Ensure the certificate is issued by a globally recognized Certificate Authority.',
            'Verify the full intermediate certificate chain is served.'
          ],
          configSnippet: '',
          checklist: ['Check DNS hostname against cert SANs', 'Validate intermediate CA bundle']
        },
        references: [{ title: 'Mozilla SSL Configuration Guide', url: 'https://wiki.mozilla.org/Security/Server_Side_TLS' }]
      });

      resolve({
        checkId: 'check-tls-config',
        name: 'TLS / SSL Configuration',
        category: 'tls',
        status: 'failed',
        message: `TLS error: ${err.message}`,
        findings
      });
    });
  });
}
