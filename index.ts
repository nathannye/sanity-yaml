import { CONFIG, type GeneratorConfig } from "./config";
import { generateFileset } from "./src/generators";
import { registerHelpers, registerPartials } from "./src/utils/handlebars";

// const slices = yaml.parse(fs.readFileSync("./slices.yaml", "utf8"));

const createStuff = async (config: GeneratorConfig) => {
	if (!config.filesets) {
		console.error("No filesets found in config");
		return;
	}

	const filesetPromises = Object.entries(config.filesets)
		.filter(([name, fileset]) => {
			if (typeof fileset.onFileCreate !== "function") {
				console.error(`File creater callback for ${name} is not a function`);
				return false;
			}
			return true;
		})
		.map(([name, fileset]) => {
			return generateFileset({
				name,
				inputPath: fileset.inputPath,
				onFileCreate: fileset.onFileCreate,
			});
		});

	// Wait for all filesets to complete
	await Promise.all(filesetPromises);

	console.log("✅ All filesets generated successfully");
};

registerHelpers();
// Register internal partials first (so they're available when sanity-fields.hbs needs them)
registerPartials("./templates/partials/internal");
// Register user-exposed partials (in root of partials directory)
registerPartials("./templates/partials");
// generateFileset("slices", "./slices.yaml");

createStuff(CONFIG);
