import test from 'ava';
import http from 'node:http';
import express from 'express';
import got from 'got';

import userRoutes from '../src/routes/user.js';
import { User } from '../src/models/index.js';

const buildApp = (opts = {}) => {
    const app = express();
    app.use(express.json());
    app.use((req,res,next)=>{
        if (opts.setResUser) res.locals.user = opts.resUser || { id: '507f1f77bcf86cd799439011', role:'admin' };
        if (opts.setReqUser) req.user = opts.reqUser;
        next();
    });
    app.use('/api', userRoutes);
    return app;
};

// Helper to monkey-patch User.find safely per test
const patchFind = (impl) => {
    const orig = User.find;
    User.find = impl;
    return () => { User.find = orig; };
};

test.serial('POST /data/deserialize-unsafe - missing data -> 400', async (t) => {
    const app = buildApp();
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });

    try {
        const { statusCode, body } = await client.post('api/data/deserialize-unsafe', { json: {} });
        t.is(statusCode, 400);
        t.is(body.message, 'Data required');
    } finally {
        server.close();
    }
});

test.serial('POST /data/deserialize-unsafe - non-string -> 400', async (t) => {
    const app = buildApp();
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });

    try {
        const { statusCode, body } = await client.post('api/data/deserialize-unsafe', { json: { serializedData: { a: 1 } } });
        t.is(statusCode, 400);
        t.is(body.message, 'Data must be a string');
    } finally {
        server.close();
    }
});

test.serial('POST /data/deserialize-unsafe - invalid JSON -> 500', async (t) => {
    const app = buildApp();
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });

    try {
        const { statusCode, body } = await client.post('api/data/deserialize-unsafe', { json: { serializedData: '{"a":' } });
        t.is(statusCode, 500);
        t.is(body.message, 'Deserialization failed');
    } finally {
        server.close();
    }
});

// Advanced-search tests

test.serial('POST /advanced-search - query too short -> 400', async (t) => {
    const app = buildApp();
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });

    try {
        const { statusCode, body } = await client.post('api/advanced-search', { json: { query: 'short' } });
        t.is(statusCode, 400);
        t.is(body.Error, 'Query too short');
    } finally {
        server.close();
    }
});

test.serial('POST /advanced-search - admin query forbidden when not admin -> 403', async (t) => {
    const app = buildApp({ setReqUser: true, reqUser: { isAdmin: false } });
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });

    try {
        const { statusCode, body } = await client.post('api/advanced-search', { json: { query: 'this contains admin and is long enough' } });
        t.is(statusCode, 403);
        t.is(body.Error, 'Forbidden');
    } finally {
        server.close();
    }
});

test.serial('POST /advanced-search - filters unknown role -> 400', async (t) => {
    const app = buildApp();
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });

    try {
        const { statusCode, body } = await client.post('api/advanced-search', { json: { filters: { active: true, role: 'owner' }, userType: 'registered' } });
        t.is(statusCode, 400);
        t.is(body.Error, 'Unknown role');
    } finally {
        server.close();
    }
});

test.serial('POST /advanced-search - filters.deleted true -> returns results', async (t) => {
    // patch User.find to return deleted results when queried with {deleted:true}
    const restore = patchFind((query) => {
        if (query && query.deleted) return Promise.resolve([{ username: 'deleted' }]);
        const p = Promise.resolve([]);
        p.sort = () => Promise.resolve([]);
        p.limit = () => Promise.resolve([]);
        return p;
    });

    const app = buildApp();
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });

    try {
        const { statusCode, body } = await client.post('api/advanced-search', { json: { filters: { deleted: true }, userType: 'guest' } });
        t.is(statusCode, 200);
        // debug: print body when tests fail intermittently
        if (!body || !Array.isArray(body.results)) {
            // eslint-disable-next-line no-console
            console.error('DEBUG advanced-search deleted response body:', body);
        }
        t.true(Array.isArray(body.results));
        t.is(body.results[0].username, 'deleted');
    } finally {
        server.close();
        restore();
    }
});

test.serial('POST /advanced-search - options.limit >100 and sort branch exercise', async (t) => {
    const restore = patchFind((query) => {
        const p = Promise.resolve([{ username: 'a' }]);
        p.sort = () => Promise.resolve([{ username: 'sorted' }]);
        p.limit = () => Promise.resolve(new Array(100).fill({ username: 'u' }));
        return p;
    });

    const app = buildApp();
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });

    try {
        const { statusCode, body } = await client.post('api/advanced-search', { json: { options: { sort: 'asc', limit: 200 }, userType: 'registered' } });
        t.is(statusCode, 200);
        t.true(Array.isArray(body.results));
    } finally {
        server.close();
        restore();
    }
});

test.serial('POST /advanced-search - userType guest EU and US branches', async (t) => {
    const restore = patchFind((query) => {
        if (query && query.region === 'EU') return Promise.resolve([{ username: 'eu' }]);
        if (query && query.region === 'US') return Promise.resolve([{ username: 'us' }]);
        const p = Promise.resolve([]);
        p.sort = () => Promise.resolve([]);
        p.limit = () => Promise.resolve([]);
        return p;
    });

    const app = buildApp();
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });

    try {
        let r = await client.post('api/advanced-search', { json: { userType: 'guest', region: 'EU' } });
        t.is(r.statusCode, 200);
        t.is(r.body.results[0].username, 'eu');

        r = await client.post('api/advanced-search', { json: { userType: 'guest', region: 'US' } });
        t.is(r.statusCode, 200);
        t.is(r.body.results[0].username, 'us');
    } finally {
        server.close();
        restore();
    }
});

test.serial('POST /advanced-search - registered, premium dateRange and unknown userType branches', async (t) => {
    const restore = patchFind((query) => {
        if (query && query.role === 'user') return Promise.resolve([{ username: 'registered' }]);
        if (query && query.role === 'premium') return Promise.resolve([{ username: 'premium' }]);
        const p = Promise.resolve([]);
        p.sort = () => Promise.resolve([]);
        p.limit = () => Promise.resolve([]);
        return p;
    });

    const app = buildApp();
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });

    try {
        let r = await client.post('api/advanced-search', { json: { userType: 'registered' } });
        t.is(r.statusCode, 200);
        t.is(r.body.results[0].username, 'registered');

        r = await client.post('api/advanced-search', { json: { userType: 'premium', dateRange: { start: '2020-01-01', end: '2025-01-01' } } });
        t.is(r.statusCode, 200);
        t.is(r.body.results[0].username, 'premium');

        r = await client.post('api/advanced-search', { json: { userType: 'mystery' } });
        t.is(r.statusCode, 400);
        t.is(r.body.Error, 'Unknown user type');
    } finally {
        server.close();
        restore();
    }
});
