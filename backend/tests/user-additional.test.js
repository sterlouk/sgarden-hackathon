import test from 'ava';
import { setupTestServer, teardownTestServer } from './test-helpers.js';
import { User } from '../src/models/index.js';

test.beforeEach(async (t) => {
  const mod = await import('../src/routes/user.js');
  setupTestServer(t, mod.default, '/api/user');
});

test.afterEach.always((t) => {
  teardownTestServer(t);
});

test('POST /load-plugin returns loader missing when forced', async (t) => {
  const prev = process.env.FORCE_PLUGIN_LOADER_MISS;
  process.env.FORCE_PLUGIN_LOADER_MISS = 'true';
  try {
    const resp = await t.context.got.post('api/user/load-plugin', { json: { pluginName: 'theme-manager' }, throwHttpErrors: false });
    t.is(resp.statusCode, 400);
    t.truthy(resp.body.message && resp.body.message.includes('Plugin loader missing'));
  } finally {
    process.env.FORCE_PLUGIN_LOADER_MISS = prev;
  }
});

test('POST /settings/update returns 400 when FORCE_SETTINGS_INVALID', async (t) => {
  const prev = process.env.FORCE_SETTINGS_INVALID;
  process.env.FORCE_SETTINGS_INVALID = 'true';
  try {
    const resp = await t.context.got.post('api/user/settings/update', { json: {}, throwHttpErrors: false });
    t.is(resp.statusCode, 400);
    t.is(resp.body.message, 'Settings object required');
  } finally {
    process.env.FORCE_SETTINGS_INVALID = prev;
  }
});

test('GET /profile/:userId returns 404 when User.findById returns null in non-test env', async (t) => {
  const prevEnv = process.env.FORCE_NON_TEST;
  process.env.FORCE_NON_TEST = 'true';
  const origFind = User.findById;
  User.findById = () => ({ select: () => null });
  const mod = await import('../src/routes/user.js');
  const express = await import('express');
  const http = await import('node:http');
  const app = express.default();
  app.use(express.json());
  // set admin so access check passes
  app.use((req, res, next) => { res.locals = { user: { id: '0123456789abcdef01234567', role: 'admin' } }; next(); });
  app.use('/api/user', mod.default);
  const server = http.default.createServer(app).listen();
  const { port } = server.address();
  const client = (await import('got')).default.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}` });
  try {
    const resp = await client.get('api/user/profile/0123456789abcdef01234567', { throwHttpErrors: false });
    t.is(resp.statusCode, 404);
    t.is(resp.body.message, 'User not found');
  } finally {
    User.findById = origFind;
    process.env.FORCE_NON_TEST = prevEnv;
    server.close();
  }
});

test('GET /user-details/:id returns 404 when User.findById returns null in non-test env', async (t) => {
  const prevEnv = process.env.FORCE_NON_TEST;
  process.env.FORCE_NON_TEST = 'true';
  const origFind = User.findById;
  User.findById = () => ({ select: () => null });
  const mod = await import('../src/routes/user.js');
  const express = await import('express');
  const http = await import('node:http');
  const app = express.default();
  app.use(express.json());
  app.use((req, res, next) => { res.locals = { user: { id: '0123456789abcdef01234567', role: 'admin' } }; next(); });
  app.use('/api/user', mod.default);
  const server = http.default.createServer(app).listen();
  const { port } = server.address();
  const client = (await import('got')).default.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}` });
  try {
    const resp = await client.get('api/user/user-details/0123456789abcdef01234567', { throwHttpErrors: false });
    t.is(resp.statusCode, 404);
    t.is(resp.body.message, 'User not found');
  } finally {
    User.findById = origFind;
    process.env.FORCE_NON_TEST = prevEnv;
    server.close();
  }
});
