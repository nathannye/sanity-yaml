import fs from "node:fs/promises";
import path from "node:path";
import Handlebars from "handlebars";
import type { FieldHandlerReturn, TemplateData } from "~/types";
import { resolveFrom } from "./paths";

export const renderTemplate = async (args: {
	templateFile?: string;
	template?: string;
	data: {
		name: string;
		sanityFields: FieldHandlerReturn[];
		typeDefinition: Record<string, string>;
		[key: string]: unknown;
	};
	outputPath: string;
}) => {
	// Validate that exactly one of templateFile or template is provided
	if (!args.templateFile && !args.template) {
		throw new Error(
			`Either 'templateFile' or 'template' must be provided. Use 'templateFile' for a file path (e.g., "./templates/{{name}}.hbs") or 'template' for a direct template string (e.g., "import {{pascalCase name}} from './{{name}}'").`,
		);
	}

	if (args.templateFile && args.template) {
		throw new Error(
			`Cannot provide both 'templateFile' and 'template'. Use 'templateFile' for a file path or 'template' for a direct template string.`,
		);
	}

	let compiledTemplate: HandlebarsTemplateDelegate;

	if (args.templateFile) {
		// Handle templateFile - path to a template file
		// Compile and render template path as a Handlebars template
		const templatePathTemplate = Handlebars.compile(args.templateFile);
		const renderedTemplatePath = templatePathTemplate(args.data);

		// Resolve template path
		const templatePath = resolveFrom(renderedTemplatePath);

		// Check if template file exists
		try {
			await fs.access(templatePath);
		} catch {
			throw new Error(
				`Template file not found: ${renderedTemplatePath} (resolved to: ${templatePath}). If you meant to use a direct template string instead of a file path, use the 'template' parameter instead of 'templateFile'.`,
			);
		}

		// Read and compile the template
		const templateContent = await fs.readFile(templatePath, "utf8");
		compiledTemplate = Handlebars.compile(templateContent);
	} else {
		// Handle template - direct template string
		compiledTemplate = Handlebars.compile(args.template!);
	}

	// Render the template with data
	const renderedContent = compiledTemplate(args.data);

	// Compile and render outputPath as a Handlebars template
	const outputPathTemplate = Handlebars.compile(args.outputPath);
	const renderedOutputPath = outputPathTemplate(args.data);

	// Validate output path
	if (!renderedOutputPath || renderedOutputPath.trim() === "") {
		throw new Error(`Invalid output path: ${renderedOutputPath}`);
	}

	// Ensure the output directory exists
	const outputDir = path.dirname(renderedOutputPath);
	try {
		await fs.mkdir(outputDir, { recursive: true });
	} catch (error) {
		throw new Error(
			`Invalid output path: ${renderedOutputPath} - ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	// Write the output file
	await fs.writeFile(renderedOutputPath, renderedContent, "utf8");
};

export const modifyFile = async (args: {
	templateFile?: string;
	template?: string;
	data: TemplateData;
	targetFile: string;
	regex?: string;
}) => {
	// Validate that exactly one of templateFile or template is provided
	if (!args.templateFile && !args.template) {
		throw new Error(
			`Either 'templateFile' or 'template' must be provided. Use 'templateFile' for a file path (e.g., "./templates/{{name}}.hbs") or 'template' for a direct template string (e.g., "import {{pascalCase name}} from './{{name}}'").`,
		);
	}

	if (args.templateFile && args.template) {
		throw new Error(
			`Cannot provide both 'templateFile' and 'template'. Use 'templateFile' for a file path or 'template' for a direct template string.`,
		);
	}

	let compiledTemplate: HandlebarsTemplateDelegate;

	if (args.templateFile) {
		// Handle templateFile - path to a template file
		// Compile and render template path as a Handlebars template
		const templatePathTemplate = Handlebars.compile(args.templateFile);
		const renderedTemplatePath = templatePathTemplate(args.data);

		// Resolve template path
		const templatePath = resolveFrom(renderedTemplatePath);

		// Check if template file exists
		try {
			await fs.access(templatePath);
		} catch {
			throw new Error(
				`Template file not found: ${renderedTemplatePath} (resolved to: ${templatePath}). If you meant to use a direct template string instead of a file path, use the 'template' parameter instead of 'templateFile'.`,
			);
		}

		// Read and compile the template
		const templateContent = await fs.readFile(templatePath, "utf8");
		compiledTemplate = Handlebars.compile(templateContent);
	} else {
		// Handle template - direct template string
		compiledTemplate = Handlebars.compile(args.template!);
	}

	// Render the template with data
	const renderedContent = compiledTemplate(args.data);

	// Compile and render targetFile as a Handlebars template
	const targetFileTemplate = Handlebars.compile(args.targetFile);
	const renderedTargetFile = targetFileTemplate(args.data);

	// Resolve the rendered target file path
	const resolvedPath = resolveFrom(renderedTargetFile);

	// Check if target file exists
	try {
		await fs.access(resolvedPath);
	} catch {
		throw new Error(
			`Target file not found: ${renderedTargetFile} (resolved to: ${resolvedPath})`,
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

	// If regex is provided, insert the template content after the matched pattern
	let updatedContent: string;
	if (regexPattern) {
		if (regexPattern.test(fileContent)) {
			// Insert rendered content after the match (using $& to keep the matched content)
			updatedContent = fileContent.replace(
				regexPattern,
				`$&${renderedContent}`,
			);
		} else {
			// If regex doesn't match, log a warning and append
			console.warn(
				`Regex pattern did not match in ${renderedTargetFile}, appending content instead`,
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
