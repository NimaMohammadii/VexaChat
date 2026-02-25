/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const blockedCodePatterns = [
  ".storage.from(",
  "getPublicUrl",
  "createSignedUrl",
  "supabase.storage",
  "storage/v1/object"
];

const includeExt = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs"]);
const ignoreDir = new Set([".git", "node_modules", ".next"]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoreDir.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
      continue;
    }
    if (includeExt.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

const violations = [];
for (const file of walk(root)) {
  const rel = path.relative(root, file);
  if (rel === "scripts/migrate-legacy-storage-urls-to-r2.js" || rel === "scripts/assert-r2-only.js") continue;
  const text = fs.readFileSync(file, "utf8");
  for (const pat of blockedCodePatterns) {
    if (text.includes(pat)) violations.push(`${rel}: contains ${pat}`);
  }
}

try {
  const storageCode = fs.readFileSync(path.join(root, "lib/storage/object-storage.ts"), "utf8");
  if (!storageCode.includes("must be an R2 object key, received URL")) {
    violations.push("lib/storage/object-storage.ts: assertStorageKey does not reject http(s) URLs");
  }
  if (!storageCode.includes("return getSignedReadUrl(assertStorageKey(value));")) {
    violations.push("lib/storage/object-storage.ts: resolveStoredFileUrl must only sign validated keys");
  }
} catch (error) {
  violations.push(`Failed to read storage validator: ${error instanceof Error ? error.message : String(error)}`);
}

if (violations.length) {
  console.error("R2-only storage assertions failed:\n" + violations.map((v) => ` - ${v}`).join("\n"));
  process.exit(1);
}

console.log("R2-only storage assertions passed.");
