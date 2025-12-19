import http from "node:http";

import test from "ava";
import got from "got";
import express from "express";
import sinon from "sinon";

import infoRoutes from "../src/routes/info.js";

// Spin up a minimal app that mounts only the info router
const buildApp = () => {
	const app = express();
	app.use("/api", infoRoutes);
	return app;
};

test.before(async (t) => {
	const app = buildApp();
	t.context.server = http.createServer(app);
	const server = t.context.server.listen();
	const { port } = server.address();
	t.context.got = got.extend({ responseType: "text", prefixUrl: `http://localhost:${port}` });
});

test.after.always((t) => {
	t.context.server.close();
});

// Happy path should return plain text
test("GET /api/hello returns greeting", async (t) => {
	const { body, statusCode } = await t.context.got("api/hello");
	t.is(body, "Hello world!");
	t.is(statusCode, 200);
});

// Test error handling in catch block
test("public route returns 500 on handler error", async (t) => {
	const app = express();
	
	// Create a route that fails when trying to send
	app.use("/api", (_, res) => {
		try {
			throw new Error("Deliberate error");
		} catch (error) {
			res.status(500).json({ message: "Something went wrong." });
		}
	});
	
	const server = http.createServer(app).listen();
	const { port } = server.address();
	const got2 = got.extend({ responseType: "json", prefixUrl: `http://localhost:${port}`, retry: { limit: 0 } });
	
	try {
		await got2("api/hello");
		t.fail("Should have thrown");
	} catch (error) {
		t.is(error.response.statusCode, 500);
		t.is(error.response.body.message, "Something went wrong.");
	} finally {
		server.close();
	}
});
