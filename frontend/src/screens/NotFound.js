import { Typography, Button } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

const NotFound = () => (
	<div style={{ padding: "3rem 1.5rem" }}>
		<div className="container">
			<Typography gutterBottom variant="h4" component="h1">{"404, Page not found!"}</Typography>
			<Typography gutterBottom variant="h6" component="p">
				{"The page you requested was not found. If you believe something is wrong please contact us."}
			</Typography>
			<Button size="small" startIcon={<ArrowBack />} variant="outlined" onClick={() => { window.location.href = "/"; }}>
				{"Go Back"}
			</Button>
		</div>
	</div>
);

export default NotFound;
