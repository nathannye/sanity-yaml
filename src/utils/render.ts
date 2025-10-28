import { mkdir, readFile, writeFile } from "node:fs/promises";

import type { TemplateData } from "~/types";
import { getCompiledTemplate } from "./paths";

export const renderToFile = async (
	templateName: string,
	data: TemplateData,
	outputPath: string,
	outputName: string,
) => {
	console.log(data);
	// 1) Load template + data
	const templateFile = await getCompiledTemplate(templateName);
	const renderedTemplate = templateFile(data);

	// 3) Write output
	await mkdir(outputPath, { recursive: true });
	await writeFile(`${outputPath}/${outputName}`, renderedTemplate, "utf8");
};
