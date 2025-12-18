import { Box, Typography, Grid } from "@mui/material";
import { memo } from "react";

import colors from "../_colors.scss";

const Card = ({
	children,
	title = "",
	titleExists = true,
	titleColor = "white.main",
	titleBackgroundColor = "primary",
	titleFontSize = "16px",
	footer = "",
	footerExists = true,
	footerColor = "white.main",
	footerBackgroundColor = "primary",
	backgroundColor = "white.main",
	footerFontSize = "16px",
	width = "100%",
	height = "auto",
	padding = "10px",
}) => (
	<Box
		sx={{
			width,
			height,
			padding,
			backgroundColor: colors?.[backgroundColor] || backgroundColor,
		}}
	>
		{titleExists && (
			<Grid
				width="100%"
				color={colors?.[titleColor] || titleColor}
				backgroundColor={colors?.[titleBackgroundColor] || titleBackgroundColor}
				padding="10px 20px"
				display="flex"
				flexDirection="row"
				justifyContent="center"
				alignItems="center"
			>
				{typeof title === "string" ? (
					<Typography variant="body" component="h2" fontSize={titleFontSize}>{title}</Typography>
				) : (
					title
				)}
			</Grid>
		)}
		<Grid width="100%" padding="10px 20px" justifyContent="center" alignItems="center">
			{children}
		</Grid>
		{footerExists && (
			<Grid
				width="100%"
				color={colors?.[footerColor] || footerColor}
				backgroundColor={colors?.[footerBackgroundColor] || footerBackgroundColor}
				display="flex"
				flexDirection="row"
				justifyContent="space-between"
				alignItems="center"
			>
				{typeof footer === "string" ? (
					<Typography variant="h6" component="h2" fontSize={footerFontSize}>{footer}</Typography>
				) : (
					footer
				)}
			</Grid>
		)}
	</Box>
);

export default memo(Card);
