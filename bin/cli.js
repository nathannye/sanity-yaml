#!/usr/bin/env node

/**
 * CLI wrapper for sanity-yaml
 * Uses the built JavaScript file if available, otherwise falls back to tsx
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to use the built file first, then fall back to tsx
const builtCliPath = resolve(__dirname, "../dist/bin/cli.js");
const sourceCliPath = resolve(__dirname, "cli.ts");

let cliPath;
let tsxCmd;
let tsxArgs;

if (existsSync(builtCliPath)) {
	// Use built JavaScript file (production)
	cliPath = builtCliPath;
	tsxCmd = "node";
	tsxArgs = [];
} else {
	// Use tsx to run TypeScript file (development)
	cliPath = sourceCliPath;
	const nodeModulesTsx = resolve(__dirname, "../node_modules/.bin/tsx");
	if (existsSync(nodeModulesTsx)) {
		tsxCmd = nodeModulesTsx;
		tsxArgs = [];
	} else {
		tsxCmd = "npx";
		tsxArgs = ["-y", "tsx"];
	}
}

const child = spawn(tsxCmd, [...tsxArgs, cliPath, ...process.argv.slice(2)], {
	stdio: "inherit",
	shell: true,
	env: { ...process.env, PATH: `${process.env.PATH}:${resolve(__dirname, "../node_modules/.bin")}` },
});

child.on("exit", (code) => {
	process.exit(code || 0);
});

child.on("error", (error) => {
	console.error("❌ Error running sanity-yaml:", error.message);
	console.error("   Please ensure Node.js and npm/pnpm are installed");
	process.exit(1);
});

