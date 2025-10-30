import type { FieldHandlerParams } from "~/types";
import { getLibraryConfig } from "~/utils/config";

export const handleTextField = ({ name, options }: FieldHandlerParams) => {
	const config = getLibraryConfig();
	const rows = options || config.fieldDefaults?.text?.rows;

	return {
		name,
		type: "text",
		options: {
			rows,
		},
	};
};
