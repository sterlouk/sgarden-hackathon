import { useCallback } from "react";
import { create } from "zustand";
import { shallow } from "zustand/shallow";

export const snackStore = create((setState) => ({
	severity: "success",
	setSeverity: (severity) => setState({ severity }),
	message: "Done.",
	setMessage: (message) => setState({ message }),
	open: false,
	setOpen: (open) => setState({ open }),
	autoHideDuration: 3000,
	setAutoHideDuration: (autoHideDuration) => setState({ autoHideDuration }),
}));

const useSnackbar = () => {
	const { setSeverity, setMessage, setOpen, setAutoHideDuration } = snackStore(useCallback((e) => ({
		setSeverity: e.setSeverity,
		setMessage: e.setMessage,
		setOpen: e.setOpen,
		setAutoHideDuration: e.setAutoHideDuration,
	}), []), shallow);

	const success = useCallback((msg = "Done.", autoHideDuration = 3000) => {
		setMessage(msg);
		setSeverity("success");
		setAutoHideDuration(autoHideDuration);
		setOpen(true);
	}, [setAutoHideDuration, setMessage, setOpen, setSeverity]);

	const error = useCallback((msg = "Something went wrong. Please try again later.", autoHideDuration = 3000) => {
		setMessage(msg);
		setSeverity("error");
		setAutoHideDuration(autoHideDuration);
		setOpen(true);
	}, [setAutoHideDuration, setMessage, setOpen, setSeverity]);

	const info = useCallback((msg = "Done.", autoHideDuration = 3000) => {
		setMessage(msg);
		setSeverity("info");
		setAutoHideDuration(autoHideDuration);
		setOpen(true);
	}, [setAutoHideDuration, setMessage, setOpen, setSeverity]);

	const close = useCallback(() => setOpen(false), [setOpen]);

	return { success, error, info, close };
};

export default useSnackbar;
