import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const pluginOutputPath = path.resolve(
	"com.futuroptimist.prlist.sdPlugin",
	"bin",
	"plugin.js"
);

test("build output contains plugin entrypoint", () => {
	assert.ok(
		fs.existsSync(pluginOutputPath),
		`Expected build output at ${pluginOutputPath}`
	);

	const output = fs.readFileSync(pluginOutputPath, "utf8");
	assert.match(output, /connect\s*\(/);
	assert.doesNotMatch(output, /registerAction\s*\(/);
});
