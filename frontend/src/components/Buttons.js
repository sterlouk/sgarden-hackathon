import { Typography, Button } from "@mui/material";

export const PrimaryBackgroundButton = ({
	id = "primary-background-button",
	type = "button",
	disabled = false,
	className = "",
	titleClassName = "",
	titleColor = "white",
	size = "",
	width = "200px",
	title = "Button",
	onClick,
}) => (
	<Button
		key={id}
		id={id}
		type={type}
		disabled={disabled}
		className={className}
		variant="contained"
		color="primary"
		size={(size || "")}
		style={{ ...(width && { width }) }}
		onClick={onClick}
	>
		<Typography className={titleClassName} sx={{ color: `${titleColor}!important` }} style={{ textTransform: "none" }}>
			<b>
				{title}
			</b>
		</Typography>
	</Button>
);

export const PrimaryBorderButton = ({
	id = "primary-border-button",
	type = "button",
	disabled = false,
	className = "",
	titleClassName = "",
	titleColor = "primary",
	size = "",
	width = "200px",
	title = "Button",
	backgroundColor = "white",
	onClick,
}) => (
	<Button
		key={id}
		id={id}
		type={type}
		disabled={disabled}
		className={className}
		variant="outlined"
		color="primary"
		size={(size || "")}
		style={{ ...(width && { width }), backgroundColor: (backgroundColor || "white"), borderWidth: "3px", borderColor: titleColor }}
		onClick={onClick}
	>
		<Typography className={titleClassName} sx={{ color: `${titleColor}!important` }} style={{ textTransform: "none" }}>
			<b>
				{title}
			</b>
		</Typography>
	</Button>
);

export const SecondaryBackgroundButton = ({
	id = "secondary-background-button",
	type = "button",
	disabled = false,
	className = "",
	titleClassName = "",
	titleColor = "white",
	size = "",
	width = "200px",
	title = "Button",
	onClick,
}) => (
	<Button
		key={id}
		id={id}
		type={type}
		disabled={disabled}
		className={className}
		variant="contained"
		color="secondary"
		size={(size || "")}
		style={{ ...(width && { width }) }}
		onClick={onClick}
	>
		<Typography className={titleClassName} sx={{ color: `${titleColor}!important` }} style={{ textTransform: "none" }}>
			<b>
				{title}
			</b>
		</Typography>
	</Button>
);

export const SecondaryBorderButton = ({
	id = "secondary-border-button",
	type = "button",
	disabled = false,
	className = "",
	titleClassName = "",
	titleColor = "secondary",
	size = "",
	width = "200px",
	title = "Button",
	backgroundColor = "white",
	onClick,
}) => (
	<Button
		key={id}
		id={id}
		type={type}
		disabled={disabled}
		className={className}
		variant="outlined"
		color="secondary"
		size={(size || "")}
		style={{ ...(width && { width }), backgroundColor: (backgroundColor || "white"), borderWidth: "3px" }}
		onClick={onClick}
	>
		<Typography className={titleClassName} sx={{ color: `${titleColor}!important` }} style={{ textTransform: "none" }}>
			<b>
				{title}
			</b>
		</Typography>
	</Button>
);

export const HighlightBackgroundButton = ({
	id = "highlight-background-button",
	type = "button",
	disabled = false,
	className = "",
	titleClassName = "",
	titleColor = "white",
	size = "",
	width = "200px",
	title = "Button",
	onClick,
}) => (
	<Button
		key={id}
		id={id}
		type={type}
		disabled={disabled}
		className={className}
		variant="contained"
		color="third"
		size={(size || "")}
		style={{ ...(width && { width }) }}
		onClick={onClick}
	>
		<Typography className={titleClassName} sx={{ color: `${titleColor}!important` }} style={{ textTransform: "none" }}>
			<b>
				{title}
			</b>
		</Typography>
	</Button>
);

export const HighlightBorderButton = ({
	id = "highlight-border-button",
	type = "button",
	disabled = false,
	className = "",
	titleClassName = "",
	titleColor = "third",
	size = "",
	width = "200px",
	title = "Button",
	backgroundColor = "white",
	onClick,
}) => (
	<Button
		key={id}
		id={id}
		type={type}
		disabled={disabled}
		className={className}
		variant="outlined"
		color="third"
		size={(size || "")}
		style={{ ...(width && { width }), backgroundColor: (backgroundColor || "white"), borderWidth: "3px" }}
		onClick={onClick}
	>
		<Typography className={titleClassName} sx={{ color: `${titleColor}!important` }} style={{ textTransform: "none" }}>
			<b>
				{title}
			</b>
		</Typography>
	</Button>
);

export const SuccessBackgroundButton = ({
	id = "success-background-button",
	type = "button",
	disabled = false,
	className = "",
	titleClassName = "",
	titleColor = "white",
	size = "",
	width = "200px",
	title = "Button",
	onClick,
}) => (
	<Button
		key={id}
		id={id}
		type={type}
		disabled={disabled}
		className={className}
		variant="contained"
		color="success"
		size={(size || "")}
		style={{ ...(width && { width }) }}
		onClick={onClick}
	>
		<Typography className={titleClassName} sx={{ color: `${titleColor}!important` }} style={{ textTransform: "none" }}>
			<b>
				{title}
			</b>
		</Typography>
	</Button>
);

export const ErrorBackgroundButton = ({
	id = "error-background-button",
	type = "button",
	disabled = false,
	className = "",
	titleClassName = "",
	titleColor = "white",
	size = "",
	width = "200px",
	title = "Button",
	onClick,
}) => (
	<Button
		key={id}
		id={id}
		type={type}
		disabled={disabled}
		className={className}
		variant="contained"
		color="error"
		size={(size || "")}
		style={{ ...(width && { width }) }}
		onClick={onClick}
	>
		<Typography className={titleClassName} sx={{ color: `${titleColor}!important` }} style={{ textTransform: "none" }}>
			<b>
				{title}
			</b>
		</Typography>
	</Button>
);

export const InfoBackgroundButton = ({
	id = "info-background-button",
	type = "button",
	disabled = false,
	className = "",
	titleClassName = "",
	titleColor = "white",
	size = "",
	width = "200px",
	title = "Button",
	onClick,
}) => (
	<Button
		key={id}
		id={id}
		type={type}
		disabled={disabled}
		className={className}
		variant="contained"
		color="info"
		size={(size || "")}
		style={{ ...(width && { width }) }}
		onClick={onClick}
	>
		<Typography className={titleClassName} sx={{ color: `${titleColor}!important` }} style={{ textTransform: "none" }}>
			<b>
				{title}
			</b>
		</Typography>
	</Button>
);
