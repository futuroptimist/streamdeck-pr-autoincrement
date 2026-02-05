import assert from "node:assert/strict";
import { test } from "node:test";

import { buildPrListFromUrl } from "../src/actions/pr-list.js";

test("buildPrListFromUrl builds four incrementing PR URLs", () => {
	const output = buildPrListFromUrl("https://github.com/org/repo/pull/123");

	assert.equal(
		output,
		[
			"- https://github.com/org/repo/pull/123",
			"- https://github.com/org/repo/pull/124",
			"- https://github.com/org/repo/pull/125",
			"- https://github.com/org/repo/pull/126",
		].join("\n")
	);
});

test("buildPrListFromUrl handles trailing slashes", () => {
	const output = buildPrListFromUrl("https://github.com/org/repo/pull/5/  ");

	assert.equal(
		output,
		[
			"- https://github.com/org/repo/pull/5",
			"- https://github.com/org/repo/pull/6",
			"- https://github.com/org/repo/pull/7",
			"- https://github.com/org/repo/pull/8",
		].join("\n")
	);
});

test("buildPrListFromUrl throws on invalid input", () => {
	assert.throws(() => buildPrListFromUrl("not a pull request"), /pattern/i);
});
