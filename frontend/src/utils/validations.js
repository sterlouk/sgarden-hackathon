import * as Yup from "yup";

import { passwordMinLength } from "./constants.js";

const email = Yup
	.string()
	.email("Invalid e-mail address")
	.required("E-mail address is required");

const username = Yup
	.string()
	.required("Username is required");

const agree = Yup.boolean().oneOf([true], "You have to agree");

const password = Yup
	.string()
	.min(passwordMinLength, `Password should contain at least ${passwordMinLength} characters`)
	.required("Password is required");

const confirmPassword = Yup
	.string()
	.min(passwordMinLength, `Password should contain at least ${passwordMinLength} characters`)
	.required("Password is required")
	.oneOf([Yup.ref("password")], "Passwords must match");

const schemas = {
	authenticationSchema: Yup.object({ username, password }),
	forgotPasswordSchema: Yup.object({ username }),
	resetPasswordSchema: Yup.object({ password, confirmPassword }),
	signUpSchema: Yup.object({ username, email, password, confirmPassword }),
	exampleSchema: Yup.object({ username, password, agree }),
	inviteUserSchema: Yup.object({ email }),
};

export default schemas;
