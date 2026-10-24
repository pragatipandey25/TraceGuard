import test from 'node:test';
import assert from 'node:assert/strict';
import { checkSecurityHeaders } from '../src/services/scanner/checks/securityHeaders.js';
import { checkCookieSecurity } from '../src/services/scanner/checks/cookieSecurity.js';
import { checkServerDisclosure } from '../src/services/scanner/checks/serverDisclosure.js';

test('Security Headers - Detects missing CSP, HSTS, XCTO, and XFO', () => {
  const mockResponse = {
    finalUrl: 'https://app.example.com',
    headers: {}
  };
  const context = { targetUrl: 'https://app.example.com' };

  const result = checkSecurityHeaders(mockResponse, context);
  assert.equal(result.status, 'warning');
  assert.ok(result.findings.length >= 4);

  const ruleIds = result.findings.map(f => f.ruleId);
  assert.ok(ruleIds.includes('SEC-HDR-CSP-MISSING'));
  assert.ok(ruleIds.includes('SEC-HDR-HSTS-MISSING'));
  assert.ok(ruleIds.includes('SEC-HDR-XCTO-MISSING'));
  assert.ok(ruleIds.includes('SEC-HDR-CLICKJACKING-DEFENSE-MISSING'));
  assert.ok(ruleIds.includes('SEC-HDR-REFERRER-POLICY-MISSING'));
});

test('Security Headers - Passes when all required security headers are present', () => {
  const mockResponse = {
    finalUrl: 'https://app.example.com',
    headers: {
      'content-security-policy': "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'self'",
      'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'SAMEORIGIN',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'permissions-policy': 'camera=(), microphone=()'
    }
  };
  const context = { targetUrl: 'https://app.example.com' };

  const result = checkSecurityHeaders(mockResponse, context);
  assert.equal(result.status, 'passed');
  assert.equal(result.findings.length, 0);
});

test('Cookie Security - Identifies cookies lacking Secure, HttpOnly, and SameSite', () => {
  const mockResponse = {
    finalUrl: 'https://app.example.com',
    headers: {
      'set-cookie': ['sessionid=xyz123; Path=/']
    }
  };
  const context = { targetUrl: 'https://app.example.com' };

  const result = checkCookieSecurity(mockResponse, context);
  const ruleIds = result.findings.map(f => f.ruleId);
  assert.ok(ruleIds.includes('COOKIE-MISSING-SECURE'));
  assert.ok(ruleIds.includes('COOKIE-MISSING-HTTPONLY'));
  assert.ok(ruleIds.includes('COOKIE-MISSING-SAMESITE'));
});

test('Cookie Security - Passes secure cookies', () => {
  const mockResponse = {
    finalUrl: 'https://app.example.com',
    headers: {
      'set-cookie': ['token=abc; Secure; HttpOnly; SameSite=Strict; Path=/']
    }
  };
  const context = { targetUrl: 'https://app.example.com' };

  const result = checkCookieSecurity(mockResponse, context);
  assert.equal(result.findings.length, 0);
});

test('Server Disclosure - Flags technology leaks in response headers', () => {
  const mockResponse = {
    finalUrl: 'https://app.example.com',
    headers: {
      'server': 'Apache/2.4.41 (Ubuntu)',
      'x-powered-by': 'Express'
    }
  };
  const context = { targetUrl: 'https://app.example.com' };

  const result = checkServerDisclosure(mockResponse, context);
  const ruleIds = result.findings.map(f => f.ruleId);
  assert.ok(ruleIds.includes('DISCLOSURE-X-POWERED-BY'));
  assert.ok(ruleIds.includes('DISCLOSURE-SERVER-VERSION'));
});
