// import { kebabCase, sentenceCase } from "text-case";

import fs from "node:fs";
import { titleCase } from "text-case";
// import { resolveFrom } from "~/utils/file";
import { WalkBuilder, walk } from "walkjs";
import yaml from "yaml";
import { handleField } from "~/utils/field-handlers";
import type {
	FieldHandlerReturn,
	FileCreatorCallbackArgs,
	FilesetDataOutput,
} from "./types";
import { renderTemplate, updateFile } from "./utils/exposed";
import { renderToFile } from "./utils/render";

const createSchema = (item: Record<string, unknown>) => {
	const fields: FieldHandlerReturn[] = [];
	walk(item, {
		onVisit: {
			filters: (node) => !!node.key,
			callback: (node) => {
				const field = handleField(String(node.key), node.val);

				if (field === undefined) return;
				// Skip the below scenarios to avoid adding fields to the parent array that have already been resolved in place as children of objects and arrays
				if (node.parent?.key?.includes("[]")) return;
				if (node.parent?.key && typeof node?.parent?.val === "object") return;

				fields.push(field);
			},
		},
	});

	// new WalkBuilder()
	// 	.withGlobalFilter((a) => !!a.key) // do not walk root nodes (name of schema)
	// 	.withSimpleCallback((node) => {})
	// 	.walk(item);

	return fields;
};

const createType = (schema: any) => {
	// console.log("schema::", schema);
	const root = {};
	const processedNestedFields = new Set<string>();

	new WalkBuilder()
		.withGlobalFilter((a) => !!a.key && a?.val?._PARAMS)
		.withSimpleCallback((node) => {
			const fieldName = node.val.name;
			const fieldType = node.val._PARAMS.type;

			// Skip if this field is nested within an object (it's already handled in the object case)
			if (node.parent?.val?.type === "object") {
				if (fieldName) processedNestedFields.add(fieldName);
				return;
			}

			// Skip if this field was already processed as a nested field
			if (fieldName && processedNestedFields.has(fieldName)) {
				return;
			}

			switch (node.val.type) {
				case "object": {
					const t = {};
					const fields = node.val.fields;

					fields.forEach((field, i) => {
						// Mark nested fields as processed so they don't get added to root
						if (field.name) {
							processedNestedFields.add(field.name);
						}

						// If the field is an array, handle it specially
						if (field.type === "array" && field.of) {
							const ofTypes = field.of
								.map((o: any) => {
									if (o.type === "object" && o.fields) {
										// Mark nested fields within array objects as processed
										o.fields.forEach((f: any) => {
											if (f.name) {
												processedNestedFields.add(f.name);
											}
										});

										const objFields = o.fields
											.map(
												(f: any) =>
													`  ${String(f.name)}: ${f._PARAMS?.type || "any"}`,
											)
											.join(";\n");
										return `{\n${objFields};\n}`;
									}
									return o._PARAMS?.type || o.type;
								})
								.filter(Boolean)
								.join(" | ");
							const needsParens = ofTypes.includes("|");
							t[String(field.name)] = needsParens
								? `(${ofTypes})[]`
								: `${ofTypes}[]`;
						} else {
							t[String(field.name)] = field._PARAMS.type;
						}
					});

					root[fieldName] = t;

					break;
				}
				case "array": {
					const ofTypes = node.val.of
						.map((o: any) => {
							// If it's an object type, create the inline object type
							if (o.type === "object" && o.fields) {
								// Mark nested fields within array objects as processed
								o.fields.forEach((f: any) => {
									if (f.name) {
										processedNestedFields.add(f.name);
									}
								});

								const objFields = o.fields
									.map(
										(field: any) =>
											`  ${String(field.name)}: ${field._PARAMS?.type || "any"}`,
									)
									.join(";\n");
								return `{\n${objFields};\n}`;
							}
							return o._PARAMS?.type || o.type;
						})
						.filter(Boolean)
						.join(" | ");

					// Only wrap in parentheses if there's more than one type
					const needsParens = ofTypes.includes("|");
					root[fieldName] = needsParens ? `(${ofTypes})[]` : `${ofTypes}[]`;

					break;
				}
				default:
					root[fieldName] = fieldType;
					break;
			}
		})
		.walk(schema);

	return root;
};

export const generateFileset = async ({
	name,
	inputPath,
	onFileCreate,
}: {
	name: string;
	inputPath: string;
	onFileCreate: (args: FileCreatorCallbackArgs) => void | Promise<void>;
}) => {
	const parsedYaml = yaml.parse(fs.readFileSync(inputPath, "utf8"));

	const fileset = Object.entries(parsedYaml).flatMap(([key, value]) => {
		const sanityFields = createSchema(value);
		const typeDefinition = createType(sanityFields);

		return { name: key, sanityFields, typeDefinition, title: titleCase(key) };
	});

	// Wait for all file creation promises to resolve
	await Promise.all(
		fileset.map(async (file) => {
			const result = onFileCreate({
				name: file.name,
				sanityFields: file.sanityFields,
				typeDefinition: file.typeDefinition,
				renderTemplate,
				updateFile,
			});
			await result; // Resolve promise if it's async, otherwise await undefined
		}),
	);

	console.log(`✅ Generated ${fileset.length} files for ${name}`);
};
