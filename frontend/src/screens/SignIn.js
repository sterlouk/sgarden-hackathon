import { useEffect, memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useSnackbar } from "../utils/index.js";
import { authenticate } from "../api/index.js";
import { createUsernameField, createPasswordField, createSubmitButton } from "./authFormHelpers.js";
import { AuthFormWrapper } from "./AuthFormWrapper.js";
import { useShowPassword } from "./useShowPassword.js";

const SignIn = () => {
	const { state } = useLocation();
	const { error } = useSnackbar();
	const navigate = useNavigate();
	const { showPassword, handleShowPassword } = useShowPassword();

	const submitHandler = async (values) => {
		try {
			const { success, token, message } = await authenticate(values.username, values.password);

			if (success) {
				navigate(`/auth/?token=${token}`);
			} else {
				error(message);
			}
		} catch (error_) {
			// Error caught during sign in
		}
	};

	useEffect(() => {
		try {
			sessionStorage.setItem("redirectTo", JSON.stringify(state?.from || { pathname: "/dashboard" }));
		} catch { /** */ }
	}, [state]);

	const formContent = [
		createUsernameField(),
		createPasswordField(showPassword, handleShowPassword),
		createSubmitButton("Sign In"),
	];

	const footerLinks = [
		{ label: "Forgot Password? ", text: "Click Here", href: "forgot-password" },
		{ label: "Don't have an account? ", text: "Sign Up Here", href: "sign-up" },
	];

	return (
		<AuthFormWrapper
			isSubmitting={false}
			formContent={formContent}
			validationSchema="authenticationSchema"
			onSubmit={submitHandler}
			toResetForm={false}
			title="WELCOME"
			subtitle="to SGarden Platform"
			footerLinks={footerLinks}
			showDivider={true}
		/>
	);
};

export default memo(SignIn);
