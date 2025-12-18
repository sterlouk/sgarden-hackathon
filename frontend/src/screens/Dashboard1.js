import { useEffect, useState } from "react";
import { Grid, Typography, Box, Button, TextField } from "@mui/material";
import Dropdown from "../components/Dropdown.js";
import Card from "../components/Card.js";
import Plot from "../components/Plot.js";
import DatePicker from "../components/DatePicker.js";
import Map from "../components/Map.js";

import colors from "../_colors.scss";

const availableCities = ["Thessaloniki", "Athens", "Patras"];
const availableCropTypes = ["Soil Moisture", "ETc", "Irrigation Water", "Rainfall"];
const generateRandomData = (min = 0, max = 10) => Math.random() * (max - min) + min;
const randomDate = () => new Date(new Date(2020, 0, 1).getTime() + Math.random() * (new Date().getTime() - new Date(2020, 0, 1).getTime()));
const buildMonthlySeries = (fromDate, toDate) => {
    if (!fromDate || !toDate) {
        return { months: [], soilMoisture: [], etc: [], irrigationWater: [], rainfall: [] };
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    const monthLabels = [];
    while (from <= to) {
        monthLabels.push(from.toLocaleString("en-GB", { month: "short", year: "numeric" }));
        from.setMonth(from.getMonth() + 1);
    }

    return {
        months: monthLabels,
        soilMoisture: monthLabels.map(() => generateRandomData(0, 20)),
        etc: monthLabels.map(() => generateRandomData(0, 30)),
        irrigationWater: monthLabels.map(() => generateRandomData(0, 40)),
        rainfall: monthLabels.map(() => generateRandomData(0, 50)),
    };
};
const randomFieldInformation = () => ({ date: randomDate(), value: generateRandomData(0, 100) });

const createPlotAnnotations = (dataKey, months, data) => [
    {
        x: months[data[dataKey].indexOf(Math.min(...data[dataKey]))],
        y: Math.min(...data[dataKey]),
        xref: "x",
        yref: "y",
        text: `Min: ${Math.min(...data[dataKey]).toFixed(2)}%`,
        showarrow: true,
        font: { size: 16, color: "#ffffff" },
        align: "center",
        arrowhead: 2,
        arrowsize: 1,
        arrowwidth: 2,
        arrowcolor: colors.primary,
        borderpad: 4,
        bgcolor: colors.primary,
        opacity: 0.8,
    },
    {
        x: months[data[dataKey].indexOf(Math.max(...data[dataKey]))],
        y: Math.max(...data[dataKey]),
        xref: "x",
        yref: "y",
        text: `Max: ${Math.max(...data[dataKey]).toFixed(2)}%`,
        showarrow: true,
        font: { size: 16, color: "#ffffff" },
        align: "center",
        arrowhead: 2,
        arrowsize: 1,
        arrowwidth: 2,
        arrowcolor: colors.primary,
        borderpad: 4,
        bgcolor: colors.primary,
        opacity: 0.8,
    },
];

const Dashboard = () => {
    const [selectedCity, setSelectedCity] = useState("Thessaloniki");
    const [selectedCropType, setSelectedCropType] = useState(null);
    const [fromDate, setFromDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));
    const [toDate, setToDate] = useState(new Date());
    const [months, setMonths] = useState([]);
    const [data, setData] = useState({ fieldInformation: randomFieldInformation(), soilMoisture: [], etc: [], irrigationWater: [], rainfall: [] });

    useEffect(() => {
        const series = buildMonthlySeries(fromDate, toDate);
        setMonths(series.months);
        setData((prev) => ({ ...prev, ...series }));
    }, [fromDate, toDate, selectedCity]);

    useEffect(() => {
        setData((prev) => ({ ...prev, fieldInformation: randomFieldInformation() }));
    }, [selectedCropType, selectedCity]);

    return (
        <Grid container py={2} flexDirection="column">
            <Typography variant="h4" gutterBottom color="white.main">
                Dashboard
            </Typography>
            
            <Grid item style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "20px" }}>
                <Typography variant="body1" style={{ marginRight: "10px" }} color="white.main">Dashboard Area:</Typography>
                <Dropdown
                    items={availableCities.map((city) => ({ value: city, text: city }))}
                    value={selectedCity}
                    onChange={(event) => setSelectedCity(event.target.value)}
                />
            </Grid>
            
            <Grid container spacing={2}>
                <Grid container item sm={12} md={4} spacing={4}>
                        <Grid item width="100%">
                            <Card
                                title="Field Information"
                                footer={(
                                    <Box
                                        width="100%"
                                        height="100px"
                                        display="flex"
                                        flexDirection="column"
                                        justifyContent="center"
                                        alignItems="center"
                                        backgroundColor="greyDark.main"
                                        py={1}
                                    >
                                        {selectedCropType && (
                                            <>
                                                <Typography variant="body">
                                                    {`Last reported value of ${selectedCropType} for ${selectedCity}`}
                                                </Typography>
                                                <Typography variant="body1" fontWeight="bold" color="primary.main">
                                                    {`${data.fieldInformation.date.toLocaleString("en-GB", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })} - ${data.fieldInformation.value.toFixed(2)}%`}
                                                </Typography>
                                            </>
                                        )}
                                        {!selectedCropType && (
                                            <>
                                                <Typography variant="body1" fontWeight="bold" color="white.main">
                                                    {"No crop type selected"}
                                                </Typography>
                                            </>
                                        )}
                                    </Box>
                                )}
                            >
                                <Box height="100px" display="flex" alignItems="center" justifyContent="space-between">
                                    <Typography width="fit-content" variant="subtitle1">Crop type:</Typography>
                                    <Dropdown
                                        id="cropTypeDropdown"
                                        width="50%"
                                        height="40px"
                                        size="small"
                                        placeholder="Select"
                                        background="greyDark"
                                        items={availableCropTypes.map((crType) => ({ value: crType, text: crType }))}
                                        value={selectedCropType}
                                        onChange={(event) => setSelectedCropType(event.target.value)}
                                    />
                                </Box>
                            </Card>
                        </Grid>
                        <Grid item width="100%">
                            <Card title="Interactive Map">
                                <Map />
                                {/* <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                                    
                                </Box> */}
                            </Card>
                        </Grid>
                </Grid>

                <Grid item sm={12} md={8}>
                    <Card title="Graphs">
                        <Box display="flex" justifyContent="space-between" mb={1}>
                            <Grid item xs={12} sm={6} display="flex" flexDirection="row" alignItems="center">
                                <Typography variant="subtitle1" align="center" mr={2}>
                                    {"From: "}
                                </Typography>
                                <DatePicker
                                    width="200px"
                                    views={["month", "year"]}
                                    inputFormat="MM/YYYY"
                                    label="From"
                                    background="greyDark"
                                    value={fromDate}
                                    onChange={(value) => setFromDate(value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} display="flex" flexDirection="row" alignItems="center" justifyContent="flex-end">
                                <Typography variant="subtitle1" align="center" mr={2}>
                                    {"To: "}
                                </Typography>
                                <DatePicker
                                    width="200px"
                                    views={["month", "year"]}
                                    inputFormat="MM/YYYY"
                                    label="To"
                                    background="greyDark"
                                    value={toDate}
                                    onChange={(value) => setToDate(value)}
                                />
                            </Grid>
                        </Box>
                        <Grid container spacing={1} width="100%">
                            <Grid item xs={12} md={6}>
                                <Plot
                                    data={[
                                        {
                                            x: months,
                                            y: data.soilMoisture,
                                            type: "lines",
                                            fill: "tozeroy",
                                            color: "third",
                                            line: { shape: "spline", smoothing: 1},
                                            markerSize: 0,
                                            hoverinfo: "none",
                                        },
                                        {
                                            x: months,
                                            y: data.soilMoisture,
                                            type: "scatter",
                                            mode: "markers",
                                            color: "primary",
                                            markerSize: 10,
                                            name: "",
                                            hoverinfo: "none",
                                        },
                                    ]}
                                    showLegend={false}
                                    title="Soil Moisture"
                                    titleColor="primary"
                                    titleFontSize={16}
                                    displayBar={false}
                                    height="250px"
                                    annotations={createPlotAnnotations("soilMoisture", months, data)}
                                />
                                <Typography variant="body1" textAlign="center">
                                    {`Average: ${(data.soilMoisture.reduce((acc, curr) => acc + curr, 0) / data.soilMoisture.length).toFixed(2)}%`}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Plot
                                    data={[
                                        {
                                            x: months,
                                            y: data.etc,
                                            type: "lines",
                                            fill: "tozeroy",
                                            color: "third",
                                            line: { shape: "spline", smoothing: 1},
                                            markerSize: 0,
                                            hoverinfo: "none",
                                        },
                                        {
                                            x: months,
                                            y: data.etc,
                                            type: "scatter",
                                            mode: "markers",
                                            color: "primary",
                                            markerSize: 10,
                                            name: "",
                                            hoverinfo: "none",
                                        },
                                    ]}
                                    showLegend={false}
                                    title="ETc"
                                    titleColor="primary"
                                    titleFontSize={16}
                                    displayBar={false}
                                    height="250px"
                                    annotations={createPlotAnnotations("etc", months, data)}
                                />
                                <Typography variant="body1" textAlign="center">
                                    {`Average: ${(data.etc.reduce((acc, curr) => acc + curr, 0) / data.etc.length).toFixed(2)}%`}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Plot
                                    data={[
                                        {
                                            x: months,
                                            y: data.irrigationWater,
                                            type: "lines",
                                            fill: "tozeroy",
                                            color: "third",
                                            line: { shape: "spline", smoothing: 1},
                                            markerSize: 0,
                                            hoverinfo: "none",
                                        },
                                        {
                                            x: months,
                                            y: data.irrigationWater,
                                            type: "scatter",
                                            mode: "markers",
                                            color: "primary",
                                            markerSize: 10,
                                            name: "",
                                            hoverinfo: "none",
                                        },
                                    ]}
                                    showLegend={false}
                                    title="Irrigation Water"
                                    titleColor="primary"
                                    titleFontSize={16}
                                    displayBar={false}
                                    height="250px"
                                    annotations={createPlotAnnotations("irrigationWater", months, data)}
                                />
                                <Typography variant="body1" textAlign="center">
                                    {`Average: ${(data.irrigationWater.reduce((acc, curr) => acc + curr, 0) / data.irrigationWater.length).toFixed(2)}%`}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Plot
                                    data={[
                                        {
                                            x: months,
                                            y: data.rainfall,
                                            type: "lines",
                                            fill: "tozeroy",
                                            color: "third",
                                            line: { shape: "spline", smoothing: 1},
                                            markerSize: 0,
                                            hoverinfo: "none",
                                        },
                                        {
                                            x: months,
                                            y: data.rainfall,
                                            type: "scatter",
                                            mode: "markers",
                                            color: "primary",
                                            markerSize: 10,
                                            name: "",
                                            hoverinfo: "none",
                                        },
                                    ]}
                                    showLegend={false}
                                    title="Rainfall"
                                    titleColor="primary"
                                    titleFontSize={16}
                                    displayBar={false}
                                    height="250px"
                                    annotations={createPlotAnnotations("rainfall", months, data)}
                                />
                                <Typography variant="body1" textAlign="center">
                                    {`Average: ${(data.rainfall.reduce((acc, curr) => acc + curr, 0) / data.rainfall.length).toFixed(2)}%`}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Card>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default Dashboard;
