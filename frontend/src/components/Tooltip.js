import PropTypes from "prop-types";
import { Tooltip as MUITooltip, Zoom, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles({
	tooltip: {
		whiteSpace: "normal",
		wordWrap: "break-word",
		textAlign: "center",
	},
});

const Tooltip = ({ children, title, titleVariant = "caption", placement = "top", ...rest }) => {
	const classes = useStyles();
	return (
		<MUITooltip
			arrow
			title={typeof title === "string" ? (<Typography variant={titleVariant} color="inherit">{title}</Typography>) : title || ""}
			placement={placement}
			TransitionComponent={Zoom}
			PopperProps={{ disablePortal: true }}
			classes={{ tooltip: classes.tooltip }}
			{...rest}
		>
			{children}
		</MUITooltip>
	);
};

Tooltip.propTypes = {
	children: PropTypes.node,
	title: PropTypes.oneOfType([PropTypes.string, PropTypes.element, PropTypes.bool]).isRequired,
	titleVariant: PropTypes.string,
	placement: PropTypes.string,
};

export default Tooltip;
