import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const pluginPath = path.resolve("src", "plugin.ts");
const pluginSource = fs.readFileSync(pluginPath, "utf8");

const prListPath = path.resolve("src", "actions", "pr-list.ts");
const prListSource = fs.readFileSync(prListPath, "utf8");

test("plugin entrypoint includes crash/rejection logging and connect", () => {
	assert.match(pluginSource, /uncaughtException/);
	assert.match(pluginSource, /unhandledRejection/);
	assert.match(pluginSource, /streamDeck\.connect/);
});

test("pr-list action includes stage labels for keydown logging", () => {
	assert.match(prListSource, /READ_CLIPBOARD_START/);
	assert.match(prListSource, /PARSE_START/);
	assert.match(prListSource, /WRITE_CLIPBOARD_START/);
});
