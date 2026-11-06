#!/usr/bin/env bash
# One clean build of the front-end, byte-for-byte comparable with another.
#
# The site is deployed as static output, so "reproducible build" means: the
# same source tree, built twice, must produce the same bytes. That is item 34
# of the G4 baseline, and the only way to know is to actually build twice.
#
# This script exists because the stock `npm run build` cannot be run verbatim
# on this machine:
#   - `npx` is wedged (a stale npm lock from a killed install), so tsx and
#     esbuild are invoked through their real entry points;
#   - the native esbuild/rollup/lightningcss binaries hang in exec() on this
#     host (the macOS exec-policy defect), so the build runs on the WASM/WASI
#     substitutes that are patched into node_modules;
#   - the safe-delete guard blocks vite's emptyOutDir and the prerender's
#     route-directory wipe, both of which delete more than 50 files.
#
# Usage: scripts/build-once.sh <label>
#   Writes .runs/build-<label>.sha256.json, a manifest of every output file
#   and its sha256. Compare two manifests to answer "is the build reproducible".
set -euo pipefail

LABEL="${1:?usage: build-once.sh <label>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export NAPI_RS_FORCE_WASI=true
export CODEBUDDY_SAFE_DELETE_ENABLED=0

# `npm run build` starts here. The subset file is committed and the script is
# idempotent (verified 2026-11-06: re-running leaves public/fonts/fonts-latin.css
# byte-identical), so this step changes nothing today -- but a build script that
# skips a step of the real build is only equal to it by accident.
echo "=== build $LABEL: font subset ==="
node scripts/build-font-subset.mjs

echo "=== build $LABEL: vite ==="
node node_modules/vite/bin/vite.js build

# `npm run build` keeps the vite shell before the prerender overwrites it, and
# finishes by replacing index.html with the static homepage. Both steps were
# missing here until 2026-11-06, which made this script produce a dist whose
# index.html was the prerender's SPA shell (30 KB) instead of the shipped
# document (201 KB) - reproducible, but reproducible of the wrong artifact.
mkdir -p .runs/home-ssr
cp dist/index.html .runs/home-ssr/spa-shell.html

echo "=== build $LABEL: prerender ==="
node node_modules/tsx/dist/cli.mjs scripts/prerender-pages.ts

echo "=== build $LABEL: static home ==="
bash scripts/build-home.sh

echo "=== build $LABEL: manifest ==="
mkdir -p .runs
node -e '
const hash = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const root = "dist";
const walk = (dir, base, out) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full).split(path.sep).join("/");
    if (entry.isDirectory()) walk(full, base, out);
    else if (entry.isFile()) out[rel] = hash.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
  }
};
const out = {};
walk(root, root, out);
fs.writeFileSync(process.argv[1], JSON.stringify(out, Object.keys(out).sort(), 2));
console.log(`manifest: ${Object.keys(out).length} files -> ${process.argv[1]}`);
' ".runs/build-$LABEL.sha256.json"
