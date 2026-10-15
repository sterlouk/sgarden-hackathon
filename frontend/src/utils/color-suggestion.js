import colors from "../_colors.scss";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const hexToRgb = (hex) => {
	const normalized = hex.replace("#", "");
	const chunk = normalized.length === 3
		? normalized.split("").map((c) => c + c)
		: normalized.match(/.{1,2}/g);
	if (!chunk || chunk.length < 3) return { r: 0, g: 0, b: 0 };
	const [r, g, b] = chunk.map((c) => parseInt(c, 16));
	return { r, g, b };
};

const rgbToHsl = ({ r, g, b }) => {
	const rN = r / 255;
	const gN = g / 255;
	const bN = b / 255;
	const max = Math.max(rN, gN, bN);
	const min = Math.min(rN, gN, bN);
	const delta = max - min;

	let h = 0;
	if (delta) {
		switch (max) {
			case rN:
				h = ((gN - bN) / delta) % 6;
				break;
			case gN:
				h = (bN - rN) / delta + 2;
				break;
			default:
				h = (rN - gN) / delta + 4;
		}
		// normalize to degrees
		h *= 60;
		if (h < 0) h += 360;
	}

	const l = (max + min) / 2;
	const s = delta ? delta / (1 - Math.abs(2 * l - 1)) : 0;
	return { h, s, l };
};

const hslToHex = ({ h, s, l }) => {
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;

	let r = 0; let g = 0; let b = 0;

	if (h >= 0 && h < 60) [r, g, b] = [c, x, 0];
	else if (h < 120) [r, g, b] = [x, c, 0];
	else if (h < 180) [r, g, b] = [0, c, x];
	else if (h < 240) [r, g, b] = [0, x, c];
	else if (h < 300) [r, g, b] = [x, 0, c];
	else [r, g, b] = [c, 0, x];

	const toHex = (val) => {
		const num = Math.round((val + m) * 255);
		return clamp(num, 0, 255).toString(16).padStart(2, "0");
	};

	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const rotateHue = (hex, degrees) => {
	const hsl = rgbToHsl(hexToRgb(hex));
	const h = (hsl.h + degrees) % 360;
	return hslToHex({ ...hsl, h });
};

// Triadic scheme: rotate primary hue by ±120°.
const colorSuggestions = (() => {
	const primary = colors.primary || "#3366ff";
	const secondary = rotateHue(primary, 120);
	const third = rotateHue(primary, 240);
	return { secondary, third };
})();

export default colorSuggestions;
