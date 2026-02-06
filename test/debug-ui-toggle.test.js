import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const actionPath = path.resolve("src", "actions", "pr-list.ts");
const actionSource = fs.readFileSync(actionPath, "utf8");

test("debug UI toggle remains available", () => {
	assert.match(actionSource, /PR_AUTOINC_DEBUG_UI/);
});
