import fs from "node:fs";
import { defaultCompilerOptions, type CompilerOptions } from "../compile.js";
import type { Runtime } from "./type.js";
import * as pathToRegexp from "path-to-regexp";

/**
 * Returns the code for the `runtime.js` module
 */
export function createRuntimeFile(args: {
	baseLocale: string;
	locales: string[];
	compilerOptions: {
		strategy: NonNullable<CompilerOptions["strategy"]>;
		cookieName: NonNullable<CompilerOptions["cookieName"]>;
		pathnames?: CompilerOptions["pathnames"];
	};
}): string {
	return `
import * as pathToRegexp from "@inlang/paraglide-js/path-to-regexp";

${injectCode("./variables.js")
	.replace(`<base-locale>`, `${args.baseLocale}`)
	.replace(`["<base-locale>"]`, `["${args.locales.join('", "')}"]`)
	.replace(`["variable"]`, `["${args.compilerOptions.strategy.join('", "')}"]`)
	.replace(`<cookie-name>`, `${args.compilerOptions.cookieName}`)
	.replace(
		`pathnames = {}`,
		`pathnames = ${JSON.stringify(args.compilerOptions.pathnames ?? {}, null, 2)}`
	)}

/**
 * Define the \`getLocale()\` function.
 *
 * Use this function to define how the locale is resolved. For example,
 * you can resolve the locale from the browser's preferred language,
 * a cookie, env variable, or a user's preference.
 *
 * @example
 *   defineGetLocale(() => {
 *     // resolve the locale from a cookie. fallback to the base locale.
 *     return Cookies.get('locale') ?? baseLocale
 *   }
 *
 * @param {() => Locale} fn
 * @type {(fn: () => Locale) => void}
 */
export const defineGetLocale = (fn) => {
	getLocale = fn;
};

/**
 * Define the \`setLocale()\` function.
 *
 * Use this function to define how the locale is set. For example,
 * modify a cookie, env variable, or a user's preference.
 *
 * @example
 *   defineSetLocale((newLocale) => {
 *     // set the locale in a cookie
 *     return Cookies.set('locale', newLocale)
 *   });
 *
 * @param {(newLocale: Locale) => void} fn
 */
export const defineSetLocale = (fn) => {
	setLocale = fn;
};

${injectCode("./get-locale.js")} 

${injectCode("./set-locale.js")}

${injectCode("./is-locale.js")}

${injectCode("./assert-is-locale.js")}

${injectCode("./localize-path.js")}

${injectCode("./de-localize-path.js")}

${injectCode("./extract-locale-from-pathname.js")}

${injectCode("./extract-locale-from-request.js")}

${injectCode("./extract-locale-from-cookie.js")}

// ------ TYPES ------

/**
 * A locale that is available in the project.
 *
 * @example
 *   setLocale(request.locale as Locale)
 *
 * @typedef {(typeof locales)[number]} Locale
 */

`;
}

/**
 * Load a file from the current directory.
 *
 * Prunes the imports on top of the file as the runtime is
 * self-contained.
 *
 * @param {string} path
 * @returns {string}
 */
function injectCode(path: string): string {
	const code = fs.readFileSync(new URL(path, import.meta.url), "utf-8");
	// Regex to match single-line and multi-line imports
	const importRegex = /import\s+[\s\S]*?from\s+['"][^'"]+['"]\s*;?/g;
	return code.replace(importRegex, "").trim();
}

/**
 * Returns the runtime module as an object for testing purposes.
 *
 * @example
 *   const runtime = await createRuntime({
 *      baseLocale: "en",
 *      locales: ["en", "de"],
 *   })
 */
export async function createRuntimeForTesting(args: {
	baseLocale: string;
	locales: string[];
	compilerOptions?: {
		strategy?: CompilerOptions["strategy"];
		cookieName?: CompilerOptions["cookieName"];
		pathnames?: CompilerOptions["pathnames"];
	};
}): Promise<Runtime> {
	const file = createRuntimeFile({
		baseLocale: args.baseLocale,
		locales: args.locales,
		compilerOptions: {
			...defaultCompilerOptions,
			strategy: ["variable"],
			...args.compilerOptions,
		},
	})
		// remove the import statement for path-to-regexp
		.replace(
			`import * as pathToRegexp from "@inlang/paraglide-js/path-to-regexp";`,
			""
		);

	// @ts-expect-error - defining a depdency globally to avoid importing it in the runtime
	globalThis.pathToRegexp = pathToRegexp;

	return await import(
		"data:text/javascript;base64," +
			Buffer.from(file, "utf-8").toString("base64")
	);
}
