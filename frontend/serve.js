require("dotenv").config();

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT || 3050;
const BUILD_DIR = path.join(__dirname, "build");

// Build a conservative CSP tailored to this app
const connectSrc = ["'self'"];
const apiUrl = process.env.REACT_APP_MAIN_SERVER_URL || process.env.API_URL || "http://localhost:4000";
if (apiUrl) connectSrc.push(apiUrl);
const sentryDsn = process.env.REACT_APP_SENTRY_DSN;
if (sentryDsn) {
	try {
		const sentryOrigin = new URL(sentryDsn).origin;
		connectSrc.push(sentryOrigin);
	} catch (error) {
		console.warn("Invalid Sentry DSN for CSP:", error.message);
	}
}

// Generate a random CSP nonce per request
const generateNonce = () => crypto.randomBytes(16).toString("base64");

// Helmet middleware with dynamic nonce (set per-request in the handler below)
const helmetMiddleware = helmet({
	contentSecurityPolicy: false, // We'll set CSP manually per-request
	frameguard: { action: "deny" },
	referrerPolicy: { policy: "no-referrer" },
	crossOriginResourcePolicy: { policy: "same-origin" },
	crossOriginEmbedderPolicy: false,
});

app.use(helmetMiddleware);

// Dynamic CSP per request with nonce
app.use((req, res, next) => {
	const nonce = generateNonce();
	res.locals.cspNonce = nonce;
	res.set("Content-Security-Policy", [
		"default-src 'self'",
		"base-uri 'self'",
		"block-all-mixed-content",
		`connect-src 'self' ${apiUrl}${sentryDsn ? ` ${new URL(sentryDsn).origin}` : ""}`,
		"font-src 'self' data:",
		"form-action 'self'",
		"frame-ancestors 'none'",
		"img-src 'self' data: blob:",
		"object-src 'none'",
		"script-src 'self'",
		"script-src-attr 'none'",
		`style-src 'self' 'nonce-${nonce}'`,
		"style-src-elem 'self' 'unsafe-inline'",
		"upgrade-insecure-requests",
	].join(";"));
	next();
});

// Prevent caching of the entry HTML to avoid serving stale bundles
app.use((req, res, next) => {
	if (req.path === "/" || req.path === "/index.html") {
		res.set("Cache-Control", "no-store");
	}
	next();
});

// Avoid 301 redirects for directory paths (ZAP noise) while still serving index files.
app.use((req, _res, next) => {
	if (req.method === "GET") {
		const candidate = path.join(BUILD_DIR, req.path);
		if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory() && !req.path.endsWith("/")) {
			req.url += "/";
		}
	}
	next();
});

app.use(express.static(BUILD_DIR, {
	maxAge: "1y",
	redirect: false,
	setHeaders: (res, servedPath) => {
		if (servedPath.endsWith("index.html")) {
			res.set("Cache-Control", "no-store");
		}
	},
}));

app.get("*", (req, res) => {
	const htmlPath = path.join(BUILD_DIR, "index.html");
	fs.readFile(htmlPath, "utf8", (err, html) => {
		if (err) {
			console.error("Error reading index.html:", err);
			return res.status(500).send("Internal Server Error");
		}
		// Inject nonce as a window variable before React hydrates
		const nonce = res.locals.cspNonce;
		const scriptTag = `<script>window.CSP_NONCE="${nonce}";</script>`;
		const modifiedHtml = html.replace(
			"</head>",
			`${scriptTag}\n\t</head>`
		);
		res.set("Content-Type", "text/html; charset=UTF-8");
		res.set("Cache-Control", "no-store");
		res.send(modifiedHtml);
	});
});

app.listen(PORT, () => {
	console.log(`Frontend server with dynamic CSP nonce listening on http://localhost:${PORT}`);
});
