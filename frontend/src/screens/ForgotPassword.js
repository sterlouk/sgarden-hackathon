import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useSnackbar } from "../utils/index.js";
import { forgotPassword } from "../api/index.js";

import { createUsernameField, createSubmitButton } from "./authFormHelpers.js";
import { AuthFormWrapper } from "./AuthFormWrapper.js";

const ForgotPassword = () => {
	const [isSubmitting, setIsSubmitting] = useState(false);
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
		createUsernameField(),
		createSubmitButton("Reset Password"),
	];

	const footerLinks = [
		{ label: "Otherwise, ", text: "Sign In", href: "/" },
	];

	return (
		<AuthFormWrapper
			isSubmitting={isSubmitting}
			formContent={formContent}
			validationSchema="forgotPasswordSchema"
			title="Trouble signing in?"
			subtitle="Please enter your username and you will receive a link to create a new password."
			footerLinks={footerLinks}
			onSubmit={submitHandler}
		/>
	);
};

export default memo(ForgotPassword);
