import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		"bin/cli": "bin/cli.ts",
		"src/index": "src/index.ts",
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
	external: [
		"@inquirer/prompts",
		"@sanity/types",
		"handlebars",
		"text-case",
		"walkjs",
		"yaml",
	],
	onSuccess: async () => {
		const { copyFileSync, mkdirSync, cpSync } = await import("fs");
		const { resolve } = await import("path");
		// Copy bin/cli.js
		mkdirSync(resolve("dist", "bin"), { recursive: true });
		copyFileSync("bin/cli.js", "dist/bin/cli.js");
		// Copy templates directory
		cpSync("templates", "dist/templates", { recursive: true });
	},
});
