import test from "ava";

test("morgan middleware applied when forced", async (t) => {
	process.env.FORCE_DEV_MORGAN = "1";
	process.env.SKIP_INIT = "1"; // avoid DB init during import
	process.env.NODE_ENV = "test"; // prevent server from listening

	const serverModule = await import("../server.js");
	const app = serverModule.default;

	t.truthy(app.locals && app.locals._morganApplied, "morgan should be applied when forced via env");
});
