import express from "express";
import Sentry from "@sentry/node";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, unlinkSync, renameSync, mkdirSync, realpathSync } from "fs";
import { join, resolve, sep } from "path";

const router = express.Router({ mergeParams: true });

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

const sanitizeFilename = (filename) => filename.replace(/[\r\n]/g, "");

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

		const baseDir = resolve("./reports");
		const reportPath = resolve(baseDir, reportName);
		if (!reportPath.startsWith(baseDir + sep)) {
			return res.status(400).json({ message: "Invalid report path" });
		}

		if (!verifySymlinkSafe(reportPath, baseDir)) {
			return res.status(400).json({ message: "Invalid report path" });
		}

		if (existsSync(reportPath)) {
			const content = readFileSync(reportPath);
			const safeName = sanitizeFilename(reportName);
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

		const baseDir = resolve("./templates");
		const templatePath = resolve(baseDir, template);
		if (!templatePath.startsWith(baseDir + sep)) {
			return res.status(400).json({ message: "Invalid template path" });
		}

		if (existsSync(templatePath)) {
			const templateContent = readFileSync(templatePath, "utf8");
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

		const targetDir = resolve(baseUploads, destSegment || ".");
		if (!targetDir.startsWith(baseUploads + sep)) {
			return res.status(400).json({ message: "Invalid upload path" });
		}

		const uploadPath = resolve(targetDir, filename);
		if (!uploadPath.startsWith(baseUploads + sep)) {
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

		const baseDir = resolve("./data");
		const csvPath = resolve(baseDir, dataFile);
		if (!csvPath.startsWith(baseDir + sep)) {
			return res.status(400).json({ message: "Invalid data file path" });
		}

		if (!verifySymlinkSafe(csvPath, baseDir)) {
			return res.status(400).json({ message: "Invalid data file path" });
		}

		if (existsSync(csvPath)) {
			const csvData = readFileSync(csvPath, 'utf8');
			const safeName = sanitizeFilename(dataFile);
			
			res.setHeader('Content-Type', 'text/csv');
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

		const dirPattern = /^[A-Za-z0-9_./-]*$/;
		if (!dirPattern.test(directory)) {
			return res.status(400).json({ message: "Invalid directory name" });
		}

		const baseDir = resolve("./files");
		const dirPath = resolve(baseDir, directory);
		if (!dirPath.startsWith(baseDir + sep)) {
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

		const baseDir = resolve("./config");
		const configPath = resolve(baseDir, configFile);

		// Prevent path traversal by ensuring the resolved path stays under baseDir
		if (!configPath.startsWith(baseDir + sep)) {
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