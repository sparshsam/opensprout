/**
 * OpenSprout Release Version Bumper
 *
 * Usage:
 *   node scripts/bump-version.mjs          # Interactive: prompts for version
 *   node scripts/bump-version.mjs 0.9.14   # Bump to specific version, auto-increment code
 *   node scripts/bump-version.mjs 0.9.14 3 # Bump to version with explicit version code
 *
 * Updates:
 *   - apps/web/android/app/build.gradle  (versionCode, versionName)
 *   - apps/web/package.json              (version)
 *   - root package.json                  (version)
 *
 * Does NOT commit or tag — run after.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// ── Files ────────────────────────────────────────────────────────────────────
const BUILD_GRADLE = join(ROOT, "apps/web/android/app/build.gradle");
const WEB_PKG = join(ROOT, "apps/web/package.json");
const ROOT_PKG = join(ROOT, "package.json");

// ── Parse versionName from build.gradle ───────────────────────────────────────
function parseBuildGradle(text) {
  const vcMatch = text.match(/versionCode\s+(\d+)/);
  const vnMatch = text.match(/versionName\s+"([^"]+)"/);
  return {
    versionCode: vcMatch ? parseInt(vcMatch[1], 10) : null,
    versionName: vnMatch ? vnMatch[1] : null,
  };
}

// ── Parse CLI args ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
let newVersionName = args[0] || null;
let newVersionCode = args[1] ? parseInt(args[1], 10) : null;

// ── Read current values ───────────────────────────────────────────────────────
const gradle = readFileSync(BUILD_GRADLE, "utf-8");
const current = parseBuildGradle(gradle);
const webPkg = JSON.parse(readFileSync(WEB_PKG, "utf-8"));
const rootPkg = JSON.parse(readFileSync(ROOT_PKG, "utf-8"));

console.log(`Current build.gradle: versionName="${current.versionName}", versionCode=${current.versionCode}`);
console.log(`Current apps/web/package.json: version="${webPkg.version}"`);
console.log(`Current root package.json: version="${rootPkg.version}"`);

// ── Interactive prompt ────────────────────────────────────────────────────────
if (!newVersionName) {
  const readline = await import("readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  newVersionName = await new Promise((resolve) => {
    rl.question(`New version name (current: ${current.versionName}): `, (v) => {
      rl.close();
      resolve(v.trim());
    });
  });
  if (!newVersionName) {
    console.log("Aborted.");
    process.exit(0);
  }
}

if (!newVersionCode) {
  // Auto-increment: strip non-numeric prefix, add 1
  const parsed = parseInt(newVersionName.replace(/^v/, "").split(".").pop() || "0", 10);
  newVersionCode = current.versionCode ? current.versionCode + 1 : parsed + 1;
}

// ── Validate ──────────────────────────────────────────────────────────────────
if (!/^\d+(\.\d+)*$/.test(newVersionName)) {
  console.error(`Invalid version name: "${newVersionName}". Use semver like "0.9.14".`);
  process.exit(1);
}
if (!Number.isInteger(newVersionCode) || newVersionCode <= 0) {
  console.error(`Invalid version code: ${newVersionCode}. Must be a positive integer.`);
  process.exit(1);
}
if (newVersionCode <= (current.versionCode ?? 0)) {
  console.error(`Version code ${newVersionCode} must be > ${current.versionCode}.`);
  process.exit(1);
}

// ── Apply updates ─────────────────────────────────────────────────────────────
// build.gradle
let updated = gradle.replace(
  /(versionCode\s+)(\d+)/,
  `$1${newVersionCode}`
);
updated = updated.replace(
  /(versionName\s+)"([^"]+)"/,
  `$1"${newVersionName}"`
);
writeFileSync(BUILD_GRADLE, updated, "utf-8");

// apps/web/package.json
webPkg.version = newVersionName;
writeFileSync(WEB_PKG, JSON.stringify(webPkg, null, 2) + "\n", "utf-8");

// root package.json
rootPkg.version = newVersionName;
writeFileSync(ROOT_PKG, JSON.stringify(rootPkg, null, 2) + "\n", "utf-8");

console.log(`\n✅ Updated to v${newVersionName} (versionCode ${newVersionCode})`);
console.log(`\nFiles changed:`);
console.log(`  - apps/web/android/app/build.gradle`);
console.log(`  - apps/web/package.json`);
console.log(`  - package.json`);
console.log(`\nNext steps:`);
console.log(`  1. Review changes: git diff`);
console.log(`  2. Commit: git commit -am "v${newVersionName} — <description>"`);
console.log(`  3. Tag:    git tag v${newVersionName}`);
console.log(`  4. Push:   git push && git push --tags`);
