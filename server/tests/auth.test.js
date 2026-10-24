import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { config } from '../src/config/env.js';

test.before(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.MONGODB_URI);
  }
});

test.after(async () => {
  await mongoose.disconnect();
});

test('Auth API - Healthy status check', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'healthy');
});

test('Auth API - User registration, duplicate block, and login flow', async () => {
  const uniqueEmail = `testuser_${Date.now()}@traceguard.dev`;

  // 1. Register new user
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Auditor',
      email: uniqueEmail,
      password: 'SecurePassword123!'
    });

  assert.equal(regRes.status, 201);
  assert.equal(regRes.body.success, true);
  assert.ok(regRes.body.token);
  assert.equal(regRes.body.user.email, uniqueEmail);

  // 2. Duplicate registration attempt blocked
  const dupRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Auditor',
      email: uniqueEmail,
      password: 'SecurePassword123!'
    });

  assert.equal(dupRes.status, 409);
  assert.equal(dupRes.body.success, false);

  // 3. Login with correct credentials
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: uniqueEmail,
      password: 'SecurePassword123!'
    });

  assert.equal(loginRes.status, 200);
  assert.equal(loginRes.body.success, true);
  assert.ok(loginRes.body.token);

  // 4. Protected endpoint access with token
  const meRes = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${loginRes.body.token}`);

  assert.equal(meRes.status, 200);
  assert.equal(meRes.body.user.email, uniqueEmail);

  // 5. Unauthenticated request rejected
  const unauthRes = await request(app).get('/api/auth/me');
  assert.equal(unauthRes.status, 401);
});
