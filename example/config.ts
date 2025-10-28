import type { FilesetDataOutput } from "../types";

export type GeneratorConfig = {
	fieldDefaults?: {
		text: {
			rows: number;
		};
	};
	additionalTypes?: {
		[key: string]: string;
	};

	filesets: {
		[name: string]: {
			output: string;
			input: string;
			template: string;
			data: FilesetDataOutput;
		};
	};
};

export const CONFIG: GeneratorConfig = {
	fieldDefaults: {
		text: {
			rows: 3,
		},
	},

	filesets: {
		blogSchemas: {
			output: "./example/generated/schemas",
			input: "./example/blog-post.yaml",
			template: "./templates/sanity-slice.hbs",
			data: "schema",
		},
		blogTypes: {
			output: "./example/generated/types",
			input: "./example/blog-post.yaml",
			template: "./templates/frontend-slice.hbs",
			data: "type",
		},
	},
};
