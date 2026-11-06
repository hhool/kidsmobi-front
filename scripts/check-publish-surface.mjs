#!/usr/bin/env node
/**
 * Guard the publishable surface: `dist/` holds the site, not the tooling.
 *
 * Context (2026-11-06): the SSR bundle was emitted to `dist/server.cjs` with a
 * sourcemap, because `npm start`/`npm run preview` run it and the path was
 * hard-coded in package.json. Cloudflare Pages publishes every file in the
 * output directory, so `GET /server.cjs` answered 200 with 2,588,967 bytes and
 * `GET /server.cjs.map` with 3,473,971 — the whole server tree, unminified
 * TypeScript names included, to anyone who guessed the path. Nothing in the
 * build ever failed; the site was simply a little bigger than the site.
 *
 * The rule is not "server.cjs is bad". It is: whatever a browser is not meant
 * to fetch does not belong in the tree that is uploaded, and the way to keep
 * that true is to make the build write its own tools elsewhere — `dist` is the
 * published object, `.runs/` is the workbench. This guard is the assertion that
 * the two stayed apart.
 *
 * Run: npm run check:publish
 * Self-test: node scripts/check-publish-surface.mjs --self-test
 */
import { existsSync, mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

/**
 * Extensions that never belong in a published tree.
 *
 * `.map` is the one that matters most: a sourcemap is not a leak of build
 * tooling, it is a leak of the source itself.
 */
export const BANNED = [/\.map$/i, /\.cjs$/i, /\.mjs$/i, /\.ts$/i, /\.tsx$/i];

/** Platform directives: consumed at deploy time, never served as documents. */
const REQUIRED = ["_headers", "_redirects"];

function walk(dir, base, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, out);
    else out.push(relative(base, full).split(sep).join("/"));
  }
  return out;
}

/**
 * @returns {{problems: string[], notes: string[], files: number}}
 */
export function scan(dir, { banned = BANNED, required = REQUIRED } = {}) {
  const problems = [];
  const notes = [];
  if (!existsSync(dir)) {
    return { problems: [`${dir} does not exist — run the build first`], notes, files: 0 };
  }
  const files = walk(dir, dir, []);
  for (const rel of files) {
    const name = rel.split("/").pop();
    if (name.startsWith(".")) {
      // Pages does not serve dotfiles, so this is litter rather than exposure.
      notes.push(`dotfile not served: ${rel}`);
      continue;
    }
    for (const pattern of banned) {
      if (pattern.test(rel)) {
        problems.push(`tooling in the published tree: ${rel}`);
        break;
      }
    }
  }
  for (const name of required) {
    if (!files.includes(name)) {
      problems.push(`${name} is missing — the deploy directives would be dropped silently`);
    }
  }
  return { problems, notes, files: files.length };
}

function selfTest() {
  const cases = [];
  const fixture = () => {
    const dir = mkdtempSync(join(tmpdir(), "publish-surface-"));
    writeFileSync(join(dir, "index.html"), "<html></html>");
    writeFileSync(join(dir, "_headers"), "/*\n  X-Content-Type-Options: nosniff\n");
    writeFileSync(join(dir, "_redirects"), "/shop /products 301\n");
    mkdirSync(join(dir, "assets"));
    writeFileSync(join(dir, "assets", "index-abc.js"), "console.log(1)");
    return dir;
  };
  const ok = (name, fn) => {
    try {
      fn();
      cases.push([true, name]);
    } catch (err) {
      cases.push([false, `${name} — ${err.message}`]);
    }
  };
  const eq = (actual, expected, what) => {
    if (actual !== expected) throw new Error(`${what}: expected ${expected}, got ${actual}`);
  };

  const dir = fixture();

  ok("a clean tree passes", () => {
    const got = scan(dir);
    eq(got.problems.length, 0, "problems");
    eq(got.files, 4, "files");
  });

  ok("the server bundle is reported by name", () => {
    writeFileSync(join(dir, "server.cjs"), "module.exports={}");
    const got = scan(dir);
    eq(got.problems.length, 1, "problems");
    if (!got.problems[0].includes("server.cjs")) throw new Error(got.problems[0]);
    rmSync(join(dir, "server.cjs"));
  });

  ok("a sourcemap is reported", () => {
    writeFileSync(join(dir, "assets", "index-abc.js.map"), "{}");
    const got = scan(dir);
    eq(got.problems.length, 1, "problems");
    if (!got.problems[0].endsWith(".js.map")) throw new Error(got.problems[0]);
    rmSync(join(dir, "assets", "index-abc.js.map"));
  });

  ok("TypeScript in the tree is reported", () => {
    writeFileSync(join(dir, "src.ts"), "export {}");
    const got = scan(dir);
    eq(got.problems.length, 1, "problems");
    rmSync(join(dir, "src.ts"));
  });

  ok("a missing directive is reported", () => {
    rmSync(join(dir, "_redirects"));
    const got = scan(dir);
    eq(got.problems.length, 1, "problems");
    if (!got.problems[0].includes("_redirects")) throw new Error(got.problems[0]);
    writeFileSync(join(dir, "_redirects"), "/shop /products 301\n");
  });

  ok("a dotfile is a note, not a problem", () => {
    writeFileSync(join(dir, ".DS_Store"), "x");
    const got = scan(dir);
    eq(got.problems.length, 0, "problems");
    eq(got.notes.length, 1, "notes");
    rmSync(join(dir, ".DS_Store"));
  });

  // The reverse assertion: with the detector emptied, the same fixture with a
  // server bundle in it comes back clean. If this case ever fails, the earlier
  // failures were produced by the fixture rather than by the rule.
  ok("with the rule removed the server bundle passes", () => {
    writeFileSync(join(dir, "server.cjs"), "module.exports={}");
    eq(scan(dir, { banned: [] }).problems.length, 0, "problems");
    rmSync(join(dir, "server.cjs"));
  });

  ok("an absent tree is a problem, not a pass", () => {
    const got = scan(join(dir, "nope"));
    eq(got.problems.length, 1, "problems");
  });

  rmSync(dir, { recursive: true, force: true });

  for (const [pass, name] of cases) console.log(`${pass ? "ok  " : "FAIL"} ${name}`);
  const failed = cases.filter(([pass]) => !pass).length;
  console.log(`\nself-test: ${cases.length - failed}/${cases.length}`);
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    const { problems, notes, files } = scan(dist);
    for (const note of notes) console.log(`note ${note}`);
    for (const problem of problems) console.log(`FAIL ${problem}`);
    console.log(`${files} files · ${problems.length} problem(s)`);
    process.exit(problems.length ? 1 : 0);
  }
}
