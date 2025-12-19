module.exports = {
	webpack: {
		configure: {
			ignoreWarnings: [
				/Failed to parse source map/,
				{ module: /power-assert/ },
			],
			resolve: {
				fallback: {
					url: require.resolve("url"),
				},
			},
		},
	},
	eslint: {
		enable: false,
	},
	devServer: {
		port: 3002,
		headers: {
			"Content-Security-Policy": "default-src 'self'; base-uri 'self'; block-all-mixed-content; connect-src 'self' http://localhost:4000; font-src 'self' data:; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob:; object-src 'none'; script-src 'self' 'unsafe-eval'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; style-src-elem 'self' 'unsafe-inline'",
			"X-Frame-Options": "DENY",
			"X-Content-Type-Options": "nosniff",
			"Referrer-Policy": "no-referrer",
			"Permissions-Policy": "accelerometer=(), ambient-light-sensor=(), camera=(), document-domain=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), usb=(), vr=(), xr-spatial-tracking=()",
			"X-DNS-Prefetch-Control": "off",
			"X-Download-Options": "noopen",
			"X-Permitted-Cross-Domain-Policies": "none",
			"Cross-Origin-Resource-Policy": "same-origin",
			"Cross-Origin-Opener-Policy": "same-origin",
			"Origin-Agent-Cluster": "?1",
			// Override overly-permissive CORS defaults
			"Access-Control-Allow-Origin": "http://localhost:3002",
			"Access-Control-Allow-Credentials": "true",
			"Vary": "Origin",
		},
		allowedHosts: "all",
		static: {
			serveIndex: false,
		},
		server: {
			type: "http",
		},
		setupMiddlewares: (middlewares, devServer) => {
			// Remove X-Powered-By header and enforce headers uniformly for all responses
			devServer.app.disable("x-powered-by");
			devServer.app.use((_req, res, next) => {
				res.setHeader(
					"Content-Security-Policy",
					"default-src 'self'; base-uri 'self'; block-all-mixed-content; connect-src 'self' http://localhost:4000; font-src 'self' data:; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob:; object-src 'none'; script-src 'self' 'unsafe-eval'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; style-src-elem 'self' 'unsafe-inline'"
				);
				res.setHeader("X-Frame-Options", "DENY");
				res.setHeader("X-Content-Type-Options", "nosniff");
				res.setHeader("Referrer-Policy", "no-referrer");
				res.setHeader("Permissions-Policy", "accelerometer=(), ambient-light-sensor=(), camera=(), document-domain=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), usb=(), vr=(), xr-spatial-tracking=()");
				res.setHeader("X-DNS-Prefetch-Control", "off");
				res.setHeader("X-Download-Options", "noopen");
				res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
				res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
				res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
				res.setHeader("Origin-Agent-Cluster", "?1");
				// Restrictive CORS
				res.removeHeader("Access-Control-Allow-Origin");
				res.setHeader("Access-Control-Allow-Origin", "http://localhost:3002");
				res.setHeader("Access-Control-Allow-Credentials", "true");
				res.setHeader("Vary", "Origin");
				return next();
			});
			return middlewares;
		},
		client: {
			overlay: {
				errors: true,
				warnings: false,
			},
		},
	},
};
