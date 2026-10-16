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
  // Wave 4 (2026-10-16 dynamic check): a second claim family lived in the
  // front-end copy layer — src/lib/translate.ts legacy dictionaries (live
  // imports from App.tsx/GuidesSection), the fallback datasets, and the
  // transparency pages. dist/ is an EN-only prerender, so none of it was
  // visible to the phase-1 scan; phase 2 below scans the source directly.
  { text: "lab recommendations for you", sanitized: true },
  { text: "highest lab score", sanitized: true },
  { text: "safety benchmark lab", sanitized: true },
  { text: "testing methodology", sanitized: true },
  { text: "rig fatigue test", sanitized: true },
  { text: "rig test", sanitized: true },
  { text: "lab inspection", sanitized: true },
  { text: "lab checklist", sanitized: true },
  { text: "lab extracts", sanitized: true },
  { text: "lab data", sanitized: true },
  { text: "lab report", sanitized: true },
  { text: "lab-measured", sanitized: true },
  { text: "lab weight", sanitized: true },
  { text: "laboratory scores", sanitized: true },
  { text: "independent safety testing", sanitized: true },
  { text: "mechanics lab", sanitized: true },
  { text: "lab audit", sanitized: true },
  { text: "lab insight", sanitized: true },
  { text: "lab exclusive", sanitized: true },
  { text: "lab verified", sanitized: true },
  { text: "ergonomics lab", sanitized: true },
  { text: "motor development lab", sanitized: true },
  { text: "实验室为您推荐", sanitized: true },
  { text: "实验室最高分", sanitized: true },
  { text: "实验室数据", sanitized: true },
  { text: "实验室报告", sanitized: true },
  { text: "实验室评分", sanitized: true },
  { text: "实验室首选", sanitized: true },
  { text: "实验室测评", sanitized: true },
  { text: "实验室主推", sanitized: true },
  { text: "安全基准实验室", sanitized: true },
  { text: "安全实验室", sanitized: true },
  { text: "测试方法", sanitized: true },
  { text: "双盲实测", sanitized: true },
  { text: "匿名采购", sanitized: true },
  { text: "自购样品", sanitized: true },
  { text: "台架测试", sanitized: true },
  {
    text: "颠震滚筒",
    sanitized: false,
    note: "fabricated rig-equipment wording removed from src copy (translate.ts promo block); content-level, no sanitizer rule by design",
  },
  {
    text: "滚筒仪",
    sanitized: false,
    note: "same fabricated-equipment family as 颠震滚筒; source-level only",
  },
  {
    text: "已公示第三方检测",
    sanitized: false,
    note: "dead translations.zh key rewritten to 公开安全认证; source-level only",
  },
  {
    text: "连续疲劳测试",
    sanitized: false,
    note: "fabricated 100-day fatigue-test narrative removed from the translations dict; source-level only",
  },
  {
    text: "全自研",
    sanitized: false,
    note: "'self-developed weighing equipment' claim removed from the translations dict; source-level only",
  },
  {
    text: "力学质检",
    sanitized: false,
    note: "fake 'quality inspection group' persona removed from guidesData; kept as a watch phrase (no sanitizer rule — it is a byline, not a testing claim)",
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

// --- Phase 2: source-level scan ---------------------------------------------
// Phase 1 reads dist/, which is an EN-only prerender: zh copy and any body
// copy the sanitizer never touches are structurally invisible to it. The
// 2026-10-16 dynamic (SPA/hydrated) check proved that gap is real — it found
// ~200 claim instances in src/lib/translate.ts legacy dictionaries, the
// fallback datasets, and the transparency pages. This phase scans the source
// strings directly, EN + ZH, so a claim can no longer hide by being
// client-rendered only.
type SourcePattern = { label: string; regex: RegExp };

const SOURCE_FORBIDDEN: SourcePattern[] = [
  // EN claim shapes (word-bounded so code identifiers don't false-positive).
  { label: "lab-tested", regex: /\blab[\s-]?tested\b/gi },
  { label: "lab-reviewed", regex: /\blab[\s-]?reviewed\b/gi },
  { label: "lab-verified", regex: /\blab[\s-]?verified\b/gi },
  { label: "lab measurements", regex: /\blab[\s-]?measurements?\b/gi },
  { label: "lab scores", regex: /\blab[\s-]?scores?\b/gi },
  { label: "lab checklist", regex: /\blab[\s-]?checklist\b/gi },
  { label: "lab extracts", regex: /\blab[\s-]?extracts?\b/gi },
  { label: "lab data", regex: /\blab[\s-]?data\b/gi },
  { label: "lab report", regex: /\blab[\s-]?reports?\b/gi },
  { label: "lab weight", regex: /\blab[\s-]?weight\b/gi },
  { label: "lab-measured", regex: /\blab[\s-]?measured\b/gi },
  { label: "lab test", regex: /\blab[\s-]?tests?\b/gi },
  { label: "laboratory scores", regex: /\blaboratory scores\b/gi },
  { label: "lab audit", regex: /\blab audit\b/gi },
  { label: "lab insight", regex: /\blab insight\b/gi },
  { label: "lab exclusive", regex: /\blab exclusive\b/gi },
  { label: "lab verified", regex: /\blab verified\b/gi },
  { label: "ergonomics lab", regex: /\bergonomics lab\b/gi },
  { label: "motor development lab", regex: /\bmotor development lab\b/gi },
  { label: "mechanics lab", regex: /\bmechanics lab\b/gi },
  { label: "rig test", regex: /\brig[\s-]?(?:fatigue[\s-]+)?tests?\b/gi },
  { label: "tilt test", regex: /\btilt tests?\b/gi },
  { label: "fatigue test", regex: /\bfatigue tests?\b/gi },
  { label: "testing methodology", regex: /\btesting methodology\b/gi },
  { label: "test pool", regex: /\btest pool\b/gi },
  { label: "test notes:", regex: /\btest notes:/gi },
  { label: "test group", regex: /\btest group\b/gi },
  { label: "we have tested", regex: /\bwe have tested\b/gi },
  { label: "we tested", regex: /\bwe tested\b/gi },
  { label: "hands-on testing", regex: /\bhands-on testing\b/gi },
  { label: "backed by real testing", regex: /\bbacked by real testing\b/gi },
  { label: "independent safety testing", regex: /\bindependent safety testing\b/gi },
  { label: "safety benchmark lab", regex: /\bsafety benchmark lab\b/gi },
  { label: "our lab", regex: /\bour lab\b/gi },
  { label: "from our lab", regex: /\bfrom our lab\b/gi },
  { label: "lab database", regex: /\blab database\b/gi },
  // ZH claim shapes. 我们实测 carries a lookbehind so the honest negations on
  // the asset pages ("不是我们实测", "本页面没有任何数据是实测的") stay legal.
  { label: "实验室评测", regex: /实验室评测/g },
  { label: "实验室测评", regex: /实验室测评/g },
  { label: "实验室主推", regex: /实验室主推/g },
  { label: "实验室为您推荐", regex: /实验室为您推荐/g },
  { label: "实验室最高分", regex: /实验室最高分/g },
  { label: "实验室数据", regex: /实验室数据/g },
  { label: "实验室报告", regex: /实验室报告/g },
  { label: "实验室评分", regex: /实验室评分/g },
  { label: "实验室首选", regex: /实验室首选/g },
  { label: "安全基准实验室", regex: /安全基准实验室/g },
  { label: "安全实验室", regex: /安全实验室/g },
  { label: "双盲实测", regex: /双盲实测/g },
  { label: "匿名采购", regex: /匿名采购/g },
  { label: "自购样品", regex: /自购样品/g },
  { label: "台架测试", regex: /台架测试/g },
  { label: "颠震滚筒", regex: /颠震滚筒/g },
  { label: "滚筒仪", regex: /滚筒仪/g },
  { label: "实测池", regex: /实测池/g },
  { label: "第三方实测", regex: /第三方实测/g },
  { label: "实测整备", regex: /实测整备/g },
  { label: "经实测验证", regex: /经实测验证/g },
  { label: "本组测试", regex: /本组测试/g },
  { label: "本组对比", regex: /本组对比/g },
  { label: "岁组测试中", regex: /岁组测试中/g },
  { label: "我们实测", regex: /(?<![是不没未非])我们实测/g },
  { label: "已公示第三方检测", regex: /已公示第三方检测/g },
  { label: "连续疲劳测试", regex: /连续疲劳测试/g },
  { label: "全自研", regex: /全自研/g },
  { label: "应力测试", regex: /应力测试/g },
  { label: "静置拉力", regex: /静置拉力/g },
  { label: "测试方法", regex: /测试方法/g },
  { label: "力学质检", regex: /力学质检/g },
];

/**
 * Legitimate (file, phrase) pairs. `label: "*"` exempts a whole file.
 * Every entry must carry the reason it is legal.
 */
const SOURCE_ALLOWLIST: Array<{ file: RegExp; label: string; note: string }> = [
  { file: /lib\/unsupportedClaims\.ts$/, label: "*", note: "the sanitizer rules themselves" },
  { file: /scripts\/check-honesty-claims\.ts$/, label: "*", note: "this guard" },
  {
    file: /components\/EvaluationsSection\.tsx$/,
    label: "lab report",
    note: "stripper regex that REMOVES 'Lab Report' from CMS evaluation text",
  },
  {
    file: /components\/EvaluationsSection\.tsx$/,
    label: "lab insight",
    note: "stripper regex that REMOVES 'Review Lab Insight' from CMS text",
  },
  {
    file: /data\/balanceBikeSafety\.ts$/,
    label: "lab test",
    note: "'CPSC-accepted lab test' is a regulatory fact; 'without a lab' is a negative",
  },
];

function walkSource(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walkSource(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

const workspaceRoot = process.cwd();
const isAllowed = (relFile: string, label: string) =>
  SOURCE_ALLOWLIST.some((rule) => rule.file.test(relFile) && (rule.label === "*" || rule.label === label));

const sourceFindings: Array<{ file: string; phrase: string; sample: string }> = [];
for (const file of walkSource(resolve(workspaceRoot, "src"))) {
  const rel = file.slice(workspaceRoot.length + 1).replace(/\\/g, "/");
  const text = readFileSync(file, "utf8");
  for (const pattern of SOURCE_FORBIDDEN) {
    if (isAllowed(rel, pattern.label)) continue;
    pattern.regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.regex.exec(text)) !== null) {
      const at = match.index;
      sourceFindings.push({
        file: rel,
        phrase: pattern.label,
        sample: text.slice(Math.max(0, at - 60), at + match[0].length + 60).replace(/\s+/g, " "),
      });
      if (sourceFindings.length > 200) break;
    }
    if (sourceFindings.length > 200) break;
  }
}

if (sourceFindings.length) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        phase: "source-scan",
        count: sourceFindings.length,
        detail:
          "Testing claims found in src/ strings. dist/ is an EN-only prerender, so client-rendered and zh copy needs this scan. " +
          "Fix the copy, or add a (file, phrase) allowlist entry with a reason in SOURCE_ALLOWLIST.",
        findings: sourceFindings.slice(0, 50),
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    { ok: true, phase: "source-scan", patterns: SOURCE_FORBIDDEN.length, findings: 0 },
    null,
    2,
  ),
);
