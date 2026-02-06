import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const compiledPluginPath = path.resolve(
	"com.futuroptimist.prlist.sdPlugin",
	"bin",
	"plugin.js"
);

test("compiled plugin entrypoint exists after build", () => {
	assert.ok(fs.existsSync(compiledPluginPath));

	const compiledSource = fs.readFileSync(compiledPluginPath, "utf8");
	assert.ok(compiledSource.includes("connect("));
	assert.ok(!compiledSource.includes("registerAction("));
});
