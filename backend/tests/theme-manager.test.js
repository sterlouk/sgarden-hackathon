import test from "ava";
import themeManager from "../src/routes/plugins/theme-manager.js";

test("themeManager returns plugin info", (t) => {
	const result = themeManager();
	t.is(result.name, "theme-manager");
	t.is(result.version, "1.0.0");
	t.is(typeof result, "object");
});
