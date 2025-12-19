import createCache from "@emotion/cache";

// Read the nonce injected by the server as a window variable
const getNonce = () => {
	return typeof window !== "undefined" && window.CSP_NONCE ? window.CSP_NONCE : undefined;
};

export default function createEmotionCache() {
	return createCache({ key: "mui", nonce: getNonce() });
}
