import propTypes from "prop-types";
import { TextField } from "@mui/material";

export const Input = ({
	id,
	label,
	required,
	helperText,
	error,
	multiline,
	minRows,
	maxRows,
	fullWidth,
	variant,
	onChange,
	children,
	classes,
	...props
}) => (
	<TextField
		hiddenLabel={label === ""}
		id={id}
		label={label}
		required={required}
		helperText={helperText}
		error={error}
		multiline={multiline}
		minRows={minRows}
		maxRows={maxRows}
		fullWidth={fullWidth}
		variant={variant}
		classes={classes}
		onChange={onChange}
		{...props}
	>
		{children}
	</TextField>
);

export default Input;

Input.propTypes = {
	id: propTypes.string,
	label: propTypes.string,
	required: propTypes.bool,
	helperText: propTypes.string,
	error: propTypes.bool,
	multiline: propTypes.bool,
	minRows: propTypes.number,
	maxRows: propTypes.number,
	fullWidth: propTypes.bool,
	variant: propTypes.string,
	onChange: propTypes.func,
	children: propTypes.any,
};

Input.defaultProps = {
	id: "basic-form",
	label: "",
	required: false,
	helperText: "",
	error: false,
	multiline: false,
	fullWidth: true,
	variant: "outlined",
	onChange: () => {},
};
