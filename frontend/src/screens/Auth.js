import { useState, useEffect, memo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import queryString from "query-string";

import { jwt, useSnackbar } from "../utils/index.js";
import api from "../api/index.js";

const Auth = () => {
	const location = useLocation();
	const { error: error_ } = useSnackbar();
	const [redirectTo, setRedirectTo] = useState("/dashboard");

	useEffect(() => {
		try {
			setRedirectTo((p) => JSON.parse(sessionStorage.getItem("redirectTo")) || p);
			sessionStorage.removeItem("redirectTo");
		} catch { /** empty */ }
	}, []);

	const [state, setState] = useState({ user: null, error: null });
	const [error, setError] = useState(queryString.parse(location.search)?.error || null);

	useEffect(() => {
		let isMounted = true;

		(async () => {
			try {
				const { token, error: err } = queryString.parse(location.search);
				if (error) {
					setError(err);
				} else {
					// Set JWT only if provided; no insecure defaults
					if (token) jwt.setToken(token);
					const usr = await api.get("user/attempt-auth/");
					if (isMounted) setState({ user: usr });
				}
			} catch {
				error_();
			}
		})();

		return () => { isMounted = false; };
	}, [error, error_, location.search]);

	if (error) return (<Navigate replace to="/" state={{ error }} />);
	if (!state.user) return <div />;
	return state.user.ok ? <Navigate replace to={redirectTo} /> : <Navigate replace to="/" />;
};

export default memo(Auth);
