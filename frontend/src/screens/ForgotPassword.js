import { memo, useState } from "react";
import { Grid, Typography, Link, InputAdornment } from "@mui/material";
import { useNavigate } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import AccountCircle from "@mui/icons-material/AccountCircle";

import { useSnackbar } from "../utils/index.js";
import Spinner from "../components/Spinner.js";
import { forgotPassword } from "../api/index.js";
import Form from "../components/Form.js";
import AuthLayout, { useAuthLayoutStyles } from "../components/AuthLayout.js";

const ForgotPassword = () => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const classes = useAuthLayoutStyles();
	const { success, error } = useSnackbar();
	const navigate = useNavigate();

	const submitHandler = async (values) => {
		setIsSubmitting(true);

		try {
			const { success: successCode, message } = await forgotPassword(values.username);

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
			customType: "button",
			id: "submit",
			type: "submit",
			text: "Reset Password",
			buttonColor: "third",
		},
	];

	return (
		<>
			<Spinner open={isSubmitting} />
			<AuthLayout title="Trouble signing in?" subtitle="Please enter your username and you will receive a link to create a new password.">
				<Grid item container direction="column" justifyContent="center" alignItems="center">
					<Form content={formContent} validationSchema="forgotPasswordSchema" onSubmit={submitHandler} />
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

export default memo(ForgotPassword);
