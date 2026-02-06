import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const pluginPath = path.resolve("src", "plugin.ts");
const pluginSource = fs.readFileSync(pluginPath, "utf8");

test("plugin entrypoint relies on decorator registration", () => {
	assert.doesNotMatch(pluginSource, /registerAction\s*\(/);
	assert.doesNotMatch(pluginSource, /\.actions\.registerAction/);
	assert.doesNotMatch(pluginSource, /new\s+PRListAction/);
	assert.match(pluginSource, /import\s+["'`]\.\/actions\/pr-list/);
	assert.match(pluginSource, /streamDeck\.connect\s*\(/);
});
