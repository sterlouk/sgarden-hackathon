import { Slider as MUISlider, Stack } from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles(() => ({
	markLabel: {
		color: "white",
	},
}));

const Slider = ({
	id = "custom-slider",
	value,
	onChange,
	min = 0,
	max = 100,
	marks,
	step,
	size = "medium",
	track,
	color = "secondary",
	displayLabel,
	iconBefore,
	iconAfter,
}) => {
	const classes = useStyles();
	return (
		<Stack key={id} spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
			{iconBefore}
			<MUISlider
				color={color || "secondary"}
				value={value}
				min={min}
				max={max}
				marks={marks}
				step={step === null ? null : step || 1}
				size={size || "medium"} // small, medium
				track={track} // normal, false, inverted
				valueLabelDisplay={displayLabel || "auto"} // on, off, auto
				classes={{
					markLabel: classes.markLabel,
				}}
				onChange={onChange}
			/>
			{iconAfter}
		</Stack>
	);
};

export default Slider;
