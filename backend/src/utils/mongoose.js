import "dotenv/config";

import Sentry from "@sentry/node";
import mongoose from "mongoose";

const init = async () => {
	// Test hooks: allow returning mock connections
	if (process.env.MOCK_MONGO === "success") {
		return { mock: true };
	}
	if (process.env.MOCK_MONGO === "fail") {
		Sentry.captureException(new Error('MOCK_MONGO forced failure'));
		return null;
	}
	const {
		DATABASE_URL = "mongodb://localhost:27017/testDB",
	} = process.env;

	mongoose.set("strictQuery", false);
	const connection = await mongoose.connect(DATABASE_URL).catch((error) => {
		Sentry.captureException(error);
		console.error(error.message);
		return null;
	});
	console.log("Connected to db!");

	return connection;
};

export default init;
