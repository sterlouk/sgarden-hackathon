export const setServerTimeout = (millis = 5 * 60 * 1000) => (req, res, next) => {
	req.setTimeout(millis, () => res.status(408).json({ message: "Request Timeout" }));
	res.setTimeout(millis, () => res.status(503).json({ message: "Service Unavailable" }));
	next();
};

export const restrictHealthEndpoint = (req, res, next) => {
	const isLocalhost = req.ip === "127.0.0.1" || req.ip === "::1" || req.hostname === "localhost";
	const hasValidAuth = req.headers["authorization"]?.startsWith("Bearer ");
	
	if (!isLocalhost && !hasValidAuth) {
		return res.status(403).json({ message: "Forbidden" });
	}
	
	next();
};
