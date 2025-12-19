import test from "ava";

import dataRouter from "../src/routes/data.js";
import { setupTestServer, teardownTestServer } from "./test-helpers.js";

test.before((t) => {
	setupTestServer(t, dataRouter, "/api/data");
});

test.after.always((t) => {
	teardownTestServer(t);
});

test("download-report blocks traversal", async (t) => {
	const error = await t.throwsAsync(() => t.context.got("api/data/download-report", {
		searchParams: { reportName: "../../etc/passwd" },
	}));

	t.is(error.response.statusCode, 400);
	t.true(String(error.response.body.message || "").toLowerCase().includes("invalid"));
});

test("render-page blocks traversal", async (t) => {
	const error = await t.throwsAsync(() => t.context.got("api/data/render-page", {
		searchParams: { template: "../secret" },
	}));

	t.is(error.response.statusCode, 400);
	t.true(String(error.response.body.message || "").toLowerCase().includes("invalid"));
});

test("upload-file blocks traversal in destination and filename", async (t) => {
	const error = await t.throwsAsync(() => t.context.got.post("api/data/upload-file", {
		json: { filename: "../../evil.txt", content: "bad", destination: "../" },
	}));

	t.is(error.response.statusCode, 400);
	t.true(String(error.response.body.message || "").toLowerCase().includes("invalid"));
});

test("export-csv blocks traversal", async (t) => {
	const error = await t.throwsAsync(() => t.context.got("api/data/export-csv", {
		searchParams: { dataFile: "../../secret.csv" },
	}));

	t.is(error.response.statusCode, 400);
	t.true(String(error.response.body.message || "").toLowerCase().includes("invalid"));
});

test("browse-files blocks traversal", async (t) => {
	const error = await t.throwsAsync(() => t.context.got("api/data/browse-files", {
		searchParams: { directory: "../../etc" },
	}));

	t.is(error.response.statusCode, 400);
	t.true(String(error.response.body.message || "").toLowerCase().includes("invalid"));
});
