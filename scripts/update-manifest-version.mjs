import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
let manifestPath;
let versionInput;

if (args.length === 1) {
  versionInput = args[0];
  manifestPath = path.resolve('com.futuroptimist.prlist.sdPlugin', 'manifest.json');
} else if (args.length === 2) {
  [manifestPath, versionInput] = args;
  manifestPath = path.resolve(manifestPath);
} else {
  console.error(
    'Usage: node scripts/update-manifest-version.mjs <version>\n' +
      '   or: node scripts/update-manifest-version.mjs <manifestPath> <version>'
  );
  process.exit(1);
}

const semverThreePart = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const semverFourPart =
  /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;

let manifestVersion;
if (semverThreePart.test(versionInput)) {
  manifestVersion = `${versionInput}.0`;
} else if (semverFourPart.test(versionInput)) {
  manifestVersion = versionInput;
} else {
  console.error(
    'Invalid version format. Expected SemVer: X.Y.Z or X.Y.Z.B with no leading zeros (e.g., 1.2.3 or 1.2.3.4).'
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

manifest.Version = manifestVersion;

try {
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
} catch (error) {
  console.error(`Failed to write manifest.json at ${manifestPath}: ${error.message}`);
  process.exit(1);
}
