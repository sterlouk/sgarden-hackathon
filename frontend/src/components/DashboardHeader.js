import { Grid, Typography } from "@mui/material";
import Dropdown from "./Dropdown.js";

const DashboardHeader = ({ title = "Dashboard", cities = [], selectedCity, onCityChange }) => {
	return (
		<>
			<Typography variant="h4" gutterBottom color="white.main">
				{title}
			</Typography>

			<Grid item style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "20px" }}>
				<Typography variant="body1" style={{ marginRight: "10px" }} color="white.main">
					Dashboard Area:
				</Typography>
				<Dropdown
					items={cities.map((city) => ({ value: city, text: city }))}
					value={selectedCity}
					onChange={onCityChange}
				/>
			</Grid>
		</>
	);
};

export default DashboardHeader;
