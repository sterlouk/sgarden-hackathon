import { useEffect, useState } from "react";
import { Grid, Typography, Box } from "@mui/material";

import Dropdown from "../components/Dropdown.js";
import Card from "../components/Card.js";
import Plot from "../components/Plot.js";

const availableCities = ["Thessaloniki", "Athens", "Patras"];
const generateRandomData = (minimum = 0, maximum = 100) => {
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
};

const formatNumber = (number, symbol = "", showSign = true) => {
    if (!number) return "-";

    let formattedNumber = (number > 0 && showSign) ? "+" : "";
    formattedNumber += number;
    formattedNumber += symbol;

    return formattedNumber;
};

const Dashboard = () => {
    const [selectedCity, setSelectedCity] = useState("Thessaloniki");
    const [data, setData] = useState({});

    useEffect(() => {
        const newData = {
            undernourishment: {
                value: generateRandomData(),
                change: generateRandomData(-100, 100),
            },
            localFoodCropProduction: {
                value: generateRandomData(0, 10_000),
                change: generateRandomData(-100, 100),
            },
            localBreedPopulation: {
                value: generateRandomData(0, 100_000),
                change: generateRandomData(-100, 100),
            },
            livestockFarmingIndex: Array.from({ length: 7 }, () => generateRandomData(0, 100)),
            dairySales: Array.from({ length: 12 }, () => generateRandomData(0, 500)),
            foodSecurityIndex: Array.from({ length: 12 }, () => generateRandomData(0, 500)),
        };

        setData(newData);
    }, [selectedCity]);

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
                <Grid item xs={12} sm={4}>
                    <Card title="Undernourishment">
                        <Box display="flex" flexDirection="column" alignItems="center">
                            <Typography variant="h3" fontWeight="bold" color="secondary.main">{formatNumber(data?.undernourishment?.value, "%", false)}</Typography>
                            <Grid item display="flex" flexDirection="row">
                                <Typography variant="body" color={data?.undernourishment?.change > 0 ? "success.main" : "error.main"}>
                                    {formatNumber(data?.undernourishment?.change, "%")}
                                </Typography>
                                <Typography variant="body" color="secondary.main" ml={1}>
                                    {"than last month"}
                                </Typography>
                            </Grid>
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card title="Local Food Crop Production">
                        <Box display="flex" flexDirection="column" alignItems="center">
                            <Typography variant="h3" fontWeight="bold" color="secondary.main">{formatNumber(data?.localFoodCropProduction?.value, "", false)}</Typography>
                            <Grid item display="flex" flexDirection="row">
                                <Typography variant="body" color={data?.localFoodCropProduction?.change > 0 ? "success.main" : "error.main"}>
                                    {formatNumber(data?.localFoodCropProduction?.change, "%")}
                                </Typography>
                                <Typography variant="body" color="secondary.main" ml={1}>
                                    {"than last month"}
                                </Typography>
                            </Grid>
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card title="Local Breed Population">
                        <Box display="flex" flexDirection="column" alignItems="center">
                            <Typography variant="h3" fontWeight="bold" color="secondary.main">{formatNumber(data?.localBreedPopulation?.value, "", false)}</Typography>
                            <Grid item display="flex" flexDirection="row">
                                <Typography variant="body" color={data?.localBreedPopulation?.change > 0 ? "success.main" : "error.main"}>
                                    {formatNumber(data?.localBreedPopulation?.change, "%")}
                                </Typography>
                                <Typography variant="body" color="secondary.main" ml={1}>
                                    {"than last month"}
                                </Typography>
                            </Grid>
                        </Box>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <Card
                        title="Livestock Farming Index"
                        footer={(
                            <Grid sx={{ width: "100%", borderTop: "1px solid gray" }}>
                                <Typography variant="body2" component="p" sx={{ marginTop: "10px" }}>{"🕗 averages (last month)"}</Typography>
                            </Grid>
                        )}
                        footerBackgroundColor="white"
                        footerColor="gray"
                    >
                        <Plot
                            data={[
                                {
                                    x: ["M", "T", "W", "T", "F", "S", "S"],
                                    y: data?.livestockFarmingIndex,
                                    type: "bar",
                                    color: "third",
                                },
                            ]}
                            showLegend={false}
                            title="Number of livestock in supply chain"
                            titleColor="primary"
                            titleFontSize={16}
                            displayBar={false}
                        />
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card
                        title="Dairy Sales"
                        footer={(
                            <Grid sx={{ width: "100%", borderTop: "1px solid gray" }}>
                                <Typography variant="body2" component="p" sx={{ marginTop: "10px" }}>{"🕗 updated 4min ago"}</Typography>
                            </Grid>
                        )}
                        footerBackgroundColor="white"
                        footerColor="gray"
                    >
                        <Plot
                            data={[{
                                x: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Dec"],
                                y: data?.dairySales,
                                type: "lines+markers",
                                color: "third",
                            }]}
                            showLegend={false}
                            title="15% increase in sales this month"
                            titleColor="primary"
                            titleFontSize={16}
                            displayBar={false}
                        />
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card
                        title="Food Security Index"
                        footer={(
                            <Grid sx={{ width: "100%", borderTop: "1px solid gray" }}>
                                <Typography variant="body2" component="p" sx={{ marginTop: "10px" }}>{"🕗 just updated"}</Typography>
                            </Grid>
                        )}
                        footerBackgroundColor="white"
                        footerColor="gray"
                    >
                        <Plot
                            data={[{
                                x: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Dec"],
                                y: data?.foodSecurityIndex,
                                type: "lines+markers",
                                color: "third",
                            }]}
                            showLegend={false}
                            title="Number of people nourished properly"
                            titleColor="primary"
                            titleFontSize={16}
                            displayBar={false}
                        />
                    </Card>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default Dashboard;
