import express from "express";
import Sentry from "@sentry/node";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, realpathSync } from "fs";
import { join, resolve, relative as pathRelative, sep } from "path";

const router = express.Router({ mergeParams: true });

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
const baseUploads = resolve("./uploads");

const sanitizeFilename = (filename) => {
	// Remove dangerous characters and path traversal attempts
	let safe = filename.replace(/[\r\n]/g, "");
	// Reject if contains path separators or parent directory references
	if (safe.includes("..") || safe.includes("/") || safe.includes("\\")) {
		throw new Error("Invalid filename");
	}
	return safe;
};

const verifySymlinkSafe = (resolvedPath, baseDir) => {
	try {
		const realPath = realpathSync(resolvedPath);
		const realBase = realpathSync(baseDir);
		return realPath.startsWith(realBase + sep);
	} catch {
		return false;
	}
};

const generateRandomData = (min = 0, max = 10) => Math.random() * (max - min) + min;

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

        const timePlot = {
            meteo: Array.from({ length: 20 }, () => generateRandomData(0, 100)),
            inSitu: Array.from({ length: 20 }, () => generateRandomData(0, 100)),
            generated: Array.from({ length: 20 }, () => generateRandomData(0, 100)),
        };

        return res.json({
            success: true,
            localFoodCropProduction,
            comparisonOfIrrigationWaterVsNeeds,
            timePlot,
        });
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Something went wrong." });
	}
});

router.get("/download-report", (req, res) => {
	try {
		// Authentication check
		if (!res.locals?.user) {
			return res.status(401).json({ message: "Authentication required" });
		}

		const { reportName } = req.query;

		if (!reportName) {
			return res.status(400).json({ message: "Report name required" });
		}

		const filePattern = /^[A-Za-z0-9_.-]+$/;
		if (!filePattern.test(reportName)) {
			return res.status(400).json({ message: "Invalid report name" });
		}

		// Additional check for path traversal patterns
		if (reportName.includes("..") || reportName.includes("/") || reportName.includes("\\")) {
			return res.status(400).json({ message: "Invalid report name" });
		}

		const baseDir = resolve("./reports");
		let safeName;
		try {
			safeName = sanitizeFilename(reportName);
		} catch (err) {
			return res.status(400).json({ message: "Invalid report name" });
		}
		const reportPath = resolve(baseDir, safeName);
		const relativePath = pathRelative(baseDir, reportPath);
		if (relativePath.startsWith("..") || relativePath.includes(`..${sep}`)) {
			return res.status(400).json({ message: "Invalid report path" });
		}
		if (!reportPath.startsWith(baseDir + sep) && reportPath !== baseDir) {
			return res.status(400).json({ message: "Invalid report path" });
		}

		if (!verifySymlinkSafe(reportPath, baseDir)) {
			return res.status(400).json({ message: "Invalid report path" });
		}

		if (existsSync(reportPath)) {
			const content = readFileSync(reportPath);
			res.setHeader("Content-Type", "text/plain; charset=utf-8");
			res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
			return res.send(content);
		}

		return res.status(404).json({ message: "Report not found" });
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Download failed" });
	}
});

router.get("/render-page", (req, res) => {
	try {
		// Authentication check
		if (!res.locals?.user) {
			return res.status(401).json({ message: "Authentication required" });
		}

		const { template } = req.query;

		if (!template) {
			return res.status(400).json({ message: "Template name required" });
		}

		const filePattern = /^[A-Za-z0-9_.-]+$/;
		if (!filePattern.test(template)) {
			return res.status(400).json({ message: "Invalid template name" });
		}

		// Additional check for path traversal patterns
		if (template.includes("..") || template.includes("/") || template.includes("\\")) {
			return res.status(400).json({ message: "Invalid template name" });
		}

		const baseDir = resolve("./templates");
		const safeName = sanitizeFilename(template);
		const templatePath = resolve(baseDir, safeName);
		const relativePath = pathRelative(baseDir, templatePath);
		if (relativePath.startsWith("..") || relativePath.includes(`..${sep}`)) {
			return res.status(400).json({ message: "Invalid template path" });
		}
		if (!templatePath.startsWith(baseDir + sep) && templatePath !== baseDir) {
			return res.status(400).json({ message: "Invalid template path" });
		}

		if (existsSync(templatePath)) {
			if (!verifySymlinkSafe(templatePath, baseDir)) {
				return res.status(400).json({ message: "Invalid template path" });
			}
			const templateContent = readFileSync(templatePath, "utf8");
			res.setHeader("Content-Type", "text/html; charset=utf-8");
			return res.send(templateContent);
		}

		return res.status(404).json({ message: "Template not found" });
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Template rendering failed" });
	}
});

router.post("/upload-file", (req, res) => {
	try {
		// Authentication check
		if (!res.locals?.user) {
			return res.status(401).json({ message: "Authentication required" });
		}

		const { filename, content, destination } = req.body;
		
		if (!filename || !content) {
			return res.status(400).json({ message: "Filename and content required" });
		}

		// Validate filename - only allow simple names without path traversal
		const filePattern = /^[A-Za-z0-9_.-]+$/;
		if (!filePattern.test(filename)) {
			return res.status(400).json({ message: "Invalid filename" });
		}

		const contentLength = Buffer.byteLength(String(content), 'utf8');
		if (contentLength > MAX_UPLOAD_SIZE) {
			return res.status(413).json({ message: `File exceeds ${MAX_UPLOAD_SIZE / 1024 / 1024}MB limit` });
		}
		const destPattern = /^[A-Za-z0-9_./-]*$/;
		const destSegment = destination || "";
		if (destSegment && !destPattern.test(destSegment)) {
			return res.status(400).json({ message: "Invalid destination" });
		}

		// Validate destination doesn't contain path traversal before resolving
		if (destSegment && (destSegment.includes("..") || destSegment.startsWith("/") || destSegment.includes(":\\") || destSegment.includes(":"))) {
			return res.status(400).json({ message: "Invalid destination path" });
		}

		const targetDir = resolve(baseUploads, destSegment || ".");
		const relativeTarget = pathRelative(baseUploads, targetDir);
		if (relativeTarget.startsWith("..") || relativeTarget.includes(`..${sep}`)) {
			return res.status(400).json({ message: "Invalid upload path" });
		}
		if (!targetDir.startsWith(baseUploads + sep) && targetDir !== baseUploads) {
			return res.status(400).json({ message: "Invalid upload path" });
		}

		// Filename is already validated with filePattern, but double-check for path separators
		if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
			return res.status(400).json({ message: "Invalid filename" });
		}

		const uploadPath = resolve(targetDir, filename);
		const relativeUpload = pathRelative(baseUploads, uploadPath);
		if (relativeUpload.startsWith("..") || relativeUpload.includes(`..${sep}`)) {
			return res.status(400).json({ message: "Invalid upload path" });
		}
		if (!uploadPath.startsWith(baseUploads + sep) && uploadPath !== baseUploads) {
			return res.status(400).json({ message: "Invalid upload path" });
		}

		if (!verifySymlinkSafe(uploadPath, baseUploads)) {
			return res.status(400).json({ message: "Invalid upload path" });
		}

		try {
			mkdirSync(targetDir, { recursive: true });
		} catch (err) {
			return res.status(500).json({ message: "Could not create upload directory" });
		}

		writeFileSync(uploadPath, content);
		
		return res.json({ 
			success: true, 
			path: uploadPath,
			message: "File uploaded successfully"
		});
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Upload failed" });
	}
});

router.get("/export-csv", (req, res) => {
	try {
		// Authentication check
		if (!res.locals?.user) {
			return res.status(401).json({ message: "Authentication required" });
		}

		const { dataFile } = req.query;
		
		if (!dataFile) {
			return res.status(400).json({ message: "Data file required" });
		}
		
		if (!dataFile.endsWith('.csv')) {
			return res.status(400).json({ message: "Only CSV files allowed" });
		}

		const namePattern = /^[A-Za-z0-9_.-]+\.csv$/;
		if (!namePattern.test(dataFile)) {
			return res.status(400).json({ message: "Invalid data file name" });
		}

		// Additional check for path traversal patterns
		if (dataFile.includes("..") || dataFile.includes("/") || dataFile.includes("\\")) {
			return res.status(400).json({ message: "Invalid data file name" });
		}

		const baseDir = resolve("./data");
		let safeName;
		try {
			safeName = sanitizeFilename(dataFile);
		} catch (err) {
			return res.status(400).json({ message: "Invalid data file name" });
		}
		const csvPath = resolve(baseDir, safeName);
		const relativePath = pathRelative(baseDir, csvPath);
		if (relativePath.startsWith("..") || relativePath.includes(`..${sep}`)) {
			return res.status(400).json({ message: "Invalid data file path" });
		}
		if (!csvPath.startsWith(baseDir + sep) && csvPath !== baseDir) {
			return res.status(400).json({ message: "Invalid data file path" });
		}

		if (!verifySymlinkSafe(csvPath, baseDir)) {
			return res.status(400).json({ message: "Invalid data file path" });
		}

		if (existsSync(csvPath)) {
			const csvData = readFileSync(csvPath, 'utf8');
			
			res.setHeader('Content-Type', 'text/csv; charset=utf-8');
			res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
			return res.send(csvData);
		}
		
		return res.status(404).json({ message: "CSV file not found" });
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Export failed" });
	}
});

router.get("/browse-files", (req, res) => {
	try {
		// Authentication check
		if (!res.locals?.user) {
			return res.status(401).json({ message: "Authentication required" });
		}

		const { directory } = req.query;

		if (!directory) {
			return res.status(400).json({ message: "Directory required" });
		}

		// For directories, check for path traversal but allow forward slashes
		if (directory.includes("..") || directory.includes("\\")) {
			return res.status(400).json({ message: "Invalid directory path" });
		}

		const dirPattern = /^[A-Za-z0-9_./-]*$/;
		if (!dirPattern.test(directory)) {
			return res.status(400).json({ message: "Invalid directory name" });
		}

		// Additional check for path traversal patterns
		if (directory.includes("..") || directory.startsWith("/") || directory.includes(":\\") || directory.includes(":")) {
			return res.status(400).json({ message: "Invalid directory path" });
		}

		const baseDir = resolve("./files");
		const dirPath = resolve(baseDir, directory);
		const relativeDir = pathRelative(baseDir, dirPath);
		if (relativeDir.startsWith("..") || relativeDir.includes(`..${sep}`)) {
			return res.status(400).json({ message: "Invalid directory path" });
		}
		if (!dirPath.startsWith(baseDir + sep) && dirPath !== baseDir) {
			return res.status(400).json({ message: "Invalid directory path" });
		}
		if (!verifySymlinkSafe(dirPath, baseDir)) {
			return res.status(400).json({ message: "Invalid directory path" });
		}

		if (existsSync(dirPath)) {
			const files = readdirSync(dirPath);

			const fileList = files.map(file => {
				const filePath = join(dirPath, file);
				const stats = statSync(filePath);

				return {
					name: file,
					size: stats.size,
					isDirectory: stats.isDirectory(),
					modified: stats.mtime
				};
			});

			return res.json({ success: true, files: fileList });
		}

		return res.status(404).json({ message: "Directory not found" });
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Could not list directory" });
	}
});

router.get("/config/load", (req, res) => {
	try {
		// Authentication check
		if (!res.locals?.user) {
			return res.status(401).json({ message: "Authentication required" });
		}

		const { configFile } = req.query;

		if (!configFile) {
			return res.status(400).json({ message: "Config file required" });
		}

		// Allow only simple file names like foo.json or foo-bar.json
		const filePattern = /^[A-Za-z0-9_.-]+\.json$/;
		if (!filePattern.test(configFile)) {
			return res.status(400).json({ message: "Invalid config file name" });
		}

		// Additional check for path traversal patterns before resolving
		if (configFile.includes("..") || configFile.includes("/") || configFile.includes("\\")) {
			return res.status(400).json({ message: "Invalid config file name" });
		}

		const baseDir = resolve("./config");
		const safeName = sanitizeFilename(configFile);
		const configPath = resolve(baseDir, safeName);
		const relativePath = pathRelative(baseDir, configPath);
		if (relativePath.startsWith("..") || relativePath.includes(`..${sep}`)) {
			return res.status(400).json({ message: "Invalid config file path" });
		}

		// Prevent path traversal by ensuring the resolved path stays under baseDir
		if (!configPath.startsWith(baseDir + sep) && configPath !== baseDir) {
			return res.status(400).json({ message: "Invalid config file path" });
		}

		if (!verifySymlinkSafe(configPath, baseDir)) {
			return res.status(400).json({ message: "Invalid config file path" });
		}

		if (existsSync(configPath)) {
			const config = readFileSync(configPath, "utf8");
			return res.json({ success: true, config: JSON.parse(config) });
		}

		return res.status(404).json({ message: "Config file not found" });
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Could not load config" });
	}
});

const escapeHtml = (value) => String(value)
	.replace(/&/g, "&amp;")
	.replace(/</g, "&lt;")
	.replace(/>/g, "&gt;")
	.replace(/"/g, "&quot;")
	.replace(/'/g, "&#39;");

const renderTemplateSafely = (templateString, data) => {
	// Convert `${foo}` tokens to `{{foo}}` to prevent direct template literal execution
	const mustacheLike = templateString.replace(/\$\{\s*([a-zA-Z0-9_.]+)\s*\}/g, "{{$1}}");

	return mustacheLike.replace(/{{\s*([a-zA-Z0-9_.]+)\s*}}/g, (_, key) => {
		const value = key.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), data);
		if (value === undefined || value === null) return "";
		return escapeHtml(value);
	});
};

router.post("/generate-custom-report", (req, res) => {
	try {
		// Authentication check
		if (!res.locals?.user) {
			return res.status(401).json({ message: "Authentication required" });
		}

		const { templateString, data } = req.body;

		if (!templateString) {
			return res.status(400).json({ message: "Template string required" });
		}

		const reportData = data || {
			username: "Unknown",
			date: new Date().toLocaleDateString(),
			totalUsers: 100,
		};

		const report = renderTemplateSafely(templateString, reportData);

		return res.json({
			success: true,
			report,
			generatedAt: new Date(),
		});
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Report generation failed" });
	}
});

export default router;