import test from "ava";

import dataRouter from "../src/routes/data.js";
import { setupTestServer, teardownTestServer } from "./test-helpers.js";

test.before((t) => {
	setupTestServer(t, dataRouter, "/api/data");
});

test.after.always((t) => {
	teardownTestServer(t);
});

// Assumes no such file exists; we just verify the traversal is blocked up front.
test("config/load blocks traversal attempts", async (t) => {
	const error = await t.throwsAsync(() => t.context.got("api/data/config/load", {
		searchParams: { configFile: "../../etc/passwd" },
	}));

	t.is(error.response.statusCode, 400);
	t.truthy(error.response.body.message?.toLowerCase().includes("invalid"));
});
