// imports placed at bottom to avoid hoisting issues in bundlers
import { createUsernameField, createEmailField, createPasswordField, createSubmitButton } from "./authFormHelpers.js";

export const buildSignUpFormContent = ({ showPassword, handleShowPassword, email = "", emailDisabled = false }) => [
	// username
	{ ...createUsernameField() },
	// email (optionally disabled/prefilled)
	{ ...createEmailField(emailDisabled, email) },
	// password + confirm
	{ ...createPasswordField(showPassword, handleShowPassword) },
	{ ...createPasswordField(showPassword, handleShowPassword, "confirmPassword", "Re-type Password") },
	// submit button
	{ ...createSubmitButton("Sign Up") },
];

export const signUpFooterLinks = [
	{ label: "Otherwise, ", text: "Sign In", href: "/" },
];

export const signUpTitle = "Sign Up";
export const signUpSubtitle = "to SGarden Platform";
