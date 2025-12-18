import http from "node:http";

import test from "ava";
import express from "express";
import got from "got";

import dataRouter from "../src/routes/data.js";

test.before((t) => {
	const app = express();
	app.use(express.json({ limit: "1mb" }));
	app.use((req, res, next) => {
		res.locals = { user: { id: "test-user" } };
		next();
	});
	app.use("/api/data", dataRouter);

	const server = http.createServer(app).listen();
	const { port } = server.address();
	t.context.server = server;
	t.context.got = got.extend({ responseType: "json", prefixUrl: `http://localhost:${port}` });
});

test.after.always((t) => {
	if (t.context.server) t.context.server.close();
});

// Assumes no such file exists; we just verify the traversal is blocked up front.
test("config/load blocks traversal attempts", async (t) => {
	const error = await t.throwsAsync(() => t.context.got("api/data/config/load", {
		searchParams: { configFile: "../../etc/passwd" },
	}));

	t.is(error.response.statusCode, 400);
	t.truthy(error.response.body.message?.toLowerCase().includes("invalid"));
});
