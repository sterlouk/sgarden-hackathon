import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useSnackbar } from "../utils/index.js";
import { resetPassword } from "../api/index.js";

import { createPasswordField, createSubmitButton } from "./authFormHelpers.js";
import { AuthFormWrapper } from "./AuthFormWrapper.js";

const ResetPassword = () => {
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	const token = urlParams.get("token");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { success, error } = useSnackbar();
	const navigate = useNavigate();

	const [showPassword, setShowPassword] = useState(false);

	const handleShowPassword = () => {
		setShowPassword(!showPassword);
	};

	const submitHandler = async (values) => {
		setIsSubmitting(true);

		try {
			const { success: successCode, message } = await resetPassword(values.password, token);

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
		createPasswordField(showPassword, handleShowPassword, "password", "New Password"),
		createPasswordField(showPassword, handleShowPassword, "confirmPassword", "Re-type New Password"),
		createSubmitButton("Change Password"),
	];

	const footerLinks = [
		{ label: "Otherwise, ", text: "Sign In", href: "/" },
	];

	return (
		<AuthFormWrapper
			isSubmitting={isSubmitting}
			formContent={formContent}
			validationSchema="resetPasswordSchema"
			title="Reset Password"
			footerLinks={footerLinks}
			onSubmit={submitHandler}
		/>
	);
};

export default memo(ResetPassword);
