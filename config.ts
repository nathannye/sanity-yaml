// These are exposed to the config via FileCreatorCallbackArgs

export const FIELDS_MAP = {
	string: "string",
	url: "url",
	number: "number",
	email: {
		type: "string",
		validation: "Rule",
	},
	boolean: "boolean",
	datetime: "datetime",
	date: "date",
	// array: handleArrayField,
	// object: handleObjectField,
	reference: "reference",
	image: "image",
	file: "file",
};

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
			inputPath: string;
			onFileCreate: (args: {
				name: string;
				sanityFields: any;
				typeDefinition: any;
				renderTemplate: (args: {
					template: string;
					data: any;
					outputPath: string;
				}) => Promise<void>;
				updateFile: (
					filepath: string,
					regex?: string,
					content?: string,
				) => Promise<void>;
			}) => void | Promise<void>;
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
			inputPath: "./slices.yaml",
			onFileCreate: async ({
				name,
				sanityFields,
				typeDefinition,
				renderTemplate,
			}) => {
				await renderTemplate({
					template: "./templates/sanity-slice.hbs",
					data: { name, sanityFields },
					outputPath: `./generated/schemas/${name}.ts`,
				});
				await renderTemplate({
					template: "./templates/frontend-slice.hbs",
					data: { name, typeDefinition },
					outputPath: `./generated/components/${name}.tsx`,
				});
				// await updateFile(
				// 	"../my-index-file.ts",
				// 	"REGEX",
				// 	`export * from './${name}'`,
				// );
			},
		},
	},
};
