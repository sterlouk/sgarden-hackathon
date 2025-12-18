import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useSnackbar } from "../utils/index.js";
import { invitedSignUp } from "../api/index.js";
import { buildSignUpFormContent, signUpFooterLinks, signUpTitle, signUpSubtitle } from "./signUpShared.js";
import { AuthFormWrapper } from "./AuthFormWrapper.js";
import { useShowPassword } from "./useShowPassword.js";

const InvitedSignUp = () => {
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	const token = urlParams.get("token");
	const email = urlParams.get("email");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { success, error } = useSnackbar();
	const navigate = useNavigate();
	const { showPassword, handleShowPassword } = useShowPassword();

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
			// Error caught during invited sign up
		}

		setIsSubmitting(false);
	};

	const formContent = buildSignUpFormContent({ showPassword, handleShowPassword, email, emailDisabled: true });
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

export default memo(InvitedSignUp);
