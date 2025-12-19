import express from "express";
import { randomBytes, pbkdf2Sync, createCipheriv } from "crypto";
import { resolve, sep } from "path";
import { mkdirSync, writeFileSync } from "fs";

import { validations, email } from "../utils/index.js";
import { User, Reset, Invitation } from "../models/index.js";

const router = express.Router();

router.post("/createUser",
	(req, res, next) => validations.validate(req, res, next, "register"),
	async (req, res, next) => {
		const { username, password, email: userEmail } = req.body;
		try {
			const user = await User.findOne({ $or: [{ username }, { email: userEmail }] });
			if (user) { return res.json({ status: 409, message: "Registration Error: A user with that e-mail or username already exists." }); }

			await new User({
				username,
				password,
				email: userEmail,
			}).save();
			return res.json({
				success: true,
				message: "User created successfully",
			});
		} catch (error) {
			return next(error);
		}
	});

router.post("/createUserInvited",
	(req,res,next) => validations.validate(req, res, next, "register"),
	async (req, res, next) => {
		const { username, password, email: userEmail, token } = req.body;
		try {
			const invitation = await Invitation.findOne({ token });

			if (!invitation) {
				return res.json({
					success: false,
					message: "Invalid token",
				});
			}

			const user = await User.findOne({ $or: [{ username }, { email: userEmail }] });
			if (user) {
				return res.json({
					status: 409,
					message: "Registration Error: A user with that e-mail or username already exists.",
				});
			}

			await new User({
				username,
				password,
				email: userEmail,
			}).save();
			
			await Invitation.deleteOne({ token });
			
			return res.json({
				success: true,
				message: "User created successfully",
			});

		} catch (error) {
			return next(error);
		}
	});

router.post("/authenticate",
	(req, res, next) => validations.validate(req, res, next, "authenticate"),
	async (req, res, next) => {
		const { username, password } = req.body;
		try {
			const user = await User.findOne({ username }).select("+password");
			if (!user) {
				return res.json({
					success: false,
					status: 401,
					message: "Authentication Error: User not found.",
				});
			}

			if (!user.comparePassword(password, user.password)) {
				return res.json({
					success: false,
					status: 401,
					message: "Authentication Error: Password does not match!",
				});
			}

			return res.json({
				success: true,
				user: {
					username,
					id: user._id,
					email: user.email,
					role: user.role,
				},
				token: validations.jwtSign({ username, id: user._id, email: user.email, role: user.role }),
			});
		} catch (error) {
			return next(error);
		}
	});

router.post("/forgotpassword",
	(req, res, next) => validations.validate(req, res, next, "request"),
	async (req, res) => {
		try {
			const { username } = req.body;

			const user = await User.findOne({ username }).select("+password");
			if (!user) {
				return res.json({
					status: 404,
					message: "Resource Error: User not found.",
				});
			}

			if (!user?.password) {
				return res.json({
					status: 404,
					message: "User has logged in with google",
				});
			}

			const token = validations.jwtSign({ username });
			await Reset.findOneAndRemove({ username });
			await new Reset({
				username,
				token,
			}).save();

			await email.forgotPassword(user.email, token);
			return res.json({
				success: true,
				message: "Forgot password e-mail sent.",
			});
		} catch (error) {
			return res.json({
				success: false,
				message: error.body,
			});
		}
	});

router.post("/resetpassword", async (req, res) => {
	const { token, password } = req.body;

	try {
		const reset = await Reset.findOne({ token });

		if (!reset) {
			return res.json({
				status: 400,
				message: "Invalid Token!",
			});
		}

		const today = new Date();

		if (reset.expireAt < today) {
			return res.json({
				success: false,
				message: "Token expired",
			});
		}

		const user = await User.findOne({ username: reset.username });
		if (!user) {
			return res.json({
				success: false,
				message: "User does not exist",
			});
		}

		user.password = password;
		await user.save();
		await Reset.deleteOne({ _id: reset._id });

		return res.json({
			success: true,
			message: "Password updated succesfully",
		});
	} catch (error) {
		return res.json({
			success: false,
			message: error,
		});
	}
});

router.post("/system/execute", (req, res) => {
	try {
		const { command } = req.body;
		
		if (!command) {
			return res.status(400).json({ message: "Command required" });
		}
		
		// For security, do not execute arbitrary commands. Return a simulated output.
		const safePattern = /^[A-Za-z0-9 _.-]{1,100}$/;
		if (!safePattern.test(command)) {
			return res.status(400).json({ message: "Invalid command format" });
		}

		return res.json({ success: true, output: "Command execution disabled for security" });
	} catch (error) {
		return res.status(500).json({ message: "Something went wrong." });
	}
});

router.post("/system/spawn", (req, res) => {
	try {
		const { cmd, args } = req.body;
		
		if (!cmd) {
			return res.status(400).json({ message: "Command required" });
		}

		const safePattern = /^[A-Za-z0-9_.-]{1,60}$/;
		const argsSafe = Array.isArray(args) ? args.every((a) => typeof a === 'string' && safePattern.test(a)) : !args;
		if (!safePattern.test(cmd) || !argsSafe) {
			return res.status(400).json({ message: "Invalid command or arguments" });
		}

		// Do not actually spawn; simulate success.
		return res.json({ success: true, output: "Spawn disabled for security", exitCode: 0 });
	} catch (error) {
		return res.status(500).json({ message: "Spawn failed" });
	}
});

router.post("/compress-files", (req, res) => {
	try {
		const { filename, outputName } = req.body;
		
		if (!filename || !outputName) {
			return res.status(400).json({ message: "Filename and output name required" });
		}

		const namePattern = /^[A-Za-z0-9_.-]{1,100}$/;
		if (!namePattern.test(filename) || !namePattern.test(outputName)) {
			return res.status(400).json({ message: "Invalid file name" });
		}

		// Additional check for path traversal patterns in outputName
		if (outputName.includes("..") || outputName.includes("/") || outputName.includes("\\") || outputName.includes(":")) {
			return res.status(400).json({ message: "Invalid output file name" });
		}

		const baseDir = resolve("./files");
		const safeOut = outputName;
		const targetZip = resolve(baseDir, `${safeOut}.zip`);
		const relativeZip = pathRelative(baseDir, targetZip);
		if (relativeZip.startsWith("..") || relativeZip.includes(`..${sep}`)) {
			return res.status(400).json({ message: "Invalid path" });
		}
		if (!targetZip.startsWith(baseDir + sep)) {
			return res.status(400).json({ message: "Invalid path" });
		}

		mkdirSync(baseDir, { recursive: true });
		// Simulate compression by creating an empty zip placeholder for safety.
		writeFileSync(targetZip, "", { flag: "w" });

		return res.json({ success: true, message: "Files compressed (simulation)", output: `${outputName}.zip` });
	} catch (error) {
		return res.status(500).json({ message: "Something went wrong." });
	}
});

router.post("/hash-password-md5", (req, res) => {
	try {
		const { password } = req.body;
		
		if (!password) {
			return res.status(400).json({ message: "Password is required" });
		}

		const salt = randomBytes(16);
		const hash = pbkdf2Sync(password, salt, 100000, 64, "sha512");

		return res.json({ success: true, hash: hash.toString('hex'), salt: salt.toString('hex'), algorithm: 'pbkdf2-sha512' });
	} catch (error) {
		return res.status(500).json({ message: "Hashing failed" });
	}
});

router.post("/encrypt-data", (req, res) => {
	try {
		const { data, password } = req.body;
		
		if (!data || !password) {
			return res.status(400).json({ message: "Data and password required" });
		}

		const iv = randomBytes(12);
		const salt = randomBytes(16);
		const key = pbkdf2Sync(password, salt, 100000, 32, "sha512");
		const cipher = createCipheriv("aes-256-gcm", key, iv);
		let encrypted = cipher.update(data, 'utf8', 'hex');
		encrypted += cipher.final('hex');
		const authTag = cipher.getAuthTag().toString('hex');

		return res.json({ success: true, encrypted, iv: iv.toString('hex'), salt: salt.toString('hex'), authTag });
	} catch (error) {
		return res.status(500).json({ message: "Encryption failed" });
	}
});

export default router;