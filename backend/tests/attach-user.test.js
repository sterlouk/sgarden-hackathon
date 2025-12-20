import test from 'ava';
import http from 'node:http';
import express from 'express';
import got from 'got';

import attachUser from '../src/utils/attach-user.js';

test('attachUser returns 401 when no token provided', async (t) => {
  const app = express();
  app.use(express.json());
  app.get('/protected', attachUser, (req, res) => res.json({ ok: true }));

  const server = http.createServer(app).listen();
  const { port } = server.address();
  const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}` });

  try {
    const resp = await client.get('protected', { throwHttpErrors: false });
    t.is(resp.statusCode, 401);
    t.truthy(resp.body.message && resp.body.message.includes('No token'));
  } finally {
    server.close();
  }
});
