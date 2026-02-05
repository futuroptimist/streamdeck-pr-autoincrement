import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const scriptPath = path.resolve("scripts", "update-manifest-version.mjs");

function writeManifest(manifestPath, version = "0.0.1.0") {
	const manifest = {
		Name: "Example",
		Version: version
	};
	fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
	fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function readManifestVersion(manifestPath) {
	const data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
	return data.Version;
}

test("update-manifest-version adds a .0 build number for three-part versions", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-test-"));
	try {
		const manifestPath = path.join(
			tempDir,
			"com.futuroptimist.prlist.sdPlugin",
			"manifest.json"
		);
		writeManifest(manifestPath, "0.0.1.0");

		const result = spawnSync(process.execPath, [scriptPath, "1.2.3"], {
			cwd: tempDir,
			encoding: "utf8"
		});

		assert.equal(result.status, 0, result.stderr);
		assert.equal(readManifestVersion(manifestPath), "1.2.3.0");
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
});

test("update-manifest-version accepts four-part versions as-is", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-test-"));
	try {
		const manifestPath = path.join(tempDir, "manifest.json");
		writeManifest(manifestPath, "0.0.1.0");

		const result = spawnSync(process.execPath, [scriptPath, manifestPath, "1.2.3.4"], {
			encoding: "utf8"
		});

		assert.equal(result.status, 0, result.stderr);
		assert.equal(readManifestVersion(manifestPath), "1.2.3.4");
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
});
