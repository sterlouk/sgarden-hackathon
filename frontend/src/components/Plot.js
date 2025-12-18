import { useEffect, useState } from "react";
import Plotly from "react-plotly.js";

import colors from "../_colors.scss";

const Plot = ({
	data: plotData, // An array of objects. Each one describes a specific subplot
	title: plotTitle = "", // Plot title
	titleColor: plotTitleColor = "primary", // Plot title color (from the list of colors e.g. secondary or global e.g. red)
	titleFontSize: plotTitleFontSize = 20, // Plot title font size
	showLegend: plotShowLegend = true, // Show plot legend or not
	legendFontSize: plotLegendFontSize = 12, // Plot legend font size
	scrollZoom: plotScrollZoom = false, // Enable or disable zoom in/out on scrolling
	editable: plotEditable = false, // Enable or disable user edit on plot (e.g. plot title)
	displayBar: plotDisplayBar = undefined, // Enable or disable mode bar with actions for user
	// (true for always display, false for never display, undefined for display on hover)
	width: plotWidth = "100%",
	height: plotHeight = "100%",
	background: plotBackground = "white",
	marginBottom: plotMarginBottom = 80,
	annotations: plotAnnotations = [],
}) => {
	const [data, setData] = useState(plotData);
	const [title, setTitle] = useState(plotTitle);
	const [titleColor, setTitleColor] = useState(plotTitleColor);
	const [titleFontSize, setTitleFontSize] = useState(plotTitleFontSize);
	const [showLegend, setShowLegend] = useState(plotShowLegend);
	const [legendFontSize, setLegendFontSize] = useState(plotLegendFontSize);
	const [scrollZoom, setScrollZoom] = useState(plotScrollZoom);
	const [editable, setEditable] = useState(plotEditable);
	const [displayBar, setDisplayBar] = useState(plotDisplayBar);
	const [width, setWidth] = useState(plotWidth);
	const [height, setHeight] = useState(plotHeight);
	const [background, setBackground] = useState(plotBackground);
	const [marginBottom, setMarginBottom] = useState(plotMarginBottom);
	const [annotations, setAnnotations] = useState(plotAnnotations);

	useEffect(() => {
		setData(plotData);
	}, [plotData]);

	useEffect(() => {
		setTitle(plotTitle);
	}, [plotTitle]);

	useEffect(() => {
		setTitleColor(plotTitleColor);
	}, [plotTitleColor]);

	useEffect(() => {
		setTitleFontSize(plotTitleFontSize);
	}, [plotTitleFontSize]);

	useEffect(() => {
		setShowLegend(plotShowLegend);
	}, [plotShowLegend]);

	useEffect(() => {
		setLegendFontSize(plotLegendFontSize);
	}, [plotLegendFontSize]);

	useEffect(() => {
		setScrollZoom(plotScrollZoom);
	}, [plotScrollZoom]);

	useEffect(() => {
		setEditable(plotEditable);
	}, [plotEditable]);

	useEffect(() => {
		setDisplayBar(plotDisplayBar);
	}, [plotDisplayBar]);

	useEffect(() => {
		setWidth(plotWidth);
	}, [plotWidth]);

	useEffect(() => {
		setHeight(plotHeight);
	}, [plotHeight]);

	useEffect(() => {
		setBackground(plotBackground);
	}, [plotBackground]);

	useEffect(() => {
		setMarginBottom(plotMarginBottom);
	}, [plotMarginBottom]);

	useEffect(() => {
		setAnnotations(plotAnnotations);
	}, [plotAnnotations]);

	return (
		<Plotly
			data={data.map((d) => ({
				x: d.x,
				y: d.y,
				z: d.z,
				type: d.type,
				name: d.title,
				text: d.texts,
				mode: d.mode,
				fill: d.fill,
				line: d.line,
				marker: { color: colors?.[d?.color] || d?.color, size: d?.markerSize ?? 6 },
				values: d.values,
				labels: d.labels,
				textFont: { color: "white" },
				hoverinfo: d.hoverinfo,
				hovertemplate: d.hovertemplate,
			}))}
			layout={{
				title: {
					text: title,
					font: { color: colors?.[titleColor] || titleColor, size: titleFontSize },
				},
				showlegend: showLegend,
				legend: {
					font: { color: colors?.[titleColor] || titleColor, size: legendFontSize },
				},
				paper_bgcolor: colors?.[background] || background,
				plot_bgcolor: colors?.[background] || background,
				margin: { t: title ? 60 : 40, l: 40, b: marginBottom, ...(!showLegend && { r: 40 }) },
				annotations,
				xaxis: { tickangle: -45 },
			}}
			config={{
				scrollZoom,
				editable,
				...(displayBar !== undefined && { displayModeBar: displayBar }),
				displaylogo: false,
			}}
			style={{ width, height }}
		/>
	);
};

export default Plot;
