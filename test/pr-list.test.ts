import assert from "node:assert/strict";
import test from "node:test";

import { buildPrListFromUrl } from "../src/actions/pr-list.js";

test("buildPrListFromUrl builds 4 lines from PR URL", () => {
	const url = "https://github.com/acme/widgets/pull/123";
	const result = buildPrListFromUrl(url);

	assert.equal(
		result,
		[
			"- https://github.com/acme/widgets/pull/123",
			"- https://github.com/acme/widgets/pull/124",
			"- https://github.com/acme/widgets/pull/125",
			"- https://github.com/acme/widgets/pull/126",
		].join("\n")
	);
});

test("buildPrListFromUrl handles trailing slash", () => {
	const url = "https://github.com/acme/widgets/pull/77/";
	const result = buildPrListFromUrl(url);

	assert.equal(
		result,
		[
			"- https://github.com/acme/widgets/pull/77",
			"- https://github.com/acme/widgets/pull/78",
			"- https://github.com/acme/widgets/pull/79",
			"- https://github.com/acme/widgets/pull/80",
		].join("\n")
	);
});

test("buildPrListFromUrl throws on invalid input", () => {
	assert.throws(() => buildPrListFromUrl("not a url"), /expected PR URL pattern/);
});
