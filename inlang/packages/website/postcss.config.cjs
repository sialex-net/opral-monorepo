// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("node:path");

module.exports = {
	plugins: {
		tailwindcss: {
			config: path.join(__dirname, "./tailwind.config.cjs"),
		},
	},
};
