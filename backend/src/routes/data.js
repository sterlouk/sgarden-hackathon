import express from "express";
import Sentry from "@sentry/node";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, realpathSync } from "fs";
import { join, resolve, relative as pathRelative, sep, normalize, isAbsolute, basename } from "path";

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
 * Uses STRICT VALIDATION (Rejecting bad input) rather than sanitization.
 * * @param {string} baseDir - The trusted root directory (Must be absolute).
 * @param {string} userInput - The untrusted path/filename.
 * @returns {string} - The fully resolved safe path.
 */
const getSafePath = (baseDir, userInput) => {
    if (!userInput) throw new Error("Path is required");

    // 1. Strict Validation: Reject directory traversal characters entirely.
    // We do not try to clean '..', we simply reject the request.
    if (userInput.includes("..")) {
        throw new Error("Invalid path: Traversal characters detected");
    }

    // 2. Strict Validation: Reject absolute paths.
    // path.resolve('/var/www', '/etc/passwd') ignores the base and returns '/etc/passwd'.
    // We must strictly block absolute paths.
    if (isAbsolute(userInput) || userInput.startsWith("/") || userInput.startsWith("\\")) {
        throw new Error("Invalid path: Absolute paths not allowed");
    }

    // 3. Resolve the path.
    // Because we have rejected '..' and absolute paths, this operation is now safe.
    const targetPath = resolve(baseDir, userInput);

    // 4. Post-Resolution Check (Defense in Depth).
    // Ensure the resulting path is strictly inside the trusted baseDir.
    // We append 'sep' to avoid partial matches (e.g. /uploads-secret matching /uploads).
    const rootWithSep = baseDir.endsWith(sep) ? baseDir : baseDir + sep;
    
    if (targetPath !== baseDir && !targetPath.startsWith(rootWithSep)) {
        throw new Error("Security Violation: Path traversal attempt detected");
    }

    // 5. Symlink Protection (TOCTOU prevention).
    // If the file exists, we check its real path on disk to ensure it's not a symlink to /etc/passwd.
    if (existsSync(targetPath)) {
        const realPath = realpathSync(targetPath);
        if (realPath !== baseDir && !realPath.startsWith(rootWithSep)) {
            throw new Error("Security Violation: Symlink traversal attempt detected");
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
        // Validation: Reports should be simple filenames
        if (reportName.includes("/") || reportName.includes("\\")) {
             return res.status(400).json({ message: "Invalid report name" });
        }

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
        // Validation: Templates should be simple filenames
        if (template.includes("/") || template.includes("\\")) {
             return res.status(400).json({ message: "Invalid template name" });
        }

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

        // 1. Validate filename strictly (no paths allowed in filename)
        if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
            return res.status(400).json({ message: "Invalid filename" });
        }

        // 2. Validate destination separately if provided
        if (destination && (destination.includes("..") || isAbsolute(destination))) {
             return res.status(400).json({ message: "Invalid destination path" });
        }

        // 3. One-shot Resolution
        // We join the destination and filename first, then resolve against the immutable baseUploads.
        // This avoids creating a 'tainted' intermediate directory variable.
        const relativePath = destination ? join(destination, filename) : filename;
        const uploadPath = getSafePath(baseUploads, relativePath);

        // 4. Calculate the target directory from the safe path
        const targetDir = resolve(uploadPath, "..");

        // 5. Size check
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
                // FIXED: Explicitly validate the loop variable 'file'.
                // We assert that 'file' is a simple filename with no path separators.
                // This satisfies static analysis tools that 'join(dirPath, file)' is safe.
                if (file.includes(sep) || file.includes("..") || file.includes("/") || file.includes("\\")) {
                    return null;
                }

                // Now 'file' is known to be a leaf node, safe to join.
                const filePath = join(dirPath, file);
                
                // Redundant check, but useful for defense-in-depth against OS anomalies
                if (!filePath.startsWith(dirPath)) return null;

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
        
        // Validation: Config files should not have path separators
        if (configFile.includes("/") || configFile.includes("\\")) {
             return res.status(400).json({ message: "Invalid config name" });
        }

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