import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const pluginPath = path.resolve("src", "plugin.ts");
const pluginSource = fs.readFileSync(pluginPath, "utf8");
const actionPath = path.resolve("src", "actions", "pr-list.ts");
const actionSource = fs.readFileSync(actionPath, "utf8");

test("plugin crash logging hooks remain in place", () => {
	assert.match(pluginSource, /uncaughtException/);
	assert.match(pluginSource, /unhandledRejection/);
	assert.match(pluginSource, /streamDeck\.connect/);
});

test("PR list action stage labels remain in place", () => {
	assert.match(actionSource, /READ_CLIPBOARD_START/);
	assert.match(actionSource, /PARSE_START/);
	assert.match(actionSource, /WRITE_CLIPBOARD_START/);
});
