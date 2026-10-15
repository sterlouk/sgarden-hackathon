import test from "ava";

test("server executes init and listen branches in noop mode", async (t) => {
	process.env.NODE_ENV = "production";
	process.env.NOOP_INIT = "1";
	process.env.NOOP_LISTEN = "1";
	// ensure SKIP_INIT is not set so init() is called
	delete process.env.SKIP_INIT;
	delete process.env.SKIP_LISTEN;

	const mod = await import("../server.js");
	const app = mod.default;

	t.truthy(app);
});
