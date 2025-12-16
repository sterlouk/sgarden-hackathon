import { FormControlLabel, Radio, RadioGroup } from "@mui/material";

const RadioButtons = ({
	id = "custom-radio-buttons",
	value = "",
	onChange,
	row = false,
	color = "secondary",
	size = "medium",
	labelPlacement = "end",
	disabled = false,
	items = [],
}) => (
	<RadioGroup
		value={value}
		name={id}
		row={row}
		onChange={onChange}
	>
		{items.map((it) => (
			<FormControlLabel
				key={it.value}
				value={it.value}
				control={(
					<Radio
						color={color}
						sx={{
							color: `${color}.main`,
							"&.Mui-checked": {
								color: `${color}.main`,
							},
						}}
						size={size}
					/>
				)}
				label={it.label}
				labelPlacement={labelPlacement}
				disabled={disabled || it.disabled}
			/>
		))}
	</RadioGroup>
);

export default RadioButtons;
