import { Grid, Typography, Divider, InputAdornment, ToggleButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { memo, useCallback, useEffect, useState } from "react";

import Accordion from "../components/Accordion.js";
import { SecondaryBackgroundButton, SecondaryBorderButton } from "../components/Buttons.js";
import Popup from "../components/Popup.js";
import Search from "../components/Search.js";
import Spinner from "../components/Spinner.js";
import Form from "../components/Form.js";
import Dropdown from "../components/Dropdown.js";
import { isFuzzyMatch, useSnackbar, dayjs } from "../utils/index.js";
import { getUsersData, inviteUser, removeUser, submitUserRole } from "../api/index.js";
import { jwt } from "../utils/index.js";

const Users = () => {
	const { error, success } = useSnackbar();
	const [isLoading, setIsLoading] = useState(false);
	const [searchFilter, setSearchFilter] = useState("");
	const [users, setUsers] = useState([]);
	const [filteredUsers, setFilteredUsers] = useState(users);
	const [popupOpen, setPopupOpen] = useState(false);
	const [deleteUser, setDeleteUser] = useState({ id: null, username: null });

	const role = jwt.decode().role;

	const fetchData = useCallback(
		async () => {
			setIsLoading(true);

			try {
				const { success: scs, users: usrs } = await getUsersData();
				if (scs) {
					setUsers(usrs);
				} else {
					error();
				}
			} catch {
				error();
			}

			setIsLoading(false);
		},
		[error],
	);

	const submitHandler = async (values) => {
		setIsLoading(true);

		try {
			const { success: successCode, message } = await inviteUser(values.email);

			if (successCode) {
				success(message);
				setPopupOpen(false);
			} else {
				error(message);
			}
		} catch { /* empty */ }

		setIsLoading(false);
	};

	const onDelete = async () => {
		setIsLoading(true);

		const { success: successCode } = await removeUser(deleteUser?.id);
		if (successCode) {
			success("User deleted!");
		} else {
			error();
		}

		setDeleteUser({ id: null, username: null });
		await fetchData();
		setIsLoading(false);
	};

	const submitRole = async (userId, newRole) => {
		setIsLoading(true);
		
		try {
			const { success: successCode } = await submitUserRole(userId, newRole);

			if (successCode) {
				success("Role changed successfully!");
			} else {
				error("Role change failed!");
			}
		} catch { /* empty */ }

		setIsLoading(false);
	};

	useEffect(() => {
		(async () => {
			await fetchData();
		})();
	}, [fetchData]);

	useEffect(() => {
		setFilteredUsers(users.filter((us) => isFuzzyMatch(us.username, searchFilter)
			|| isFuzzyMatch(us.email, searchFilter)
			|| isFuzzyMatch(us.lastActiveAt, searchFilter)
			|| isFuzzyMatch(us.createdAt, searchFilter)));
	}, [searchFilter, users]);

	const formContent = [
		{
			customType: "input",
			id: "email",
			type: "text",
			placeholder: "Email",
			inputProps: {
				endAdornment: (
					<InputAdornment position="start">
						<IconButton disabled>
							<AccountCircle />
						</IconButton>
					</InputAdornment>
				),
			},
		},
		{
			customType: "button",
			id: "submit",
			type: "submit",
			text: "Invite",
		},
	];

	return (
		<>
			<Spinner open={isLoading} />
			<Grid
				container
				display="flex"
				direction="column"
				alignItems="center"
				justifyContent="center"
			>
				<Grid
					container
					item
					width="100%"
					display="flex"
					minHeight="60px"
					borderRadius="10px"
					alignItems="center"
				>
					<Grid
						item
						xs={6}
						display="flex"
						flexDirection="row"
						alignItems="center"
					>
						<Search value={searchFilter} onChange={(event) => setSearchFilter(event.target.value)} />
					</Grid>
					<Grid
						item
						xs={6}
						display="flex"
						flexDirection="row"
						alignItems="center"
						justifyContent="flex-end"
						height="100%"
					>
						<SecondaryBorderButton title="Invite User" onClick={() => setPopupOpen(true)} />
					</Grid>
				</Grid>
				<Grid item mt={2} width="100%">
					<Accordion
						alwaysExpanded
						title={(
							<Grid
								container
								display="flex"
								direction="row"
								alignItems="center"
								justifyContent="center"
							>
								<Grid item xs={12}>
									<Typography>{"Users"}</Typography>
								</Grid>
							</Grid>
						)}
						subtitle={(
							<Grid container display="flex" direction="row" alignItems="center" justifyContent="center" spacing={0}>
								<Grid item xs={3}>
									<Typography>{"Username"}</Typography>
								</Grid>
								<Grid item xs={3} textAlign="center">
									<Typography>{"E-mail"}</Typography>
								</Grid>
								<Grid item xs={2} textAlign="center">
									<Typography>{"Created At"}</Typography>
								</Grid>
								<Grid item xs={2} textAlign="center">
									<Typography>{"Last Active At"}</Typography>
								</Grid>
								<Grid item xs={1} textAlign="center">
									<Typography>{"Role"}</Typography>
								</Grid>
								<Grid item xs={1} />
							</Grid>
						)}
						content={(
							<Grid container width="100%" display="flex" direction="column" alignItems="center" justifyContent="center" spacing={0}>
								{filteredUsers.map((us, ind) => (
									<Grid key={`comp_${ind}`} item flexDirection="column" width="100%">
										{ind !== 0
										&& (
											<Grid key={`divider_${ind}`} item my={1} width="100%">
												<Divider style={{ width: "100%" }} />
											</Grid>
										)}
										<Grid key={`row_${ind}`} container item alignItems="center">
											<Grid item xs={3}>
												<Typography>{us.username}</Typography>
											</Grid>
											<Grid item xs={3} textAlign="center">
												<Typography>{us.email}</Typography>
											</Grid>
											<Grid item xs={2} textAlign="center">
												<Typography>{dayjs(us.createdAt).format("DD/MM/YYYY HH:mm")}</Typography>
											</Grid>
											<Grid item xs={2} textAlign="center">
												<Typography>{dayjs(us.lastActiveAt).format("DD/MM/YYYY HH:mm")}</Typography>
											</Grid>
											<Grid item xs={1} textAlign="center">
												<Dropdown
													items={["user", "admin"].map((role) => ({ value: role, text: role }))}
													value={role}
													onChange={(event) => submitRole(us._id, event.target.value)}
												/>
											</Grid>
											<Grid item xs={1} textAlign="center">
												<ToggleButton
													value="Delete"
													title="Delete"
													size="small"
													aria-label="Delete"
													sx={{ backgroundColor: "error.main" }}
													onClick={() => setDeleteUser({ id: us._id, username: us.username })}
												>
													<DeleteIcon color="white" />
												</ToggleButton>
											</Grid>
										</Grid>
									</Grid>
								))}
							</Grid>
						)}
					/>
				</Grid>
			</Grid>
			<Popup
				width="400px"
				open={popupOpen}
				title="Invite User"
				onClose={() => setPopupOpen(false)}
			>
				<Form content={formContent} validationSchema="inviteUserSchema" onSubmit={submitHandler} />
			</Popup>
			<Dialog
				open={!!deleteUser?.id}
				onClose={() => setDeleteUser({ id: null, username: null })}
			>
				<DialogTitle>
					{"Delete user?"}
				</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{`Are you sure you want to delete the user ${deleteUser?.username}?`}
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<SecondaryBorderButton title="Cancel" onClick={() => setDeleteUser({ id: null, username: null })} />
					<SecondaryBackgroundButton title="Delete" onClick={onDelete} />
				</DialogActions>
			</Dialog>
		</>
	);
};

export default memo(Users);
