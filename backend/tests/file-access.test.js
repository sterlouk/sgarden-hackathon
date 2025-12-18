import http from "node:http";

import test from "ava";
import express from "express";
import got from "got";

import dataRouter from "../src/routes/data.js";

test.before((t) => {
	const app = express();
	app.use(express.json({ limit: "1mb" }));
	app.use("/api/data", dataRouter);

	const server = http.createServer(app).listen();
	const { port } = server.address();
	t.context.server = server;
	t.context.got = got.extend({ responseType: "json", prefixUrl: `http://localhost:${port}` });
});

test.after.always((t) => {
	if (t.context.server) t.context.server.close();
});

test("download-report blocks traversal", async (t) => {
	const error = await t.throwsAsync(() => t.context.got("api/data/download-report", {
		searchParams: { reportName: "../../etc/passwd" },
	}));

	t.is(error.response.statusCode, 400);
	t.true(String(error.response.body.message || "").toLowerCase().includes("invalid"));
});

test("render-page blocks traversal", async (t) => {
	const error = await t.throwsAsync(() => t.context.got("api/data/render-page", {
		searchParams: { template: "../secret" },
	}));

	t.is(error.response.statusCode, 400);
	t.true(String(error.response.body.message || "").toLowerCase().includes("invalid"));
});
