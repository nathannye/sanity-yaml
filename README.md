
> 🚨 This library is under active development, syntax is up for grabs at the moment but the premise will remain the same. I highly recommend not installing this while I work out the kinks

# What is this
A bulk Sanity.io schema and component generator. Write your schemas (images, arrays, objects, whatecer you want) in yaml with basic validation rules and print them to files using handlebars templates.

# Why
One of the first steps to building a new CMS-driven site is creating the schemas/sections and the matching frontend components. It's not fast work, for me it's 90m to an hour at least, every time. So to save myself some time I made this, much faster to write a yaml-ish syntax and generate proper schemas and files than to type it all by hand, or leave it up to interpretation by your model of choice

Highly inspired by [plop.js](https://www.npmjs.com/package/plop). An absolutely incredible library for one-off file generation.


# How it works: Syntax
To get started, write up a `.yaml file` using the syntax described below.

## Gotchas
90% of the syntax is native yaml. But we don't have support for native yaml arrays. The `[]` was chosen over this for its similarity to typescript (LINK TO THIS) and removing the need for keys in arrays, as Sanity doesn't need them either.

## Basics
The basic structure of schemas within YAML is key/value pairs. Keys are field names, and values are field types.

## Supported Field Types

| Sanity Field Type | Basic YAML Syntax             | Description                                   | Advanced Syntax Example                |
|:------------------|:-----------------------------|:-----------------------------------------------|:---------------------------------------|
| `array`           | `tags[]: {fieldName}`        | Array of any field type                        |                                         |
| `boolean`         | `isActive: boolean`          | `true`/`false` value                           |                                         |
| `date`            | `eventDate: date`            | ISO-format date string                         |                                         |
| `datetime`        | `publishedDate: datetime`    | ISO-format date/time string                    |                                         |
| `email`           | `contact: email`             | String field with added email validation rule  |                                         |
| `geopoint`        | `location: geopoint`         | Point with lat/lng                             |                                         |
| `image`           | `thumbnail: image`           | Sanity image field                             |                                         |
| `number`          | `count: number`              | Numeric value (integer or float)               |                                         |
| `object`          | ``` stuff: -thing - thing ```| Nested fields as an object                     |                                         |
| `reference`       | `author: ->author`           | Reference (relation) to another document       | `category: ->category[]` (array of refs)|
| `reference array` | `clothing[]: ->(shirts,pants)` | Reference (relation) to another document       | `category: ->category[]` (array of refs)|
| `slug`            | `slug: slug`                 | Slug with optional soure parameter             |  `slug: slug(title)`                    |
| `string`          | `name: string`               | Plain text string                              | `status: string(active, inactive)`      |
| `text`            | `description: text(4)`       | Plain text with multiple lines                 |                                         |


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

# How it works: Template partials
Handlebars is used as the template engine to generate files. 3 partials are exposed for use in your templates. Each partial requires specific property names:

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