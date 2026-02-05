import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const compiledPath = path.resolve(
	"com.futuroptimist.prlist.sdPlugin",
	"bin",
	"actions",
	"pr-list.js"
);
const compiledCode = fs.readFileSync(compiledPath, "utf8");
const compiledModule = { exports: {} };
const compiledDir = path.dirname(compiledPath);
const wrapper = `(function (exports, require, module, __filename, __dirname) {\n${compiledCode}\n});`;
const script = new vm.Script(wrapper, { filename: compiledPath });
const execute = script.runInThisContext();
execute(compiledModule.exports, require, compiledModule, compiledPath, compiledDir);
const { buildPrListFromUrl } = compiledModule.exports;

if (!buildPrListFromUrl) {
	throw new Error("buildPrListFromUrl export not found in compiled output");
}

test("buildPrListFromUrl builds four lines for a valid PR URL", () => {
	const result = buildPrListFromUrl("https://github.com/octo/repo/pull/42");

	assert.equal(
		result,
		[
			"- https://github.com/octo/repo/pull/42",
			"- https://github.com/octo/repo/pull/43",
			"- https://github.com/octo/repo/pull/44",
			"- https://github.com/octo/repo/pull/45"
		].join("\n")
	);
});

test("buildPrListFromUrl handles trailing slash and whitespace", () => {
	const result = buildPrListFromUrl("https://github.com/octo/repo/pull/7/  ");

	assert.equal(
		result,
		[
			"- https://github.com/octo/repo/pull/7",
			"- https://github.com/octo/repo/pull/8",
			"- https://github.com/octo/repo/pull/9",
			"- https://github.com/octo/repo/pull/10"
		].join("\n")
	);
});

test("buildPrListFromUrl throws on invalid input", () => {
	assert.throws(() => buildPrListFromUrl("https://github.com/octo/repo/issues/1"));
});
