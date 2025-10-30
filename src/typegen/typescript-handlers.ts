import type { FieldHandlerReturn } from "../types";

const TYPE_TRANSFORMERS: Record<
	string,
	string | ((args: FieldHandlerReturn) => string)
> = {
	datetime: "string",
	date: "string",
	url: "string",
	text: "string",
	email: "string",
	string: ({ options }) => {
		if (options && typeof options === "object" && options.list) {
			const opts = Array.isArray(options.list) ? options.list : [];
			return opts.map((option: string) => `'${option}'`).join(" | ");
		}
		return "string";
	},
	number: "number",
	file: "any",
	boolean: "boolean",
	reference: "any",
	array: "array",
	geopoint: "{ lat: number; lng: number; alt: number }",
};

export const fieldToTypeDefinition = (field: FieldHandlerReturn) => {
	const typeTransformer = TYPE_TRANSFORMERS?.[field?.type];
	const definition =
		typeof typeTransformer === "function"
			? typeTransformer(field)
			: typeTransformer || field.type;

	return definition;
};
