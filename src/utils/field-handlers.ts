import {
	handleArrayField,
	handleGeneric,
	handleObjectField,
	handleReferenceField,
	handleSlugField,
	handleStringField,
	handleTextField,
} from "~/fields";
import { handleFileField } from "~/fields/file";
import { fieldToTypeDefinition } from "~/typegen";
import type {
	FieldHandlerParams,
	FieldHandlerReturn,
	ProcessedGenericField,
} from "~/types";
import { parseValidationRules } from "~/validation";

const GENERIC_FIELD_TYPES = [
	"datetime",
	"date",
	"number",
	"boolean",
	"geopoint",
	"slug",
];

export const SUPPORTED_FIELD_TYPES = [
	"string",
	"object",
	"array",
	"email",
	"text",
	"slug",
	"reference",
	"file",
	...GENERIC_FIELD_TYPES,
];

// Using Record with any for handlers to allow flexible return types
// Handlers return ProcessedGenericField variants which are later wrapped with _PARAMS
const FIELD_HANDLERS: Record<string, (params: FieldHandlerParams) => unknown> =
	{
		string: handleStringField,
		object: handleObjectField,
		array: handleArrayField,
		email: handleStringField,
		text: handleTextField,
		slug: handleSlugField,
		reference: handleReferenceField,
		file: handleFileField,
		...GENERIC_FIELD_TYPES.reduce<Record<string, typeof handleGeneric>>(
			(acc, type) => {
				acc[type] = handleGeneric;
				return acc;
			},
			{},
		),
	} as Record<
		string,
		(params: FieldHandlerParams) => ProcessedGenericField | undefined
	>;

const parseFieldData = (name: string | null, type: unknown) => {
	const options = typeof type === "string" ? type.match(/\((.*)\)/)?.[1] : null;
	const cleanedTypeName =
		typeof type === "string" ? type.replace(/\((.*)\)/, "") : type;

	const field: {
		_type: unknown;
		dataSignature: unknown;
		options: string | null | undefined;
	} = {
		_type: cleanedTypeName,
		dataSignature: null as unknown,
		options: options ?? null,
	};

	if (Array.isArray(type)) {
		field._type = "array";
		field.dataSignature = cleanedTypeName;

		return field;
	}

	if (typeof type === "string" && type?.startsWith("->")) {
		field._type = "reference";
		field.dataSignature = type.replace("->", "");
		return field;
	}

	if (typeof name === "string" && name?.includes("[]")) {
		field._type = "array";
		field.dataSignature = cleanedTypeName;

		return field;
	}

	if (typeof type === "object" && type !== null && !Array.isArray(type)) {
		field._type = "object";
		field.dataSignature = cleanedTypeName;

		return field;
	}

	if (cleanedTypeName === "file") {
		field._type = "file";
		field.dataSignature = cleanedTypeName;

		return field;
	}

	if (cleanedTypeName === "text") {
		field._type = "text";

		return field;
	}

	if (cleanedTypeName === "string") {
		field._type = "string";

		return field;
	}

	return field;
};

export const coalesce = (objKey: string, options: object | string | null) => {
	const fieldOptions = {} as Record<string, string>;

	if (!options) return {};

	if (typeof options === "string") {
		return { [objKey]: options };
	}

	for (const [key, value] of Object.entries(options)) {
		if (value !== undefined) {
			fieldOptions[key] = value as string;
		}
	}

	if (Object.keys(fieldOptions).length === 0) {
		return {};
	}

	return { [objKey]: fieldOptions };
};

export const handleField = (
	name: string | null,
	type: unknown,
): FieldHandlerReturn | undefined => {
	// console.log("handling field::", name, type);
	if (!type) {
		console.log("🚨 No field type");
		return undefined;
	}

	if (name === "undefined") {
		return undefined;
	}

	const { _type, dataSignature, options } = parseFieldData(name, type);
	const { validation, cleanedFieldName } = parseValidationRules(name, type);

	const fn = typeof _type === "string" ? FIELD_HANDLERS[_type] : undefined;

	if (typeof fn !== "function") {
		console.log("🚨 No field handler or declared type found for type: ", type);
		return undefined;
	}

	const formattedField = fn({
		name: cleanedFieldName || name || "",
		type: typeof _type === "string" ? _type : "string",
		dataSignature: typeof dataSignature === "string" ? dataSignature : "",
		options: options ?? "",
	}) as ProcessedGenericField | undefined;

	if (!formattedField) {
		return undefined;
	}

	return {
		...formattedField,
		...coalesce("validation", validation),
		_PARAMS: {
			type: fieldToTypeDefinition(formattedField as FieldHandlerReturn),
		},
	} as FieldHandlerReturn;
};
