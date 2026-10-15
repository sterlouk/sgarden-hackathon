import http from "node:http";

import test from "ava";
import express from "express";
import got from "got";

import userRouter from "../src/routes/user.js";

test.before((t) => {
	const app = express();
	app.use(express.json({ limit: "1mb" }));
	// Mock user middleware - add authenticated user to res.locals
	app.use((req, res, next) => {
		// Use admin here to ensure validation tests are not blocked by auth checks
		res.locals = { user: { id: "507f1f77bcf86cd799439011", role: "admin" } };
		next();
	});
	app.use("/api/user", userRouter);

	const server = http.createServer(app).listen();
	const { port } = server.address();
	t.context.server = server;
	t.context.got = got.extend({ responseType: "json", prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
});

test.after.always((t) => {
	if (t.context.server) t.context.server.close();
});

// Test ObjectId validation on /delete endpoint
test("/delete rejects invalid ObjectId format", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/delete", {
		json: { id: "invalid-id-format" },
	});

	t.is(statusCode, 400);
	t.true(String(body.message || "").toLowerCase().includes("invalid"));
});

test("/delete rejects missing id", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/delete", {
		json: {},
	});

	t.is(statusCode, 400);
	t.true(String(body.message || "").toLowerCase().includes("invalid"));
});

test("/delete rejects null id", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/delete", {
		json: { id: null },
	});

	t.is(statusCode, 400);
	t.true(String(body.message || "").toLowerCase().includes("invalid"));
});

// Test role validation on /role endpoint
// NOTE FOR FUTURE DEVELOPERS:
// If you add new user roles to the system (e.g., 'moderator', 'superadmin'),
// you MUST update the isValidRole() validation function in src/routes/user.js
// to include the new role in the allowed list, and add corresponding tests here.
test("/role rejects invalid ObjectId format", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/role", {
		json: { id: "not-a-valid-objectid", role: "admin" },
	});

	t.is(statusCode, 400);
	t.is(body.message, "Invalid user ID format");
});

test("/role rejects invalid role value", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/role", {
		json: { id: "507f1f77bcf86cd799439011", role: "superadmin" },
	});

	t.is(statusCode, 400);
	t.true(String(body.message || "").toLowerCase().includes("invalid role"));
});

test("/role rejects missing role", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/role", {
		json: { id: "507f1f77bcf86cd799439011" },
	});

	t.is(statusCode, 400);
	t.true(String(body.message || "").toLowerCase().includes("invalid role"));
});

test("/role rejects role injection attempts", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/role", {
		json: { id: "507f1f77bcf86cd799439011", role: "admin' OR '1'='1" },
	});

	t.is(statusCode, 400);
	t.true(String(body.message || "").toLowerCase().includes("invalid role"));
});

// Test ObjectId validation on /profile/:userId endpoint
test("/profile/:userId rejects invalid ObjectId format", async (t) => {
	const { body, statusCode } = await t.context.got.get("api/user/profile/invalid-id");

	t.is(statusCode, 400);
	t.true(String(body.message || "").toLowerCase().includes("invalid"));
});

test("/profile/:userId rejects path traversal attempts", async (t) => {
	const { body, statusCode } = await t.context.got.get("api/user/profile/../admin");

	// Express may normalize path traversal and skip the route, yielding 404.
	// We accept either 400 (blocked by validation) or 404 (route not matched).
	t.true([400, 404].includes(statusCode));
	if (statusCode === 400) {
		t.true(String(body.message || "").toLowerCase().includes("invalid"));
	}
});

// Valid input format acceptance (does not assert DB outcome)
test("/profile/:userId accepts valid ObjectId format", async (t) => {
	const { statusCode } = await t.context.got.get("api/user/profile/507f1f77bcf86cd799439011");
	// Should not be blocked as bad format
	t.not(statusCode, 400);
});

test("/user-details/:id accepts valid ObjectId format", async (t) => {
	const { statusCode } = await t.context.got.get("api/user/user-details/507f1f77bcf86cd799439011");
	// Should not be blocked as bad format
	t.not(statusCode, 400);
});

test("/role accepts valid ObjectId and role", async (t) => {
	const { statusCode } = await t.context.got.post("api/user/role", {
		json: { id: "507f1f77bcf86cd799439011", role: "admin" },
	});
	// May be 200 or 500 depending on DB, but should not be 400 format rejection
	t.not(statusCode, 400);
});

test("/delete accepts valid ObjectId format", async (t) => {
	const { statusCode } = await t.context.got.post("api/user/delete", {
		json: { id: "507f1f77bcf86cd799439011" },
	});
	// May be 200 or 500 depending on DB, but should not be 400 format rejection
	t.not(statusCode, 400);
});

// Test ObjectId validation on /user-details/:id endpoint
test("/user-details/:id rejects invalid ObjectId format", async (t) => {
	const { body, statusCode } = await t.context.got.get("api/user/user-details/bad-format");

	t.is(statusCode, 400);
	t.true(String(body.message || "").toLowerCase().includes("invalid"));
});

test("/user-details/:id rejects SQL injection patterns", async (t) => {
	const { body, statusCode } = await t.context.got.get("api/user/user-details/1' OR '1'='1");

	t.is(statusCode, 400);
	t.true(String(body.message || "").toLowerCase().includes("invalid"));
});

// Test settings validation on /settings/update endpoint
test("/settings/update accepts valid theme values", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/settings/update", {
		json: { theme: "dark", language: "en", notifications: false },
	});

	t.is(statusCode, 200);
	t.true(body.success);
	t.is(body.settings.theme, "dark");
});

test("/settings/update rejects invalid theme values", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/settings/update", {
		json: { theme: "hacker-mode" },
	});

	t.is(statusCode, 200);
	t.true(body.success);
	// Should default to 'light' for invalid theme
	t.is(body.settings.theme, "light");
});

test("/settings/update rejects prototype pollution attempts", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/settings/update", {
		json: { "__proto__": { isAdmin: true }, theme: "dark" },
	});

	t.is(statusCode, 200);
	t.true(body.success);
	// Should only contain whitelisted settings
	t.false(body.settings.hasOwnProperty("__proto__"));
	t.false(body.settings.hasOwnProperty("isAdmin"));
});

test("/settings/update rejects constructor pollution attempts", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/settings/update", {
		json: { "constructor": { "prototype": { "isAdmin": true } } },
	});

	t.is(statusCode, 200);
	// Should only return whitelisted properties
	t.false(body.settings.hasOwnProperty("constructor"));
});

// Test plugin whitelist on /load-plugin endpoint
test("/load-plugin rejects non-whitelisted plugins", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/load-plugin", {
		json: { pluginName: "malicious-plugin" },
	});

	t.is(statusCode, 400);
	t.true(body.message.includes("Plugin not allowed"));
});

test("/load-plugin rejects path traversal in plugin name", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/load-plugin", {
		json: { pluginName: "../../etc/passwd" },
	});

	t.is(statusCode, 400);
	t.true(body.message.includes("Plugin not allowed"));
});

test("/load-plugin sanitizes special characters", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/load-plugin", {
		json: { pluginName: "theme-manager; rm -rf /" },
	});

	// After sanitization, becomes "theme-managerrm-rf" which is not in whitelist
	t.is(statusCode, 400);
	t.true(body.message.includes("Plugin not allowed"));
});

// Test safe deserialization on /data/deserialize-unsafe endpoint
test("/data/deserialize-unsafe accepts valid JSON", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/data/deserialize-unsafe", {
		json: { serializedData: '{"name":"test","value":123}' },
	});

	t.is(statusCode, 200);
	t.true(body.success);
	t.deepEqual(body.data, { name: "test", value: 123 });
});

test("/data/deserialize-unsafe rejects code execution attempts", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/data/deserialize-unsafe", {
		json: { serializedData: 'require("fs").readFileSync("/etc/passwd")' },
	});

	t.is(statusCode, 500);
	t.true(String(body.message || "").toLowerCase().includes("failed"));
});

test("/data/deserialize-unsafe rejects eval patterns", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/data/deserialize-unsafe", {
		json: { serializedData: '(function(){ return process.env; })()' },
	});

	t.is(statusCode, 500);
	t.true(String(body.message || "").toLowerCase().includes("failed"));
});

test("/data/deserialize-unsafe rejects non-string input", async (t) => {
	const { body, statusCode } = await t.context.got.post("api/user/data/deserialize-unsafe", {
		json: { serializedData: { malicious: "object" } },
	});

	t.is(statusCode, 400);
	t.is(body.message, "Data must be a string");
});
