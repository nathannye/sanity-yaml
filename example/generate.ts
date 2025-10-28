import fs from "node:fs";
import { generateFileset } from "../src/generators";
import { registerHelpers, registerPartials } from "../src/utils/handlebars";
import { CONFIG, type GeneratorConfig } from "./config";

const createExampleFiles = (config: GeneratorConfig) => {
	if (!config.filesets) {
		console.error("No filesets found in config");
		return;
	}

	// Create output directories
	const outputDirs = new Set(
		Object.values(config.filesets).map((fileset) => fileset.output),
	);

	outputDirs.forEach((dir) => {
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
			console.log(`📁 Created directory: ${dir}`);
		}
	});

	const filesets = Object.entries(config.filesets).map(([name, fileset]) => {
		const { template, data, output, input } = fileset;
		console.log(`🔄 Processing fileset: ${name}`);
		console.log(`   Input: ${input}`);
		console.log(`   Output: ${output}`);
		console.log(`   Template: ${template}`);
		console.log(`   Data type: ${data}`);

		return generateFileset({ name, input, data, template, output });
	});

	console.log("✅ Generation complete!");
};

// Initialize Handlebars helpers and partials
registerHelpers();
registerPartials("./templates/partials");

// Run the example generation
createExampleFiles(CONFIG);
