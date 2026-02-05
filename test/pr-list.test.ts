import assert from "node:assert/strict";
import test from "node:test";

import { buildPrListFromUrl } from "../src/actions/pr-list.ts";

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
