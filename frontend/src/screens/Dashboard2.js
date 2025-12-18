import { useEffect, useState } from "react";
import { Grid } from "@mui/material";

import Card from "../components/Card.js";
import Plot from "../components/Plot.js";
import DashboardHeader from "../components/DashboardHeader.js";
import { getData } from "../api/index.js";

const availableCities = ["Thessaloniki", "Athens", "Patras"];

const Dashboard = () => {
	const [selectedCity, setSelectedCity] = useState("Thessaloniki");
	const [data, setData] = useState({ localFoodCropProduction: {}, comparisonOfIrrigationWaterVsNeeds: {}, timePlot: {} });

	useEffect(() => {
		getData().then((tempData) => {
			const { success, localFoodCropProduction, comparisonOfIrrigationWaterVsNeeds, timePlot } = tempData;

			if (success) {
				setData({ localFoodCropProduction, comparisonOfIrrigationWaterVsNeeds, timePlot });
			}
		});
	}, [selectedCity]);

	return (
		<Grid container py={2} flexDirection="column">
			<DashboardHeader
				title="Dashboard"
				cities={availableCities}
				selectedCity={selectedCity}
				onCityChange={(event) => setSelectedCity(event.target.value)}
			/>

			<Grid container spacing={2}>
				<Grid item sm={12} md={6}>
					<Card title="Local Food Crop Production">
						<Plot
							data={[
								{
									title: "March",
									y: data?.localFoodCropProduction?.March,
									type: "box",
									color: "primary",
								},
								{
									title: "April",
									y: data?.localFoodCropProduction?.April,
									type: "box",
									color: "secondary",
								},
								{
									title: "May",
									y: data?.localFoodCropProduction?.May,
									type: "box",
									color: "third",
								},
							]}
							showLegend={false}
							displayBar={false}
							height="300px"
							marginBottom="40"
						/>
					</Card>
				</Grid>
				<Grid item sm={12} md={6}>
					<Card title="Comparison of Irrigation Wated vs Needs">
						<Plot
							showLegend
							data={[
								{
									x: ["March", "April", "May", "June", "July", "August"],
									y: Object.values(data?.comparisonOfIrrigationWaterVsNeeds).map((month) => month.etc),
									type: "bar",
									color: "primary",
									title: "ETc",
								},
								{
									x: ["March", "April", "May", "June", "July", "August"],
									y: Object.values(data?.comparisonOfIrrigationWaterVsNeeds).map((month) => month.irrigation),
									type: "bar",
									color: "secondary",
									title: "Irrigation",
								},
								{
									x: ["March", "April", "May", "June", "July", "August"],
									y: Object.values(data?.comparisonOfIrrigationWaterVsNeeds).map((month) => month.rainfall),
									type: "bar",
									color: "third",
									title: "Rainfall",
								},
							]}
							displayBar={false}
							height="300px"
							marginBottom="40"
						/>
					</Card>
				</Grid>
				<Grid item sm={12}>
					<Card title="Time Plot">
						<Plot
							showLegend
							data={[
								{
									title: "Meteo data",
									x: Array.from({ length: 20 }, (_, i) => i + 1),
									y: data?.timePlot?.meteo,
									type: "line",
									color: "primary",
								},
								{
									title: "In situ data",
									x: Array.from({ length: 20 }, (_, i) => i + 1),
									y: data?.timePlot?.inSitu,
									type: "line",
									color: "secondary",
								},
								{
									title: "Generated data",
									x: Array.from({ length: 20 }, (_, i) => i + 1),
									y: data?.timePlot?.generated,
									type: "line",
									color: "third",
								},
							]}
							displayBar={false}
							height="300px"
							marginBottom="40"
						/>
					</Card>
				</Grid>
			</Grid>
		</Grid>
	);
};

export default Dashboard;
