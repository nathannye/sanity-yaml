#!/usr/bin/env node

/**
 * CLI wrapper for sanity-yaml
 * Uses the built JavaScript file if available, otherwise falls back to source TypeScript
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try built file first, then fall back to source
const builtCliPath = resolve(__dirname, "../dist/bin/cli.js");
const sourceCliPath = resolve(__dirname, "cli.ts");

let cliPath;
let cmd;
let args;

if (existsSync(builtCliPath)) {
	// Use built JavaScript file (production/after build)
	cliPath = builtCliPath;
	cmd = "node";
	args = [];
} else if (existsSync(sourceCliPath)) {
	// Fall back to TypeScript source (development or when build skipped)
	cliPath = sourceCliPath;
	// Try to find tsx in various locations
	const nodeModulesTsx = resolve(__dirname, "../node_modules/.bin/tsx");
	if (existsSync(nodeModulesTsx)) {
		cmd = nodeModulesTsx;
		args = [];
	} else {
		// Use npx to run tsx (will download if needed)
		cmd = "npx";
		args = ["-y", "tsx"];
	}
} else {
	console.error("❌ CLI file not found.");
	console.error(`   Expected built file: ${builtCliPath}`);
	console.error(`   Or source file: ${sourceCliPath}`);
	console.error("   Please ensure the package is properly installed");
	process.exit(1);
}

const child = spawn(cmd, [...args, cliPath, ...process.argv.slice(2)], {
	stdio: "inherit",
	shell: true,
	env: {
		...process.env,
		PATH: `${process.env.PATH}:${resolve(__dirname, "../node_modules/.bin")}`,
	},
});

child.on("exit", (code) => {
	process.exit(code || 0);
});

child.on("error", (error) => {
	console.error("❌ Error running sanity-yaml:", error.message);
	console.error("   Please ensure Node.js is installed");
	if (!existsSync(builtCliPath)) {
		console.error("   Note: If tsx is not available, please run `pnpm build` or `npm run build`");
	}
	process.exit(1);
});
