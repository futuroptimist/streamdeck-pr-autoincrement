import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const pluginSourcePath = path.resolve("src", "plugin.ts");
const pluginSource = fs.readFileSync(pluginSourcePath, "utf8");

test("plugin entrypoint relies on decorator registration", () => {
	assert.ok(!/\.actions\.registerAction\s*\(/.test(pluginSource));
	assert.ok(!/registerAction\s*\(/.test(pluginSource));
	assert.ok(!/new\s+PRListAction/.test(pluginSource));
	assert.ok(pluginSource.includes("import \"./actions/pr-list"));
	assert.ok(pluginSource.includes("streamDeck.connect()"));
});
