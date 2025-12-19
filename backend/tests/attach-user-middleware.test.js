import test from "ava";
import jwt from "jsonwebtoken";

// Ensure secret is set before importing the middleware
process.env.SERVER_SECRET = process.env.SERVER_SECRET || "test-secret";

// Patch User model methods before loading the middleware
import { User } from "../src/models/index.js";

// Helper to build mock req/res/next
const mockCtx = (token) => {
	const req = { headers: {}, body: {}, query: {}, cookies: {} };
	if (token) req.headers["x-access-token"] = token;

	const res = {
		locals: {},
		statusCode: 200,
		status(code) { this.statusCode = code; return this; },
		json(payload) { return { statusCode: this.statusCode, payload }; },
	};

	let calledNext = false;
	const next = () => { calledNext = true; };

	return { req, res, next, get calledNext() { return calledNext; } };
};

const { default: attachUser } = await import("../src/utils/attach-user.js");

// 1. No token anywhere

test("attachUser returns 401 when no token provided", async (t) => {
	const { req, res, next } = mockCtx();
	const out = await attachUser(req, res, next);
	t.deepEqual(out, { statusCode: 401, payload: { message: "No token provided." } });
});

// 2. Expired token triggers authentication failure without calling DB

test("attachUser returns 401 when token expired", async (t) => {
	const token = jwt.sign({ id: "u1" }, process.env.SERVER_SECRET, { expiresIn: 1 });
	// Wait to ensure expiration
	await new Promise((r) => setTimeout(r, 1100));
	const { req, res, next } = mockCtx(token);
	const out = await attachUser(req, res, next);
	t.is(out.statusCode, 401);
	t.is(out.payload.message, "Failed to authenticate user.");
});

// 3. Valid token but user not found

test("attachUser returns 404 when user not found", async (t) => {
	User.findById = () => ({ exec: async () => null });
	const token = jwt.sign({ id: "missing-user" }, process.env.SERVER_SECRET, { expiresIn: "1h" });
	const { req, res, next } = mockCtx(token);
	const out = await attachUser(req, res, next);
	t.deepEqual(out, { statusCode: 404, payload: { message: "User not found." } });
});

// 4. Valid token and user found -> next() and res.locals.user

test("attachUser attaches user and calls next", async (t) => {
	const fakeUser = {
		lastActiveAt: null,
		toObject() { return { id: "u2", email: "u2@example.com" }; },
		save: async () => {},
	};
	User.findById = () => ({ exec: async () => fakeUser });

	const token = jwt.sign({ id: "u2" }, process.env.SERVER_SECRET, { expiresIn: "1h" });
	const ctx = mockCtx(token);
	await attachUser(ctx.req, ctx.res, ctx.next);
	t.true(ctx.calledNext);
	t.truthy(ctx.res.locals.user);
	t.is(ctx.res.locals.user.jwt, token);
});
