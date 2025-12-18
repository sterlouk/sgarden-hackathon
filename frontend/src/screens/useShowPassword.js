import { useState } from "react";

export const useShowPassword = () => {
	const [showPassword, setShowPassword] = useState(false);

	const handleShowPassword = () => {
		setShowPassword(!showPassword);
	};

	return { showPassword, handleShowPassword };
};
