import { defineField } from "sanity";
import { createPreview } from "../../utils/preview";

export default {
	name: "mySlice",
	title: "",
	type: "object",
	fields: [
		defineField({
			name: "slug",
			type: "slug",
			validation: (Rule: any) => Rule.required(),
		}),
		defineField({
			name: "stuff",
			type: "object",
			fields: [
				defineField({
					name: "you",
					type: "string",
				}),
				defineField({
					name: "them",
					type: "string",
				}),
				defineField({
					name: "listItems",
					type: "array",
					of: [
						{
							type: "object",
							fields: [
								defineField({
									name: "name",
									type: "string",
								}),
								defineField({
									name: "other",
									type: "number",
								}),
							],
						},
					],
				}),
			],
		}),
		defineField({
			name: "title",
			type: "string",
		}),
		defineField({
			name: "date",
			type: "datetime",
			validation: (Rule: any) => Rule.max(4).required(),
		}),
		defineField({
			name: "itemsWithOptions",
			type: "array",
			of: [{ type: "string" }],
		}),
		defineField({
			name: "items",
			type: "string",
		}),
		defineField({
			name: "ref",
			type: "reference",
			to: [{ type: "stuff" }],
		}),
		defineField({
			name: "docs",
			type: "array",
			of: [{ type: "file" }],
		}),
		defineField({
			name: "description",
			type: "text",
		}),
		defineField({
			name: "refArr",
			type: "array",
			of: [{ type: "reference" }],
		}),
		defineField({
			name: "contact",
			type: "string",
			validation: (Rule: any) => Rule.email(),
		}),
		defineField({
			name: "count",
			type: "number",
		}),
		defineField({
			name: "itemList",
			type: "string",
		}),
		defineField({
			name: "points",
			type: "geopoint",
		}),
	],
	preview: createPreview(""),
};
