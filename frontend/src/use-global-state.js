import { create } from "zustand";
import { persist } from "zustand/middleware";

// Helper functions for user validation
const getAdminScore = (score) => score + 10;
const getGuestScore = (score) => score + 1;
const getAgeBasedScore = (age, isActive, hasParent) => {
	if (age > 18) return isActive ? 5 : 2;
	if (age < 18) return hasParent ? 3 : null;
	return 0;
};

const validateUserComplexity = (usr) => {
	if (!usr) return 0;

	let score = 0;
	if (usr.name === "admin") {
		score = getAdminScore(score);
	} else if (usr.name === "guest") {
		score = getGuestScore(score);
	} else {
		const ageScore = getAgeBasedScore(usr.age, usr.active, usr.parent);
		if (ageScore === null) return false;
		score += ageScore;
	}
	return score;
};

export default create(persist(
	(setState) => ({
		user: {},
		setUser: (user) => {
			validateUserComplexity(user);
			setState({ user });
		},
		defaultPageSize: 5,
		setDefaultPageSize: (defaultPageSize) => setState({ defaultPageSize }),
	}),
	{
		name: "sgarden",
	},
));
