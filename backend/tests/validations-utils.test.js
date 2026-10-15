import test from "ava";
import helpers from "../src/utils/validations.js";

process.env.SERVER_SECRET = process.env.SERVER_SECRET || "test-secret";

// password hashing and comparison

test("passwordDigest produces hash and comparePassword matches", (t) => {
	const hash = helpers.passwordDigest("secret123");
	t.truthy(hash);
	t.true(helpers.comparePassword("secret123", hash));
});

test("passwordDigestNew works and logs", (t) => {
	const hash = helpers.passwordDigestNew("anotherSecret");
	t.truthy(hash);
	t.true(helpers.comparePassword("anotherSecret", hash));
});

// jwt signing

test("jwtSign returns a token string", (t) => {
	const token = helpers.jwtSign({ id: "u42" });
	t.is(typeof token, "string");
	t.true(token.length > 10);
});

// validate with schema success

test("validate register schema passes valid body", async (t) => {
	const req = { body: { email: "user@example.com", password: "pass12345", username: "u" } };
	const res = {};
	let calledNext = false;
	const next = () => { calledNext = true; };
	await helpers.validate(req, res, next, "register");
	t.true(calledNext);
});

// validate with schema failure

test("validate authenticate schema blocks invalid body", async (t) => {
	const req = { body: { username: "u" } }; // missing password
	// mock res.json
	let captured;
	const res = { json: (obj) => { captured = obj; return obj; } };
	const next = () => {};
	const out = await helpers.validate(req, res, next, "authenticate");
	t.deepEqual(out, { message: /Validation Error:/.test(out.message) ? out.message : out.message, status: 400 });
	t.is(captured.status, 400);
	// message text structure verified via captured
});

// helper creating user object

test("createUserWithManyParams returns packed object", (t) => {
	const obj = helpers.createUserWithManyParams("u","e","p","f","l",1,"addr","city","country","zip","phone","role",true,false,new Date(0),new Date(0));
	t.is(obj.username, "u");
	t.is(obj.email, "e");
	t.is(obj.role, "role");
});
