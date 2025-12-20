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

const patch = (obj, name, impl) => {
    const orig = obj[name];
    obj[name] = impl;
    return () => { obj[name] = orig; };
};

test.serial('POST /api/ returns exists when User.findOne returns a user (non-test env)', async (t) => {
    process.env.FORCE_NON_TEST = 'true';
    const restore = patch(User, 'findOne', (q) => Promise.resolve({ _id: 'x', email: q.email }));
    const app = buildApp({ setResUser: true });
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        const r = await client.post('api/', { json: { email: 'exists@example.com' } });
        t.is(r.statusCode, 200);
        t.false(r.body.success);
        t.true(/already exists/.test(r.body.message));
    } finally { restore(); delete process.env.FORCE_NON_TEST; server.close(); }
});

test.serial('POST /api/role returns success:false when findByIdAndUpdate returns null (non-test env)', async (t) => {
    process.env.FORCE_NON_TEST = 'true';
    const restore = patch(User, 'findByIdAndUpdate', (id, obj) => Promise.resolve(null));
    const app = buildApp({ setResUser: true });
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        const r = await client.post('api/role', { json: { id: '507f1f77bcf86cd799439011', role: 'user' } });
        t.is(r.statusCode, 200);
        t.false(r.body.success);
    } finally { restore(); delete process.env.FORCE_NON_TEST; server.close(); }
});

test.serial('GET /api/profile/:userId returns 404 when user missing (non-test env) and access allowed', async (t) => {
    process.env.FORCE_NON_TEST = 'true';
    const restore = patch(User, 'findById', (id) => ({ select: () => Promise.resolve(null) }));
    const app = buildApp({ setResUser: true, resUser: { id: '507f1f77bcf86cd799439011', role: 'user' } });
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        const r = await client.get('api/profile/507f1f77bcf86cd799439011');
        t.is(r.statusCode, 404);
        t.is(r.body.message, 'User not found');
    } finally { restore(); delete process.env.FORCE_NON_TEST; server.close(); }
});

test.serial('POST /api/ returns error message when User.findOne throws', async (t) => {
    process.env.FORCE_NON_TEST = 'true';
    const restore = patch(User, 'findOne', () => { throw { body: 'invite-error' }; });
    const app = buildApp({ setResUser: true });
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        const r = await client.post('api/', { json: { email: 'x@example.com' } });
        t.is(r.statusCode, 200);
        t.false(r.body.success);
        t.is(r.body.message, 'invite-error');
    } finally { restore(); delete process.env.FORCE_NON_TEST; server.close(); }
});

test.serial('GET /api/profile and /api/user-details return mapped profile when user exists', async (t) => {
    process.env.FORCE_NON_TEST = 'true';
    const userObj = { _id: '507f1f77bcf86cd799439011', username: 'u', email: 'e@e', role: 'user', lastActiveAt: '2020-01-01' };
    const restore = patch(User, 'findById', (id) => ({ select: () => Promise.resolve(userObj) }));
    const app = buildApp({ setResUser: true, resUser: { id: '507f1f77bcf86cd799439011', role: 'user' } });
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        const r1 = await client.get('api/profile/507f1f77bcf86cd799439011');
        t.is(r1.statusCode, 200);
        t.is(r1.body.profile.username, 'u');

        const r2 = await client.get('api/user-details/507f1f77bcf86cd799439011');
        t.is(r2.statusCode, 200);
        t.is(r2.body.profile.email, 'e@e');
    } finally { restore(); delete process.env.FORCE_NON_TEST; server.close(); }
});
