import { Typography, Button } from "@mui/material";

const createButton = ({
	defaultId,
	variant,
	color,
	defaultTitleColor = "white",
	defaultBackgroundColor,
	borderWidth,
	useTitleColorAsBorder = false,
}) => ({
	id = defaultId,
	type = "button",
	disabled = false,
	className = "",
	titleClassName = "",
	titleColor = defaultTitleColor,
	size = "",
	width = "200px",
	title = "Button",
	backgroundColor = defaultBackgroundColor,
	onClick,
}) => (
	<Button
		key={id}
		id={id}
		type={type}
		disabled={disabled}
		className={className}
		variant={variant}
		color={color}
		size={(size || "")}
		style={{
			...(width && { width }),
			...(variant === "outlined"
				? {
					backgroundColor: backgroundColor || "white",
					...(borderWidth ? { borderWidth } : {}),
					...(useTitleColorAsBorder ? { borderColor: titleColor } : {}),
				}
				: {}),
		}}
		onClick={onClick}
	>
		<Typography className={titleClassName} sx={{ color: `${titleColor}!important` }} style={{ textTransform: "none" }}>
			<b>{title}</b>
		</Typography>
	</Button>
);

export const PrimaryBackgroundButton = createButton({
	defaultId: "primary-background-button",
	variant: "contained",
	color: "primary",
	defaultTitleColor: "white",
});

export const PrimaryBorderButton = createButton({
	defaultId: "primary-border-button",
	variant: "outlined",
	color: "primary",
	defaultTitleColor: "primary",
	borderWidth: "3px",
	useTitleColorAsBorder: true,
});

export const SecondaryBackgroundButton = createButton({
	defaultId: "secondary-background-button",
	variant: "contained",
	color: "secondary",
	defaultTitleColor: "white",
});

export const SecondaryBorderButton = createButton({
	defaultId: "secondary-border-button",
	variant: "outlined",
	color: "secondary",
	defaultTitleColor: "secondary",
	borderWidth: "3px",
});

export const HighlightBackgroundButton = createButton({
	defaultId: "highlight-background-button",
	variant: "contained",
	color: "third",
	defaultTitleColor: "white",
});

export const HighlightBorderButton = createButton({
	defaultId: "highlight-border-button",
	variant: "outlined",
	color: "third",
	defaultTitleColor: "third",
	borderWidth: "3px",
});

export const SuccessBackgroundButton = createButton({
	defaultId: "success-background-button",
	variant: "contained",
	color: "success",
	defaultTitleColor: "white",
});

export const ErrorBackgroundButton = createButton({
	defaultId: "error-background-button",
	variant: "contained",
	color: "error",
	defaultTitleColor: "white",
});

export const InfoBackgroundButton = createButton({
	defaultId: "info-background-button",
	variant: "contained",
	color: "info",
	defaultTitleColor: "white",
});
