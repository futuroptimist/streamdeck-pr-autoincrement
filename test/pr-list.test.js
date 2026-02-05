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

test("buildPrListFromUrl allows PR number 0", () => {
	const result = buildPrListFromUrl("https://github.com/octo/repo/pull/0");

	assert.equal(
		result,
		[
			"- https://github.com/octo/repo/pull/0",
			"- https://github.com/octo/repo/pull/1",
			"- https://github.com/octo/repo/pull/2",
			"- https://github.com/octo/repo/pull/3"
		].join("\n")
	);
});

test("buildPrListFromUrl handles large PR numbers within safe integer range", () => {
	const base = Number.MAX_SAFE_INTEGER - 3;
	const result = buildPrListFromUrl(`https://github.com/octo/repo/pull/${base}`);

	assert.equal(
		result,
		[
			`- https://github.com/octo/repo/pull/${base}`,
			`- https://github.com/octo/repo/pull/${base + 1}`,
			`- https://github.com/octo/repo/pull/${base + 2}`,
			`- https://github.com/octo/repo/pull/${base + 3}`
		].join("\n")
	);
});

test("buildPrListFromUrl throws on invalid input", () => {
	assert.throws(() => buildPrListFromUrl("https://github.com/octo/repo/issues/1"));
});

test("buildPrListFromUrl throws when URL does not end with a PR number", () => {
	assert.throws(() =>
		buildPrListFromUrl("https://github.com/octo/repo/pull/123/comments")
	);
});

test("buildPrListFromUrl throws when PR number is missing", () => {
	assert.throws(() => buildPrListFromUrl("https://github.com/octo/repo/pull/"));
});
