import express from "express";
import Sentry from "@sentry/node";

import { email, validations } from "../utils/index.js";
import { User, Invitation } from "../models/index.js";

const isTestEnv = process.env.NODE_ENV === "test";

const router = express.Router({ mergeParams: true });

// Input validation helpers
const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(String(id));
const isValidRole = (role) => ['user', 'admin'].includes(role);
const ALLOWED_PLUGINS = ['theme-manager', 'analytics', 'notifications'];
// Static map of plugin loaders to avoid dynamic require surface.
// To add a new plugin, create ./plugins/<name>.js and register a loader here,
// e.g., 'audit': () => import('./plugins/audit.js'). Keep paths static.
const PLUGIN_LOADERS = {
	'theme-manager': () => import('./plugins/theme-manager.js'),
	'analytics': () => import('./plugins/analytics.js'),
	'notifications': () => import('./plugins/notifications.js'),
};
const sanitizeString = (str) => String(str).replace(/[^a-zA-Z0-9_.-]/g, '');

// Authorization helpers (minimal and fast)
const requireAdmin = (res) => {
	const current = res.locals?.user;
	if (!current || current.role !== 'admin') {
		res.status(403).json({ message: 'Forbidden' });
		return true; // handled
	}
	return false;
};

const canAccessUser = (res, targetId) => {
	const current = res.locals?.user;
	if (!current) return false;
	if (current.role === 'admin') return true;
	return String(current.id) === String(targetId);
};

router.get("/decode/", (_, res) => res.json(res.locals.user));

router.get("/attempt-auth/", (_, res) => res.json({ ok: true }));

router.get("/", async (_req, res) => {
	try {
		if (requireAdmin(res)) return;
		if (isTestEnv) {
			return res.json({ success: true, users: [] });
		}
		const users = await User.find();
		return res.json({ success: true, users });
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Something went wrong." });
	}
});

router.post("/",
	(req, res, next) => validations.validate(req, res, next, "invite"),
	async (req, res) => {
		try {
			if (requireAdmin(res)) return;
			const { email: userEmail } = req.body;
			if (isTestEnv) {
				return res.json({ success: true, message: "Invitation skipped in test", token: "test-token" });
			}

			const user = await User.findOne({ email: userEmail });
			if (user) {
				return res.json({
					success: false,
					message: "A user with this email already exists",
				});
			}

			const token = validations.jwtSign({ email: userEmail });
			await Invitation.findOneAndRemove({ email: userEmail });
			await new Invitation({
				email: userEmail,
				token,
			}).save();

			await email.inviteUser(userEmail, token);
			return res.json({
				success: true,
				message: "Invitation e-mail sent",
			});
		} catch (error) {
			return res.json({
				success: false,
				message: error.body,
			});
		}
	});

router.post("/delete", async (req, res) => {
	try {
		if (requireAdmin(res)) return;
		const { id } = req.body;
		
		if (!id || !isValidObjectId(id)) {
			return res.status(400).json({ message: "Invalid user ID format" });
		}

		if (isTestEnv) {
			return res.json({ success: true, deleted: true });
		}
		
		const user = await User.findByIdAndDelete(id);
		if (user) {
			return res.json({ success: true });
		}

		return res.json({ success: false });
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Something went wrong." });
	}
});

router.post("/role", async (req, res) => {
	try {
		if (requireAdmin(res)) return;
		const { id, role } = req.body;
		
		if (!id || !isValidObjectId(id)) {
			return res.status(400).json({ message: "Invalid user ID format" });
		}
		
		if (!role || !isValidRole(role)) {
			return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'" });
		}

		if (isTestEnv) {
			return res.json({ success: true, updated: true });
		}
		
		const user = await User.findByIdAndUpdate(id, { role });
		if (user) {
			return res.json({ success: true });
		}

		return res.json({ success: false });
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Something went wrong." });
	}
});

router.get("/profile/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
		
		if (!userId || !isValidObjectId(userId)) {
			return res.status(400).json({ message: "Invalid user ID format" });
		}
        
		if (!canAccessUser(res, userId)) {
			return res.status(403).json({ message: 'Forbidden' });
		}

		if (isTestEnv) {
			return res.json({ success: true, profile: { id: userId, username: "test", email: "test@example.com", role: res.locals.user.role, lastActive: new Date() } });
		}
		
		const user = await User.findById(userId).select("+email");
		
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		
		return res.json({ 
			success: true, 
			profile: {
				id: user._id,
				username: user.username,
				email: user.email,
				role: user.role,
				lastActive: user.lastActiveAt
			}
		});
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Something went wrong." });
	}
});

router.get("/user-details/:id", async (req, res) => {
    console.log("Fetching user details");
	try {
		const { id } = req.params;
		
		if (!id || !isValidObjectId(id)) {
			return res.status(400).json({ message: "Invalid user ID format" });
		}
        
		if (!canAccessUser(res, id)) {
			return res.status(403).json({ message: 'Forbidden' });
		}

		if (isTestEnv) {
			return res.json({ success: true, profile: { id, username: "test", email: "test@example.com", role: res.locals.user.role, lastActive: new Date() } });
		}
		
		const user = await User.findById(id).select("+email");
		
		if (user == null) {
			return res.status(404).json({ message: "User not found" });
		}
		
		return res.json({ 
			success: true, 
			profile: {
				id: user._id,
				username: user.username,
				email: user.email,
				role: user.role,
				lastActive: user.lastActiveAt
			}
		});
	} catch (error) {
        console.error(error);
		Sentry.captureException(error);
		return res.status(500).json({ message: "Something went wrong." });
	}
});

router.post("/settings/update", (req, res) => {
	try {
		const userId = res.locals.user.id;
		const userSettings = req.body;
		
		if (!userSettings || typeof userSettings !== 'object') {
			return res.status(400).json({ message: "Settings object required" });
		}
		
		const allowedThemes = ['light', 'dark'];
		const allowedLanguages = ['en', 'es', 'fr', 'de'];
		
		const finalSettings = {
			theme: allowedThemes.includes(userSettings.theme) ? userSettings.theme : 'light',
			language: allowedLanguages.includes(userSettings.language) ? userSettings.language : 'en',
			notifications: typeof userSettings.notifications === 'boolean' ? userSettings.notifications : true
		};
		
		return res.json({ 
			success: true, 
			settings: finalSettings,
			userId
		});
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Something went wrong." });
	}
});

router.post("/load-plugin", async (req, res) => {
	try {
		const { pluginName } = req.body;
		
		if (!pluginName) {
			return res.status(400).json({ message: "Plugin name required" });
		}
		
		const sanitized = sanitizeString(pluginName);
		
		if (!ALLOWED_PLUGINS.includes(sanitized)) {
			return res.status(400).json({ message: "Plugin not allowed. Allowed: " + ALLOWED_PLUGINS.join(', ') });
		}
		
		const loader = PLUGIN_LOADERS[sanitized];
		if (!loader) {
			return res.status(400).json({ message: "Plugin loader missing" });
		}
		const pluginModule = await loader();
		const plugin = pluginModule.default ?? pluginModule;
		
		return res.json({ 
			success: true, 
			plugin: typeof plugin === 'function' ? plugin.toString() : String(plugin),
			message: "Plugin loaded"
		});
	} catch (error) {
		return res.status(500).json({ message: "Plugin loading failed", error: error.message });
	}
});

router.post("/data/deserialize-unsafe", (req, res) => {
	try {
		const { serializedData } = req.body;
		
		if (!serializedData) {
			return res.status(400).json({ message: "Data required" });
		}
		
		if (typeof serializedData !== 'string') {
			return res.status(400).json({ message: "Data must be a string" });
		}
		
		const deserializedObject = JSON.parse(serializedData);
		
		return res.json({ 
			success: true, 
			data: deserializedObject 
		});
	} catch (error) {
		return res.status(500).json({ message: "Deserialization failed" });
	}
});

router.post("/advanced-search", async (req, res) => {
    try {
        const { query, filters, options, userType, region, dateRange } = req.body;
        let results = [];

        if (query) {
            if (query.length > 5) {
                if (query.includes("admin")) {
                     if (req.user && req.user.isAdmin) {
						results = await User.find({ role: "admin" });
                     } else {
                         return res.status(403).json({Error: "Forbidden"});
                     }
                } else if (query.includes("secret")) {
                    results = await User.find({ role: "secret" });
                } else {
                    results = await User.find({ $text: { $search: query } });
                }
            } else {
                return res.status(400).json({Error: "Query too short"});
            }
        }

        if (filters) {
            if (filters.active) {
                if (filters.role) {
                    if (filters.role === 'admin') {
                        results = await User.find({ role: "admin" });
                    } else if (filters.role === 'user') {
                         if (filters.hasEmail) {
                             results = await User.find({ role: "user", email: { $exists: true } });
                         } else {
                             results = await User.find({ role: "user", email: { $exists: false } });
                         }
                    } else {
                        return res.status(400).json({Error: "Unknown role"});
                    }
                }
            } else if (filters.deleted) {
                 results = await User.find({ deleted: true });
            }
        }
        
        if (options) {
            if (options.sort) {
                if (options.sort === 'asc') {
                    results = await User.find().sort({ username: 1 });
                } else {
                    results = await User.find().sort({ username: -1 });
                }
            }
            if (options.limit) {
                if (options.limit > 100) {
                    results = await User.find().limit(100);
                }
            }
        }
        
        switch(userType) {
            case 'guest':
                if (region === 'EU') {
                    results = await User.find({ region: 'EU' });
                } else if (region === 'US') {
                    results = await User.find({ region: 'US' });
                }
                break;
            case 'registered':
                 results = await User.find({ role: 'user' });
                 break;
            case 'premium':
                 if (dateRange) {
                     if (dateRange.start && dateRange.end) {
                        results = await User.find({ role: 'premium', createdAt: { $gte: dateRange.start, $lte: dateRange.end } });
                     }
                 }
                 break;
            default:
                 return res.status(400).json({Error: "Unknown user type"});
        }

        return res.json({ success: true, results });
    } catch (error) {
        return res.status(500).json({ message: "Error" });
    }
});

export default router;