/**
 * Shared library configuration
 * This allows field handlers to access config defaults
 */

export type LibraryConfig = {
	fieldDefaults?: {
		text?: {
			rows?: number;
		};
	};
};

// Default configuration
const defaultConfig: LibraryConfig = {
	fieldDefaults: {
		text: {
			rows: 3,
		},
	},
};

// Current library configuration
let currentConfig: LibraryConfig = { ...defaultConfig };

/**
 * Set the library configuration
 * This can be called by users or passed to generateFileset
 */
export function setLibraryConfig(config: Partial<LibraryConfig>) {
	currentConfig = {
		...defaultConfig,
		...config,
		fieldDefaults: {
			...defaultConfig.fieldDefaults,
			...config.fieldDefaults,
			text: {
				...defaultConfig.fieldDefaults?.text,
				...config.fieldDefaults?.text,
			},
		},
	};
}

/**
 * Get the current library configuration
 */
export function getLibraryConfig(): LibraryConfig {
	return currentConfig;
}

/**
 * Reset to default configuration
 */
export function resetLibraryConfig() {
	currentConfig = { ...defaultConfig };
}
