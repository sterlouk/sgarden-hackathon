import test from "ava";

test("server.listen branch executes with stub", async (t) => {
	process.env.NODE_ENV = "production";
	process.env.NOOP_INIT = "1";
	process.env.STUB_HTTP_LISTEN = "1";
	// ensure SKIP_LISTEN is not set so listen branch is reached
	delete process.env.SKIP_LISTEN;

	const mod = await import("../server.js");
	const app = mod.default;

	t.truthy(app.locals && app.locals._serverFileMarker, "server file marker should be set");
});
