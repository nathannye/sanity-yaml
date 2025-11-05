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
	bundle: true,
	external: ["@inquirer/prompts", "handlebars", "text-case", "walkjs", "yaml"],
	onSuccess: async () => {
		const { cpSync } = await import("node:fs");
		// Copy templates directory
		cpSync("templates", "dist/templates", { recursive: true });
	},
});
