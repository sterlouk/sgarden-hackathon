import { forwardRef, memo } from "react";
import PropTypes from "prop-types";
import { CircularProgress, Slide, Dialog } from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
	root: {
		background: "transparent",
		color: theme.palette.secondary.main,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	},
}));

const Transition = forwardRef((props, ref) => <Slide ref={ref} direction="up" {...props} />);

const Spinner = ({ open }) => {
	const classes = useStyles();

	return (
		<Dialog
			fullScreen
			open={open}
			TransitionComponent={Transition}
			maxWidth={false}
			classes={{
				paper: classes.root,
			}}
		>
			<CircularProgress color="inherit" size={60} />
		</Dialog>
	);
};

Spinner.propTypes = {
	open: PropTypes.bool.isRequired,
};

export default memo(Spinner);
