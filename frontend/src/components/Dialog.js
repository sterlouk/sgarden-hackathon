import { Dialog as MUIDialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { memo, useEffect, useState } from "react";

import { SecondaryBackgroundButton, SecondaryBorderButton } from "./Buttons.js";

const Dialog = ({
	open: dialogOpen = false,
	title = "",
	text = "",
	confirmButton = "Confirm",
	cancelButton = "Cancel",
	onConfirm,
	onClose,
}) => {
	const [open, setOpen] = useState(dialogOpen);

	useEffect(() => {
		setOpen(dialogOpen);
	}, [dialogOpen]);

	return (
		<MUIDialog
			open={open}
			onClose={onClose}
		>
			<DialogTitle>
				{title}
			</DialogTitle>
			<DialogContent>
				<DialogContentText>
					{text}
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<SecondaryBorderButton title={cancelButton} onClick={onClose} />
				<SecondaryBackgroundButton title={confirmButton} onClick={onConfirm} />
			</DialogActions>
		</MUIDialog>
	);
};

export default memo(Dialog);
