import Sentry from "@sentry/node";
import express from "express";
import { restrictHealthEndpoint } from "../middleware/index.js";

const router = express.Router({ mergeParams: true });

router.get("/", restrictHealthEndpoint, (_,res) => {
	try {
		return res.json({ message: "It works!" });
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Something went wrong." });
	}
});
export default router;
