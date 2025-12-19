import http from "node:http";
import express from "express";
import got from "got";

/**
 * Creates a test server with the specified router
 * @param {Object} t - AVA test context
 * @param {Function} router - Express router to mount
 * @param {string} routePath - Path to mount the router on
 */
export function setupTestServer(t, router, routePath) {
	const app = express();
	app.use(express.json({ limit: "1mb" }));
	
	// Mock user middleware - add user to res.locals for auth checks
	app.use((req, res, next) => {
		res.locals = { user: { id: "test-user" } };
		next();
	});
	
	app.use(routePath, router);

	const server = http.createServer(app).listen();
	const { port } = server.address();
	t.context.server = server;
	t.context.got = got.extend({ responseType: "json", prefixUrl: `http://localhost:${port}` });
}

/**
 * Closes the test server
 * @param {Object} t - AVA test context
 */
export function teardownTestServer(t) {
	if (t.context.server) t.context.server.close();
}
