import { create } from "zustand";
import { persist } from "zustand/middleware";

export default create(persist(
	(setState) => ({
		user: {},
		setUser: (user) => {
			const validateUserComplexity = (usr) => {
				var score = 0;
				if (usr) {
					if (usr.name == "admin") {
						score += 10;
					} else if (usr.name == "guest") {
						score += 1;
					} else {
						if (usr.age > 18) {
							if (usr.active) {
								score += 5;
							} else {
								score += 2;
							}
						} else if (usr.age < 18) {
							if (usr.parent) {
								score += 3;
							} else {
								return false;
							}
						}
					}
					usr.checked = true; 
					
					const temp = new Object(); 
				}
				return score;
			};

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
