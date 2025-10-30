import fs from "node:fs/promises";
import path from "node:path";
import Handlebars from "handlebars";
import { resolveFrom } from "./paths";

export const renderTemplate = async (args: {
	template: string;
	data: any;
	outputPath: string;
}) => {
	// Resolve template path
	const templatePath = resolveFrom(args.template);

	// Read and compile the template
	const templateContent = await fs.readFile(templatePath, "utf8");
	const compiledTemplate = Handlebars.compile(templateContent);

	// Render the template with data
	const renderedContent = compiledTemplate(args.data);

	// Ensure the output directory exists
	const outputDir = path.dirname(args.outputPath);
	await fs.mkdir(outputDir, { recursive: true });

	// Write the output file
	await fs.writeFile(args.outputPath, renderedContent, "utf8");
};

export const updateFile = async (
	filepath: string,
	regex?: string,
	content?: string,
) => {
	// If no content provided, just return (nothing to add)
	if (!content) {
		return;
	}

	// Resolve the file path
	const resolvedPath = resolveFrom(filepath);

	// Read existing file content or create empty if it doesn't exist
	let fileContent = "";
	try {
		fileContent = await fs.readFile(resolvedPath, "utf8");
	} catch {
		// File doesn't exist yet, will create it
	}

	// If regex is provided, replace the matched content
	if (regex) {
		const regexPattern = new RegExp(regex);
		if (regexPattern.test(fileContent)) {
			fileContent = fileContent.replace(regexPattern, content);
		} else {
			// If regex doesn't match, log a warning and append
			console.warn(
				`Regex pattern did not match in ${filepath}, appending content instead`,
			);
			fileContent += content;
		}
	} else {
		// No regex, just append the content
		fileContent += content;
	}

	// Ensure the directory exists
	const outputDir = path.dirname(resolvedPath);
	await fs.mkdir(outputDir, { recursive: true });

	// Write the updated file
	await fs.writeFile(resolvedPath, fileContent, "utf8");
};
