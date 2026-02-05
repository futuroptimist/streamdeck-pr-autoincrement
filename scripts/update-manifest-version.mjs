import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
let manifestPath;
let versionInput;

if (args.length === 1) {
  [versionInput] = args;
  manifestPath = path.resolve("com.futuroptimist.prlist.sdPlugin", "manifest.json");
} else if (args.length === 2) {
  [manifestPath, versionInput] = args;
  manifestPath = path.resolve(manifestPath);
} else {
  console.error("Usage: node scripts/update-manifest-version.mjs <version>");
  console.error("   or: node scripts/update-manifest-version.mjs <manifestPath> <version>");
  process.exit(1);
}

const semverRegex = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const manifestVersionRegex =
  /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;

let manifestVersion;
if (semverRegex.test(versionInput)) {
  manifestVersion = `${versionInput}.0`;
} else if (manifestVersionRegex.test(versionInput)) {
  manifestVersion = versionInput;
} else {
  console.error(
    "Invalid version format. Expected X.Y.Z or X.Y.Z.B with no leading zeros (e.g., 1.2.3 or 1.2.3.0)."
  );
  process.exit(1);
}

if (!fs.existsSync(manifestPath)) {
  console.error(`manifest.json not found at expected path: ${manifestPath}`);
  process.exit(1);
}

let manifest;
try {
  const raw = fs.readFileSync(manifestPath, "utf8");
  manifest = JSON.parse(raw);
} catch (error) {
  console.error(`Failed to read or parse manifest.json at ${manifestPath}: ${error.message}`);
  process.exit(1);
}

if (!Object.prototype.hasOwnProperty.call(manifest, "Version")) {
  console.error('manifest.json does not contain a "Version" field to update.');
  process.exit(1);
}

manifest.Version = manifestVersion;

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
