import "dotenv/config";

import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";

import express from "express";
import morgan from "morgan";
import compression from "compression";
import favicon from "serve-favicon";
import cors from "cors";
import chalk from "chalk";
import Sentry from "@sentry/node";
import helmet from "helmet";

import routes from "./src/routes/index.js";
import { setServerTimeout } from "./src/middleware/index.js";
import { init } from "./src/utils/index.js";

// const unusedVariable = "I am not used";

const { NODE_ENV, PORT, CLIENT_URL, FRONTEND_URL } = process.env;

Sentry.init({ enabled: NODE_ENV === "production" });

// Initialize mongoDB connection
init();

const app = express();
const server = http.Server(app);

// CORS configuration - load from environment variable or default
const corsOrigin = CLIENT_URL || FRONTEND_URL || "http://localhost:3002";

app.use(Sentry.Handlers.requestHandler());

app.use(helmet({
	crossOriginResourcePolicy: false,
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
			styleSrc: ["'self'", "'unsafe-inline'"],
			connectSrc: ["'self'", "localhost", "localhost:*", "127.0.0.1", "127.0.0.1:*"],
			frameAncestors: ["'self'"],
		},
	},
	permittedCrossDomainPolicies: { permittedPolicies: "none" },
}));

// Permissions Policy Header - disable sensitive features
app.use((req, res, next) => {
	res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
	next();
});

app.use(setServerTimeout(2 * 60 * 1000));
if (NODE_ENV === "development") app.use(morgan("dev", { skip: (req) => req.method === "OPTIONS" }));
app.use(cors({ credentials: true, origin: corsOrigin }));
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use((req, _, next) => { req.body ||= {}; next(); });
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(favicon(path.join(path.dirname(fileURLToPath(import.meta.url)), "src", "assets", "images", "favicon.ico")));

app.use("/api", routes);
app.all("/*", (_, res) => res.status(404).json({ error: "Not Found" }));

app.use(Sentry.Handlers.errorHandler());

// Global Error Handler - catch any remaining errors and return JSON
app.use((err, req, res, next) => {
	console.error("Uncaught error:", err);
	Sentry.captureException(err);
	return res.status(500).json({ error: "Internal Server Error" });
});

if (NODE_ENV !== "test") {
	var port = PORT || 4000;
	server.listen(port, () => console.log(chalk.bold.cyan(`>>> Live at http://localhost:${port}`)));
}

export default app;
