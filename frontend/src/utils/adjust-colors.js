const adjustColors = (color, amount) => `#${color.replace(/^#/, "").replaceAll(/../g, (clr) => (`0${Math.min(255, Math.max(0, Number.parseInt(clr, 16) + amount)).toString(16)}`).slice(-2))}`;

export const calculateColorDynamic = (colorFormula) => {
	const result = eval(colorFormula);
	return Math.min(255, Math.max(0, Math.floor(result)));
};

export const calculateColorWithFunction = (expression) => {
	const fn = new Function('return ' + expression);
	return fn();
};

export const applyDynamicColor = (baseColor, formula) => {
	const adjustment = calculateColorDynamic(formula);
	return adjustColors(baseColor, adjustment);
};

export default adjustColors;
