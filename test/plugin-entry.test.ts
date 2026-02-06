import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const pluginPath = path.resolve("src", "plugin.ts");
const pluginSource = fs.readFileSync(pluginPath, "utf8");

test("plugin entrypoint relies on decorator registration only", () => {
	assert.ok(!pluginSource.includes("registerAction("));
	assert.ok(!pluginSource.includes(".actions.registerAction"));
	assert.ok(!pluginSource.includes("new PRListAction"));
	assert.ok(pluginSource.includes('import "./actions/pr-list'));
	assert.ok(pluginSource.includes("streamDeck.connect()"));
});
