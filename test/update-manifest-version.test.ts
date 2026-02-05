import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const scriptPath = path.resolve("scripts", "update-manifest-version.mjs");

function writeManifest(tempDir: string): string {
	const manifestPath = path.join(tempDir, "manifest.json");
	const manifest = {
		Name: "Test",
		Version: "0.0.0.0",
	};
	fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
	return manifestPath;
}

test("update-manifest-version writes 4-part version from semver", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-test-"));
	const manifestPath = writeManifest(tempDir);

	execFileSync("node", [scriptPath, manifestPath, "1.2.3"], { stdio: "inherit" });
	const updated = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
	assert.equal(updated.Version, "1.2.3.0");
});

test("update-manifest-version keeps provided 4-part version", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-test-"));
	const manifestPath = writeManifest(tempDir);

	execFileSync("node", [scriptPath, manifestPath, "1.2.3.4"], { stdio: "inherit" });
	const updated = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
	assert.equal(updated.Version, "1.2.3.4");
});
