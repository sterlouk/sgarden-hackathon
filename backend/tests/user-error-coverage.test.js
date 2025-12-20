import test from 'ava';
import http from 'node:http';
import express from 'express';
import got from 'got';

import userRoutes from '../src/routes/user.js';
import { User } from '../src/models/index.js';

const buildApp = (opts = {}) => {
    const app = express();
    app.use(express.json());
    if (opts.setResUser) app.use((req,res,next)=>{ res.locals.user = opts.resUser || { id: '507f1f77bcf86cd799439011', role:'admin' }; next(); });
    app.use('/api', userRoutes);
    return app;
};

const patch = (obj, key, fn) => {
    const orig = obj[key];
    obj[key] = fn;
    return () => { obj[key] = orig; };
};

test.serial('POST /api/role returns 500 when findByIdAndUpdate throws', async (t) => {
    process.env.FORCE_NON_TEST = 'true';
    const restore = patch(User, 'findByIdAndUpdate', async () => { throw new Error('boom-role'); });
    const app = buildApp({ setResUser: true });
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        const r = await client.post('api/role', { json: { id: '507f1f77bcf86cd799439011', role: 'admin' } });
        t.is(r.statusCode, 500);
        t.is(r.body.message, 'Something went wrong.');
    } finally { delete process.env.FORCE_NON_TEST; restore(); server.close(); }
});

test.serial('GET /api/profile/:userId returns 500 when select throws', async (t) => {
    process.env.FORCE_NON_TEST = 'true';
    const restore = patch(User, 'findById', (id) => ({ select: async () => { throw new Error('boom-select'); } }));
    const app = buildApp({ setResUser: true });
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        const r = await client.get('api/profile/507f1f77bcf86cd799439011');
        t.is(r.statusCode, 500);
        t.is(r.body.message, 'Something went wrong.');
    } finally { delete process.env.FORCE_NON_TEST; restore(); server.close(); }
});

test.serial('POST /api/settings/update returns finalSettings with given inputs', async (t) => {
    const app = buildApp({ setResUser: true });
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        const r = await client.post('api/settings/update', { json: { theme: 'dark', language: 'es', notifications: false } });
        t.is(r.statusCode, 200);
        t.is(r.body.settings.theme, 'dark');
        t.is(r.body.settings.language, 'es');
        t.is(r.body.settings.notifications, false);
    } finally { server.close(); }
});
