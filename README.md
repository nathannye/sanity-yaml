
> 🚨 This library is under active development, breaking changes are to be expected while I figure out the best way to use this.

# What is this
A bulk Sanity.io schema and component generator. Write your schemas like this: 

```yaml 

heroSection:
  title!40: string
  subtitle: text
  image[]: image
  tags: string(option1, option2, options3)
  ctaLink: string
```

And generate this: 

```ts
export default {
  name: 'heroSection',
  title: 'Hero Section',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (Rule: any) => Rule.max(40).required()
    }),
    defineField({
      name: 'subtitle',
      type: 'text',
      options: {
        rows: 3
      }
    }),
    defineField({
      name: 'image',
      type: 'array',
      of: [
        { type: 'image' }
      ]
    }),
    defineField({
      name: 'tags',
      type: 'string',
      options: {
        list: ['option1', 'option2', 'options3']
      }
    }),
    defineField({
      name: 'ctaLink',
      type: 'string'
    })
  ]
};
```


**Why does it exist?**
<br/>
One of the first steps to building a new CMS-driven site is creating the schemas and the matching frontend components. It's not fast work, for me it's 90m to an hour every time I start a new project. I had originally used [plop.js](https://www.npmjs.com/package/plop), a phenomenal tool, Big up to Plop. But I still had to write length Sanity schemas and plop only makes one file at a time. So I wanted to save a bit more time and gen them all upfront.


> 👀 Highly inspired by [plop.js](https://www.npmjs.com/package/plop). An absolutely incredible library for one-off file generation.

## Table of Contents

- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Project Structure](#project-structure)
  - [Configuration File](#configuration-file)
  - [YAML Schema File](#yaml-schema-file)
  - [Handlebars Templates](#handlebars-templates)
  - [Running](#running)
- [How it works: Syntax](#how-it-works-syntax)
  - [Gotchas](#gotchas)
  - [Basics](#basics)
  - [Supported Field Types](#supported-field-types)
  - [Using Custom Sanity Types](#using-custom-sanity-types)
  - [Field Validation](#field-validation)
  - [Example](#example)
- [How it works: Templates](#how-it-works-templates)
  - [Available Data](#available-data)
  - [Handlebars Helpers](#handlebars-helpers)
  - [Template Partials](#template-partials)

# Getting Started

## Installation

Install the package in your project:

```bash
# Using pnpm
pnpm add sanity-yaml

# Using npm
npm install sanity-yaml
```

## Project Structure

Create the following files in your project:

```
your-project/
├── sanity-yaml.config.ts    # Configuration file
├── schemas.yaml              # Your schema definitions
└── templates/                # Your Handlebars templates
    ├── schema.hbs
    └── component.hbs
```

## Configuration File

Create a `sanity-yaml.config.ts` or `sanity-yaml.config.js` file in your project root:

```typescript
import type { GeneratorConfig } from "sanity-yaml";

const config: GeneratorConfig = {
  // Optional: Set default field options, only text is supported currently
  fieldDefaults: {
    text: {
      rows: 4, // Default rows for text fields
    },
  },

  // Optional: Remove defineField wrapper from generated fields
  // When true, fields will be plain objects instead of defineField() calls
  removeDefineField: false,

  // Required: Define your filesets
  filesets: {
    // Each fileset generates files for schemas in a YAML file
    yourFilesetName: {
      inputPath: "./schemas.yaml",
      onFileCreate: async ({ name, sanityFields, typeDefinition, renderTemplate, modifyFile }) => {
        // Generate Sanity schema file using templateFile (path to .hbs file)
        // Note: Output directories are created automatically if they don't exist
        // You can use Handlebars helpers in template paths too!
        await renderTemplate({
          templateFile: "./templates/{{name}}.hbs",  // Template path supports Handlebars
          data: { name, sanityFields },
          outputPath: `./generated/schemas/{{kebabCase name}}.ts`,  // Output path supports Handlebars
        });

        // Generate JSX component file using templateFile
        // Both templateFile and outputPath support Handlebars helpers
        await renderTemplate({
          templateFile: "./templates/{{kebabCase name}}-component.hbs",
          data: { name, typeDefinition },
          outputPath: `./generated/components/{{kebabCase name}}.tsx`,
        });

        // Add import to index file using direct template string
        // Use 'template' parameter for inline template strings
        // The regex option inserts content AFTER the matched pattern (doesn't replace it)
        await modifyFile({
          template: "import {{pascalCase name}} from './{{name}}/{{pascalCase name}}.tsx'\n",
          data: { name },
          targetFile: "./generated/schemas/index.ts",
          regex: "const sections = \{", // Inserts import statement after this line
        });
      },
    },
  },
};

export default config;
```

## YAML Schema File

Create a YAML file (e.g., `schemas.yaml`) with your schema definitions:

```yaml
heroSection:
  title!: string
  subtitle: text
  image: image
  ctaText: string
  ctaLink: string

blogPost:
  title!: string
  slug!: slug(title)
  publishedDate!: datetime
  author: ->author
  content: text
  tags[]: string
  featuredImage: image
```

## Handlebars Templates

Create template files (`.hbs`) that use Handlebars syntax:

**`templates/schema.hbs`** - Generates Sanity schema:
```handlebars
{{#unless (shouldRemoveDefineField)}}
import { defineField } from "sanity";
{{/unless}}

export default {
  name: '{{name}}',
  title: '{{titleCase name}}',
  type: 'object',
  fields: [
    {{> sanity-fields fields=sanityFields}}
  ],
};
```

> 💡 When `removeDefineField: true` is set in your config, fields will be generated as plain objects instead of `defineField()` calls.
> 🧠 The component-props will give your linter a heart attack if you have unused-arguments enabled. Use this only if you are okay having a bunch of unused props in each file.
**`templates/component.hbs`** - Generates JSX component:
```handlebars
interface {{pascalCase name}}Props {
{{> jsx-types typeDefinition=typeDefinition}}
}

const {{pascalCase name}} = ({ {{> component-props typeDefinition=typeDefinition}} }: {{pascalCase name}}Props) => {
  return (
    <section>
      <h1>{{titleCase name}}</h1>
    </section>
  );
};

export default {{pascalCase name}};
```

**`templates/import.hbs`** - Template for adding exports to index file:
```handlebars
export * from './{{name}}';
```

## Running

After setting up your config and YAML files:

```bash
# Using pnpm
pnpm sanity-yaml

# Using npm
npm sanity-yaml

# With custom config path
pnpm sanity-yaml --config ./my-config.ts
```

---

# How it works: Syntax
To get started, write up a `.yaml file` using the syntax described below.

## Gotchas
99% of the syntax is native yaml. But the array syntax had some liberties taken to keep it closer to typescript:

### Arrays

**Native YAML for arrays of key/value pairs**
🚨 Do NOT use this, it is not supported
```yaml
arrayName:
  - field1: string
    field2: number
```

**Our syntax**
We re-use the native object syntax and keep the array `[]` modifier used on other fields, ex: `string[]`.
```yaml
arrayName[]:
  - field1: string
  - field2: number
```

**For arrays of simple types**, use the simpler syntax:
```yaml
tags[]: string
numbers[]: number
```

## Basics
The basic structure of schemas within YAML is key/value pairs. Keys are field names, and values are field types. Some fields support options with the () syntax.

## Supported Field Types

| Sanity Field Type | Basic Syntax                        | Description                                   | Advanced Syntax Example                |
|:------------------|:------------------------------------|:-----------------------------------------------|:---------------------------------------|
| `array`           | `tags[]: string` or `items[]: -field: type` | Array of any field type                        | Simple: `tags[]: string`, Objects: `items[]: -field1: string -field2: number` |
| `boolean`         | `isActive: boolean`                 | `true`/`false` value                           |                                        |
| `date`            | `eventDate: date`                   | ISO-format date string                         |                                        |
| `datetime`        | `publishedDate: datetime`           | ISO-format date/time string                    |                                        |
| `email`           | `contact: email`                    | String field with added email validation rule  |                                        |
| `file`            | `annualReport: file`                | File upload field                              | Format requirements: `annualReports: file(pdf,docx)` |
| `geopoint`        | `location: geopoint`                | Point with lat/lng/alt                         |                                        |
| `image`           | `thumbnail: image`                  | Sanity image field                             |                                        |
| `number`          | `count: number`                     | Numeric value (integer or float)               |                                        |
| `object`          | `address: -street: string -city: string` | Nested fields as an object                   | Multiple fields: `address: -street: string -city: string -zip: number` |
| `reference`       | `author: ->author`                  | Reference (relation) to another document       | Single: `author: ->author`, Array: `categories[]: ->category`, Multiple types: `clothing[]: ->(shirts,pants)` |
| `slug`            | `slug: slug`                        | Slug field automatically generated from a source | Use another field as source: `slug: slug(title)` |
| `string`          | `name: string`                      | Plain text string                              | List options: `status: string(active, inactive)`  |
| `text`            | `description: text`                 | Plain text with multiple lines                 | Row amount: `description: text(4)`     |
| `url`             | `website: url`                     | URL field with validation                      |                                        |


> 📝 A note on arrays: They can be mixed with ANY type. image[], number[], whatever you want.

## Using Custom Sanity Types

You can use any Sanity schema type that exists in your project, even if it's not in the supported types list above. Common examples include:
- `portableText` - Sanity's rich text block content
- `code` - Code blocks with syntax highlighting from a plugin
- Any custom types you've defined in your Sanity schema

When you use an unrecognized type:
1. The generator will detect it and show a warning listing all unrecognized types
2. You'll be prompted to confirm if you want to continue
3. If you continue, these fields will be:
   - Included in your Sanity schema files (using the type name as-is)
   - Typed as `any` in your TypeScript type definitions

**Example:**
```yaml
blogPost:
  title!: string
  content: portableText  # Custom Sanity type
  codeBlock: code        # Another custom type
```

When you run the generator, you'll see:
```
⚠️  Unsupported field types detected:
  blogPost: portableText, code

Supported types: array, boolean, date, datetime, email, file, geopoint, image, number, object, reference, slug, string, text

Continue with 2 unsupported types? (y/N)
```

After confirming, these fields will be generated with their Sanity types intact, but TypeScript will type them as `any`.

## Field Validation
All field validation works together

### Required
An exclamation point `!` after the field name and before the colon, marks a field required and compiles to: Rule = () => Rule.required()`

```yaml
SliceName
  fieldName!: string
```

### Maximum Length
A number after the field name and before the colon marks a field as needing a max number of items or characters. Compiles to: `validation: (Rule: any)=>Rule.max(number)`.
```yaml
SliceName:
  fieldName4: string  # Requires minimum 4 characters
```

# Example

Here's a complete example showing various field types:

```yaml
heroSection:
  title!: string
  subtitle: text
  image: image
  ctaText!: string
  ctaLink!4: string
  tags[]: string

blogPost:
  title!: string
  slug!: slug(title)
  publishedDate!: datetime
  author: ->author
  categories[]: ->category
  content: text(10)
  featuredImage: image
  metadata: -description: string -keywords: string[]
```

# How it works: Templates

Handlebars is used as the template engine to generate files. You have access to several built-in helpers and partials.

## Available Data

Each template receives the following data:
- `name` - The schema name (e.g., "heroSection")
- `title` - Title case version of the name (e.g., "Hero Section")
- `sanityFields` - Array of processed Sanity field definitions
- `typeDefinition` - TypeScript type definitions as an object

### onFileCreate Callback Arguments

The `onFileCreate` callback receives an object with the following properties:

- `name` - The schema name as a string (e.g., `"heroSection"`)
- `sanityFields` - Array of processed Sanity field definitions
- `typeDefinition` - TypeScript type definitions as an object
- `renderTemplate` - Function to render a Handlebars template
- `modifyFile` - Function to modify an existing file

### Template Parameters: `templateFile` vs `template`

Both `renderTemplate` and `modifyFile` accept either `templateFile` or `template` (but not both):

- **`templateFile`** - Path to a Handlebars template file (`.hbs`). The path itself supports Handlebars syntax for dynamic file selection.
- **`template`** - Direct template string. Use this for inline templates without needing a separate file.

You must provide exactly one of these parameters. If you provide `templateFile` but the file doesn't exist, you'll get a helpful error suggesting you might want to use `template` instead.

**Example:**
```typescript
onFileCreate: async ({ name, sanityFields, typeDefinition, renderTemplate, modifyFile }) => {
  // Using templateFile - path to a template file
  await renderTemplate({
    templateFile: "./templates/{{name}}.hbs",
    // Renders to: ./templates/heroSection.hbs, then reads that file
    data: { name, typeDefinition },
    outputPath: `./src/components/{{kebabCase name}}.tsx`,
    // Renders to: ./src/components/hero-section.tsx
  });
  
  // Using templateFile with dynamic path selection
  await renderTemplate({
    templateFile: "./templates/{{kebabCase name}}-component.hbs",
    // Renders to: ./templates/hero-section-component.hbs
    data: { name, typeDefinition },
    outputPath: `./src/types/{{pascalCase name}}.ts`,
    // Renders to: ./src/types/HeroSection.ts
  });
  
  // Using template - direct template string (no file needed)
  await modifyFile({
    template: "import {{pascalCase name}} from './{{name}}/{{pascalCase name}}.tsx'\n",
    // Direct template string, no file needed
    data: { name },
    targetFile: "./src/components/{{kebabCase name}}/index.ts",
    // Renders to: ./src/components/hero-section/index.ts
    regex: "const sections = \{", // Optional: inserts content AFTER this pattern
  });
}
```

> 💡 **Note:** The `templateFile` parameter path is processed as a Handlebars template before resolving the file path, so you can dynamically select template files based on the schema name or other data properties. This is especially useful when you have multiple template variants or want to organize templates by naming conventions.

### `modifyFile` Behavior

The `modifyFile` function modifies existing files by inserting or appending content:

- **Without `regex`**: Appends the rendered template content to the end of the file
- **With `regex`**: Finds the first match of the regex pattern and inserts the rendered template content **after** the match (the matched content is preserved)

**Example with regex:**
If your file contains:
```typescript
const sections = {
  // existing code
}
```

And you call:
```typescript
await modifyFile({
  template: "import HeroSection from './heroSection'\n",
  data: { name: "heroSection" },
  targetFile: "./index.ts",
  regex: "const sections = \{",
});
```

The result will be:
```typescript
const sections = {
import HeroSection from './heroSection'
  // existing code
}
```

The matched pattern (`const sections = \{`) is preserved, and the template content is inserted right after it.

## Handlebars Helpers

### Casing Utilities

The following casing helpers are available for transforming the `name` or any string:

- `{{pascalCase name}}` - `heroSection` → `HeroSection`
- `{{camelCase name}}` - `hero-section` → `heroSection`
- `{{kebabCase name}}` - `heroSection` → `hero-section`
- `{{titleCase name}}` - `hero section` → `Hero Section`
- `{{sentenceCase name}}` - `hero section` → `Hero section`
- `{{snakeCase name}}` - `heroSection` → `hero_section`

**Example:**
```handlebars
<!-- Component name -->
const {{pascalCase name}} = ...

<!-- File name -->
export * from './{{kebabCase name}}'

<!-- Display name -->
<h1>{{titleCase name}}</h1>
```

## Template Partials

Three built-in partials are available for use in your templates (no setup required). Each partial requires specific property names:

## `component-props`
Generates component props destructuring for JSX components.

```hbs
const MyComponent = ({ {{> component-props typeDefinition=typeDefinition}} }: MyComponentProps) => {
```

Outputs: `field1, field2, field3`

## `jsx-types`
Generates TypeScript interface properties from type definitions for TSX files (sorry Vue!).

```hbs
interface MyComponentProps {
{{> jsx-types typeDefinition=typeDefinition}}
}
```

Outputs:
```ts
  field1: string;
  field2: number;
  field3: boolean;
```

## `sanity-fields`
Generates Sanity field definitions from your schema fields.

```hbs
fields: [
  {{> sanity-fields fields=sanityFields}}
]
```

Outputs complete Sanity `defineField` calls for all field types.

## Full Frontend Template file example
```hbs
<!-- jsx-types only utputs the types, NOT the type or interface wrapper -->
interface {{pascalCase name}}Props {
{{> jsx-types typeDefinition=typeDefinition}}
}

const {{pascalCase name}} = ({ {{> component-props typeDefinition=typeDefinition}} }: {{pascalCase name}}Props) => {
  return (
    <section>
			<h2>Section: {{name}}</h2>
    </section>
  )
}

export default {{pascalCase name}}


```

## Fill Sanity Schema file example

```hbs

import { defineField } from "sanity";

export default {
    name: '{{name}}',
    title: '{{title}}',
    type: 'object',
    fields: [
        {{> sanity-fields fields=sanityFields}}
    ],
    preview: {
			prepare(){
				return {
					title: '{{name}}'
				}
			}
		}
}

```