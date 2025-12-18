import express from "express";
import Sentry from "@sentry/node";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, unlinkSync, renameSync } from "fs";
import { join } from "path";

const router = express.Router({ mergeParams: true });

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
		const { reportName } = req.query;
		
		if (!reportName) {
			return res.status(400).json({ message: "Report name required" });
		}
		
		const reportPath = join("./reports", reportName);
		
		if (existsSync(reportPath)) {
			const content = readFileSync(reportPath);
			
			res.setHeader('Content-Disposition', `attachment; filename="${reportName}"`);
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
		const { template } = req.query;
		
		if (!template) {
			return res.status(400).json({ message: "Template name required" });
		}
		
		const templatePath = join("./templates", template);
		
		if (existsSync(templatePath)) {
			const templateContent = readFileSync(templatePath, 'utf8');
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
		const { filename, content, destination } = req.body;
		
		if (!filename || !content) {
			return res.status(400).json({ message: "Filename and content required" });
		}
		
		const uploadPath = join(destination || "./uploads", filename);
		
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
		const { dataFile } = req.query;
		
		if (!dataFile) {
			return res.status(400).json({ message: "Data file required" });
		}
		
		if (!dataFile.endsWith('.csv')) {
			return res.status(400).json({ message: "Only CSV files allowed" });
		}
		
		const csvPath = join("./data", dataFile);
		
		if (existsSync(csvPath)) {
			const csvData = readFileSync(csvPath, 'utf8');
			
			res.setHeader('Content-Type', 'text/csv');
			res.setHeader('Content-Disposition', `attachment; filename="${dataFile}"`);
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
		const { directory } = req.query;
		
		if (!directory) {
			return res.status(400).json({ message: "Directory required" });
		}
		
		const dirPath = join("./files", directory);
		
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
		const { configFile } = req.query;
		
		if (!configFile) {
			return res.status(400).json({ message: "Config file required" });
		}
		
		if (!configFile.endsWith('.json')) {
			return res.status(400).json({ message: "Only JSON config files allowed" });
		}
		
		const configPath = join("./config", configFile);
		
		if (existsSync(configPath)) {
			const config = readFileSync(configPath, 'utf8');
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