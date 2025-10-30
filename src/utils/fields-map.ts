/**
 * Field type mappings used for reference/validation
 * This is a utility map that can be used throughout the library
 */

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
	reference: "reference",
	image: "image",
	file: "file",
} as const;
