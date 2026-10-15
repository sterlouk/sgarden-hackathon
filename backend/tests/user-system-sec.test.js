import http from "node:http";

import test from "ava";
import express from "express";
import got from "got";

import userSystemRouter from "../src/routes/user-system.js";

const makeServer = () => {
	const app = express();
	app.use(express.json({ limit: "1mb" }));
	app.use("/api/user-system", userSystemRouter);
	const server = http.createServer(app).listen();
	const { port } = server.address();
	const client = got.extend({ responseType: "json", prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
	return { server, client };
};

// system/execute
test("/system/execute rejects dangerous command", async (t) => {
	const { server, client } = makeServer();
	const { statusCode, body } = await client.post("api/user-system/system/execute", {
		json: { command: "$(rm -rf /)" },
	});
	server.close();
	t.is(statusCode, 400);
	t.true(String(body.message || "").toLowerCase().includes("invalid"));
});

test("/system/execute accepts safe command but does not execute", async (t) => {
	const { server, client } = makeServer();
	const { statusCode, body } = await client.post("api/user-system/system/execute", {
		json: { command: "echo-safe" },
	});
	server.close();
	t.is(statusCode, 200);
	t.true(body.success);
	t.true(String(body.output || "").toLowerCase().includes("disabled"));
});

// system/spawn
test("/system/spawn rejects invalid args", async (t) => {
	const { server, client } = makeServer();
	const { statusCode, body } = await client.post("api/user-system/system/spawn", {
		json: { cmd: "echo", args: ["foo", "../evil"] },
	});
	server.close();
	t.is(statusCode, 400);
	t.true(String(body.message || "").toLowerCase().includes("invalid"));
});

test("/system/spawn accepts safe input but does not execute", async (t) => {
	const { server, client } = makeServer();
	const { statusCode, body } = await client.post("api/user-system/system/spawn", {
		json: { cmd: "echo", args: ["ok"] },
	});
	server.close();
	t.is(statusCode, 200);
	t.true(body.success);
	t.true(String(body.output || "").toLowerCase().includes("disabled"));
});

// compress-files
test("/compress-files rejects invalid output name", async (t) => {
	const { server, client } = makeServer();
	const { statusCode, body } = await client.post("api/user-system/compress-files", {
		json: { outputName: "../../etc/passwd" },
	});
	server.close();
	t.is(statusCode, 400);
	t.true(String(body.message || "").toLowerCase().includes("invalid"));
});

// hash-password-md5 (now pbkdf2)
test("/hash-password-md5 returns pbkdf2 hash and salt", async (t) => {
	const { server, client } = makeServer();
	const { statusCode, body } = await client.post("api/user-system/hash-password-md5", {
		json: { password: "secret" },
	});
	server.close();
	t.is(statusCode, 200);
	t.true(body.success);
	t.truthy(body.hash);
	t.truthy(body.salt);
	t.is(body.algorithm, "pbkdf2-sha512");
});

// encrypt-data (now AES-256-GCM)
test("/encrypt-data returns AES-GCM fields", async (t) => {
	const { server, client } = makeServer();
	const { statusCode, body } = await client.post("api/user-system/encrypt-data", {
		json: { data: "hello", password: "pass" },
	});
	server.close();
	t.is(statusCode, 200);
	t.true(body.success);
	t.truthy(body.encrypted);
	t.truthy(body.iv);
	t.truthy(body.salt);
	t.truthy(body.authTag);
});
