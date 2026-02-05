import assert from "node:assert/strict";
import test from "node:test";

import { buildPrListFromUrl } from "../src/actions/pr-list.ts";

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
