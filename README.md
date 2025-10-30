
> 🚨 This library is under active development, breaking changes are to be expected while I figure out the best way to use this.

# What is this
A bulk Sanity.io schema and component generator. Write your schemas (images, arrays, objects, whatever you want) in yaml with basic validation rules and print them to files using handlebars templates.

# Why
One of the first steps to building a new CMS-driven site is creating the schemas/sections and the matching frontend components. It's not fast work, for me it's 90m to an hour at least, every time. So to save myself some time I made this, much faster to write a yaml-ish syntax and generate proper schemas and files than to type it all by hand, or leave it up to interpretation by your model of choice

Highly inspired by [plop.js](https://www.npmjs.com/package/plop). An absolutely incredible library for one-off file generation.


# Getting Started

## Installation

Install the package in your project:

```bash
# Using pnpm
pnpm add sanity-yaml

# Using npm
npm install sanity-yaml
```

**Requirements:**
- Node.js 18+ 
- TypeScript 5.0+ (for TypeScript config files)

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

  // Required: Define your filesets
  filesets: {
    // Each fileset generates files for schemas in a YAML file
    slices: {
      inputPath: "./schemas.yaml",
      onFileCreate: async ({ name, sanityFields, typeDefinition, renderTemplate }) => {
        // Generate Sanity schema file
        // Note: Output directories are created automatically if they don't exist
        await renderTemplate({
          template: "./templates/schema.hbs",
          data: { name, sanityFields },
          outputPath: `./generated/schemas/${name}.ts`,
        });

        // Generate React component file
        await renderTemplate({
          template: "./templates/component.hbs",
          data: { name, typeDefinition },
          outputPath: `./generated/components/${name}.tsx`,
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
import { defineField } from "sanity";

export default {
  name: '{{name}}',
  title: '{{titleCase name}}',
  type: 'object',
  fields: [
    {{> sanity-fields fields=sanityFields}}
  ],
};
```

**`templates/component.hbs`** - Generates React component:
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
99% of the syntax is native yaml. But a few liberties were taken:

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


> 📝 A note on arrays: They can be mixed with ANY type. image[], number[], whatever you want.


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
Generates component props destructuring for React components.

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