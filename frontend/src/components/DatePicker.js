import { useState } from "react";
import { TextField } from "@mui/material";
import { TimePicker, DateTimePicker, DesktopDatePicker, MobileDatePicker } from "@mui/x-date-pickers";
import { makeStyles } from "@mui/styles";

import colors from "../_colors.scss";

const useStyles = makeStyles(() => ({
	date_picker: {
		color: (props) => colors[props.color] || props.color,
		backgroundColor: (props) => colors[props.background] || props.background,
		borderRadius: (props) => props.borderRadius,
		outline: "none",
		width: (props) => props.width,
	},
}));

const DatePicker = ({
	type = "desktop", // desktop, mobile, time, datetime
	value = null,
	onChange,
	disabled = false,
	label = "Date",
	views = ["day", "month", "year"],
	inputFormat = "DD/MM/YYYY",
	background = "third",
	color = "white",
	borderRadius = "10px",
	width = "100%",
}) => {
	const classes = useStyles({ background, color, borderRadius, width });
	const [customValue, setCustomValue] = useState(value);

	const handleChange = (newValue) => {
		setCustomValue(newValue);
		if (onChange) onChange(newValue);
	};

	return (
		<>
			{type === "desktop" && (
				<DesktopDatePicker
					className={classes.date_picker}
					views={views}
					disabled={disabled}
					label={label}
					inputFormat={inputFormat}
					value={customValue}
					renderInput={(params) => <TextField {...params} />}
					onChange={handleChange}
				/>
			)}
			{type === "mobile" && (
				<MobileDatePicker
					className={classes.date_picker}
					views={views}
					disabled={disabled}
					label={label}
					inputFormat={inputFormat}
					value={customValue}
					renderInput={(params) => <TextField {...params} />}
					onChange={handleChange}
				/>
			)}
			{type === "time" && (
				<TimePicker
					className={classes.date_picker}
					disabled={disabled}
					label={label}
					value={customValue}
					renderInput={(params) => <TextField {...params} />}
					onChange={handleChange}
				/>
			)}
			{type === "datetime" && (
				<DateTimePicker
					className={classes.date_picker}
					views={views}
					disabled={disabled}
					label={label}
					value={customValue}
					renderInput={(params) => <TextField {...params} />}
					onChange={handleChange}
				/>
			)}
		</>
	);
};

export default DatePicker;
