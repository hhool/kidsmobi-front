#!/usr/bin/env node
/**
 * Code-review dimension of the quality-gate suite: a deterministic review of
 * the diff under review. Where the other guards prove properties of the whole
 * tree (lazy exports, canonicals, claims, review counts), this script answers
 * "what did THIS change touch, and does the change itself violate a known
 * rule?" — fast enough to run before any install or build (~1s, git + node
 * only), which is what makes it usable as the first gate on every push/PR.
 *
 * It is a pattern-based reviewer, not an LLM reviewer: every rule below encodes
 * a bug class this repo has actually shipped or nearly shipped. Rules are
 * deliberately conservative — `warn` means "a human must look", `fail` means
 * "this exact shape has broken production before".
 *
 * Usage:
 *   node scripts/ci/diff-review.mjs                 # auto-pick base (origin/main, else HEAD~1)
 *   DIFF_BASE=<ref> node scripts/ci/diff-review.mjs # explicit range base
 *   DIFF_HEAD=<ref> ...                             # explicit range head (default HEAD)
 *   --strict                                         # warnings also fail
 *
 * Exit 0 = no fail-level findings (warnings may exist), 1 = at least one fail.
 * Writes a markdown report to $GITHUB_STEP_SUMMARY when that env var is set
 * (GitHub Actions), so the review lands on the run summary page.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const STRICT = process.argv.includes("--strict");
const root = process.cwd();

/** @type {{level:"fail"|"warn"|"info", rule:string, file:string, line:number|null, detail:string}[]} */
const findings = [];
const add = (level, rule, file, line, detail) => findings.push({ level, rule, file, line, detail });

const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

// ---------------------------------------------------------------------------
// Resolve the review range.
// ---------------------------------------------------------------------------
const refExists = (ref) => {
  try {
    git(["rev-parse", "--verify", "--quiet", ref]);
    return true;
  } catch {
    return false;
  }
};

const head = process.env.DIFF_HEAD || "HEAD";
let base = process.env.DIFF_BASE || "";
if (!base) {
  if (refExists("origin/main")) base = "origin/main";
  else if (refExists("origin/master")) base = "origin/master";
  else if (refExists("HEAD~1")) base = "HEAD~1";
}
if (!base || !refExists(base) || !refExists(head)) {
  console.log("diff-review: no reviewable range (no base ref, single-commit repo?) — nothing to do.");
  process.exit(0);
}

/** Files changed on the head side since the merge-base: status + path. */
const changed = git(["diff", "--name-status", `${base}...${head}`])
  .split("\n")
  .filter(Boolean)
  .map((row) => {
    const [status, ...rest] = row.split("\t");
    return { status: status[0], file: rest[rest.length - 1] };
  });

const reviewable = changed.filter((c) => c.status !== "D");
if (reviewable.length === 0) {
  console.log(`diff-review: no file changes in ${base}...${head} — nothing to review.`);
  process.exit(0);
}

/** Added lines of a file as {line, text}. `git diff -U0` keeps the hunk precise. */
function addedLines(file) {
  let out;
  try {
    out = git(["diff", "-U0", `${base}...${head}`, "--", file]);
  } catch {
    return [];
  }
  const rows = [];
  let lineNo = null;
  for (const raw of out.split("\n")) {
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(raw);
    if (hunk) {
      lineNo = Number(hunk[1]);
      continue;
    }
    if (lineNo === null) continue;
    if (raw.startsWith("+") && !raw.startsWith("+++")) {
      rows.push({ line: lineNo, text: raw.slice(1) });
      lineNo += 1;
    } else if (!raw.startsWith("-") && !raw.startsWith("\\")) {
      lineNo += 1; // context line
    }
  }
  return rows;
}

const perFile = new Map();
for (const c of reviewable) perFile.set(c.file, addedLines(c.file));

// ---------------------------------------------------------------------------
// Rule set. Each rule scans ADDED lines only (or file lists) of this diff.
// ---------------------------------------------------------------------------

// R1 — Honesty: testing claims the site cannot defend. Compact fast-signal
// subset of scripts/check-honesty-claims.ts (that guard is authoritative but
// needs a full build; this one runs pre-build on the diff).
const BANNED_CLAIMS = [
  { re: /in our test group/i, why: "first-person testing claim (2026-10-16 audit class)" },
  { re: /in our testing/i, why: "first-person testing claim" },
  { re: /in our checks/i, why: "first-person testing claim" },
  { re: /in our group/i, why: "first-person testing claim" },
  { re: /in our test pool/i, why: "first-person testing claim" },
  { re: /hands-on testing/i, why: "testing claim (lab/testing false-claim sweep)" },
  { re: /we tested/i, why: "testing claim" },
  { re: /backed by real testing/i, why: "testing claim" },
  { re: /Test notes:/, why: "testing-claim template remnant" },
  { re: /实验室评测/, why: "lab-review claim (ZH)" },
  { re: /第三方实测/, why: "third-party testing claim (ZH)" },
  { re: /经实测验证/, why: "testing claim (ZH)" },
  { re: /本组测试|测试组中/, why: "first-person testing claim (ZH)" },
  { re: /(?<!必须)实测/, why: "testing claim (ZH catch-all; 必须实测 is protected consumer advice)" },
  { re: /我们[^。。<]{0,44}(?:测试|实测|验证)/, why: "unattributed first-person testing (ZH)" },
];

// R2 — Project convention: bilingual copy objects must not be `as const`
// (type UiStrings + Record<"en"|"zh", …> is the convention; as const breaks
// the assignability the i18n layer relies on).
const EN_ZH_FILE_RE = /(?:"|')?en(?:"|')?\s*:|(?:"|')?zh(?:"|')?\s*:/;

// R3 — Canonical single source of truth: src/lib/canonicalPath.ts. Any other
// file introducing canonical-link mechanics needs human eyes (the 2026-10-19
// GSC "Alternate page" incident came from exactly this shape).
const CANONICAL_ALLOWED = new Set([
  "src/lib/canonicalPath.ts",
  "src/App.tsx",
  "scripts/prerender-pages.ts",
  "scripts/check-spa-canonicals.ts",
  "scripts/ci/diff-review.mjs",
]);
const CANONICAL_RE = /rel=["']canonical|canonical["']?\s*[,:)]|setAttribute\(\s*["']canonical|querySelector\(\s*["'][^"']*canonical/i;

// R4 — TDK limits: title base ≤44 chars (+" | BalanceBikeToddler" = ≤65),
// description ≤155. Matches publishSectionTitle/Description + capSeoTitle.
// Fail-level only in the TDK single-source files; elsewhere (product data etc.,
// where long copy is legitimate) a long literal is a warn for human eyes.
const TDK_KEY_RE = /\b(seoTitle|seoDescription|title|description)\s*:\s*(["'`])/;
/** Same keys with the value starting on a following added line. */
const TDK_KEY_NEXT_LINE_RE = /\b(seoTitle|seoDescription|title|description)\s*:\s*$/;
const TDK_FAIL_FILES = new Set([
  "src/data/guidesData.ts",
  "src/data/newsData.ts",
  "src/data/transparencyPages.ts",
  "src/lib/pageKeywords.ts",
  "src/lib/cmsSectionSeo.ts",
  "src/config/defaultSeo.ts",
]);
/** Scan a string literal body until the first unescaped matching quote. */
function scanLiteral(text, quote) {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\\") {
      out += text[i + 1] ?? "";
      i++;
      continue;
    }
    if (ch === quote) return { value: out, closed: true };
    out += ch;
  }
  return { value: out, closed: false };
}

// R5 — XSS surface.
// R6 — console noise in shipped src.
// R7 — secrets hardcoded in source (64-hex literals, token-shaped assignments).
const SECRET_LITERAL_RE = /["'][A-Fa-f0-9]{64}["']/;
const SECRET_ASSIGN_RE = /(?:CMS_ADMIN_ALL_TOKEN|CLOUDFLARE_API_TOKEN|VITE_[A-Z_]+)\s*[:=]\s*["'][^"']{12,}["']/;

// R8 — CMS write scripts must carry the admin token (闸门 #48): a script that
// POSTs to /api/cms/* without the shared token helper would fail closed in
// production (403) — or worse, indicate a bypass attempt.
const TOKEN_HELPER_RE = /_cmsAdminToken|x-cms-admin-token/i;

// R9 — Infra files with outsized blast radius.
const INFRA_FILES = [
  "public/_headers", // Cache-Control rules: hard cap 100, must stay mutually exclusive
  "public/_redirects", // 301 layer for retired listings
  "vite.config.ts",
  "package.json", // dependency surface
  "vercel.json",
  "wrangler.toml",
];

for (const { file } of reviewable) {
  const rows = perFile.get(file) || [];
  const isSrc = file.startsWith("src/");
  const isScript = file.startsWith("scripts/");
  const isDoc = /\.(md|mdx)$/.test(file) || file.startsWith("doc/");

  // Full content of the changed file at the review head (for file-level rules).
  let content = "";
  try {
    content = git(["show", `${head}:${file}`]);
  } catch {
    try { content = readFileSync(file, "utf8"); } catch { /* deleted mid-range */ }
  }

  // Infra blast radius (file-level, no line scan needed).
  if (INFRA_FILES.includes(file)) {
    add("warn", "infra-blast-radius", file, null,
      `${file} has site-wide effect (cache rules / redirects / deps / build config) — human review required`);
  }
  if (file.startsWith(".github/")) {
    add("warn", "ci-change", file, null, "CI/workflow change — verify secrets, triggers and gate order before merge");
  }

  for (const { line, text } of rows) {
    const hit = (rule, level, detail) => add(level, rule, file, line, detail);

    // R1 claims (all file types except the guard itself & docs describing them)
    if (!isDoc && !file.includes("check-honesty-claims") && !file.includes("diff-review")) {
      for (const { re, why } of BANNED_CLAIMS) {
        if (re.test(text)) hit("honesty-claim", "fail", `"${text.trim().slice(0, 80)}" — ${why}`);
      }
    }

    // R2 as const on bilingual copy. The `as const` is usually on its own line
    // (closing the object literal), so decide at file level: the file must be a
    // bilingual copy object (en:/zh: markers) and an added `as const` must sit
    // within a few lines of those markers (same object literal).
    // NOTE: this block has its own `rows` loop — call add() directly, never the
    // outer `hit` closure (it would capture the outer loop's line number).
    if (isSrc && /\bas const\b/.test(content)) {
      const markerLines = [];
      content.split("\n").forEach((l, i) => {
        if (EN_ZH_FILE_RE.test(l)) markerLines.push(i + 1);
      });
      const nearBilingual = (lineNo) => markerLines.some((m) => Math.abs(m - lineNo) <= 8);
      for (const { line, text } of rows) {
        if (!/\bas const\b/.test(text)) continue;
        if (markerLines.length > 0 && nearBilingual(line)) {
          add("fail", "ui-strings-as-const", file, line, "bilingual copy object marked `as const` — use `type UiStrings` + Record<\"en\"|\"zh\", …>");
        } else if (markerLines.length > 0) {
          add("warn", "ui-strings-as-const", file, line, "`as const` in a bilingual copy file — confirm it is not the en/zh object");
        }
      }
    }

    // R3 canonical mechanics outside the single source of truth
    if (!CANONICAL_ALLOWED.has(file) && !isDoc && CANONICAL_RE.test(text)) {
      hit("canonical-bypass", "warn", "canonical-link mechanics outside src/lib/canonicalPath.ts — confirm it routes through the shared resolver");
    }

    // R4 TDK limits (multi-line aware: values may open on one added line and
    // close on a later one — template literals are common in this repo).
    if (isSrc) {
      for (let i = 0; i < rows.length; i++) {
        const m = TDK_KEY_RE.exec(rows[i].text);
        const mNext = m ? null : TDK_KEY_NEXT_LINE_RE.exec(rows[i].text);
        if (!m && !mNext) continue;
        const key = m ? m[1] : mNext[1];
        // Value starts either after the colon on this line, or on a later added line.
        let valueStart = i;
        let quote = null;
        let offset = 0;
        if (m) {
          quote = m[2];
          offset = m.index + m[0].length;
        } else {
          let j = i + 1;
          while (j < rows.length) {
            const q = /^\s*(["'`])/.exec(rows[j].text);
            if (q) {
              quote = q[1];
              valueStart = j;
              offset = q[0].length;
              break;
            }
            if (/\S/.test(rows[j].text)) break; // non-string content: bail
            j++;
          }
          if (!quote) continue;
        }
        const joined = rows
          .slice(valueStart)
          .map((r, j) => (j === 0 ? r.text.slice(offset) : r.text))
          .join("\n");
        const lit = scanLiteral(joined, quote);
        const len = lit.value.length;
        if ((key === "title" || key === "seoTitle") && len > 44) {
          add("warn", "tdk-title-length", file, rows[i].line,
            `title base ${len} chars > 44 (+21 suffix = ${len + 21} > 65): "${lit.value.slice(0, 60)}…"`);
        }
        if ((key === "description" || key === "seoDescription") && len > 155) {
          const level = TDK_FAIL_FILES.has(file) ? "fail" : "warn";
          add(level, "tdk-desc-length", file, rows[i].line,
            `description ${len} chars > 155: "${lit.value.slice(0, 60)}…"`);
        }
      }
    }

    // R5/R6
    if (/dangerouslySetInnerHTML/.test(text)) hit("dangerous-html", "warn", "dangerouslySetInnerHTML introduced — confirm the payload is sanitized/trusted");
    if (isSrc && /console\.(log|debug)\(/.test(text)) hit("console-noise", "info", "console.log in shipped src — remove or route through the logger");

    // R7 secrets
    if ((isSrc || isScript || file.startsWith("api/")) && SECRET_LITERAL_RE.test(text)) {
      hit("secret-literal", "fail", "64-hex literal looks like a committed secret/token — move to env/secret store");
    }
    if ((isSrc || isScript) && SECRET_ASSIGN_RE.test(text) && !/process\.env|import\.meta\.env/.test(text)) {
      hit("secret-assign", "fail", "hardcoded token-shaped assignment — read from process.env instead");
    }

    // R7b TODO markers
    if (/\b(TODO|FIXME|XXX|HACK)\b/.test(text) && !isDoc) hit("todo-marker", "info", `marker left in code: "${text.trim().slice(0, 60)}"`);
  }

  // R8 CMS write scripts (file-level on changed scripts)
  if (isScript && /\.mjs?$/.test(file) && content) {
    const postsToCms = /\/api\/cms\//.test(content) && /method:\s*["']POST|method:\s*["']PUT|method:\s*["']DELETE|fetch\([^)]*\{[^}]*method/i.test(content);
    if (postsToCms && !TOKEN_HELPER_RE.test(content)) {
      add("fail", "cms-write-token", file, null,
        "script mutates /api/cms/* without the admin-token helper (_cmsAdminToken.mjs) — production gate #48 returns 403");
    }
  }

  // R9 new SPA routes (file-level)
  if (file === "src/App.tsx") {
    const routeRows = rows.filter((r) => /\bpath\s*=/.test(r.text));
    if (routeRows.length > 0) {
      add("info", "new-spa-route", file, null,
        `${routeRows.length} route path change(s) in App.tsx — confirm sitemap coverage, keywords meta and canonical resolver handle them`);
    }
  }
}

// Dedupe: one line can trip several phrases of the same rule (e.g. "we tested"
// and "in our test group" on one line) — report the first hit per rule+location.
{
  const seen = new Set();
  const kept = [];
  for (const f of findings) {
    const key = `${f.rule}|${f.file}|${f.line ?? "-"}`;
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(f);
  }
  findings.length = 0;
  findings.push(...kept);
}

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
const fails = findings.filter((f) => f.level === "fail");
const warns = findings.filter((f) => f.level === "warn");
const infos = findings.filter((f) => f.level === "info");
const verdict = fails.length > 0 || (STRICT && warns.length > 0) ? "FAIL" : "PASS";

const BUCKETS = {
  "SEO / TDK": ["honesty-claim", "tdk-title-length", "tdk-desc-length", "canonical-bypass", "new-spa-route"],
  "Conventions": ["ui-strings-as-const", "console-noise", "todo-marker"],
  "Security": ["secret-literal", "secret-assign", "dangerous-html", "cms-write-token"],
  "Infra / CI": ["infra-blast-radius", "ci-change"],
};

const lines = [];
lines.push(`### diff-review — ${verdict}`);
lines.push("");
lines.push(`Range \`${base}...${head}\` · ${reviewable.length} file(s) changed · **${fails.length} fail · ${warns.length} warn · ${infos.length} info**`);
lines.push("");
for (const [bucket, rules] of Object.entries(BUCKETS)) {
  const rows = findings.filter((f) => rules.includes(f.rule));
  if (rows.length === 0) continue;
  lines.push(`#### ${bucket}`);
  lines.push("");
  lines.push("| level | rule | location | detail |");
  lines.push("| --- | --- | --- | --- |");
  for (const f of rows) {
    const loc = f.line ? `${f.file}:${f.line}` : f.file;
    lines.push(`| ${f.level} | ${f.rule} | \`${loc}\` | ${f.detail.replace(/\|/g, "\\|").slice(0, 140)} |`);
  }
  lines.push("");
}
if (findings.length === 0) lines.push("No findings — diff matches every known rule.\n");

const report = lines.join("\n");
console.log(report.replace(/^### /m, "").trimEnd());

if (process.env.GITHUB_STEP_SUMMARY && existsSync(process.env.GITHUB_STEP_SUMMARY)) {
  const { appendFileSync } = await import("node:fs");
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + "\n");
}

if (verdict === "FAIL") {
  console.error(`\ndiff-review FAILED — ${fails.length} fail-level finding(s)${STRICT ? ` (+${warns.length} warnings in --strict mode)` : ""}.`);
  process.exit(1);
}
console.log(`\ndiff-review PASS — ${fails.length} fail · ${warns.length} warn (warn = human look, not a merge blocker by default).`);
