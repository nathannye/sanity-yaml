export type FilesetDataOutput = "schema" | "type";

type SanityFieldType =
	| "string"
	| "number"
	| "boolean"
	| "array"
	| "object"
	| "reference"
	| "file"
	| "image"
	| "datetime"
	| "date"
	| "geopoint"
	| "slug"
	| "email"
	| "text";

export type ExtraFieldParams = {
	_PARAMS: {
		type: string;
		validation?: string;
	};
	options?: {
		[key: string]: string;
	};
};

export type TemplateData = {
	name: string;
	sanityFields: FieldHandlerReturn[];
	typeDefinition: Record<string, string>;
};

export type FieldHandlerParams = {
	name: string;
	type: string;
	dataSignature: string;
	options: string;
};

export type ProcessedGenericField = {
	name?: string;
	type: SanityFieldType | string;
	validation?: string;
};

export type FieldHandlerReturn = ProcessedGenericField & ExtraFieldParams;

export type FileCreatorCallbackArgs = {
	name: string;
	sanityFields: FieldHandlerReturn[];
	typeDefinition: Record<string, string>;
	renderTemplate: (args: {
		template: string;
		data: any;
		outputPath: string;
	}) => Promise<void>;
	updateFile: (
		filepath: string,
		regex: string | undefined,
		content: string | undefined,
	) => Promise<void>;
};
