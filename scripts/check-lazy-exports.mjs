#!/usr/bin/env node
/**
 * Guard: every React.lazy(() => import("./X")) target must have a default
 * export. lazy() resolves module.default — a named-export-only module makes
 * the chunk resolve to undefined, and React throws #306 ("Element type is
 * invalid") at hydration. The prerender pipeline does not render these
 * components (it generates HTML from the same data modules), so tsc and the
 * build pass and the bug is only visible in a browser. This guard makes the
 * failure a build-time error instead.
 *
 * Scope: all of src/**\/*.{ts,tsx}. Run via `npm run check:lazyexports`.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = join(root, "src");

const LAZY_RE = /\blazy\(\s*\(\)\s*=>\s*import\(\s*["']([^"']+)["']/g;
const DEFAULT_EXPORT_RE = /^\s*export\s+default\b|^\s*export\s*\{[^}]*\bas\s+default\b[^}]*\}/m;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (/\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function resolveModule(fromFile, spec) {
  const base = resolve(dirname(fromFile), spec);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) || null;
}

let checked = 0;
const violations = [];

for (const file of walk(srcRoot)) {
  const code = readFileSync(file, "utf8");
  let match;
  LAZY_RE.lastIndex = 0;
  while ((match = LAZY_RE.exec(code)) !== null) {
    const spec = match[1];
    if (!spec.startsWith(".")) continue; // skip bare package specifiers
    const target = resolveModule(file, spec);
    checked += 1;
    if (!target) {
      violations.push(`${file.slice(root.length + 1)}: lazy import "${spec}" does not resolve to a file`);
      continue;
    }
    const targetCode = readFileSync(target, "utf8");
    if (!DEFAULT_EXPORT_RE.test(targetCode)) {
      const line = code.slice(0, match.index).split("\n").length;
      violations.push(
        `${file.slice(root.length + 1)}:${line}: lazy(() => import("${spec}")) — ` +
          `${target.slice(root.length + 1)} has no default export (React.lazy resolves module.default)`
      );
    }
  }
}

if (violations.length > 0) {
  console.error(`check:lazyexports FAILED — ${violations.length} problem(s):\n`);
  for (const v of violations) console.error(`  ${v}`);
  console.error(
    `\nFix: add \`export default <Component>;\` to the target module (keep the named export if other code imports it).`
  );
  process.exit(1);
}

console.log(`check:lazyexports OK — ${checked} lazy import(s), all targets have default exports.`);
