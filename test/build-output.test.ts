import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const pluginOutputPath = path.resolve(
	"com.futuroptimist.prlist.sdPlugin",
	"bin",
	"plugin.js"
);

test("build output includes plugin entrypoint", () => {
	assert.ok(fs.existsSync(pluginOutputPath), `${pluginOutputPath} should exist`);
});

test("build output uses decorator registration pattern", () => {
	const content = fs.readFileSync(pluginOutputPath, "utf8");

	assert.ok(content.includes("connect("));
	assert.ok(!content.includes("registerAction("));
});
