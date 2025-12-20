import express from "express";
import Sentry from "@sentry/node";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, realpathSync } from "fs";
import { join, resolve, relative as pathRelative, sep, normalize } from "path";

const router = express.Router({ mergeParams: true });

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
const baseUploads = resolve("./uploads");
const baseReports = resolve("./reports");
const baseTemplates = resolve("./templates");
const baseData = resolve("./data");
const baseFiles = resolve("./files");
const baseConfig = resolve("./config");

/**
 * Utility to safely resolve a path and prevent traversal.
 * @param {string} baseDir - The trusted root directory.
 * @param {string} userInput - The untrusted path/filename from the user.
 * @returns {string} - The fully resolved safe path.
 */
const getSafePath = (baseDir, userInput) => {
    if (!userInput) throw new Error("Path is required");

    // 1. Normalize and resolve the path
    const resolvedBase = resolve(baseDir);
    const safeInput = normalize(userInput).replace(/^(\.\.(\/|\\|$))+/, '');
    const targetPath = resolve(resolvedBase, safeInput);

    // 2. Prefix validation (must stay within baseDir)
    // We append the separator to prevent 'uploads-secret' from matching 'uploads'
    const rootWithSep = resolvedBase.endsWith(sep) ? resolvedBase : resolvedBase + sep;
    
    if (targetPath !== resolvedBase && !targetPath.startsWith(rootWithSep)) {
        throw new Error("Directory traversal attempt detected");
    }

    // 3. Symlink protection: If path exists, ensure it doesn't point outside
    if (existsSync(targetPath)) {
        const realPath = realpathSync(targetPath);
        if (realPath !== resolvedBase && !realPath.startsWith(rootWithSep)) {
            throw new Error("Symlink traversal attempt detected");
        }
    }

    return targetPath;
};

const generateRandomData = (min = 0, max = 10) => Math.random() * (max - min) + min;

// --- Routes ---

router.get("/", async (_, res) => {
    try {
        const localFoodCropProduction = {
            March: Array.from({ length: 100 }, () => generateRandomData(0, 10)),
            April: Array.from({ length: 100 }, () => generateRandomData(0, 10)),
            May: Array.from({ length: 100 }, () => generateRandomData(0, 10)),
        };

        const comparisonOfIrrigationWaterVsNeeds = {
            March: { etc: generateRandomData(0, 100), irrigation: generateRandomData(0, 100), rainfall: generateRandomData(0, 100) },
            April: { etc: generateRandomData(0, 100), irrigation: generateRandomData(0, 100), rainfall: generateRandomData(0, 100) },
            May: { etc: generateRandomData(0, 100), irrigation: generateRandomData(0, 100), rainfall: generateRandomData(0, 100) },
            June: { etc: generateRandomData(0, 100), irrigation: generateRandomData(0, 100), rainfall: generateRandomData(0, 100) },
            July: { etc: generateRandomData(0, 100), irrigation: generateRandomData(0, 100), rainfall: generateRandomData(0, 100) },
            August: { etc: generateRandomData(0, 100), irrigation: generateRandomData(0, 100), rainfall: generateRandomData(0, 100) },
        };

        return res.json({
            success: true,
            localFoodCropProduction,
            comparisonOfIrrigationWaterVsNeeds,
            timePlot: {
                meteo: Array.from({ length: 20 }, () => generateRandomData(0, 100)),
                inSitu: Array.from({ length: 20 }, () => generateRandomData(0, 100)),
                generated: Array.from({ length: 20 }, () => generateRandomData(0, 100)),
            },
        });
    } catch (error) {
        Sentry.captureException(error);
        return res.status(500).json({ message: "Something went wrong." });
    }
});

router.get("/download-report", (req, res) => {
    try {
        if (!res.locals?.user) return res.status(401).json({ message: "Authentication required" });

        const { reportName } = req.query;
        const reportPath = getSafePath(baseReports, reportName);

        if (existsSync(reportPath) && statSync(reportPath).isFile()) {
            const content = readFileSync(reportPath);
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(reportName)}"`);
            return res.send(content);
        }
        return res.status(404).json({ message: "Report not found" });
    } catch (error) {
        return res.status(400).json({ message: error.message || "Download failed" });
    }
});

router.get("/render-page", (req, res) => {
    try {
        if (!res.locals?.user) return res.status(401).json({ message: "Authentication required" });

        const { template } = req.query;
        const templatePath = getSafePath(baseTemplates, template);

        if (existsSync(templatePath) && statSync(templatePath).isFile()) {
            const templateContent = readFileSync(templatePath, "utf8");
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.send(templateContent);
        }
        return res.status(404).json({ message: "Template not found" });
    } catch (error) {
        return res.status(400).json({ message: "Invalid template path" });
    }
});

router.post("/upload-file", (req, res) => {
    try {
        if (!res.locals?.user) return res.status(401).json({ message: "Authentication required" });

        const { filename, content, destination } = req.body;
        if (!filename || content === undefined) return res.status(400).json({ message: "Filename and content required" });

        // 1. Prevent filenames from having path components
        if (filename.includes("/") || filename.includes("\\")) {
            return res.status(400).json({ message: "Invalid filename" });
        }

        // 2. Calculate safe directory and final path
        const targetDir = getSafePath(baseUploads, destination || ".");
        const uploadPath = getSafePath(targetDir, filename);

        // 3. Size check
        const contentLength = Buffer.byteLength(String(content), 'utf8');
        if (contentLength > MAX_UPLOAD_SIZE) {
            return res.status(413).json({ message: "File too large" });
        }

        mkdirSync(targetDir, { recursive: true });
        writeFileSync(uploadPath, content);
        
        return res.json({ success: true, message: "File uploaded successfully" });
    } catch (error) {
        Sentry.captureException(error);
        return res.status(400).json({ message: error.message || "Upload failed" });
    }
});

router.get("/browse-files", (req, res) => {
    try {
        if (!res.locals?.user) return res.status(401).json({ message: "Authentication required" });

        const { directory } = req.query;
        const dirPath = getSafePath(baseFiles, directory || ".");

        if (existsSync(dirPath) && statSync(dirPath).isDirectory()) {
            const files = readdirSync(dirPath);
            const fileList = files.map(file => {
                const filePath = join(dirPath, file);
                // Secondary check: Ensure readdir didn't somehow escape (rare but good for defense-in-depth)
                if (!resolve(filePath).startsWith(dirPath)) return null;

                const stats = statSync(filePath);
                return {
                    name: file,
                    size: stats.size,
                    isDirectory: stats.isDirectory(),
                    modified: stats.mtime
                };
            }).filter(Boolean);

            return res.json({ success: true, files: fileList });
        }
        return res.status(404).json({ message: "Directory not found" });
    } catch (error) {
        return res.status(400).json({ message: "Invalid directory path" });
    }
});

router.get("/config/load", (req, res) => {
    try {
        if (!res.locals?.user) return res.status(401).json({ message: "Authentication required" });

        const { configFile } = req.query;
        if (!configFile?.endsWith('.json')) return res.status(400).json({ message: "Only JSON allowed" });

        const configPath = getSafePath(baseConfig, configFile);

        if (existsSync(configPath)) {
            const config = readFileSync(configPath, "utf8");
            return res.json({ success: true, config: JSON.parse(config) });
        }
        return res.status(404).json({ message: "Config not found" });
    } catch (error) {
        return res.status(400).json({ message: "Invalid config path" });
    }
});

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
        if (!templateString) return res.status(400).json({ message: "Template required" });

        const report = renderTemplateSafely(templateString, data || {});
        return res.json({ success: true, report, generatedAt: new Date() });
    } catch (error) {
        return res.status(500).json({ message: "Report generation failed" });
    }
});

export default router;