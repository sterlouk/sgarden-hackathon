import http from "node:http";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

import test from "ava";
import got from "got";
import express from "express";

import dataRoutes from "../src/routes/data.js";

const reportsDir = resolve("./reports");
const templatesDir = resolve("./templates");
const uploadsDir = resolve("./uploads");

const buildApp = () => {
	const app = express();
	app.use(express.json());
	app.use((req, res, next) => {
		const userId = req.headers["x-user-id"];
		if (userId) res.locals.user = { id: userId, role: "user" };
		next();
	});
	app.use("/api/data", dataRoutes);
	return app;
};

const cleanFs = () => {
	rmSync(reportsDir, { recursive: true, force: true });
	rmSync(templatesDir, { recursive: true, force: true });
	rmSync(uploadsDir, { recursive: true, force: true });
};

test.before(async (t) => {
	cleanFs();
	const app = buildApp();
	t.context.server = http.createServer(app);
	const server = t.context.server.listen();
	const { port } = server.address();
	t.context.got = got.extend({ responseType: "json", prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
});

test.after.always((t) => {
	t.context.server.close();
	cleanFs();
});

// Root data endpoint

test("GET /api/data returns datasets", async (t) => {
	const { body, statusCode } = await t.context.got("api/data/");
	t.true(body.success);
	t.truthy(body.localFoodCropProduction);
	t.is(statusCode, 200);
});

// download-report needs auth and name

test("download-report rejects when unauthenticated", async (t) => {
	const res = await t.context.got("api/data/download-report", { searchParams: { reportName: "r.txt" } });
	t.is(res.statusCode, 401);
});

test("download-report rejects missing name", async (t) => {
	const res = await t.context.got("api/data/download-report", { headers: { "x-user-id": "u1" } });
	t.is(res.statusCode, 400);
	t.is(res.body.message, "Report name required");
});


test("download-report returns file content", async (t) => {
	mkdirSync(reportsDir, { recursive: true });
	writeFileSync(resolve(reportsDir, "report1.txt"), "hello-report");
	const res = await t.context.got("api/data/download-report", {
		headers: { "x-user-id": "u1" },
		searchParams: { reportName: "report1.txt" },
		responseType: "text",
	});
	t.is(res.statusCode, 200);
	t.is(res.body, "hello-report");
});

// render-page

test("render-page rejects when unauthenticated", async (t) => {
	const res = await t.context.got("api/data/render-page", { searchParams: { template: "page.html" } });
	t.is(res.statusCode, 401);
	t.is(res.body.message, "Authentication required");
});

test("render-page rejects missing template", async (t) => {
	const res = await t.context.got("api/data/render-page", { headers: { "x-user-id": "u1" } });
	t.is(res.statusCode, 400);
	t.is(res.body.message, "Template name required");
});


test("render-page returns html", async (t) => {
	mkdirSync(templatesDir, { recursive: true });
	writeFileSync(resolve(templatesDir, "page1.html"), "<h1>Hi</h1>");
	const res = await t.context.got("api/data/render-page", {
		headers: { "x-user-id": "u1" },
		searchParams: { template: "page1.html" },
		responseType: "text",
	});
	t.is(res.statusCode, 200);
	t.is(res.body, "<h1>Hi</h1>");
});

// upload-file

test("upload-file rejects when unauthenticated", async (t) => {
	const res = await t.context.got.post("api/data/upload-file", {
		json: { filename: "test.txt", content: "data" },
	});
	t.is(res.statusCode, 401);
	t.is(res.body.message, "Authentication required");
});

test("upload-file rejects invalid filename", async (t) => {
	const res = await t.context.got.post("api/data/upload-file", {
		headers: { "x-user-id": "u1" },
		json: { filename: "bad/../name.txt", content: "x" },
	});
	t.is(res.statusCode, 400);
	t.is(res.body.message, "Invalid filename");
});


test("upload-file writes file successfully", async (t) => {
	mkdirSync(resolve(uploadsDir, "user"), { recursive: true });
	writeFileSync(resolve(uploadsDir, "user", "ok.txt"), "");
	const res = await t.context.got.post("api/data/upload-file", {
		headers: { "x-user-id": "u1" },
		json: { filename: "ok.txt", content: "data", destination: "user" },
	});
	t.is(res.statusCode, 200);
	t.true(res.body.success);
	const expectedPath = resolve(uploadsDir, "user", "ok.txt");
	t.true(existsSync(expectedPath));
	t.is(readFileSync(expectedPath, "utf8"), "data");
});

// export-csv validations

test("export-csv rejects when unauthenticated", async (t) => {
	const res = await t.context.got("api/data/export-csv", { searchParams: { dataFile: "data.csv" } });
	t.is(res.statusCode, 401);
	t.is(res.body.message, "Authentication required");
});

test("export-csv rejects missing dataFile", async (t) => {
	const res = await t.context.got("api/data/export-csv", { headers: { "x-user-id": "u1" } });
	t.is(res.statusCode, 400);
	t.is(res.body.message, "Data file required");
});

test("export-csv rejects non-csv file", async (t) => {
	const res = await t.context.got("api/data/export-csv", {
		headers: { "x-user-id": "u1" },
		searchParams: { dataFile: "test.txt" },
	});
	t.is(res.statusCode, 400);
	t.is(res.body.message, "Only CSV files allowed");
});

test("export-csv returns CSV content", async (t) => {
	const dataDir = resolve("./data");
	mkdirSync(dataDir, { recursive: true });
	writeFileSync(resolve(dataDir, "sales.csv"), "id,name\n1,Product");
	const res = await t.context.got("api/data/export-csv", {
		headers: { "x-user-id": "u1" },
		searchParams: { dataFile: "sales.csv" },
		responseType: "text",
	});
	t.is(res.statusCode, 200);
	t.is(res.body, "id,name\n1,Product");
	rmSync(dataDir, { recursive: true, force: true });
});

// browse-files

test("browse-files rejects when unauthenticated", async (t) => {
	const res = await t.context.got("api/data/browse-files", { searchParams: { directory: "docs" } });
	t.is(res.statusCode, 401);
	t.is(res.body.message, "Authentication required");
});

test("browse-files rejects missing directory", async (t) => {
	const res = await t.context.got("api/data/browse-files", { headers: { "x-user-id": "u1" } });
	t.is(res.statusCode, 400);
	t.is(res.body.message, "Directory required");
});

test("browse-files rejects invalid directory name", async (t) => {
	const res = await t.context.got("api/data/browse-files", {
		headers: { "x-user-id": "u1" },
		searchParams: { directory: "../etc" },
	});
	t.is(res.statusCode, 400);
	t.is(res.body.message, "Invalid directory path");
});

test("browse-files returns file list", async (t) => {
	const filesDir = resolve("./files/docs");
	mkdirSync(filesDir, { recursive: true });
	writeFileSync(resolve(filesDir, "file1.txt"), "content");
	writeFileSync(resolve(filesDir, "file2.txt"), "content2");
	const res = await t.context.got("api/data/browse-files", {
		headers: { "x-user-id": "u1" },
		searchParams: { directory: "docs" },
	});
	t.is(res.statusCode, 200);
	t.true(res.body.success);
	t.is(res.body.files.length, 2);
	rmSync(resolve("./files"), { recursive: true, force: true });
});

// config/load

test("config/load rejects when unauthenticated", async (t) => {
	const res = await t.context.got("api/data/config/load", { searchParams: { configFile: "app.json" } });
	t.is(res.statusCode, 401);
	t.is(res.body.message, "Authentication required");
});

test("config/load rejects missing configFile", async (t) => {
	const res = await t.context.got("api/data/config/load", { headers: { "x-user-id": "u1" } });
	t.is(res.statusCode, 400);
	t.is(res.body.message, "Config file required");
});

test("config/load rejects invalid filename", async (t) => {
	const res = await t.context.got("api/data/config/load", {
		headers: { "x-user-id": "u1" },
		searchParams: { configFile: "bad/path.json" },
	});
	t.is(res.statusCode, 400);
	t.is(res.body.message, "Invalid config file name");
});

test("config/load returns parsed JSON config", async (t) => {
	const configDir = resolve("./config");
	mkdirSync(configDir, { recursive: true });
	writeFileSync(resolve(configDir, "app.json"), JSON.stringify({ theme: "dark" }));
	const res = await t.context.got("api/data/config/load", {
		headers: { "x-user-id": "u1" },
		searchParams: { configFile: "app.json" },
	});
	t.is(res.statusCode, 200);
	t.true(res.body.success);
	t.deepEqual(res.body.config, { theme: "dark" });
	rmSync(configDir, { recursive: true, force: true });
});

// generate-custom-report

test("generate-custom-report rejects when unauthenticated", async (t) => {
	const res = await t.context.got.post("api/data/generate-custom-report", {
		json: { templateString: "Hello" },
	});
	t.is(res.statusCode, 401);
	t.is(res.body.message, "Authentication required");
});

test("generate-custom-report rejects missing template", async (t) => {
	const res = await t.context.got.post("api/data/generate-custom-report", {
		headers: { "x-user-id": "u1" },
		json: {},
	});
	t.is(res.statusCode, 400);
	t.is(res.body.message, "Template string required");
});

test("generate-custom-report renders template with data", async (t) => {
	const res = await t.context.got.post("api/data/generate-custom-report", {
		headers: { "x-user-id": "u1" },
		json: { templateString: "Hello ${name}", data: { name: "Alice" } },
	});
	t.is(res.statusCode, 200);
	t.true(res.body.success);
	t.is(res.body.report, "Hello Alice");
});

test("generate-custom-report uses default data when not provided", async (t) => {
	const res = await t.context.got.post("api/data/generate-custom-report", {
		headers: { "x-user-id": "u1" },
		json: { templateString: "User: ${username}, Total: ${totalUsers}" },
	});
	t.is(res.statusCode, 200);
	t.true(res.body.success);
	t.is(res.body.report, "User: Unknown, Total: 100");
});
