#!/usr/bin/env node

/**
 * CLI wrapper for sanity-yaml
 * Uses the built JavaScript file
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use the built file
const builtCliPath = resolve(__dirname, "../dist/bin/cli.js");

if (!existsSync(builtCliPath)) {
	console.error("❌ Built CLI file not found. Please run `pnpm build` or `npm run build`");
	console.error(`   Expected location: ${builtCliPath}`);
	process.exit(1);
}

const child = spawn("node", [builtCliPath, ...process.argv.slice(2)], {
	stdio: "inherit",
	shell: true,
});

child.on("exit", (code) => {
	process.exit(code || 0);
});

child.on("error", (error) => {
	console.error("❌ Error running sanity-yaml:", error.message);
	console.error("   Please ensure Node.js is installed");
	process.exit(1);
});
