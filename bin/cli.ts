#!/usr/bin/env node

// @ts-check

/**
 * CLI entry point for sanity-yaml
 * This file is executed by tsx (for Node.js) or bun (native TypeScript support)
 */

import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

async function loadConfig(configPath: string) {
	const configFile = resolve(process.cwd(), configPath);

	if (!existsSync(configFile)) {
		console.error(`❌ Config file not found: ${configPath}`);
		console.error(`   Looked for: ${configFile}`);
		process.exit(1);
	}

	try {
		// Try to load as ES module first
		try {
			const config = await import(configFile);
			return config.default || config.CONFIG || config;
		} catch (e) {
			// If that fails, try CommonJS
			const config = require(configFile);
			return config.default || config.CONFIG || config;
		}
	} catch (error: any) {
		console.error(`❌ Error loading config file: ${configPath}`);
		console.error(error.message);
		process.exit(1);
	}
}

async function main() {
	const args = process.argv.slice(2);
	let configPath: string | null = null;

	// Parse --config flag
	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--config" || args[i] === "-c") {
			configPath = args[i + 1];
			if (!configPath) {
				console.error("❌ --config flag requires a path");
				process.exit(1);
			}
			break;
		}
		if (args[i] === "--help" || args[i] === "-h") {
			console.log(`
Usage: sanity-yaml [options]

Options:
  -c, --config <path>  Path to config file (default: looks for sanity-yaml.config.ts or sanity-yaml.config.js)
  -h, --help           Show this help message

Examples:
  sanity-yaml
  sanity-yaml --config ./my-config.ts
			`);
			process.exit(0);
		}
	}

	// Try to find config file
	const possibleConfigs = ["sanity-yaml.config.ts", "sanity-yaml.config.js"];

	if (!configPath) {
		for (const possible of possibleConfigs) {
			if (existsSync(resolve(process.cwd(), possible))) {
				configPath = possible;
				break;
			}
		}
	}

	if (!configPath) {
		console.error("❌ No config file found.");
		console.error("   Please create a config file or use --config flag");
		console.error(`   Possible names: ${possibleConfigs.join(", ")}`);
		process.exit(1);
	}

	const config = await loadConfig(configPath);

	// Import and run the main function
	// Try dist imports first (production), then source imports (development)
	const srcBase = existsSync(resolve(__dirname, "../dist/src"))
		? "../dist/src"
		: "../src";
	const { registerHelpers, registerPartials } = await import(
		`${srcBase}/utils/handlebars.js`
	);
	const { generateFileset } = await import(`${srcBase}/generators.js`);

	// Register handlebars helpers and partials
	registerHelpers();
	// Try dist templates first (production), then source templates (development)
	const templatesBase = existsSync(resolve(__dirname, "../dist/templates"))
		? resolve(__dirname, "../dist/templates")
		: resolve(__dirname, "../templates");
	registerPartials(resolve(templatesBase, "partials/internal"));
	registerPartials(resolve(templatesBase, "partials"));

	// Run the generator
	if (!config.filesets) {
		console.error("❌ No filesets found in config");
		process.exit(1);
	}

	const filesetPromises = Object.entries(config.filesets)
		.filter(([name, fileset]: [string, any]) => {
			if (typeof fileset.onFileCreate !== "function") {
				console.error(`❌ File creator callback for ${name} is not a function`);
				return false;
			}
			return true;
		})
		.map(([name, fileset]: [string, any]) => {
			return generateFileset({
				name,
				inputPath: fileset.inputPath,
				onFileCreate: fileset.onFileCreate,
				config: {
					...(config.fieldDefaults ? { fieldDefaults: config.fieldDefaults } : {}),
					...(config.removeDefineField !== undefined
						? { removeDefineField: config.removeDefineField }
						: {}),
				},
			});
		});

	try {
		await Promise.all(filesetPromises);
		console.log("✅ All filesets generated successfully");
	} catch (error: any) {
		console.error("❌ Error during generation:", error.message);
		process.exit(1);
	}
}

main().catch((error: any) => {
	console.error("❌ Unexpected error:", error);
	process.exit(1);
});
