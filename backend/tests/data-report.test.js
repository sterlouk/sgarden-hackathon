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
	if (t.context.server) {
		t.context.server.close();
	}
});

test("generate-custom-report renders ${placeholders} safely", async (t) => {
	const payload = {
		templateString: "Hello ${username}, total users: ${totalUsers}",
		data: { username: "Alice", totalUsers: 5 },
	};

	const { body, statusCode } = await t.context.got.post("api/data/generate-custom-report", { json: payload });

	t.is(statusCode, 200);
	t.true(body.success);
	t.is(body.report, "Hello Alice, total users: 5");
});

test("generate-custom-report escapes HTML content", async (t) => {
	const payload = {
		templateString: "Hi ${username}",
		data: { username: "<img src=x onerror=alert(1)>" },
	};

	const { body, statusCode } = await t.context.got.post("api/data/generate-custom-report", { json: payload });

	t.is(statusCode, 200);
	t.true(body.success);
	t.truthy(body.report.includes("&lt;img"));
	t.false(body.report.includes("<img"));
});
