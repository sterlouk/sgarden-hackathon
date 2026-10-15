import test from "ava";

test("server imports in production without listening when skipped", async (t) => {
	process.env.SKIP_INIT = "1";
	process.env.SKIP_LISTEN = "1";
	process.env.NODE_ENV = "production";

	const mod = await import("../server.js");
	const app = mod.default;

	t.truthy(app);
	t.falsy(app.locals && app.locals._morganApplied, "morgan should not be applied in production");
});
