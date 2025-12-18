import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@mui/styles";
import { Navigate, useLocation } from "react-router-dom";
import queryString from "query-string";

import { jwt } from "../utils/index.js";

import Sidebar from "./Sidebar.js";

const useStyles = makeStyles((theme) => ({
	main: {
		width: "100%",
		height: "calc(100% - 160px)",
		backgroundImage: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primaryDark.main})`,
		position: "fixed",
	},
	mainBox: {
		padding: "10px 20px",
		overflow: "auto",
		position: "absolute",
		display: "flex",
		height: "100%",
	},
}));

const maybeSetToken = (Component) => (props) => {
	const { search } = useLocation();
	const { token } = queryString.parse(search);
	if (token) jwt.setToken(token);
	return <Component {...props} />;
};

const SIDEBAR_BREAKPOINT = 900;

const useResponsiveSidebar = () => {
	const [isSmall, setIsSmall] = useState(window.innerWidth < SIDEBAR_BREAKPOINT);

	useEffect(() => {
		const onResize = () => setIsSmall(window.innerWidth < SIDEBAR_BREAKPOINT);
		window.addEventListener("resize", onResize);

		return () => window.removeEventListener("resize", onResize);
	}, []);

	return isSmall;
};

const createGuardComponent = (predicate) => {
	const Guard = ({ c }) => {
		const isSmall = useResponsiveSidebar();
		const location = useLocation();
		const classes = useStyles();

		return predicate()
			? (
				<div className={classes.main}>
					<Sidebar isSmall={isSmall} />
					<div className={classes.mainBox} style={{ width: (isSmall) ? "calc(100% - 50px)" : "calc(100% - 200px)", marginLeft: (isSmall) ? "50px" : "200px" }}>
						<div className="header-container">
							{c}
						</div>
					</div>
				</div>
			)
			: <Navigate replace to="/" state={{ from: location }} />;
	};

	Guard.propTypes = { c: PropTypes.node.isRequired };
	Guard.whyDidYouRender = true;

	return maybeSetToken(Guard);
};

const Protected = createGuardComponent(() => jwt.isAuthenticated());

export { createGuardComponent };
export default Protected;

