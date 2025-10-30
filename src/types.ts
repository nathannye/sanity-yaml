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
	// Array fields can have 'of' property
	of?: FieldHandlerReturn[];
	// Object fields can have 'fields' property
	fields?: FieldHandlerReturn[];
	// Allow any additional properties for extensibility
	[key: string]: unknown;
};

export type FieldHandlerReturn = ProcessedGenericField & ExtraFieldParams;

// Expandable type for type definitions - can be string or nested objects
export type TypeDefinition = string | TypeDefinitionRecord;
export interface TypeDefinitionRecord extends Record<string, TypeDefinition> {}

export type FileCreatorCallbackArgs = {
	name: string;
	sanityFields: FieldHandlerReturn[];
	typeDefinition: Record<string, TypeDefinition>;
	renderTemplate: (args: {
		template: string;
		data: Record<string, unknown>;
		outputPath: string;
	}) => Promise<void>;
	updateFile: (
		filepath: string,
		regex: string | undefined,
		content: string | undefined,
	) => Promise<void>;
};

// Expandable type for walk node values
export interface WalkNodeValue {
	name?: string;
	type?: string;
	_PARAMS?: {
		type: string;
		validation?: string;
	};
	fields?: FieldHandlerReturn[];
	of?: FieldHandlerReturn[];
	[key: string]: unknown;
}
