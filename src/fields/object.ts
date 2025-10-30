import type { FieldHandlerParams, ProcessedGenericField } from "~/types";
import { handleField } from "~/utils/field-handlers";

type ProcessedObjectField = ProcessedGenericField & {
	fields: ProcessedGenericField[];
};

export const handleObjectField = ({
	name,
	dataSignature,
}: FieldHandlerParams): ProcessedObjectField => {
	// Ensure dataSignature is an object
	if (typeof dataSignature !== "object" || dataSignature === null || Array.isArray(dataSignature)) {
		return {
			name: name === "array" ? undefined : name,
			type: "object",
			fields: [],
		};
	}

	const fieldsArray = Object.entries(dataSignature)
		.map(([key, value]) => handleField(key, value))
		.filter(Boolean) as ProcessedGenericField[];

	return {
		name: name === "array" ? undefined : name,
		type: "object",
		fields: fieldsArray,
	};
};
