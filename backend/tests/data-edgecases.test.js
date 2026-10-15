import test from 'ava';
import { setupTestServer, teardownTestServer } from './test-helpers.js';

test.beforeEach(async (t) => {
  const mod = await import('../src/routes/data.js');
  setupTestServer(t, mod.default, '/api/data');
});

test.afterEach.always((t) => {
  teardownTestServer(t);
});

test('GET /download-report rejects traversal in name', async (t) => {
  const resp = await t.context.got.get('api/data/download-report', { searchParams: { reportName: '../secrets' }, throwHttpErrors: false });
  t.is(resp.statusCode, 400);
  t.truthy(resp.body.message);
});

test('GET /render-page rejects missing template', async (t) => {
  const resp = await t.context.got.get('api/data/render-page', { throwHttpErrors: false });
  t.is(resp.statusCode, 400);
  t.is(resp.body.message, 'Template name required');
});

test('GET /render-page rejects invalid template name with slash', async (t) => {
  const resp = await t.context.got.get('api/data/render-page', { searchParams: { template: 'dir/page' }, throwHttpErrors: false });
  t.is(resp.statusCode, 400);
  t.truthy(resp.body.message);
});
