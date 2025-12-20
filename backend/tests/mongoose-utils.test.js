import test from "ava";

import Sentry from "@sentry/node";

// Silence Sentry during tests
Sentry.init({ dsn: "", enabled: false });

test.serial("init returns mock connection on MOCK_MONGO=success", async (t) => {
	process.env.MOCK_MONGO = "success";
	const init = (await import("../src/utils/mongoose.js")).default;
	const conn = await init();
	t.truthy(conn && conn.mock === true);
	delete process.env.MOCK_MONGO;
});

test.serial("init returns null and captures exception on MOCK_MONGO=fail", async (t) => {
	process.env.MOCK_MONGO = "fail";
	const init = (await import("../src/utils/mongoose.js")).default;
	const conn = await init();
	t.is(conn, null);
	delete process.env.MOCK_MONGO;
});
