const adjustColors = (color, amount) => `#${color.replace(/^#/, "").replaceAll(/../g, (clr) => (`0${Math.min(255, Math.max(0, Number.parseInt(clr, 16) + amount)).toString(16)}`).slice(-2))}`;

export default adjustColors;
