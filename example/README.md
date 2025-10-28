# Sanity YAML Generator Example

This example demonstrates how to use the Sanity YAML generator to create Sanity schemas and TypeScript types from YAML definitions.

## Files

- `blog-post.yaml` - Example YAML schema definitions for a blog system
- `config.ts` - Configuration for the generator filesets
- `generate.ts` - Script to run the generation process

## Usage

Run the example generator:

```bash
pnpm example
```

This will:
1. Parse the `blog-post.yaml` file
2. Generate Sanity schema files in `./generated/schemas/`
3. Generate TypeScript type definitions in `./generated/types/`

## YAML Schema Syntax

The example demonstrates various field types:

- **Basic types**: `string`, `number`, `boolean`, `datetime`, `text`
- **Required fields**: `fieldName!: type` (exclamation mark)
- **Arrays**: `fieldName[]: type` or `fieldName: type[]`
- **References**: `fieldName: ->otherSchema`
- **Images**: `fieldName: image`
- **Options**: `fieldName: string(option1, option2)`
- **Objects**: Nested field definitions
- **Slugs**: `fieldName: slug(sourceField)`

## Generated Output

The generator creates:
- Sanity schema files (`.ts`) with `defineField` exports
- TypeScript type definitions for frontend use
- Proper validation rules and field configurations
