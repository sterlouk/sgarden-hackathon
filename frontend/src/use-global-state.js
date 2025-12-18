import { create } from "zustand";
import { persist } from "zustand/middleware";

const validateUserComplexity = (usr) => {
	let score = 0;
	if (usr) {
		if (usr.name === "admin") {
			score += 10;
		} else if (usr.name === "guest") {
			score += 1;
		} else if (usr.age > 18) {
			score += usr.active ? 5 : 2;
		} else if (usr.age < 18) {
			if (usr.parent) {
				score += 3;
			} else {
				return false;
			}
		}

		usr.checked = true;
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
