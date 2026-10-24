import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTargetUrl, isPrivateOrReservedIPv4, isPrivateOrReservedIPv6 } from '../src/services/scanner/targetValidator.js';

test('SSRF Prevention - Rejects private IPv4 ranges', () => {
  const privateIps = [
    '127.0.0.1',
    '127.0.0.2',
    '10.0.0.1',
    '10.255.255.254',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '192.168.0.254',
    '169.254.169.254', // AWS/GCP metadata
    '169.254.1.1',
    '0.0.0.0',
    '100.64.0.1',
    '198.18.0.1',
    '224.0.0.1', // Multicast
    '240.0.0.1'  // Reserved
  ];

  for (const ip of privateIps) {
    const result = isPrivateOrReservedIPv4(ip);
    assert.equal(result.blocked, true, `Expected ${ip} to be blocked`);
  }
});

test('SSRF Prevention - Permits public IPv4 addresses', () => {
  const publicIps = [
    '8.8.8.8',
    '1.1.1.1',
    '93.184.216.34', // example.com
    '142.250.190.46'
  ];

  for (const ip of publicIps) {
    const result = isPrivateOrReservedIPv4(ip);
    assert.equal(result.blocked, false, `Expected ${ip} to NOT be blocked`);
  }
});

test('SSRF Prevention - Rejects IPv6 loopback and private ranges', () => {
  const privateIpv6s = [
    '::1',
    '::',
    'fe80::1',       // Link-local
    'fc00::1',       // Unique local
    'fd12:3456::1',  // Unique local
    '::ffff:127.0.0.1', // IPv4-mapped loopback
    '::ffff:10.0.0.1',  // IPv4-mapped private
    '::ffff:169.254.169.254' // IPv4-mapped metadata
  ];

  for (const ip of privateIpv6s) {
    const result = isPrivateOrReservedIPv6(ip);
    assert.equal(result.blocked, true, `Expected IPv6 ${ip} to be blocked`);
  }
});

test('SSRF Prevention - validateTargetUrl blocks dangerous targets', async () => {
  const dangerousUrls = [
    'http://localhost',
    'http://localhost:8080',
    'http://127.0.0.1',
    'http://127.0.0.1:80',
    'http://169.254.169.254/latest/meta-data/',
    'http://metadata.google.internal',
    'ftp://example.com',
    'file:///etc/passwd',
    'javascript:alert(1)',
    'http://app.internal',
    'http://service.local'
  ];

  for (const url of dangerousUrls) {
    const result = await validateTargetUrl(url);
    assert.equal(result.isValid, false, `Expected ${url} to be invalid`);
    assert.ok(result.error, `Expected an error message for ${url}`);
  }
});

test('SSRF Prevention - Disallows non-web ports', async () => {
  const badPortUrls = [
    'http://example.com:22',   // SSH
    'http://example.com:25',   // SMTP
    'http://example.com:3306', // MySQL
    'http://example.com:27017' // MongoDB
  ];

  for (const url of badPortUrls) {
    const result = await validateTargetUrl(url);
    assert.equal(result.isValid, false, `Expected port to be blocked for ${url}`);
  }
});

test('SSRF Prevention - Validates permitted public HTTPS targets', async () => {
  const validUrl = 'https://example.com';
  const result = await validateTargetUrl(validUrl);
  assert.equal(result.isValid, true, `Expected ${validUrl} to be valid`);
  assert.ok(result.resolvedIps.length > 0, 'Expected resolved IP list');
});
