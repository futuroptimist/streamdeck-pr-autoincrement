import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const prListPath = path.resolve("src", "actions", "pr-list.ts");

test("debug UI toggle env var stays referenced", () => {
	const prListSource = fs.readFileSync(prListPath, "utf8");

	assert.match(prListSource, /PR_AUTOINC_DEBUG_UI/);
});
