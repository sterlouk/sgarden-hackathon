import { Grid, Typography, Link, Divider } from "@mui/material";
import Spinner from "../components/Spinner.js";
import Form from "../components/Form.js";
import AuthLayout, { useAuthLayoutStyles } from "../components/AuthLayout.js";

export const AuthFormWrapper = ({
	isSubmitting,
	formContent,
	validationSchema,
	onSubmit,
	toResetForm = true,
	title,
	subtitle,
	footerLinks = [],
	showDivider = false,
}) => {
	const classes = useAuthLayoutStyles();

	return (
		<>
			<Spinner open={isSubmitting} />
			<AuthLayout title={title} subtitle={subtitle}>
				<Grid item container direction="column" justifyContent="center" alignItems="center">
					<Form content={formContent} validationSchema={validationSchema} toResetForm={toResetForm} onSubmit={onSubmit} />
				</Grid>
				<Grid item container direction="column" justifyContent="center" alignItems="space-between">
					{footerLinks.map((link, idx) => (
						<Grid item key={idx}>
							<Typography variant="h7" color="white.main">
								{link.label}
							</Typography>
							<Typography variant="h7" className={classes.subtitle}>
								<Link color="inherit" underline="none" href={link.href}>
									{link.text}
								</Link>
							</Typography>
						</Grid>
					))}
					{showDivider && (
						<Grid item>
							<Divider style={{ width: "280px", margin: "0px", marginTop: "5px", marginBottom: "5px" }} />
						</Grid>
					)}
				</Grid>
			</AuthLayout>
		</>
	);
};
