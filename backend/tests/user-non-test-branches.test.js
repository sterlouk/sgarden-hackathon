import test from 'ava';
import http from 'node:http';
import express from 'express';
import got from 'got';

import userRoutes from '../src/routes/user.js';
import { User } from '../src/models/index.js';

const buildServer = (patchers = {}) => {
    // force route code to treat this as non-test environment
    process.env.FORCE_NON_TEST = 'true';

    const origs = {};
    if (patchers.findAll) {
        origs.find = User.find;
        User.find = async () => [{ username: 'listuser' }];
    }
    if (patchers.findByIdNull) {
        origs.findById = User.findById;
        User.findById = (id) => ({ select: async () => null });
    }
    if (patchers.findByIdFound) {
        origs.findById = User.findById;
        User.findById = (id) => ({ select: async () => ({ _id: id, username: 'found', email: 'f@example.com', role: 'user', lastActiveAt: new Date() }) });
    }
    if (patchers.roleUpdateNotFound) {
        origs.findByIdAndUpdate = User.findByIdAndUpdate;
        User.findByIdAndUpdate = async (id, data) => null;
    }

    const app = express();
    app.use(express.json());
    app.use((req,res,next)=>{ res.locals.user = { id: '507f1f77bcf86cd799439011', role:'admin' }; next(); });
    app.use('/api', userRoutes);

    const server = http.createServer(app).listen();
    const { port } = server.address();

    const restore = () => {
        process.env.FORCE_NON_TEST = '';
        Object.keys(origs).forEach(k => { User[k] = origs[k]; });
        server.close();
    };

    return { server, port, restore };
};

test.serial('GET /api/profile/:id returns 404 when user missing (non-test env)', async (t) => {
    const { server, port, restore } = buildServer({ findByIdNull: true });
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        const r = await client.get(`api/profile/507f1f77bcf86cd799439011`);
        t.is(r.statusCode, 404);
        t.is(r.body.message, 'User not found');
    } finally { restore(); }
});

test.serial('GET /api/user-details/:id returns 404 when missing (non-test env)', async (t) => {
    const { server, port, restore } = buildServer({ findByIdNull: true });
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        const r = await client.get(`api/user-details/507f1f77bcf86cd799439011`);
        t.is(r.statusCode, 404);
        t.is(r.body.message, 'User not found');
    } finally { restore(); }
});

test.serial('GET /api/ returns users from User.find in non-test env', async (t) => {
    const { server, port, restore } = buildServer({ findAll: true });
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        const r = await client.get('api/');
        t.is(r.statusCode, 200);
        t.true(Array.isArray(r.body.users));
        t.is(r.body.users[0].username, 'listuser');
    } finally { restore(); }
});

test.serial('POST /api/role returns success:false when user not found (non-test env)', async (t) => {
    const { server, port, restore } = buildServer({ roleUpdateNotFound: true });
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
    try {
        const r = await client.post('api/role', { json: { id: '507f1f77bcf86cd799439011', role: 'admin' } });
        t.is(r.statusCode, 200);
        t.is(r.body.success, false);
    } finally { restore(); }
});
