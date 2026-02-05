import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

const scriptPath = path.resolve("scripts", "update-manifest-version.mjs");

function writeManifest(tempDir: string) {
	const manifestPath = path.join(tempDir, "manifest.json");
	const manifest = {
		Name: "Test Plugin",
		Version: "0.0.0.0",
	};
	fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
	return manifestPath;
}

function runUpdate(manifestPath: string, version: string) {
	const result = spawnSync(process.execPath, [scriptPath, manifestPath, version], {
		encoding: "utf8",
	});
	assert.equal(result.status, 0, result.stderr);
	const updated = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
	return updated.Version as string;
}

test("update-manifest-version expands three-part versions", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-test-"));
	const manifestPath = writeManifest(tempDir);

	const updatedVersion = runUpdate(manifestPath, "1.2.3");

	assert.equal(updatedVersion, "1.2.3.0");
});

test("update-manifest-version keeps four-part versions", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-test-"));
	const manifestPath = writeManifest(tempDir);

	const updatedVersion = runUpdate(manifestPath, "1.2.3.4");

	assert.equal(updatedVersion, "1.2.3.4");
});
