import http from "node:http";

import test from "ava";
import express from "express";
import got from "got";

import userRouter from "../src/routes/user.js";

function createServer(userRole = 'user', userId = '507f1f77bcf86cd799439011') {
	const app = express();
	app.use(express.json({ limit: "1mb" }));
	app.use((req, res, next) => {
		res.locals = { user: { id: userId, role: userRole } };
		return next();
	});
	app.use("/api/user", userRouter);
	const server = http.createServer(app).listen();
	const { port } = server.address();
	const client = got.extend({ responseType: "json", prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
	return { server, client };
}

// Non-admin should be forbidden for admin-only endpoints
test("non-admin cannot list users", async (t) => {
	const { server, client } = createServer('user');
	const { statusCode } = await client.get("api/user");
	t.is(statusCode, 403);
	server.close();
});

test("non-admin cannot invite users", async (t) => {
	const { server, client } = createServer('user');
	const { statusCode } = await client.post("api/user", { json: { email: "test@example.com" } });
	t.is(statusCode, 403);
	server.close();
});

test("non-admin cannot delete users", async (t) => {
	const { server, client } = createServer('user');
	const { statusCode } = await client.post("api/user/delete", { json: { id: "507f1f77bcf86cd799439012" } });
	t.is(statusCode, 403);
	server.close();
});

test("non-admin cannot change roles", async (t) => {
	const { server, client } = createServer('user');
	const { statusCode } = await client.post("api/user/role", { json: { id: "507f1f77bcf86cd799439012", role: "admin" } });
	t.is(statusCode, 403);
	server.close();
});

// Self access allowed, others forbidden for non-admin
test("non-admin can access own profile", async (t) => {
	const selfId = '507f1f77bcf86cd799439011';
	const { server, client } = createServer('user', selfId);
	const { statusCode } = await client.get(`api/user/profile/${selfId}`);
	t.not(statusCode, 403);
	server.close();
});

test("non-admin cannot access other user's profile", async (t) => {
	const { server, client } = createServer('user', '507f1f77bcf86cd799439011');
	const { statusCode } = await client.get("api/user/profile/507f1f77bcf86cd799439012");
	t.is(statusCode, 403);
	server.close();
});

test("non-admin cannot access other user's details", async (t) => {
	const { server, client } = createServer('user', '507f1f77bcf86cd799439011');
	const { statusCode } = await client.get("api/user/user-details/507f1f77bcf86cd799439012");
	t.is(statusCode, 403);
	server.close();
});

// Admin access allowed for all
test("admin can list users", async (t) => {
	const { server, client } = createServer('admin');
	const { statusCode } = await client.get("api/user");
	t.not(statusCode, 403);
	server.close();
});

test("admin can invite users", async (t) => {
	const { server, client } = createServer('admin');
	const { statusCode } = await client.post("api/user", { json: { email: "admin@example.com" } });
	t.not(statusCode, 403);
	server.close();
});

test("admin can delete users", async (t) => {
	const { server, client } = createServer('admin');
	const { statusCode } = await client.post("api/user/delete", { json: { id: "507f1f77bcf86cd799439012" } });
	t.not(statusCode, 403);
	server.close();
});

test("admin can change roles", async (t) => {
	const { server, client } = createServer('admin');
	const { statusCode } = await client.post("api/user/role", { json: { id: "507f1f77bcf86cd799439012", role: "user" } });
	t.not(statusCode, 403);
	server.close();
});
