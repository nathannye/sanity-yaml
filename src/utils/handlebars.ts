import fs from "node:fs";
import path from "node:path";
import Handlebars from "handlebars";
import {
	camelCase,
	kebabCase,
	pascalCase,
	sentenceCase,
	snakeCase,
	titleCase,
} from "text-case";
import { resolveFrom } from "./paths";

export const registerPartials = (directory: string) => {
	const resolvedDir = resolveFrom(directory);
	const files = fs.readdirSync(resolvedDir);

	for (const file of files) {
		const filePath = path.join(resolvedDir, file);
		const stat = fs.statSync(filePath);

		// Skip directories
		if (stat.isDirectory()) {
			continue;
		}

		// Only process .hbs files
		if (!file.endsWith(".hbs")) {
			continue;
		}

		const fileName = file.split(".")[0];
		Handlebars.registerPartial(fileName, fs.readFileSync(filePath, "utf8"));
	}
};

export const registerHelpers = () => {
	Handlebars.registerHelper("eq", (a, b) => a === b);
	Handlebars.registerHelper("gt", (a, b) => a > b);
	Handlebars.registerHelper("hasFields", (fields) => {
		return Array.isArray(fields) && fields.length > 0;
	});

	// Casing utilities - most commonly used
	Handlebars.registerHelper("pascalCase", pascalCase);
	Handlebars.registerHelper("camelCase", camelCase);
	Handlebars.registerHelper("kebabCase", kebabCase);
	Handlebars.registerHelper("titleCase", titleCase);
	Handlebars.registerHelper("sentenceCase", sentenceCase);
	Handlebars.registerHelper("snakeCase", snakeCase);

	Handlebars.registerHelper("or", (...fnargs) => {
		// convert `arguments` into a normal array and remove the last item (Handlebars options object)
		const args = Array.from(fnargs).slice(0, -1);
		return args.some(Boolean);
	});
	Handlebars.registerHelper(
		"switch",
		function (
			this: Record<string, unknown>,
			value: unknown,
			options: Handlebars.HelperOptions,
		) {
			this.switch_value = value;
			return options.fn(this);
		},
	);

	Handlebars.registerHelper(
		"case",
		function (
			this: Record<string, unknown>,
			value: unknown,
			options: Handlebars.HelperOptions,
		) {
			if (value === this.switch_value) {
				return options.fn(this);
			}
		},
	);

	Handlebars.registerHelper(
		"default",
		function (
			this: Record<string, unknown>,
			// value: unknown,
			options: Handlebars.HelperOptions,
		) {
			if (this.switch_break === false) {
				return options.fn(this);
			}
		},
	);

	Handlebars.registerHelper("isObject", (value) => {
		return typeof value === "object" && !Array.isArray(value) && value !== null;
	});

	// Helper to format object type inline
	Handlebars.registerHelper("inlineObjectType", (value) => {
		if (typeof value === "object" && !Array.isArray(value) && value !== null) {
			const fields = Object.entries(value)
				.map(([key, val]) => `  ${key}: ${val};`)
				.join("\n");
			return `{\n${fields}\n}`;
		}
		return value;
	});

	// Helper to check if we're on the last iteration in an each loop
	Handlebars.registerHelper("notLast", (context, options) => {
		if (context && Object.hasOwn(context, "last")) {
			return !context.last;
		}
		// Fallback for built-in @last
		return !options.data.last;
	});
};
