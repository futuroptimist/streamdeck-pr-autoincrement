import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const pluginPath = path.resolve("src", "plugin.ts");
const prListPath = path.resolve("src", "actions", "pr-list.ts");
const pluginSource = fs.readFileSync(pluginPath, "utf8");
const prListSource = fs.readFileSync(prListPath, "utf8");

test("plugin crash handlers remain wired", () => {
	assert.ok(pluginSource.includes("uncaughtException"));
	assert.ok(pluginSource.includes("unhandledRejection"));
	assert.ok(pluginSource.includes("streamDeck.connect"));
});

test("PR list action logs stage labels", () => {
	assert.ok(prListSource.includes("READ_CLIPBOARD_START"));
	assert.ok(prListSource.includes("PARSE_START"));
	assert.ok(prListSource.includes("WRITE_CLIPBOARD_START"));
});
