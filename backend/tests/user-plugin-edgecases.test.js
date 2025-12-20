import fs from 'fs';
import path from 'path';
import http from 'node:http';

import test from 'ava';
import got from 'got';
import express from 'express';

import userRoutes from '../src/routes/user.js';

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

test.serial('POST /load-plugin returns 400 when pluginName missing', async (t) => {
    const app = buildApp({ setResUser: true });
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });

    try {
        const { statusCode, body } = await client.post('api/load-plugin', { json: {} });
        t.is(statusCode, 400);
        t.is(body.message, 'Plugin name required');
    } finally {
        server.close();
    }
});

test.serial('POST /load-plugin returns 400 when plugin not allowed', async (t) => {
    const app = buildApp({ setResUser: true });
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });

    try {
        const { statusCode, body } = await client.post('api/load-plugin', { json: { pluginName: 'evil-plugin' } });
        t.is(statusCode, 400);
        t.true(String(body.message).startsWith('Plugin not allowed'));
    } finally {
        server.close();
    }
});
