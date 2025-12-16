import { Modal, Box, Typography, Grid, IconButton } from "@mui/material";
import { makeStyles } from "@mui/styles";
import CloseIcon from "@mui/icons-material/Close";
import { memo, useEffect, useState } from "react";

import colors from "../_colors.scss";

const useStyles = makeStyles(() => ({
	main: {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		boxShadow: 24,
		borderRadius: "10px",
		outline: "none",
	},
}));

const Popup = ({
	children,
	open: popupOpen = false,
	title = "",
	titleColor = "white.main",
	titleBackgroundColor = "secondary",
	color = "secondary",
	backgroundColor = "white.main",
	width = "100%",
	onClose,
}) => {
	const classes = useStyles();
	const [open, setOpen] = useState(popupOpen);

	useEffect(() => {
		setOpen(popupOpen);
	}, [popupOpen]);

	return (
		<Modal
			open={open}
			onClose={onClose}
		>
			<Box
				className={classes.main}
				width={width}
			>
				<Grid
					width="100%"
					px={2}
					color={colors?.[titleColor] || titleColor}
					backgroundColor={colors?.[titleBackgroundColor] || titleBackgroundColor}
					display="flex"
					flexDirection="row"
					justifyContent="space-between"
					alignItems="center"
					sx={{
						borderTopLeftRadius: "10px",
						borderTopRightRadius: "10px",
					}}
				>
					<Typography variant="h6" component="h2">{title}</Typography>
					<IconButton onClick={onClose}>
						<CloseIcon color="white" />
					</IconButton>
				</Grid>
				<Grid
					width="100%"
					p={4}
					color={colors?.[color] || color}
					backgroundColor={colors?.[backgroundColor] || backgroundColor}
					sx={{
						borderBottomLeftRadius: "10px",
						borderBottomRightRadius: "10px",
					}}
				>
					{children}
				</Grid>
			</Box>
		</Modal>
	);
};

export default memo(Popup);
