import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);

function loadPrListModule() {
	const sourcePath = new URL("../src/actions/pr-list.ts", import.meta.url);
	const source = require("node:fs").readFileSync(sourcePath, "utf8");
	const compiled = ts.transpileModule(source, {
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2022,
		},
	});

	const module = { exports: {} };
	const wrapper = new Function(
		"exports",
		"require",
		"module",
		"__filename",
		"__dirname",
		compiled.outputText
	);
	wrapper(
		module.exports,
		require,
		module,
		sourcePath.pathname,
		new URL("..", sourcePath).pathname
	);
	return module.exports;
}

const { buildPrListFromUrl } = loadPrListModule();

test("buildPrListFromUrl returns four incrementing URLs", () => {
	const input = "https://github.com/octo-org/octo-repo/pull/42";
	const output = buildPrListFromUrl(input, 4);

	assert.equal(
		output,
		"- https://github.com/octo-org/octo-repo/pull/42\n" +
			"- https://github.com/octo-org/octo-repo/pull/43\n" +
			"- https://github.com/octo-org/octo-repo/pull/44\n" +
			"- https://github.com/octo-org/octo-repo/pull/45"
	);
});

test("buildPrListFromUrl accepts a trailing slash", () => {
	const input = "https://github.com/octo-org/octo-repo/pull/100/";
	const output = buildPrListFromUrl(input, 4);

	assert.equal(
		output,
		"- https://github.com/octo-org/octo-repo/pull/100\n" +
			"- https://github.com/octo-org/octo-repo/pull/101\n" +
			"- https://github.com/octo-org/octo-repo/pull/102\n" +
			"- https://github.com/octo-org/octo-repo/pull/103"
	);
});

test("buildPrListFromUrl throws on invalid input", () => {
	assert.throws(() => buildPrListFromUrl("not a url"), /does not match/);
});
