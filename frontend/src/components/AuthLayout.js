import PropTypes from "prop-types";
import { Grid, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";

import background from "../assets/images/background.jpg";

const useAuthLayoutStyles = makeStyles((theme) => ({
	root: {
		overflow: "hidden",
		width: "100vw",
		height: "100%",
		backgroundImage: `url(${background})`,
		backgroundPosition: "center",
		backgroundSize: "cover",
	},
	title: {
		color: theme.palette.common.white,
		letterSpacing: theme.spacing(1),
		maxWidth: "300px",
	},
	subtitle: {
		color: theme.palette.third.main,
		letterSpacing: theme.spacing(0.1),
		maxWidth: "300px",
	},
}));

const AuthLayout = ({ title, subtitle, children }) => {
	const classes = useAuthLayoutStyles();

	return (
		<Grid container direction="row" justifyContent="center" align="center" className={classes.root}>
			<Grid item container direction="column" justifyContent="center" align="center" sm={5} xs={12} sx={{ "> .MuiGrid-item": { p: 1 } }}>
				<Grid item mt={2}>
					{title && <Typography variant="h4" className={classes.title}>{title}</Typography>}
					{subtitle && <Typography variant="h5" className={classes.subtitle}>{subtitle}</Typography>}
				</Grid>
				{children}
			</Grid>
			<Grid item sm={7} />
		</Grid>
	);
};

AuthLayout.propTypes = {
	title: PropTypes.string,
	subtitle: PropTypes.string,
	children: PropTypes.node.isRequired,
};

AuthLayout.defaultProps = {
	title: null,
	subtitle: null,
};

export { useAuthLayoutStyles };
export default AuthLayout;
