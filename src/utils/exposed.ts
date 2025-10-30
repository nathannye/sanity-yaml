import fs from "node:fs/promises";
import path from "node:path";
import Handlebars from "handlebars";
import type { FieldHandlerReturn, TemplateData } from "~/types";
import { resolveFrom } from "./paths";

export const renderTemplate = async (args: {
	template: string;
	data: {
		name: string;
		sanityFields: FieldHandlerReturn[];
		typeDefinition: Record<string, string>;
		[key: string]: unknown;
	};
	outputPath: string;
}) => {
	// Resolve template path
	const templatePath = resolveFrom(args.template);

	// Check if template file exists
	try {
		await fs.access(templatePath);
	} catch {
		throw new Error(
			`Template file not found: ${args.template} (resolved to: ${templatePath})`,
		);
	}

	// Read and compile the template
	const templateContent = await fs.readFile(templatePath, "utf8");
	const compiledTemplate = Handlebars.compile(templateContent);

	// Render the template with data
	const renderedContent = compiledTemplate(args.data);

	// Validate output path
	if (!args.outputPath || args.outputPath.trim() === "") {
		throw new Error(`Invalid output path: ${args.outputPath}`);
	}

	// Ensure the output directory exists
	const outputDir = path.dirname(args.outputPath);
	try {
		await fs.mkdir(outputDir, { recursive: true });
	} catch (error) {
		throw new Error(
			`Invalid output path: ${args.outputPath} - ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	// Write the output file
	await fs.writeFile(args.outputPath, renderedContent, "utf8");
};

export const modifyFile = async (args: {
	template: string;
	data: TemplateData;
	targetFile: string;
	regex?: string;
}) => {
	// Resolve template path
	const templatePath = resolveFrom(args.template);

	// Check if template file exists
	try {
		await fs.access(templatePath);
	} catch {
		throw new Error(
			`Template file not found: ${args.template} (resolved to: ${templatePath})`,
		);
	}

	// Read and compile the template
	const templateContent = await fs.readFile(templatePath, "utf8");
	const compiledTemplate = Handlebars.compile(templateContent);

	// Render the template with data
	const renderedContent = compiledTemplate(args.data);

	// Resolve the target file path
	const resolvedPath = resolveFrom(args.targetFile);

	// Check if target file exists
	try {
		await fs.access(resolvedPath);
	} catch {
		throw new Error(
			`Target file not found: ${args.targetFile} (resolved to: ${resolvedPath})`,
		);
	}

	// Read existing file content
	const fileContent = await fs.readFile(resolvedPath, "utf8");

	// Validate and create regex if provided
	let regexPattern: RegExp | undefined;
	if (args.regex) {
		try {
			regexPattern = new RegExp(args.regex);
		} catch (error) {
			throw new Error(
				`Invalid regex pattern: ${args.regex} - ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	// If regex is provided, replace the matched content
	let updatedContent: string;
	if (regexPattern) {
		if (regexPattern.test(fileContent)) {
			updatedContent = fileContent.replace(regexPattern, renderedContent);
		} else {
			// If regex doesn't match, log a warning and append
			console.warn(
				`Regex pattern did not match in ${args.targetFile}, appending content instead`,
			);
			updatedContent = fileContent + renderedContent;
		}
	} else {
		// No regex, just append the content at the end
		updatedContent = fileContent + renderedContent;
	}

	// Ensure the directory exists
	const outputDir = path.dirname(resolvedPath);
	await fs.mkdir(outputDir, { recursive: true });

	// Write the updated file
	await fs.writeFile(resolvedPath, updatedContent, "utf8");
};
