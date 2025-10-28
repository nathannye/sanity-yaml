import { CONFIG, type GeneratorConfig } from "./config";
import { generateFileset } from "./src/generators";
import { registerHelpers, registerPartials } from "./src/utils/handlebars";

// const slices = yaml.parse(fs.readFileSync("./slices.yaml", "utf8"));

const createStuff = (config: GeneratorConfig) => {
	if (!config.filesets) {
		console.error("No filesets found in config");
		return;
	}

	const filesets = Object.entries(config.filesets).map(([name, fileset]) => {
		const { template, data, output, input } = fileset;

		return generateFileset({ name, input, data, template, output });
	});
};

registerHelpers();
registerPartials("./templates/partials");
// generateFileset("slices", "./slices.yaml");

createStuff(CONFIG);
