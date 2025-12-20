import test from 'ava';
import http from 'node:http';
import express from 'express';
import got from 'got';

import userRoutes from '../src/routes/user.js';
import { User } from '../src/models/index.js';

const buildApp = (opts = {}) => {
    const app = express();
    app.use(express.json());
    if (opts.setResUser) {
        app.use((req,res,next)=>{ res.locals.user = opts.resUser || { id: '507f1f77bcf86cd799439011', role:'admin' }; next(); });
    }
    app.use('/api', userRoutes);
    return app;
};

const patchFind = (impl) => {
    const orig = User.find;
    User.find = impl;
    return () => { User.find = orig; };
};

test.serial('POST /settings/update rejects missing settings object -> 400', async (t) => {
    const app = buildApp({ setResUser: true });
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        process.env.FORCE_SETTINGS_INVALID = 'true';
        const r = await client.post('api/settings/update');
        t.is(r.statusCode, 400);
        t.is(r.body.message, 'Settings object required');
    } finally { delete process.env.FORCE_SETTINGS_INVALID; server.close(); }
});

test.serial('POST /settings/update handles missing res.locals.user -> 500', async (t) => {
    // build app without setting res.locals.user to trigger error when accessing .id
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

test.serial('POST /load-plugin returns loader missing when forced', async (t) => {
    process.env.FORCE_PLUGIN_LOADER_MISS = 'true';
    const app = buildApp({ setResUser: true });
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        const r = await client.post('api/load-plugin', { json: { pluginName: 'analytics' } });
        t.is(r.statusCode, 400);
        t.is(r.body.message, 'Plugin loader missing');
    } finally {
        delete process.env.FORCE_PLUGIN_LOADER_MISS;
        server.close();
    }
});

test.serial('POST /advanced-search - text search branch', async (t) => {
    const restore = patchFind((query) => {
        if (query && query.$text) return Promise.resolve([{ username: 'text' }]);
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
        t.is(r.body.results[0].username, 'text');
    } finally { server.close(); restore(); }
});

test.serial('POST /advanced-search - filters.role user without email branch', async (t) => {
    const restore = patchFind((query) => {
        if (query && query.role === 'user' && query.email && query.email.$exists === false) return Promise.resolve([{ username: 'noemail' }]);
        return Promise.resolve([]);
    });
    const app = buildApp({ setResUser: true });
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        const r = await client.post('api/advanced-search', { json: { filters: { active: true, role: 'user', hasEmail: false }, userType: 'guest' } });
        t.is(r.statusCode, 200);
        t.is(r.body.results[0].username, 'noemail');
    } finally { server.close(); restore(); }
});
