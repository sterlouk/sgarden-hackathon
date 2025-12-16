import Cookie from "js-cookie";

const cookie = Cookie
	.withAttributes({
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
	})
	.withConverter({
		read(value, name) {
			return Cookie.converter.read(value, name);
		},
		write(value, name) {
			return Cookie.converter.write(value, name);
		},
	});

export default cookie;
