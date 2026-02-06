import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const pluginPath = path.resolve("src", "plugin.ts");
const prListPath = path.resolve("src", "actions", "pr-list.ts");

test("plugin.ts includes crash/rejection logging hooks", () => {
	const pluginSource = fs.readFileSync(pluginPath, "utf8");

	assert.match(pluginSource, /uncaughtException/);
	assert.match(pluginSource, /unhandledRejection/);
	assert.match(pluginSource, /streamDeck\.connect/);
});

test("pr-list.ts includes stage logging labels", () => {
	const prListSource = fs.readFileSync(prListPath, "utf8");

	assert.match(prListSource, /READ_CLIPBOARD_START/);
	assert.match(prListSource, /PARSE_START/);
	assert.match(prListSource, /WRITE_CLIPBOARD_START/);
	assert.match(prListSource, /SUCCESS/);
});
