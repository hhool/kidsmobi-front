/**
 * Regression guard: no built page may publish a testing claim the site cannot
 * defend.
 *
 * The 2026-10-16 data audit found the cardSummary template claiming hands-on
 * testing ("Test notes:", "our test group", "backed by real testing", zh
 * "实测：") on 171 of 174 rendered products, plus single-record claims in
 * evaluations ("test pool", "independent hands-on testing", "实验室评测") and
 * one news item. The CMS data was bulk-rewritten the same day and
 * sanitizeUnsupportedClaims gained the same rules as a render-time backstop;
 * this guard fails the build if either layer regresses.
 *
 * Phrases marked `sanitized: true` must also be covered by a rewrite rule in
 * src/lib/unsupportedClaims.ts — the guard imports the sanitizer directly and
 * asserts the phrase changes, so the two layers cannot drift apart.
 *
 * Usage: npx tsx scripts/check-honesty-claims.ts   (run after the build)
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { sanitizeUnsupportedClaims } from "../src/lib/unsupportedClaims";

type Entry = {
  /** Human-readable phrase for failure output. */
  text: string;
  /** True when a sanitizer rule must neutralise it (drift-checked). */
  sanitized: boolean;
  /** String fed to the sanitizer for the drift check (defaults to `text`). */
  sample?: string;
  /** Custom matcher for dist HTML (defaults to a case-insensitive literal). */
  regex?: RegExp;
  note?: string;
};

const FORBIDDEN: Entry[] = [
  // EN — cardSummary template + mompush evaluation + Graco manufacturer copy.
  { text: "Test notes:", sanitized: true },
  { text: "in our test group", sanitized: true },
  { text: "in our testing", sanitized: true },
  { text: "in our 1-year-old test group", sanitized: true },
  { text: "in our group", sanitized: true },
  { text: "in our jogging stroller field", sanitized: true },
  { text: "in our checks", sanitized: true },
  { text: "backed by real testing", sanitized: true },
  { text: "in our test pool", sanitized: true },
  { text: "hands-on testing", sanitized: true },
  { text: "we tested", sanitized: true },
  {
    text: "delivered up to",
    sanitized: false,
    note: "ride-time wording is a manufacturer rating; the sanitizer covers the full '... minutes of ride time' shape, this phrase is fixed in CMS data only",
  },
  {
    text: "frame-stress checks",
    sanitized: false,
    note: "fixed in CMS data for kids_tricycles-b0dp9nlg63; no sanitizer rule by design",
  },
  // ZH — mirrors of the same template, plus evaluation titles/changelogs.
  {
    text: "实测 (except the protected consumer advice 必须实测)",
    sample: "电池实测续航可达 120 分钟",
    regex: /(?<!必须)实测/g,
    sanitized: true,
    note: "catch-all; the lookbehind keeps '下单前必须实测孩子头围' (measure your child's head) readable",
  },
  { text: "实测整备", sanitized: true },
  { text: "经实测验证", sanitized: true },
  { text: "本组测试", sanitized: true },
  { text: "本组", sanitized: true },
  { text: "测试组中", sanitized: true },
  { text: "实验室评测", sanitized: true },
  { text: "实测池", sanitized: true },
  { text: "第三方实测", sanitized: true },
  {
    text: "我们…测试 (unattributed first-person testing)",
    sample: "我们 1 岁组测试中维护成本最低",
    regex: /我们[^。<]{0,44}(?:测试|实测|测量|验证)/g,
    sanitized: false,
    note: "fixed in CMS data (balance_bike-b0blmf98s8 zh); the Graco manufacturer copy was attributed instead",
  },
  {
    text: "岁组测试中",
    sanitized: true,
    note: "zh mirror of 'in our N-year-old test group'; the sanitizer rewrites it to 年龄段中",
  },
  {
    text: "应力测试",
    sanitized: false,
    note: "fixed in CMS data for kids_tricycles-b0dp9nlg63 (zh 通过车架应力测试); no sanitizer rule by design",
  },
];

const distDir = resolve(process.cwd(), "dist");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return full.endsWith(".html") ? [full] : [];
  });
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Drift protection: every phrase the guard expects the sanitizer to neutralise
// must actually be rewritten by it.
const uncovered = FORBIDDEN.filter((p) => p.sanitized && sanitizeUnsupportedClaims(p.sample ?? p.text) === (p.sample ?? p.text));
if (uncovered.length) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: "sanitizer no longer covers these phrases — update src/lib/unsupportedClaims.ts or this guard",
        uncovered: uncovered.map((p) => p.text),
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

let files: string[];
try {
  files = walk(distDir);
} catch {
  console.error(JSON.stringify({ ok: false, error: `dist/ not found at ${distDir}. Run the build first.` }, null, 2));
  process.exit(1);
}

const findings: Array<{ file: string; phrase: string; sample: string }> = [];
for (const file of files) {
  const html = readFileSync(file, "utf8");
  const rel = file.slice(distDir.length).replace(/\\/g, "/");
  for (const entry of FORBIDDEN) {
    const regex = entry.regex ?? new RegExp(escapeRegex(entry.text), "gi");
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      const at = match.index;
      findings.push({
        file: rel,
        phrase: entry.text,
        sample: html.slice(Math.max(0, at - 60), at + match[0].length + 60).replace(/\s+/g, " "),
      });
      if (findings.length > 200) break;
    }
    if (findings.length > 200) break;
  }
}

if (findings.length) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        count: findings.length,
        detail:
          "Testing claims reached the built HTML. Clean the CMS records and keep sanitizeUnsupportedClaims() as the backstop — never bypass it.",
        findings: findings.slice(0, 50),
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, scanned: files.length, phrases: FORBIDDEN.length, findings: 0 }, null, 2));
