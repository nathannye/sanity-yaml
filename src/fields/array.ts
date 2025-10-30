import type {
	FieldHandlerParams,
	FieldHandlerReturn,
	ProcessedGenericField,
} from "~/types";
import { handleField } from "../utils/field-handlers";

type ProcessedArrayField = ProcessedGenericField & {
	of: FieldHandlerReturn[];
};

export const handleArrayField = ({
	name,
	type,
	dataSignature,
	options,
}: FieldHandlerParams): ProcessedArrayField | undefined => {
	const correctedFieldName = name.replace("[]", "");

	// When dataSignature is an object, it represents the array item type
	// We pass null as the name since this is an anonymous inline type
	const inner = handleField(null as unknown as string, dataSignature);

	if (!inner) {
		return undefined;
	}

	return {
		name: correctedFieldName,
		type: "array",
		of: [inner],
	};
};
