import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const sourcePath = path.resolve("src", "plugin.ts");
const sourceText = fs.readFileSync(sourcePath, "utf8");

test("plugin entrypoint uses decorator-based registration only", () => {
	assert.ok(
		!sourceText.includes("registerAction("),
		"plugin.ts should not register actions manually"
	);
	assert.ok(
		!sourceText.includes(".actions.registerAction"),
		"plugin.ts should not call streamDeck.actions.registerAction"
	);
	assert.ok(
		!sourceText.includes("new PRListAction"),
		"plugin.ts should not instantiate PRListAction directly"
	);
	assert.ok(
		sourceText.includes('import "./actions/pr-list'),
		"plugin.ts should import the action module for side effects"
	);
	assert.ok(sourceText.includes("streamDeck.connect()"), "plugin.ts should connect");
});

test("build output includes plugin entrypoint and no manual registration", () => {
	const compiledPath = path.resolve(
		"com.futuroptimist.prlist.sdPlugin",
		"bin",
		"plugin.js"
	);

	assert.ok(fs.existsSync(compiledPath), "compiled plugin.js should exist after build");

	const compiledText = fs.readFileSync(compiledPath, "utf8");

	assert.ok(
		compiledText.includes("connect("),
		"compiled output should connect to Stream Deck"
	);
	assert.ok(
		!compiledText.includes("registerAction("),
		"compiled output should not register actions manually"
	);
});
