import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const prListPath = path.resolve("src", "actions", "pr-list.ts");
const prListSource = fs.readFileSync(prListPath, "utf8");

test("debug UI toggle environment variable is referenced", () => {
	assert.ok(prListSource.includes("PR_AUTOINC_DEBUG_UI"));
});
