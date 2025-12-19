import http from "node:http";

import test from "ava";
import got from "got";
import express from "express";

import userRoutes from "../src/routes/user.js";

const buildApp = () => {
	const app = express();
	app.use(express.json());
	app.use((req, res, next) => {
		const role = req.headers["x-user-role"] || "admin";
		const id = req.headers["x-user-id"] || "507f1f77bcf86cd799439011";
		res.locals.user = { role, id };
		next();
	});
	app.use("/api/user", userRoutes);
	return app;
};

test.before(async (t) => {
	const app = buildApp();
	t.context.server = http.createServer(app);
	const server = t.context.server.listen();
	const { port } = server.address();
	t.context.got = got.extend({ responseType: "json", prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
});

test.after.always((t) => {
	t.context.server.close();
});

// List users in test env returns empty array

test("GET /api/user/ returns empty list in test env", async (t) => {
	const { body, statusCode } = await t.context.got("api/user/");
	t.true(body.success);
	t.deepEqual(body.users, []);
	t.is(statusCode, 200);
});

// Invite user short path in test env returns token

test("POST /api/user/ sends invite shortcut in test env", async (t) => {
	const payload = { email: "user@example.com" };
	const { body, statusCode } = await t.context.got.post("api/user/", { json: payload });
	t.true(body.success);
	t.is(body.token, "test-token");
	t.is(statusCode, 200);
});

// Delete with invalid ObjectId should 400

test("POST /api/user/delete rejects invalid id", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/delete", { json: { id: "123" } });
	t.is(statusCode, 400);
	t.is(body.message, "Invalid user ID format");
});

// Role update with invalid role should 400

test("POST /api/user/role rejects invalid role", async (t) => {
	const badRole = { id: "507f1f77bcf86cd799439011", role: "super" };
	const { body, statusCode } = await t.context.got.post("api/user/role", { json: badRole });
	t.is(statusCode, 400);
	t.regex(body.message, /Invalid role/);
});

// Profile access forbidden for non-owner non-admin

test("GET /api/user/profile/:id forbidden for other user", async (t) => {
	const { body, statusCode } = await t.context.got("api/user/profile/507f1f77bcf86cd799439012", {
		headers: { "x-user-role": "user", "x-user-id": "507f1f77bcf86cd799439011" },
	});
	t.is(statusCode, 403);
	t.is(body.message, "Forbidden");
});

// Profile access allowed for owner in test env

test("GET /api/user/profile/:id returns profile for owner", async (t) => {
	const userId = "507f1f77bcf86cd799439011";
	const { body, statusCode } = await t.context.got(`api/user/profile/${userId}`, {
		headers: { "x-user-role": "user", "x-user-id": userId },
	});
	t.true(body.success);
	t.is(body.profile.id, userId);
	t.is(body.profile.role, "user");
	t.is(statusCode, 200);
});

// Delete success in test env

test("POST /api/user/delete succeeds with valid id in test env", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/delete", { 
		json: { id: "507f1f77bcf86cd799439011" } 
	});
	t.is(statusCode, 200);
	t.true(body.success);
	t.true(body.deleted);
});

// Role update success in test env

test("POST /api/user/role succeeds with valid inputs in test env", async (t) => {
	const payload = { id: "507f1f77bcf86cd799439011", role: "admin" };
	const { body, statusCode } = await t.context.got.post("api/user/role", { json: payload });
	t.is(statusCode, 200);
	t.true(body.success);
	t.true(body.updated);
});

// user-details invalid ObjectId

test("GET /api/user/user-details/:id rejects invalid ObjectId", async (t) => {
	const { body, statusCode } = await t.context.got("api/user/user-details/123", {
		headers: { "x-user-role": "admin", "x-user-id": "507f1f77bcf86cd799439011" },
	});
	t.is(statusCode, 400);
	t.is(body.message, "Invalid user ID format");
});

// user-details forbidden for other user

test("GET /api/user/user-details/:id forbidden for non-owner", async (t) => {
	const { body, statusCode } = await t.context.got("api/user/user-details/507f1f77bcf86cd799439012", {
		headers: { "x-user-role": "user", "x-user-id": "507f1f77bcf86cd799439011" },
	});
	t.is(statusCode, 403);
	t.is(body.message, "Forbidden");
});

// user-details success for owner in test env

test("GET /api/user/user-details/:id returns details for owner", async (t) => {
	const userId = "507f1f77bcf86cd799439011";
	const { body, statusCode } = await t.context.got(`api/user/user-details/${userId}`, {
		headers: { "x-user-role": "user", "x-user-id": userId },
	});
	t.is(statusCode, 200);
	t.true(body.success);
	t.is(body.profile.id, userId);
});

// settings/update with valid theme

test("POST /api/user/settings/update accepts valid theme", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/settings/update", {
		json: { theme: "dark", language: "en", notifications: false },
	});
	t.is(statusCode, 200);
	t.true(body.success);
	t.is(body.settings.theme, "dark");
	t.is(body.settings.language, "en");
	t.false(body.settings.notifications);
});

// settings/update with invalid theme falls back to light

test("POST /api/user/settings/update falls back on invalid theme", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/settings/update", {
		json: { theme: "rainbow" },
	});
	t.is(statusCode, 200);
	t.true(body.success);
	t.is(body.settings.theme, "light");
});

// settings/update with valid language

test("POST /api/user/settings/update accepts valid language", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/settings/update", {
		json: { language: "es" },
	});
	t.is(statusCode, 200);
	t.true(body.success);
	t.is(body.settings.language, "es");
});

// load-plugin rejects missing plugin name

test("POST /api/user/load-plugin rejects missing plugin name", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/load-plugin", { json: {} });
	t.is(statusCode, 400);
	t.is(body.message, "Plugin name required");
});

// load-plugin loads valid plugin

test("POST /api/user/load-plugin loads theme-manager plugin", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/load-plugin", { 
		json: { pluginName: "theme-manager" } 
	});
	t.is(statusCode, 200);
	t.true(body.success);
	t.truthy(body.plugin);
	t.is(body.message, "Plugin loaded");
});

// deserialize-unsafe rejects missing data

test("POST /api/user/data/deserialize-unsafe rejects missing data", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/data/deserialize-unsafe", { json: {} });
	t.is(statusCode, 400);
	t.is(body.message, "Data required");
});

// advanced-search with short query

test("POST /api/user/advanced-search rejects short query", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/advanced-search", {
		json: { query: "ab" },
	});
	t.is(statusCode, 400);
	t.truthy(body.Error);
});

// advanced-search with unknown userType

test("POST /api/user/advanced-search rejects unknown userType", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/advanced-search", {
		json: { userType: "alien" },
	});
	t.is(statusCode, 400);
	t.truthy(body.Error);
});

// advanced-search with query including admin but no user

test("POST /api/user/advanced-search rejects admin query without auth", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/advanced-search", {
		json: { query: "find admin users" },
	});
	t.is(statusCode, 403);
	t.truthy(body.Error);
});

// advanced-search with filters.active and unknown role

test("POST /api/user/advanced-search rejects unknown filter role", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/advanced-search", {
		json: { filters: { active: true, role: "superadmin" } },
	});
	t.is(statusCode, 400);
	t.truthy(body.Error);
});
