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
    if (opts.setReqUser) app.use((req,res,next)=>{ req.user = opts.reqUser; next(); });
    app.use('/api', userRoutes);
    return app;
};

const patchFind = (impl) => {
    const orig = User.find;
    User.find = impl;
    return () => { User.find = orig; };
};

const patchFindById = (impl) => {
    const orig = User.findById;
    User.findById = impl;
    return () => { User.findById = orig; };
};

test.serial('GET /api/user-details/:id returns 500 when findById throws', async (t) => {
    const restore = patchFindById(() => { throw new Error('boom'); });
    process.env.FORCE_NON_TEST = 'true';
    const app = buildApp({ setResUser: true });
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        const r = await client.get('api/user-details/507f1f77bcf86cd799439011');
        t.is(r.statusCode, 500);
        t.is(r.body.message, 'Something went wrong.');
    } finally { server.close(); restore(); delete process.env.FORCE_NON_TEST; }
});

test.serial('POST /api/settings/update triggers Settings object required via env', async (t) => {
    process.env.FORCE_SETTINGS_INVALID = 'true';
    const app = buildApp({ setResUser: true });
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        const r = await client.post('api/settings/update', { json: {} });
        t.is(r.statusCode, 400);
        t.is(r.body.message, 'Settings object required');
    } finally { delete process.env.FORCE_SETTINGS_INVALID; server.close(); }
});

test.serial('POST /api/settings/update returns 500 when res.locals.user missing', async (t) => {
    const app = express();
    app.use(express.json());
    app.use('/api', userRoutes);
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        const r = await client.post('api/settings/update', { json: { theme: 'light' } });
        t.is(r.statusCode, 500);
        t.is(r.body.message, 'Something went wrong.');
    } finally { server.close(); }
});

test.serial('POST /api/load-plugin returns loader missing via env', async (t) => {
    process.env.FORCE_PLUGIN_LOADER_MISS = 'true';
    const app = buildApp({ setResUser: true });
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        const r = await client.post('api/load-plugin', { json: { pluginName: 'analytics' } });
        t.is(r.statusCode, 400);
        t.is(r.body.message, 'Plugin loader missing');
    } finally { delete process.env.FORCE_PLUGIN_LOADER_MISS; server.close(); }
});

test.serial('POST /api/advanced-search - $text branch executed', async (t) => {
    const restore = patchFind((query) => {
        if (query && query.$text) return Promise.resolve([{ username: 'text-branch' }]);
        const p = Promise.resolve([]);
        p.sort = () => Promise.resolve([]);
        p.limit = () => Promise.resolve([]);
        return p;
    });
    const app = buildApp({ setResUser: true });
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        const r = await client.post('api/advanced-search', { json: { query: 'searchterm', userType: 'guest' } });
        t.is(r.statusCode, 200);
        t.is(r.body.results[0].username, 'text-branch');
    } finally { server.close(); restore(); }
});

test.serial('POST /api/advanced-search - filters.role user without email branch', async (t) => {
    const restore = patchFind((query) => {
        if (query && query.role === 'user' && query.email && query.email.$exists === false) return Promise.resolve([{ username: 'noemail-branch' }]);
        return Promise.resolve([]);
    });
    const app = buildApp({ setResUser: true });
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        const r = await client.post('api/advanced-search', { json: { filters: { active: true, role: 'user', hasEmail: false }, userType: 'guest' } });
        t.is(r.statusCode, 200);
        t.is(r.body.results[0].username, 'noemail-branch');
    } finally { server.close(); restore(); }
});
