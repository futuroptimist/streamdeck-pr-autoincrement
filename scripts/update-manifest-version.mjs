import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
let manifestPath;
let inputVersion;

if (args.length === 1) {
  [inputVersion] = args;
  manifestPath = path.resolve('com.futuroptimist.prlist.sdPlugin', 'manifest.json');
} else if (args.length === 2) {
  [manifestPath, inputVersion] = args;
  manifestPath = path.resolve(manifestPath);
} else {
  console.error(
    'Usage: node scripts/update-manifest-version.mjs <version>\n' +
      '   or: node scripts/update-manifest-version.mjs <manifestPath> <version>'
  );
  process.exit(1);
}

const semverRegex = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const fourPartRegex =
  /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;

let resolvedVersion;
if (semverRegex.test(inputVersion)) {
  resolvedVersion = `${inputVersion}.0`;
} else if (fourPartRegex.test(inputVersion)) {
  resolvedVersion = inputVersion;
} else {
  console.error(
    'Invalid version format. Expected X.Y.Z or X.Y.Z.B with no leading zeros ' +
      '(e.g., 1.2.3 or 1.2.3.0).'
  );
  process.exit(1);
}

if (!fs.existsSync(manifestPath)) {
  console.error(`manifest.json not found at expected path: ${manifestPath}`);
  process.exit(1);
}

let manifest;
try {
  const original = fs.readFileSync(manifestPath, 'utf8');
  manifest = JSON.parse(original);
} catch (error) {
  console.error(
    `Failed to read or parse manifest.json at ${manifestPath}: ${error.message}`
  );
  process.exit(1);
}

manifest.Version = resolvedVersion;

try {
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
} catch (error) {
  console.error(`Failed to write manifest.json at ${manifestPath}: ${error.message}`);
  process.exit(1);
}
