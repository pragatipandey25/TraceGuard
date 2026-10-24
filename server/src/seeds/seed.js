import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Target } from '../models/Target.js';
import { Assessment } from '../models/Assessment.js';
import { Finding } from '../models/Finding.js';
import { config } from '../config/env.js';

async function seed() {
  console.log('[Seed] Connecting to MongoDB...');
  await mongoose.connect(config.MONGODB_URI);
  console.log('[Seed] Connected.');

  console.log('[Seed] Clearing existing development data...');
  await Promise.all([
    User.deleteMany({}),
    Target.deleteMany({}),
    Assessment.deleteMany({}),
    Finding.deleteMany({})
  ]);

  console.log('[Seed] Creating demo users...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', salt);

  const demoUser = await User.create({
    name: 'Alex Rivera (Security Engineer)',
    email: 'auditor@traceguard.dev',
    passwordHash,
    role: 'user'
  });

  const adminUser = await User.create({
    name: 'System Administrator',
    email: 'admin@traceguard.dev',
    passwordHash: adminPasswordHash,
    role: 'admin'
  });

  console.log('[Seed] Creating authorized targets...');
  const target1 = await Target.create({
    ownerId: demoUser._id,
    name: 'Cloud Portal Production',
    baseUrl: 'https://example.com',
    environment: 'production',
    description: 'Primary customer-facing cloud portal and authentication gateway',
    authorizationConfirmedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  });

  const target2 = await Target.create({
    ownerId: demoUser._id,
    name: 'Payments Microservice Staging',
    baseUrl: 'https://httpbin.org',
    environment: 'staging',
    description: 'Staging environment for checkout and billing webhooks',
    authorizationConfirmedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  });

  console.log('[Seed] Creating baseline assessments...');
  // Assessment 1: 5 days ago (Baseline)
  const assessment1 = await Assessment.create({
    ownerId: demoUser._id,
    targetId: target1._id,
    status: 'completed',
    progress: 100,
    startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 4200),
    durationMs: 4200,
    summary: {
      totalChecks: 8,
      passedChecks: 4,
      failedChecks: 3,
      skippedChecks: 1,
      totalFindings: 4,
      criticalCount: 0,
      highCount: 1,
      mediumCount: 2,
      lowCount: 1,
      infoCount: 0,
      postureScore: 66
    },
    checkResults: [
      { checkId: 'check-security-headers', name: 'Security Headers Inspection', category: 'headers', status: 'failed', durationMs: 45, message: 'Identified 3 header findings' },
      { checkId: 'check-cookie-security', name: 'Cookie Security Attributes', category: 'cookies', status: 'passed', durationMs: 20, message: 'All cookies secure' },
      { checkId: 'check-server-disclosure', name: 'Server & Stack Information Disclosure', category: 'info_disclosure', status: 'warning', durationMs: 15, message: 'Server header present' },
      { checkId: 'check-tls-config', name: 'TLS / SSL Configuration', category: 'tls', status: 'passed', durationMs: 120, message: 'Valid certificate' },
      { checkId: 'check-cors-config', name: 'CORS Policy Evaluation', category: 'cors', status: 'passed', durationMs: 110, message: 'CORS safe' },
      { checkId: 'check-https-redirect', name: 'HTTPS Redirection & Downgrade Check', category: 'redirect', status: 'passed', durationMs: 95, message: 'HTTP redirects to HTTPS' },
      { checkId: 'check-robots-exposure', name: 'robots.txt Information Exposure', category: 'info_disclosure', status: 'passed', durationMs: 50, message: 'Clean robots.txt' },
      { checkId: 'check-security-txt', name: 'RFC 9116 security.txt Discovery', category: 'policy', status: 'warning', durationMs: 55, message: 'security.txt missing' }
    ]
  });

  // Assessment 2: Today (Recent assessment with fixes verified)
  const assessment2 = await Assessment.create({
    ownerId: demoUser._id,
    targetId: target1._id,
    status: 'completed',
    progress: 100,
    startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000 + 3800),
    durationMs: 3800,
    summary: {
      totalChecks: 8,
      passedChecks: 6,
      failedChecks: 1,
      skippedChecks: 1,
      totalFindings: 2,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 1,
      lowCount: 1,
      infoCount: 0,
      postureScore: 89
    },
    checkResults: [
      { checkId: 'check-security-headers', name: 'Security Headers Inspection', category: 'headers', status: 'warning', durationMs: 40, message: 'CSP still recommended' },
      { checkId: 'check-cookie-security', name: 'Cookie Security Attributes', category: 'cookies', status: 'passed', durationMs: 18, message: 'All cookies secure' },
      { checkId: 'check-server-disclosure', name: 'Server & Stack Information Disclosure', category: 'info_disclosure', status: 'passed', durationMs: 12, message: 'Banners suppressed' },
      { checkId: 'check-tls-config', name: 'TLS / SSL Configuration', category: 'tls', status: 'passed', durationMs: 115, message: 'Valid certificate' },
      { checkId: 'check-cors-config', name: 'CORS Policy Evaluation', category: 'cors', status: 'passed', durationMs: 105, message: 'CORS safe' },
      { checkId: 'check-https-redirect', name: 'HTTPS Redirection & Downgrade Check', category: 'redirect', status: 'passed', durationMs: 90, message: 'HTTP redirects to HTTPS' },
      { checkId: 'check-robots-exposure', name: 'robots.txt Information Exposure', category: 'info_disclosure', status: 'passed', durationMs: 45, message: 'Clean' },
      { checkId: 'check-security-txt', name: 'RFC 9116 security.txt Discovery', category: 'policy', status: 'warning', durationMs: 50, message: 'security.txt missing' }
    ]
  });

  console.log('[Seed] Creating findings...');
  // Finding 1: CSP Missing (Medium, In Progress)
  await Finding.create({
    ownerId: demoUser._id,
    targetId: target1._id,
    assessmentId: assessment2._id,
    ruleId: 'SEC-HDR-CSP-MISSING',
    title: 'Missing Content-Security-Policy (CSP) Header',
    category: 'headers',
    severity: 'Medium',
    confidence: 'High',
    normalizedEndpoint: '/',
    affectedUrl: 'https://example.com/',
    description: 'The response does not include a Content-Security-Policy header. CSP restricts the origins from which scripts, styles, images, and other resources can be loaded.',
    evidence: { headerChecked: 'Content-Security-Policy', observedValue: null },
    impact: 'Without CSP, the browser has no origin restrictions on injected inline or remote scripts, increasing the risk and impact of XSS vulnerabilities.',
    remediation: {
      summary: 'Implement a Content-Security-Policy header defining allowed resource sources.',
      steps: [
        'Audit third-party script tags and dependencies.',
        'Deploy baseline policy: default-src \'self\'; script-src \'self\'; object-src \'none\';',
        'Test in Report-Only mode before enforcing.'
      ],
      configSnippet: "Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none';",
      checklist: ['Audit scripts', 'Add CSP header in reverse proxy']
    },
    status: 'In Progress',
    statusHistory: [
      { status: 'Open', changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), reason: 'Initial scan finding' },
      { status: 'In Progress', changedBy: demoUser._id, changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), reason: 'Drafting CSP in report-only mode first' }
    ],
    notes: [
      { authorId: demoUser._id, authorName: demoUser.name, content: 'Spoke with frontend team. We have 2 Google Analytics inline scripts to nonce before full rollout.' }
    ],
    firstDetectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    lastObservedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
  });

  // Finding 2: HSTS (Fixed!)
  await Finding.create({
    ownerId: demoUser._id,
    targetId: target1._id,
    assessmentId: assessment1._id,
    ruleId: 'SEC-HDR-HSTS-MISSING',
    title: 'Missing HTTP Strict-Transport-Security (HSTS) Header',
    category: 'headers',
    severity: 'Medium',
    confidence: 'High',
    normalizedEndpoint: '/',
    affectedUrl: 'https://example.com/',
    description: 'The HTTPS response does not specify a Strict-Transport-Security header.',
    evidence: { headerChecked: 'Strict-Transport-Security', observedValue: null },
    impact: 'Users making initial HTTP requests can be intercepted or downgraded to cleartext HTTP before an HTTPS redirect completes.',
    remediation: {
      summary: 'Send Strict-Transport-Security header with a long max-age on all HTTPS responses.',
      steps: ['Deploy Strict-Transport-Security: max-age=31536000; includeSubDomains; preload in Cloudflare.'],
      configSnippet: 'Strict-Transport-Security: max-age=31536000; includeSubDomains',
      checklist: ['Configure Cloudflare HSTS with 1 year max-age']
    },
    status: 'Fixed',
    statusHistory: [
      { status: 'Open', changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), reason: 'Initial scan finding' },
      { status: 'Fixed', changedBy: demoUser._id, changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), reason: 'HSTS enabled in production reverse proxy' }
    ],
    notes: [
      { authorId: demoUser._id, authorName: demoUser.name, content: 'Enabled 1-year HSTS in production Nginx config. Verified with curl.' }
    ],
    firstDetectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    lastObservedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  });

  // Finding 3: Server Disclosure (Accepted Risk)
  await Finding.create({
    ownerId: demoUser._id,
    targetId: target1._id,
    assessmentId: assessment2._id,
    ruleId: 'DISCLOSURE-SERVER-VERSION',
    title: 'Server Header Exposes Specific Version (Apache/2.4.52)',
    category: 'info_disclosure',
    severity: 'Low',
    confidence: 'High',
    normalizedEndpoint: '/',
    affectedUrl: 'https://example.com/',
    description: "The 'Server' header exposes exact software and version numbers (Apache/2.4.52).",
    evidence: { headerChecked: 'Server', observedValue: 'Apache/2.4.52' },
    impact: 'Precise software versions allow attackers to quickly match the host against published CVE vulnerability databases.',
    remediation: {
      summary: 'Configure web server / reverse proxy to suppress detailed version banners.',
      steps: ['Set ServerTokens Prod in Apache config.'],
      configSnippet: 'ServerTokens Prod',
      checklist: ['Suppress version numbers']
    },
    status: 'Accepted Risk',
    statusHistory: [
      { status: 'Open', changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), reason: 'Initial scan finding' },
      { status: 'Accepted Risk', changedBy: demoUser._id, changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), reason: 'Hosting provider managed proxy does not allow custom server banner override on standard plan' }
    ],
    firstDetectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    lastObservedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
  });

  console.log('[Seed] Database successfully seeded with demo accounts!');
  console.log('----------------------------------------------------');
  console.log('Demo Credentials:');
  console.log('Email:    auditor@traceguard.dev');
  console.log('Password: Password123!');
  console.log('Admin Email:    admin@traceguard.dev');
  console.log('Admin Password: AdminPassword123!');
  console.log('----------------------------------------------------');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('[Seed Error]:', err);
  process.exit(1);
});
