import fs from 'node:fs';
import path from 'node:path';

const version = process.argv[2];
if (!version) {
  console.error('Usage: node scripts/update-manifest-version.mjs <version>');
  process.exit(1);
}

const manifestPath = path.resolve('com.futuroptimist.prlist.sdPlugin', 'manifest.json');
const original = fs.readFileSync(manifestPath, 'utf8');
const updated = original.replace(
  /"Version"\s*:\s*"[^"]*"/,
  `"Version": "${version}"`
);

if (updated === original) {
  console.error('Failed to update manifest.json Version field.');
  process.exit(1);
}

fs.writeFileSync(manifestPath, updated);
