import { memo } from "react";
import { AppBar, Box, Link, Toolbar, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { Image } from "mui-image";

import logo from "../assets/images/isselLogo.png";

const useStyles = makeStyles((theme) => ({
	grow: {
		flexGrow: 1,
		flexBasis: "auto",
		background: theme.palette.dark.main,
		zIndex: 1200,
		height: "60px",
	},
	box: {
		height: "100%",
		width: "fit-content",
		padding: "10px 20px",
	},
}));

const Footer = () => {
	const classes = useStyles();

	return (
		<AppBar id="footer" position="static" className={classes.grow}>
			<Toolbar className="header-container">
				<Box className={classes.box} component={Link} target="_blank" href="https://issel.ee.auth.gr" rel="noreferrer">
					<Image src={logo} alt="Logo" fit="contain" height="100%" style={{ width: "auto" }} />
				</Box>
				<Box className={classes.grow} style={{ height: "100%" }} />
				<Box className={classes.grow} display="flex" style={{ height: "100%", justifyContent: "flex-end", alignItems: "center" }}>
					<Typography fontSize="small">{`@${(new Date()).getFullYear()} ISSEL | All Rights Reserved`}</Typography>
				</Box>
			</Toolbar>
		</AppBar>
	);
};

export default memo(Footer);
