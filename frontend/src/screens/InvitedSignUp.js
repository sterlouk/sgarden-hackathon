import { memo, useState } from "react";
import { Grid, Typography, Link, InputAdornment } from "@mui/material";
import { useNavigate } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import AccountCircle from "@mui/icons-material/AccountCircle";
import EmailIcon from "@mui/icons-material/Email";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { useSnackbar } from "../utils/index.js";
import Spinner from "../components/Spinner.js";
import { invitedSignUp } from "../api/index.js";
import Form from "../components/Form.js";
import AuthLayout, { useAuthLayoutStyles } from "../components/AuthLayout.js";

const InvitedSignUp = () => {
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	const token = urlParams.get("token");
	const email = urlParams.get("email");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const classes = useAuthLayoutStyles();
	const { success, error } = useSnackbar();
	const navigate = useNavigate();

	const [showPassword, setShowPassword] = useState(false);

	const handleShowPassword = () => {
		setShowPassword(!showPassword);
	};

	const submitHandler = async (values) => {
		setIsSubmitting(true);

		try {
			const { success: successCode, message } = await invitedSignUp(values.username, values.email, values.password, token);

			if (successCode) {
				success(message);
				navigate("/");
			} else {
				error(message);
			}
		} catch (error_) {
			console.log(error_);
		}

		setIsSubmitting(false);
	};

	const formContent = [
		{
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
		},
		{
			customType: "input",
			id: "email",
			type: "email",
			placeholder: "E-mail",
			value: email,
			disabled: true,
			inputProps: {
				endAdornment: (
					<InputAdornment position="start">
						<IconButton disabled>
							<EmailIcon />
						</IconButton>
					</InputAdornment>
				),
			},
		},
		{
			customType: "input",
			id: "password",
			type: showPassword ? "text" : "password",
			placeholder: "Password",
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
		},
		{
			customType: "input",
			id: "confirmPassword",
			type: showPassword ? "text" : "password",
			placeholder: "Re-type Password",
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
		},
		{
			customType: "button",
			id: "submit",
			type: "submit",
			text: "Sign Up",
			buttonColor: "third",
		},
	];

	return (
		<>
			<Spinner open={isSubmitting} />
			<AuthLayout title="Sign Up" subtitle="to SGarden Platform">
				<Grid item container direction="column" justifyContent="center" alignItems="center">
					<Form content={formContent} validationSchema="signUpSchema" onSubmit={submitHandler} />
				</Grid>
				<Grid item container direction="column" justifyContent="center" alignItems="space-between">
					<Grid item>
						<Typography variant="h7" color="white.main">{"Otherwise, "}</Typography>
						<Typography variant="h7" className={classes.subtitle}>
							<Link color="inherit" underline="none" href="/">{"Sign In"}</Link>
						</Typography>
					</Grid>
				</Grid>
			</AuthLayout>
		</>
	);
};

export default memo(InvitedSignUp);
