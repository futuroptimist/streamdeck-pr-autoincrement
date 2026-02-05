import fs from 'node:fs';
import path from 'node:path';

const version = process.argv[2];
if (!version) {
  console.error('Usage: node scripts/update-manifest-version.mjs <version>');
  process.exit(1);
}

const semverRegex = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
if (!semverRegex.test(version)) {
  console.error('Invalid version format. Expected SemVer: X.Y.Z with no leading zeros (e.g., 1.2.3).');
  process.exit(1);
}

const manifestPath = path.resolve('com.futuroptimist.prlist.sdPlugin', 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error(`manifest.json not found at expected path: ${manifestPath}`);
  process.exit(1);
}

let original;
try {
  original = fs.readFileSync(manifestPath, 'utf8');
} catch (error) {
  console.error(`Failed to read manifest.json at ${manifestPath}: ${error.message}`);
  process.exit(1);
}

try {
  JSON.parse(original);
} catch (error) {
  console.error(`manifest.json at ${manifestPath} is not valid JSON: ${error.message}`);
  process.exit(1);
}

const updated = original.replace(
  /"Version"\s*:\s*"[^"]*"/,
  `"Version": "${version}"`
);

if (updated === original) {
  if (!/"Version"\s*:/.test(original)) {
    console.error('manifest.json does not contain a "Version" field to update.');
  } else {
    console.error('Failed to update manifest.json Version field: existing Version entry did not match the expected format.');
  }
  process.exit(1);
}

fs.writeFileSync(manifestPath, updated);
