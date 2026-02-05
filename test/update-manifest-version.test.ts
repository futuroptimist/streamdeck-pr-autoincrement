import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const scriptPath = path.resolve("scripts/update-manifest-version.mjs");

function writeManifest(dir: string, version: string) {
	const manifestPath = path.join(dir, "manifest.json");
	const manifest = {
		Name: "Test",
		Version: version,
	};
	fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
	return manifestPath;
}

test("update-manifest-version adds .0 when given X.Y.Z", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-test-"));
	const manifestPath = writeManifest(tempDir, "0.0.0.0");

	execFileSync("node", [scriptPath, manifestPath, "1.2.3"], {
		stdio: "inherit",
	});

	const updated = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
	assert.equal(updated.Version, "1.2.3.0");
});

test("update-manifest-version keeps X.Y.Z.B intact", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-test-"));
	const manifestPath = writeManifest(tempDir, "0.0.0.0");

	execFileSync("node", [scriptPath, manifestPath, "1.2.3.4"], {
		stdio: "inherit",
	});

	const updated = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
	assert.equal(updated.Version, "1.2.3.4");
});
