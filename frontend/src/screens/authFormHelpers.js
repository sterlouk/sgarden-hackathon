import { InputAdornment } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import AccountCircle from "@mui/icons-material/AccountCircle";
import EmailIcon from "@mui/icons-material/Email";

export const createPasswordField = (showPassword, handleShowPassword, id = "password", placeholder = "Password") => ({
	customType: "input",
	id,
	type: showPassword ? "text" : "password",
	placeholder,
	inputProps: {
		endAdornment: (
			<InputAdornment position="start">
				<IconButton
					aria-label="toggle password visibility"
					tabIndex={-1}
					onClick={handleShowPassword}
				>
					{showPassword ? <Visibility /> : <VisibilityOff />}
				</IconButton>
			</InputAdornment>
		),
	},
});

export const createUsernameField = () => ({
	customType: "input",
	id: "username",
	type: "text",
	placeholder: "Username",
	inputProps: {
		endAdornment: (
			<InputAdornment position="start">
				<IconButton disabled>
					<AccountCircle />
				</IconButton>
			</InputAdornment>
		),
	},
});

export const createEmailField = (disabled = false, value = "") => ({
	customType: "input",
	id: "email",
	type: "email",
	placeholder: "E-mail",
	...(disabled && { value, disabled }),
	inputProps: {
		endAdornment: (
			<InputAdornment position="start">
				<IconButton disabled>
					<EmailIcon />
				</IconButton>
			</InputAdornment>
		),
	},
});

export const createSubmitButton = (text, buttonColor = "third") => ({
	customType: "button",
	id: "submit",
	type: "submit",
	text,
	buttonColor,
});
