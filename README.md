
> 🚨 This library is under active development, syntax is up for grabs at the moment but the premise will remain the same. I highly recommend not installing this while I work out the kinks

# What is this
A bulk Sanity.io schema and component generator. Write your schemas (images, arrays, objects, whatecer you want) in yaml with basic validation rules and print them to files using handlebars templates.

# Why
One of the first steps to building a new CMS-driven site is creating the schemas/sections and the matching frontend components. It's not fast work, for me it's 90m to an hour at least, every time. So to save myself some time I made this, much faster to write a yaml-ish syntax and generate proper schemas and files than to type it all by hand, or leave it up to interpretation by your model of choice

Highly inspired by [plop.js](https://www.npmjs.com/package/plop). An absolutely incredible library for one-off file generation.


# Getting Started

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
  // Optional: Set default field options, only text is supported at curent
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

## Basics
The basic structure of schemas within YAML is key/value pairs. Keys are field names, and values are field types. Some fields support options with the () syntax.

## Supported Field Types

| Sanity Field Type | Basic Syntax                        | Description                                   | Advanced Syntax Example                |
|:------------------|:------------------------------------|:-----------------------------------------------|:---------------------------------------|
| `array`           | `tags[]: {fieldName}`               | Array of any field type                        | Can be used with any field type        |
| `boolean`         | `isActive: boolean`                 | `true`/`false` value                           |                                        |
| `date`            | `eventDate: date`                   | ISO-format date string                         |                                        |
| `datetime`        | `publishedDate: datetime`           | ISO-format date/time string                    |                                        |
| `email`           | `contact: email`                    | String field with added email validation rule  |                                        |
| `file`            | `annualReport: file`                | File upload field                              | Format requirements: `annualReports: file(pdf,docx)` |
| `geopoint`        | `location: geopoint`                | Point with lat/lng/alt                         |                                        |
| `image`           | `thumbnail: image`                  | Sanity image field                             |                                        |
| `number`          | `count: number`                     | Numeric value (integer or float)               |                                        |
| `object`          | ``` stuff: -field: type - thing:type ``` | Nested fields as an object                   |                                        |
| `reference`       | `author: ->author`                  | Reference (relation) to another document       | `category: ->category[]` (array of refs)|
| `reference array` | `clothing[]: ->(shirts,pants)`      | Reference (relation) to another document       |                                        |
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

### Minimum Length
A number `\d+` after the field name and before the colon, marks a field as needing a minimum number of items. Compiles to: `validation: (Rule: any)=>Rule.max(${max})`.
```yaml
SliceName
  fieldName4: string
```

# Example

```yaml
expedition region
name: 
	type: string
	description: stuff
points: string[]
ponts2: {
	- title: string
	- name: number
}[]
- points3: array(string)

expedition
- title: string
- date: date
- region: ->expedition-region
- description: text
- slug: PrefixedSlug
- thing: ->place-mcgee[]

thing
- stuff: {
	- lastname: string
	- firstname: string
}[]
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

Three partials are exposed for use in your templates. Each partial requires specific property names:

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
				title: '{{name}}''
			}
		}
}


```