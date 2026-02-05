import fs from "fs";

const [manifestPath, version] = process.argv.slice(2);

if (!manifestPath || !version) {
  console.error("Usage: node update-manifest-version.mjs <manifest> <version>");
  process.exit(1);
}

const contents = fs.readFileSync(manifestPath, "utf8");
const updated = contents.replace(
  /"Version"\s*:\s*"[^"]*"(\s*\n}\s*)$/m,
  `"Version": "${version}"$1`
);

if (updated === contents) {
  console.error("Failed to update Version in manifest.json");
  process.exit(1);
}

fs.writeFileSync(manifestPath, updated, "utf8");
