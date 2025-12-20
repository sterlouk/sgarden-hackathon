import http from "node:http";

import test from "ava";
import got from "got";
import express from "express";

import userRoutes from "../src/routes/user.js";
import { User } from "../src/models/index.js";

// no sinon sandbox here; tests will monkey-patch `User.find` per-test

const buildApp = (attachReqUser) => {
    const app = express();
    app.use(express.json());
    // attach res.locals.user and optionally req.user
    app.use((req, res, next) => {
        res.locals.user = { id: "507f1f77bcf86cd799439011", role: "admin" };
        if (attachReqUser) req.user = { isAdmin: true };
        next();
    });
    app.use("/api", userRoutes);
    return app;
};

// no global before/after hooks

test.serial("advanced-search: admin query with req.user.isAdmin triggers admin find", async (t) => {
    const app = buildApp(true);
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: "json", prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });

    const origFind = User.find;
    User.find = (arg) => {
        if (arg && arg.role === "admin") return Promise.resolve([{ username: "a" }]);
        if (arg) return Promise.resolve([]);
        return { sort: () => Promise.resolve([]), limit: () => Promise.resolve([]) };
    };

    try {
        const { body, statusCode } = await client.post("api/advanced-search", {
            json: { query: "admin query term", userType: 'registered' },
        });

        t.is(statusCode, 200);
        t.true(Array.isArray(body.results));
    } finally {
        User.find = origFind;
        server.close();
    }
});

test.serial("advanced-search: options.sort desc and options.limit>100 branches", async (t) => {
    const app = buildApp(false);
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: "json", prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });

    const origFind = User.find;
    User.find = (arg) => {
        if (arg) return Promise.resolve([]);
        return { sort: () => Promise.resolve([]), limit: () => Promise.resolve([]) };
    };

    try {
        // test sort desc
        let res = await client.post("api/advanced-search", { json: { options: { sort: 'desc' }, userType: 'registered' } });
        t.is(res.statusCode, 200);

        // test limit > 100
        res = await client.post("api/advanced-search", { json: { options: { limit: 150 }, userType: 'registered' } });
        t.is(res.statusCode, 200);
    } finally {
        User.find = origFind;
        server.close();
    }
});

test.serial("advanced-search: filters.deleted and userType premium with dateRange", async (t) => {
    const app = buildApp(false);
    const server = http.createServer(app).listen();
    const { port } = server.address();
    const client = got.extend({ responseType: "json", prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });

    const origFind = User.find;
    User.find = (arg) => {
        if (arg && arg.deleted) return Promise.resolve([{ username: 'deleted_user' }]);
        if (arg && arg.role === 'premium') return Promise.resolve([{ username: 'prem' }]);
        if (arg) return Promise.resolve([]);
        return { sort: () => Promise.resolve([]), limit: () => Promise.resolve([]) };
    };

    try {
        let res = await client.post("api/advanced-search", { json: { filters: { deleted: true }, userType: 'registered' } });
        t.is(res.statusCode, 200);
        t.true(Array.isArray(res.body.results));

        res = await client.post("api/advanced-search", { json: { userType: 'premium', dateRange: { start: '2024-01-01', end: '2024-12-31' } } });
        t.is(res.statusCode, 200);
        t.true(Array.isArray(res.body.results));
    } finally {
        User.find = origFind;
        server.close();
    }
});
