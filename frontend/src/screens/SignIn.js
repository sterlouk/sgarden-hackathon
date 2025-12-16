import { useEffect, memo, useState } from "react";
import { Grid, Typography, Link, Divider, InputAdornment } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useLocation, useNavigate } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import AccountCircle from "@mui/icons-material/AccountCircle";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { useSnackbar } from "../utils/index.js";
import Spinner from "../components/Spinner.js";
import background from "../assets/images/background.jpg";
import { authenticate } from "../api/index.js";
import Form from "../components/Form.js";

const useStyles = makeStyles((theme) => ({
	root: {
		overflow: "hidden",
		width: "100vw",
		height: "100%",
		backgroundImage: `url(${background})`,
		backgroundPosition: "center",
		backgroundSize: "cover",
	},
	title: {
		color: theme.palette.common.white,
		letterSpacing: theme.spacing(1),
		maxWidth: "300px",
	},
	subtitle: {
		color: theme.palette.third.main,
		letterSpacing: theme.spacing(0.1),
		maxWidth: "300px",
	},
}));

const SignIn = () => {
	const { state } = useLocation();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const classes = useStyles();
	const { error } = useSnackbar();
	const navigate = useNavigate();

	const [showPassword, setShowPassword] = useState(false);

	const handleShowPassword = () => {
		setShowPassword(!showPassword);
	};

	const submitHandler = async (values) => {
		setIsSubmitting(true);

		try {
			const { success, token, message } = await authenticate(values.username, values.password);

			if (success) {
				navigate(`/auth/?token=${token}`);
			} else {
				error(message);
			}
		} catch (error_) {
			console.log(error_);
		}

		setIsSubmitting(false);
	};

	useEffect(() => {
		try {
			sessionStorage.setItem("redirectTo", JSON.stringify(state?.from || { pathname: "/dashboard" }));
		} catch { /** */ }
	}, [state]);

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
			customType: "button",
			id: "submit",
			type: "submit",
			text: "Sign In",
			buttonColor: "third",
		},
	];

	return (
		<>
			<Spinner open={isSubmitting} />
			<Grid container direction="row" justifyContent="center" align="center" className={classes.root}>
				<Grid item container direction="column" justifyContent="center" align="center" sm={5} xs={12} sx={{ "> .MuiGrid-item": { p: 1 } }}>
					<Grid item mt={2}>
						<Typography variant="h3" className={classes.title}>{"WELCOME"}</Typography>
						<Typography variant="h5" className={classes.subtitle}>{"to SGarden Platform"}</Typography>
					</Grid>
					<Grid item container direction="column" justifyContent="center" alignItems="center">
						<Form content={formContent} validationSchema="authenticationSchema" toResetForm={false} onSubmit={submitHandler} />
					</Grid>
					<Grid item container direction="column" justifyContent="center" alignItems="space-between">
						<Grid item>
							<Typography variant="h7" color="white.main">{"Forgot Password? "}</Typography>
							<Typography variant="h7" className={classes.subtitle}>
								<Link color="inherit" underline="none" href="forgot-password">{"Click Here"}</Link>
							</Typography>
						</Grid>
						<Grid item>
							<Divider style={{ width: "280px", margin: "0px", marginTop: "5px", marginBottom: "5px" }} />
						</Grid>
						<Grid item>
							<Typography variant="h7" color="white.main">{"Don't have an account? "}</Typography>
							<Typography variant="h7" className={classes.subtitle}>
								<Link color="inherit" underline="none" href="sign-up">{"Sign Up Here"}</Link>
							</Typography>
						</Grid>
					</Grid>
				</Grid>
				<Grid item sm={7} />
			</Grid>
		</>
	);
};

export default memo(SignIn);
