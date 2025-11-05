import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { defineConfig } from "tsup";

// Recursively find all TypeScript files in src/
function findTsFiles(dir: string, baseDir: string = dir): string[] {
	const files: string[] = [];
	try {
		const entries = readdirSync(dir);
		for (const entry of entries) {
			const fullPath = join(dir, entry);
			const stat = statSync(fullPath);
			if (stat.isDirectory()) {
				files.push(...findTsFiles(fullPath, baseDir));
			} else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) {
				files.push(relative(baseDir, fullPath));
			}
		}
	} catch {
		// Ignore errors
	}
	return files;
}

// Get all TypeScript files in src/ directory
const srcFiles = findTsFiles("src");

// Create entry points for all source files, preserving directory structure
const srcEntries = srcFiles.reduce(
	(acc, file) => {
		// File path is relative to src/, so add src/ prefix for tsup entry
		// Remove .ts extension - entry name should match the file path without extension
		const entryName = `src/${file.replace(/\.ts$/, "")}`;
		acc[entryName] = `src/${file}`;
		return acc;
	},
	{} as Record<string, string>,
);

export default defineConfig({
	entry: {
		"bin/cli": "bin/cli.ts",
		...srcEntries,
	},
	format: ["esm"],
	target: "node18",
	outDir: "dist",
	splitting: false,
	sourcemap: true,
	clean: true,
	dts: {
		entry: ["src/index.ts", "bin/cli.ts"],
	},
	bundle: false,
	external: ["@inquirer/prompts", "handlebars", "text-case", "walkjs", "yaml"],
	onSuccess: async () => {
		const { cpSync } = await import("node:fs");
		const { resolve } = await import("node:path");
		// Copy templates directory
		cpSync("templates", "dist/templates", { recursive: true });
	},
});
