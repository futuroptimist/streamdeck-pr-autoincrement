import fs from 'node:fs';

const [,, manifestPath, version] = process.argv;

if (!manifestPath || !version) {
  console.error('Usage: node scripts/update-manifest-version.mjs <manifest> <version>');
  process.exit(1);
}

const contents = fs.readFileSync(manifestPath, 'utf8');
const versionRegex = /"Version"\s*:\s*"([^"]*)"/g;
let match;
let lastMatch;

while ((match = versionRegex.exec(contents)) !== null) {
  lastMatch = match;
}

if (!lastMatch) {
  console.error('No Version field found in manifest.');
  process.exit(1);
}

const replacement = `"Version": "${version}"`;
const updated =
  contents.slice(0, lastMatch.index) +
  replacement +
  contents.slice(lastMatch.index + lastMatch[0].length);

if (updated === contents) {
  console.error('Manifest version was not updated.');
  process.exit(1);
}

fs.writeFileSync(manifestPath, updated);
