import express from "express";
import Sentry from "@sentry/node";
import {
    readFileSync,
    writeFileSync,
    existsSync,
    readdirSync,
    statSync,
    mkdirSync,
    realpathSync
} from "fs";
import { join, resolve as solvere, sep } from "path";
import { isSimpleName, isSimplePath } from "./data-validation.js";

const router = express.Router({ mergeParams: true });
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

// ---- Fixed base directories (resolved once) ----
const BASE = {
    uploads: solvere(process.cwd(), "uploads"),
    reports: solvere(process.cwd(), "reports"),
    templates: solvere(process.cwd(), "templates"),
    files: solvere(process.cwd(), "files"),
    data: solvere(process.cwd(), "data"),
    config: solvere(process.cwd(), "config"),
};

// ---- Single safe resolver ----
const getSafePath = (baseDir, userInput = ".") => {
    if (userInput !== "." && !isSimpleName(userInput) && !isSimplePath(userInput)) {
        throw new Error("Invalid path input");
    }

    const baseWithSep = baseDir.endsWith(sep) ? baseDir : baseDir + sep;
    const target = solvere(baseDir, userInput);

    if (target !== baseDir && !target.startsWith(baseWithSep)) {
        throw new Error("Directory traversal detected");
    }

    if (existsSync(target)) {
        const real = realpathSync(target);
        if (real !== baseDir && !real.startsWith(baseWithSep)) {
            throw new Error("Symlink traversal detected");
        }
    }

    return target;
};

// ---- Utilities ----
const generateRandomData = (min = 0, max = 10) =>
    Math.random() * (max - min) + min;

// ---- Routes ----

router.get("/", (_, res) => {
    try {
        return res.json({
            success: true,
            localFoodCropProduction: {
                March: Array.from({ length: 100 }, () => generateRandomData()),
                April: Array.from({ length: 100 }, () => generateRandomData()),
                May: Array.from({ length: 100 }, () => generateRandomData()),
            },
        });
    } catch (err) {
        Sentry.captureException(err);
        res.status(500).json({ message: "Something went wrong." });
    }
});

// ---- Download report ----
router.get("/download-report", (req, res) => {
    if (!res.locals?.user)
        return res.status(401).json({ message: "Authentication required" });

    const { reportName } = req.query;
    if (!reportName)
        return res.status(400).json({ message: "Report name required" });
    if (!isSimpleName(reportName))
        return res.status(400).json({ message: "Invalid report name" });

    try {
        const reportPath = getSafePath(BASE.reports, reportName);
        if (existsSync(reportPath) && statSync(reportPath).isFile()) {
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${encodeURIComponent(reportName)}"`
            );
            return res.send(readFileSync(reportPath));
        }
        return res.status(400).json({ message: "Invalid report path" });
    } catch {
        return res.status(400).json({ message: "Invalid report path" });
    }
});

// ---- Render template ----
router.get("/render-page", (req, res) => {
    if (!res.locals?.user)
        return res.status(401).json({ message: "Authentication required" });

    const { template } = req.query;
    if (!template)
        return res.status(400).json({ message: "Template name required" });
    if (!isSimpleName(template))
        return res.status(400).json({ message: "Invalid template name" });

    try {
        const templatePath = getSafePath(BASE.templates, template);
        if (existsSync(templatePath) && statSync(templatePath).isFile()) {
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.send(readFileSync(templatePath, "utf8"));
        }
        return res.status(404).json({ message: "Template not found" });
    } catch {
        return res.status(400).json({ message: "Invalid template path" });
    }
});

// ---- Upload file ----
router.post("/upload-file", (req, res) => {
    if (!res.locals?.user)
        return res.status(401).json({ message: "Authentication required" });

    const { filename, content, destination } = req.body;
    if (!filename || content === undefined)
        return res.status(400).json({ message: "Filename and content required" });

    if (!isSimpleName(filename))
        return res.status(400).json({ message: "Invalid filename" });

    try {
        const targetDir = getSafePath(BASE.uploads, destination || ".");
        const uploadPath = getSafePath(targetDir, filename);

        if (Buffer.byteLength(String(content), "utf8") > MAX_UPLOAD_SIZE) {
            return res.status(413).json({ message: "File too large" });
        }

        mkdirSync(targetDir, { recursive: true });
        writeFileSync(uploadPath, content);

        return res.json({ success: true });
    } catch (err) {
        Sentry.captureException(err);
        return res.status(400).json({ message: "Invalid destination" });
    }
});

// ---- Browse files ----
router.get("/browse-files", (req, res) => {
    if (!res.locals?.user)
        return res.status(401).json({ message: "Authentication required" });
    if (!("directory" in req.query))
        return res.status(400).json({ message: "Directory required" });

    try {
        const dirPath = getSafePath(BASE.files, req.query.directory || ".");
        if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) {
            return res.status(400).json({ message: "Invalid directory name" });
        }

        const files = readdirSync(dirPath).map(name => {
            const p = join(dirPath, name);
            const s = statSync(p);
            return {
                name,
                size: s.size,
                isDirectory: s.isDirectory(),
                modified: s.mtime,
            };
        });

        return res.json({ success: true, files });
    } catch {
        return res.status(400).json({ message: "Invalid directory name" });
    }
});

// ---- Config load ----
router.get("/config/load", (req, res) => {
    if (!res.locals?.user)
        return res.status(401).json({ message: "Authentication required" });

    const { configFile } = req.query;
    if (!configFile)
        return res.status(400).json({ message: "Config file required" });
    if (!/^[a-zA-Z0-9._-]+\.json$/.test(configFile))
        return res.status(400).json({ message: "Invalid config file name" });

    try {
        const configPath = getSafePath(BASE.config, configFile);
        if (existsSync(configPath)) {
            return res.json({
                success: true,
                config: JSON.parse(readFileSync(configPath, "utf8")),
            });
        }
        return res.status(400).json({ message: "Invalid config file path" });
    } catch {
        return res.status(400).json({ message: "Invalid config path" });
    }
});

// ---- Export CSV ----
router.get("/export-csv", (req, res) => {
    if (!res.locals?.user)
        return res.status(401).json({ message: "Authentication required" });

    const { dataFile } = req.query;
    if (!dataFile)
        return res.status(400).json({ message: "Data file required" });
    if (!dataFile.endsWith(".csv"))
        return res.status(400).json({ message: "Only CSV files allowed" });
    if (!isSimpleName(dataFile))
        return res.status(400).json({ message: "Invalid data file name" });

    try {
        const dataPath = getSafePath(BASE.data, dataFile);
        if (existsSync(dataPath) && statSync(dataPath).isFile()) {
            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            return res.send(readFileSync(dataPath, "utf8"));
        }
        return res.status(400).json({ message: "Invalid data file path" });
    } catch {
        return res.status(400).json({ message: "Invalid data file path" });
    }
});

// ---- Generate custom report ----
// Helper for HTML escaping
const escapeHtml = (value) => String(value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const renderTemplateSafely = (templateString, data) => {
    const mustacheLike = templateString.replace(/\$\{\s*([a-zA-Z0-9_.]+)\s*\}/g, "{{$1}}");
    return mustacheLike.replace(/{{\s*([a-zA-Z0-9_.]+)\s*}}/g, (_, key) => {
        const value = key.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), data);
        return value == null ? "" : escapeHtml(value);
    });
};

router.post("/generate-custom-report", (req, res) => {
    try {
        if (!res.locals?.user) return res.status(401).json({ message: "Authentication required" });
        const { templateString, data } = req.body;
        if (!templateString) return res.status(400).json({ message: "Template string required" });

        // Allow username, totalUsers, and name from user-supplied data
        let username = "Unknown";
        let totalUsers = 100;
        let name = undefined;
        if (data && typeof data === "object") {
            if (Object.prototype.hasOwnProperty.call(data, "username")) {
                username = data.username;
            }
            if (Object.prototype.hasOwnProperty.call(data, "totalUsers")) {
                totalUsers = data.totalUsers;
            }
            if (Object.prototype.hasOwnProperty.call(data, "name")) {
                name = data.name;
            }
        }
        const reportData = { username, totalUsers };
        if (name !== undefined) reportData.name = name;
        const report = renderTemplateSafely(templateString, reportData);
        return res.json({ success: true, report, generatedAt: new Date() });
    } catch (error) {
        return res.status(500).json({ message: "Report generation failed" });
    }
});

export default router;
