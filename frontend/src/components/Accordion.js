import { Accordion as MUIAccordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { makeStyles } from "@mui/styles";
import { memo } from "react";

import colors from "../_colors.scss";

const useStyles = makeStyles(() => ({
	accordion: {
		width: "100%!important",
		borderRadius: "10px!important",
		backgroundColor: "transparent",
		boxShadow: "none",
	},
	accordionExpanded: {
		minHeight: "auto",
		margin: "0px!important",
	},
	accordionHeader: {
		color: (props) => colors[props.titleColor] || props.titleColor,
		backgroundColor: (props) => colors[props.titleBackground] || props.titleBackground,
		borderRadius: "10px",
		margin: "0px!important",
	},
	accordionHeaderExpanded: {
		borderRadius: "10px 10px 10px 10px",
		minHeight: "auto!important",
	},
	accordionContentGutters: {
		margin: "12px 0px!important",
	},
	accordionSubtitle: {
		color: (props) => colors[props.subtitleColor] || props.subtitleColor,
		backgroundColor: (props) => colors[props.subtitleBackground] || props.subtitleBackground,
		borderRadius: "10px 10px 10px 10px",
		padding: "8px 40px 8px 16px",
	},
	accordionMain: {
		backgroundColor: "transparent",
		color: "white",
		padding: "8px 40px 16px 16px",
	},
}));

const Accordion = ({
	title,
	titleColor = "white",
	titleBackground = "secondary",
	subtitle,
	subtitleColor = "white",
	subtitleBackground = "third",
	expandIconColor = "primary",
	content,
	alwaysExpanded = false,
}) => {
	const classes = useStyles({ titleColor, titleBackground, subtitleColor, subtitleBackground });
	return (
		<MUIAccordion
			classes={{
				rounded: classes.accordion,
				expanded: classes.accordionExpanded,
			}}
			sx={{ minHeight: "auto" }}
			expanded={alwaysExpanded || undefined}
		>
			<AccordionSummary
				expandIcon={alwaysExpanded ? null : <ExpandMore color={expandIconColor} />}
				classes={{
					root: classes.accordionHeader,
					expanded: classes.accordionHeaderExpanded,
					contentGutters: classes.accordionContentGutters,
				}}
				sx={{ background: "secondary.main", ...(alwaysExpanded && { cursor: "default!important" }) }}
			>
				{typeof title === "string"
					? <Typography>{title}</Typography>
					: title}
			</AccordionSummary>
			{subtitle
			&& (
				<AccordionDetails
					classes={{
						root: classes.accordionSubtitle,
					}}
				>
					{typeof subtitle === "string"
						? <Typography>{subtitle}</Typography>
						: subtitle}
				</AccordionDetails>
			)}
			<AccordionDetails
				classes={{
					root: classes.accordionMain,
				}}
				style={{
					padding: (subtitle) ? "8px 40px 16px 16px" : "0px 0px 16px 0px",
				}}
			>
				{typeof content === "string"
					? <Typography>{content}</Typography>
					: content}
			</AccordionDetails>
		</MUIAccordion>
	);
};

export default memo(Accordion);
