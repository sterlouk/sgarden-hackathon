import fs from 'fs';
import path from 'path';
import http from 'node:http';

import test from 'ava';
import got from 'got';
import express from 'express';

import userRoutes from '../src/routes/user.js';

const pluginsDir = path.resolve('./src/routes/plugins');
const analyticsFile = path.join(pluginsDir, 'analytics.js');
const backupFile = path.join(pluginsDir, 'analytics.bak');

const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use((req,res,next)=>{ res.locals.user = { id: '507f1f77bcf86cd799439011', role:'admin' }; next(); });
    app.use('/api', userRoutes);
    return app;
};

test.serial('POST /load-plugin handles loader import failure (500)', async (t) => {
    // rename analytics.js to simulate import failure on loader()
    if (!fs.existsSync(analyticsFile)) {
        t.fail('analytics.js not found');
        return;
    }

    fs.renameSync(analyticsFile, backupFile);

    const app = buildApp();
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });

    try {
        const { body, statusCode } = await client.post('api/load-plugin', { json: { pluginName: 'analytics' } });
        t.is(statusCode, 500);
        t.truthy(body.message);
        t.true(String(body.message).includes('Plugin loading failed') || typeof body.error === 'string');
    } finally {
        server.close();
        // restore file
        if (fs.existsSync(backupFile)) fs.renameSync(backupFile, analyticsFile);
    }
});
