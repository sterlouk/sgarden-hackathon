import { Harmonizer } from "color-harmony";

import colors from "../_colors.scss";

const harmonizer = new Harmonizer();

const [, secondary, third] = harmonizer.harmonize(colors.primary, "triadic");
const colorSuggestions = {
	secondary,
	third,
};

export default colorSuggestions;
