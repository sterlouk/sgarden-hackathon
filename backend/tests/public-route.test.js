import http from "node:http";

import test from "ava";
import got from "got";
import express from "express";
import Sentry from "@sentry/node";

import publicRoutes from "../src/routes/public.js";

// Stub Sentry to avoid noisy output
Sentry.captureException = () => {};

const buildApp = () => {
	const app = express();
	app.use("/api", publicRoutes);
	return app;
};

test.before(async (t) => {
	const app = buildApp();
	t.context.server = http.createServer(app);
	const server = t.context.server.listen();
	const { port } = server.address();
	t.context.got = got.extend({ responseType: "json", prefixUrl: `http://localhost:${port}` });
});

test.after.always((t) => {
	t.context.server.close();
});

test("GET /api/ returns It works", async (t) => {
	const { body, statusCode } = await t.context.got("api/");
	t.deepEqual(body, { message: "It works!" });
	t.is(statusCode, 200);
});

// Exercise error branch by throwing once inside res.json, then allowing catch to respond 500

test("public route returns 500 on handler error", async (t) => {
	const layer = publicRoutes.stack.find((l) => l.route && l.route.path === "/");
	const handler = layer.route.stack[0].handle;

	const res = {
		statusCode: 200,
		payload: null,
		jsonCalls: 0,
		status(code) { this.statusCode = code; return this; },
		json(payload) {
			this.jsonCalls += 1;
			if (this.jsonCalls === 1) throw new Error("boom");
			this.payload = payload;
			return { statusCode: this.statusCode, payload };
		},
	};

	const out = await handler({}, res);
	t.is(res.statusCode, 500);
	t.deepEqual(res.payload, { message: "Something went wrong." });
	t.deepEqual(out, { statusCode: 500, payload: { message: "Something went wrong." } });
});
