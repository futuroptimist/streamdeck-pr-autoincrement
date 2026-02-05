import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

export async function load(url, context, defaultLoad) {
	if (url.endsWith(".ts")) {
		const source = await readFile(fileURLToPath(url), "utf8");
		const output = ts.transpileModule(source, {
			compilerOptions: {
				module: ts.ModuleKind.ES2022,
				target: ts.ScriptTarget.ES2022
			}
		});
		return {
			format: "module",
			source: output.outputText,
			shortCircuit: true
		};
	}

	return defaultLoad(url, context, defaultLoad);
}
