import fs from "node:fs";
import process from "node:process";
import { confirm } from "@inquirer/prompts";
import { titleCase } from "text-case";
import { WalkBuilder, walk } from "walkjs";
import yaml from "yaml";
import { handleField, SUPPORTED_FIELD_TYPES } from "~/utils/field-handlers";
import { fieldToTypeDefinition } from "./typegen/typescript-handlers";
import type {
	FieldHandlerReturn,
	FileCreatorCallbackArgs,
	TypeDefinition,
	WalkNodeValue,
} from "./types";
import { modifyFile, renderTemplate } from "./utils/exposed";

const extractFieldTypeFromValue = (
	name: string | null,
	type: unknown,
): string | null => {
	if (!type) return null;

	// Handle arrays - they're allowed, we check the inner type
	if (Array.isArray(type)) {
		return null; // We'll check array items separately
	}

	// Handle references (->type)
	if (typeof type === "string" && type?.startsWith("->")) {
		return "reference";
	}

	// Handle arrays via name (fieldName[])
	if (typeof name === "string" && name?.includes("[]")) {
		return null; // We'll check the base type separately
	}

	// Handle objects
	if (typeof type === "object" && type !== null && !Array.isArray(type)) {
		return "object";
	}

	// Extract clean type name (remove options like string(options))
	if (typeof type === "string") {
		const cleanedTypeName = type.replace(/\((.*)\)/, "");
		return cleanedTypeName;
	}

	return null;
};

const scanFieldTypes = (
	item: Record<string, unknown>,
	schemaName: string,
): Map<string, Set<string>> => {
	const unsupportedTypes = new Map<string, Set<string>>();
	const supportedSet = new Set(SUPPORTED_FIELD_TYPES);

	walk(item, {
		onVisit: {
			filters: (node) => !!node.key,
			callback: (node) => {
				const fieldName = String(node.key);
				const fieldValue = node.val;

				// Skip root level schema names
				if (!node.parent) return;

				const fieldType = extractFieldTypeFromValue(fieldName, fieldValue);

				// Handle array items - check the type inside the array
				if (Array.isArray(fieldValue)) {
					fieldValue.forEach((item) => {
						if (typeof item === "object" && item !== null) {
							// It's an object, recurse into it
							const nestedTypes = scanFieldTypes(item, schemaName);
							nestedTypes.forEach((types, name) => {
								if (!unsupportedTypes.has(name)) {
									unsupportedTypes.set(name, new Set());
								}
								types.forEach((type) => {
									unsupportedTypes.get(name)!.add(type);
								});
							});
						} else {
							// Check the type of array items
							const itemType = extractFieldTypeFromValue(null, item);
							if (itemType && !supportedSet.has(itemType)) {
								if (!unsupportedTypes.has(schemaName)) {
									unsupportedTypes.set(schemaName, new Set());
								}
								unsupportedTypes.get(schemaName)!.add(itemType);
							}
						}
					});
					return;
				}

				// Handle array syntax in field name (fieldName[])
				const isArrayField = fieldName.includes("[]");
				if (isArrayField) {
					// For array fields, check the type of the value
					// If it's an object, recurse into it to check nested types
					if (
						typeof fieldValue === "object" &&
						fieldValue !== null &&
						!Array.isArray(fieldValue)
					) {
						// Array of objects - recurse to check nested field types
						const nestedTypes = scanFieldTypes(fieldValue, schemaName);
						nestedTypes.forEach((types, name) => {
							if (!unsupportedTypes.has(name)) {
								unsupportedTypes.set(name, new Set());
							}
							types.forEach((type) => {
								unsupportedTypes.get(name)!.add(type);
							});
						});
						return; // Array field with object value - already handled
					} else {
						// Array of primitive types - extract and check the type
						const baseType = extractFieldTypeFromValue(
							fieldName.replace("[]", ""),
							fieldValue,
						);
						if (baseType && !supportedSet.has(baseType)) {
							if (!unsupportedTypes.has(schemaName)) {
								unsupportedTypes.set(schemaName, new Set());
							}
							unsupportedTypes.get(schemaName)!.add(baseType);
						}
						return; // Array field - already handled
					}
				}

				// Handle nested objects - recurse into them
				if (
					typeof fieldValue === "object" &&
					fieldValue !== null &&
					!Array.isArray(fieldValue)
				) {
					const nestedTypes = scanFieldTypes(fieldValue, schemaName);
					nestedTypes.forEach((types, name) => {
						if (!unsupportedTypes.has(name)) {
							unsupportedTypes.set(name, new Set());
						}
						types.forEach((type) => {
							unsupportedTypes.get(name)!.add(type);
						});
					});
					return; // Object field - already handled nested types
				}

				// Check if field type is unsupported (for primitive types)
				if (fieldType && !supportedSet.has(fieldType)) {
					if (!unsupportedTypes.has(schemaName)) {
						unsupportedTypes.set(schemaName, new Set());
					}
					unsupportedTypes.get(schemaName)!.add(fieldType);
				}
			},
		},
	});

	return unsupportedTypes;
};

const createSchema = (item: Record<string, unknown>) => {
	const fields: FieldHandlerReturn[] = [];
	walk(item, {
		onVisit: {
			filters: (node) => !!node.key,
			callback: (node) => {
				const field = handleField(String(node.key), node.val);

				if (field === undefined) return;
				// Skip the below scenarios to avoid adding fields to the parent array that have already been resolved in place as children of objects and arrays
				if (
					node.parent?.key &&
					typeof node.parent.key === "string" &&
					node.parent.key.includes("[]")
				)
					return;
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

const createType = (schema: FieldHandlerReturn[]) => {
	const root: Record<string, TypeDefinition> = {};
	const processedNestedFields = new Set<string>();

	new WalkBuilder()
		.withGlobalFilter((a) => !!a.key && a?.val?._PARAMS)
		.withSimpleCallback((node) => {
			const val = node.val as WalkNodeValue;
			const fieldName = val.name;
			const fieldType = val._PARAMS?.type;

			// Skip if this field is nested within an object (it's already handled in the object case)
			if ((node.parent?.val as WalkNodeValue)?.type === "object") {
				if (fieldName) processedNestedFields.add(fieldName);
				return;
			}

			// Skip if this field was already processed as a nested field
			if (fieldName && processedNestedFields.has(fieldName)) {
				return;
			}

			if (!fieldName || !fieldType) return;

			switch (val.type) {
				case "object": {
					const t: Record<string, TypeDefinition> = {};
					const fields = val.fields;

					if (!fields) return;
					fields.forEach((field: FieldHandlerReturn) => {
						// Mark nested fields as processed so they don't get added to root
						if (field.name) {
							processedNestedFields.add(field.name);
						}

						// If the field is an array, handle it specially
						if (field.type === "array" && field.of) {
							const ofTypes = field.of
								.map((o: FieldHandlerReturn) => {
									if (o.type === "object" && o.fields) {
										// Mark nested fields within array objects as processed
										o.fields.forEach((f: FieldHandlerReturn) => {
											if (f.name) {
												processedNestedFields.add(f.name);
											}
										});

										const objFields = o.fields
											.map(
												(f: FieldHandlerReturn) =>
													`  ${String(f.name)}: ${f._PARAMS?.type || "any"}`,
											)
											.join(";\n");
										return `{\n${objFields};\n}`;
									}
									// Use fieldToTypeDefinition to transform types (e.g., reference -> any)
									const type = o._PARAMS?.type || o.type;
									const { type: _, ...rest } = o;
									return fieldToTypeDefinition({
										type,
										...rest,
									} as FieldHandlerReturn);
								})
								.filter(Boolean)
								.join(" | ");
							const needsParens = ofTypes.includes("|");
							if (field.name) {
								t[String(field.name)] = needsParens
									? `(${ofTypes})[]`
									: `${ofTypes}[]`;
							}
						} else {
							if (field.name && field._PARAMS) {
								t[String(field.name)] = field._PARAMS.type;
							}
						}
					});

					root[fieldName] = t;

					break;
				}
				case "array": {
					const ofTypes =
						val.of
							?.map((o: FieldHandlerReturn) => {
								// If it's an object type, create the inline object type
								if (o.type === "object" && o.fields) {
									// Mark nested fields within array objects as processed
									o.fields.forEach((f: FieldHandlerReturn) => {
										if (f.name) {
											processedNestedFields.add(f.name);
										}
									});

									const objFields = o.fields
										.map(
											(field: FieldHandlerReturn) =>
												`  ${String(field.name)}: ${field._PARAMS?.type || "any"}`,
										)
										.join(";\n");
									return `{\n${objFields};\n}`;
								}
								// Use fieldToTypeDefinition to transform types (e.g., reference -> any)
								const type = o._PARAMS?.type || o.type;
								const { type: _, ...rest } = o;
								return fieldToTypeDefinition({
									type,
									...rest,
								} as FieldHandlerReturn);
							})
							.filter(Boolean)
							.join(" | ") || "";

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
	config,
}: {
	name: string;
	inputPath: string;
	onFileCreate: (args: FileCreatorCallbackArgs) => void | Promise<void>;
	config?: {
		fieldDefaults?: {
			text?: {
				rows?: number;
			};
		};
		removeDefineField?: boolean;
	};
}) => {
	// Set library config if provided
	if (config) {
		const { setLibraryConfig } = await import("./utils/config");
		setLibraryConfig(config);
	}
	const parsedYaml = yaml.parse(fs.readFileSync(inputPath, "utf8"));

	// Scan for unsupported field types before processing
	const allUnsupportedTypes = new Map<string, Set<string>>();
	Object.entries(parsedYaml).forEach(([schemaName, value]) => {
		const unsupportedTypes = scanFieldTypes(
			value as Record<string, unknown>,
			schemaName,
		);
		unsupportedTypes.forEach((types, name) => {
			if (!allUnsupportedTypes.has(name)) {
				allUnsupportedTypes.set(name, new Set());
			}
			types.forEach((type) => {
				allUnsupportedTypes.get(name)!.add(type);
			});
		});
	});

	// Log unsupported types if any found
	if (allUnsupportedTypes.size > 0) {
		console.log("\n⚠️  Unsupported field types detected:");
		allUnsupportedTypes.forEach((types, schemaName) => {
			const typesList = Array.from(types).sort().join(", ");
			console.log(`  ${schemaName}: ${typesList}`);
		});
		console.log(
			`\nSupported types: ${SUPPORTED_FIELD_TYPES.sort().join(", ")}\n`,
		);

		// Collect all unique unsupported types across all schemas
		const allUniqueTypes = new Set<string>();
		allUnsupportedTypes.forEach((types) => {
			types.forEach((type) => {
				allUniqueTypes.add(type);
			});
		});
		const typesList = Array.from(allUniqueTypes).sort().join(", ");
		const typesCount = allUniqueTypes.size;

		// Ask user if they want to continue
		const shouldContinue = await confirm({
			message: `Continue with ${typesCount} unsupported type${typesCount === 1 ? "" : "s"}?`,
			default: false,
		});

		if (!shouldContinue) {
			console.log("\n❌ Generation cancelled.");
			process.exit(1);
		}

		console.log(
			`\n✓ Continuing with ${typesCount} undefined type${typesCount === 1 ? "" : "s"}: ${typesList}\n`,
		);
	}

	const fileset = Object.entries(parsedYaml).flatMap(([key, value]) => {
		const sanityFields = createSchema(value as Record<string, unknown>);
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
				modifyFile,
			});
			await result; // Resolve promise if it's async, otherwise await undefined
		}),
	);

	console.log(`✅ Generated ${fileset.length} files for ${name}`);
};
