import fs from 'node:fs';
import path from 'node:path';

const [firstArg, secondArg] = process.argv.slice(2);

const usage = 'Usage: node scripts/update-manifest-version.mjs [manifestPath] <version>';

if (!firstArg) {
  console.error(usage);
  process.exit(1);
}

const manifestPath = secondArg
  ? path.resolve(firstArg)
  : path.resolve('com.futuroptimist.prlist.sdPlugin', 'manifest.json');
const inputVersion = secondArg ?? firstArg;

const semverThreePart = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const semverFourPart =
  /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;

let manifestVersion;
if (semverThreePart.test(inputVersion)) {
  manifestVersion = `${inputVersion}.0`;
} else if (semverFourPart.test(inputVersion)) {
  manifestVersion = inputVersion;
} else {
  console.error(
    'Invalid version format. Expected SemVer: X.Y.Z or X.Y.Z.B with no leading zeros (e.g., 1.2.3 or 1.2.3.0).'
  );
  process.exit(1);
}

if (!fs.existsSync(manifestPath)) {
  console.error(`manifest.json not found at expected path: ${manifestPath}`);
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (error) {
  console.error(`manifest.json at ${manifestPath} is not valid JSON: ${error.message}`);
  process.exit(1);
}

if (!Object.prototype.hasOwnProperty.call(manifest, 'Version')) {
  console.error('manifest.json does not contain a "Version" field to update.');
  process.exit(1);
}

manifest.Version = manifestVersion;

try {
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
} catch (error) {
  console.error(`Failed to write manifest.json at ${manifestPath}: ${error.message}`);
  process.exit(1);
}
