import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useSnackbar } from "../utils/index.js";
import { signUp } from "../api/index.js";
import { buildSignUpFormContent, signUpFooterLinks, signUpTitle, signUpSubtitle } from "./signUpShared.js";
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
			// Error caught during sign up
		}

		setIsSubmitting(false);
	};

	const formContent = buildSignUpFormContent({ showPassword, handleShowPassword });
	const footerLinks = signUpFooterLinks;

	return (
		<AuthFormWrapper
			isSubmitting={isSubmitting}
			formContent={formContent}
			validationSchema="signUpSchema"
			onSubmit={submitHandler}
			title={signUpTitle}
			subtitle={signUpSubtitle}
			footerLinks={footerLinks}
		/>
	);
};

export default memo(SignUp);
