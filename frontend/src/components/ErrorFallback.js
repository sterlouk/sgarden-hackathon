import PropTypes from "prop-types";
import { Button, Grid, Typography } from "@mui/material";
import { ArrowBack, Refresh } from "@mui/icons-material";
import { Image } from "mui-image";

import logo from "../assets/images/logo.png";

const ErrorFallback = ({ message = "Something went wrong! Please try again!", refetch = () => window.location.reload() }) => (
	<Grid
		container
		direction="column"
		alignItems="center"
		sx={{
			position: "absolute",
			top: "50%",
			left: "50%",
			transform: "translate(-50%, -50%)",
		}}
	>
		<Grid item xs={12}>
			<Image src={logo} alt="Sefa" width="250px" />
		</Grid>
		<Grid item xs={12} mt={2}>
			<Grid container direction="column" spacing={6}>
				<Grid item xs={12}>
					<Typography align="center" variant="h6">{message}</Typography>
				</Grid>
				<Grid item xs={12}>
					<Grid container spacing={2} justifyContent="center">
						<Grid item>
							<Button size="small" startIcon={<ArrowBack />} variant="outlined" onClick={() => { window.location.href = "/"; }}>
								{"Go Back"}
							</Button>
						</Grid>
						{refetch && (
							<Grid item>
								<Button size="small" startIcon={<Refresh />} variant="contained" onClick={refetch}>
									{"Try Again"}
								</Button>
							</Grid>
						)}
					</Grid>
				</Grid>
			</Grid>
		</Grid>
	</Grid>
);

ErrorFallback.propTypes = { message: PropTypes.string, refetch: PropTypes.func };

export default ErrorFallback;
