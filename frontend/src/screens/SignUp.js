import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useSnackbar } from "../utils/index.js";
import { signUp } from "../api/index.js";
import { createUsernameField, createEmailField, createPasswordField, createSubmitButton } from "./authFormHelpers.js";
import { AuthFormWrapper } from "./AuthFormWrapper.js";
import { useShowPassword } from "./useShowPassword.js";

const SignUp = () => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { success, error } = useSnackbar();
	const navigate = useNavigate();
	const { showPassword, handleShowPassword } = useShowPassword();

	const submitHandler = async (values) => {
		setIsSubmitting(true);

		try {
			const { success: successCode, message } = await signUp(values.username, values.email, values.password);

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
		createEmailField(),
		createPasswordField(showPassword, handleShowPassword),
		createPasswordField(showPassword, handleShowPassword, "confirmPassword", "Re-type Password"),
		createSubmitButton("Sign Up"),
	];

	const footerLinks = [
		{ label: "Otherwise, ", text: "Sign In", href: "/" },
	];

	return (
		<AuthFormWrapper
			isSubmitting={isSubmitting}
			formContent={formContent}
			validationSchema="signUpSchema"
			onSubmit={submitHandler}
			title="Sign Up"
			subtitle="to SGarden Platform"
			footerLinks={footerLinks}
		/>
	);
};

export default memo(SignUp);
