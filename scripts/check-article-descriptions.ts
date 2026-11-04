/**
 * Proves every published page carries a meta description that can survive a
 * search result, and that the hydrated SPA would publish the same one.
 *
 * Two rules, one file:
 *
 * 1. LENGTH AND UNIQUENESS. A snippet below 70 characters gets truncated into
 *    a fragment, and two pages with the same snippet are two pages competing
 *    for the same query. The Chinese teasers were 35-67 characters — every
 *    /zh/guides/* and /zh/news/* page shipped a description too short to
 *    show. The English ones were fine, which is why the failure was invisible
 *    in the English pages.
 *
 * 2. PARITY. The site has two renderers for the same URL: the prerender writes
 *    the static HTML, the SPA writes what the visitor's browser ends up with.
 *    The article descriptions used to be built by two different functions —
 *    the SPA cut at 155 characters, the prerender at 158 — so the same page
 *    answered "what is this about" in two lengths. Both now call
 *    src/lib/articleDescription.ts, and this check recomputes the SPA's value
 *    from the CMS record and compares it with what the prerender published.
 *
 * Run: npm run check:descriptions   (after `npm run build`)
 */
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import path from "path";
import { buildArticleMetaDescription } from "../src/lib/articleDescription";
import { getPageCopy } from "../src/config/pageCopy";

const ROOT = process.env.CHECK_DESCRIPTIONS_ROOT || "dist";
const SNAPSHOT_DIR = path.resolve("scripts", "cms-snapshots");

/** A snippet below this is a fragment; above it, the description is usable. */
const MIN_CHARS = 70;
/** The site's own cap (src/lib/documentTitle.ts). */
const MAX_CHARS = 158;

const decode = (text: string) =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}

/** The prerendered <meta name="description"> of a built page, if it has one. */
function readDescription(file: string): string | null {
  const html = readFileSync(file, "utf8");
  const match = /<meta\s+name="description"\s+content="([^"]*)"/i.exec(html);
  if (!match) return null;
  return decode(match[1]).replace(/\s+/g, " ").trim();
}

/** pickText() in scripts/prerender-pages.ts: the first non-empty value. */
function pickText(...values: unknown[]): string {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

interface CmsRecord {
  id: string;
  seo?: { en?: { description?: string }; zh?: { description?: string } };
  en?: { summary?: string; content?: string };
  zh?: { summary?: string; content?: string };
}

// --- The two chains, side by side --------------------------------------------
// The prerender (scripts/prerender-pages.ts, renderGuideDetailPage /
// renderNewsDetailPage) and the SPA (src/components/GuidesSection.tsx /
// NewsSection.tsx, the `mapped` array) resolve the teaser and the body from
// the same CMS record through slightly different expressions. They must still
// land on the same snippet, so both are spelled out here and compared.

const GUIDE_SUMMARY_FALLBACK = {
  en: "Professional buying guides and safety research insights.",
  zh: "专业选购指南与安全研究报告。",
};

/** What the prerender resolves. */
function prerenderCopy(record: CmsRecord, lang: "en" | "zh") {
  const seo = record.seo ?? {};
  const en = record.en ?? {};
  const zh = record.zh ?? {};
  if (lang === "zh") {
    return {
      summary: pickText(
        zh.summary,
        seo.zh?.description,
        en.summary,
        seo.en?.description,
        "BalanceBikeToddler 选购指南。",
      ),
      content: pickText(zh.content, en.content),
    };
  }
  return {
    summary: pickText(
      en.summary,
      seo.en?.description,
      zh.summary,
      seo.zh?.description,
      "BalanceBikeToddler buying guide for families.",
    ),
    content: pickText(en.content, zh.content),
  };
}

/** What the hydrated SPA resolves. */
function spaCopy(record: CmsRecord, lang: "en" | "zh", kind: "guide" | "news") {
  const seo = record.seo ?? {};
  const en = record.en ?? {};
  const zh = record.zh ?? {};
  const newsCopy = getPageCopy(lang).news;
  const summaryFallback =
    kind === "guide" ? GUIDE_SUMMARY_FALLBACK[lang] : newsCopy.fallbackSummary;
  const contentFallback = kind === "guide" ? "" : newsCopy.fallbackContent;
  // GuidesSection's pickLocalized: English falls back to the Chinese value.
  // NewsSection's does not (its English fallback is a "coming back soon"
  // string), so the two collections differ here on purpose.
  const summary =
    lang === "zh"
      ? pickText(seo.zh?.description, seo.en?.description, summaryFallback)
      : kind === "guide"
        ? pickText(seo.en?.description, seo.zh?.description, summaryFallback)
        : pickText(seo.en?.description, summaryFallback);
  const content =
    lang === "zh"
      ? pickText(zh.content, en.content, contentFallback)
      : kind === "guide"
        ? pickText(en.content, zh.content, contentFallback)
        : pickText(en.content, contentFallback);
  return { summary, content };
}

function loadRecords(file: string): CmsRecord[] {
  const full = path.join(SNAPSHOT_DIR, file);
  if (!existsSync(full)) return [];
  const parsed = JSON.parse(readFileSync(full, "utf8"));
  return Array.isArray(parsed) ? (parsed as CmsRecord[]) : [];
}

function main() {
  const findings: string[] = [];

  // --- 1. every built page has a usable, unique snippet --------------------
  const files = walk(ROOT);
  const seen = new Map<string, string>();
  let withDescription = 0;
  for (const file of files) {
    const description = readDescription(file);
    if (description === null) continue;
    withDescription += 1;
    const route = path.relative(ROOT, file).replace(/index\.html$/, "").replace(/\.html$/, "") || "/";
    if (description.length < MIN_CHARS) {
      findings.push(`${route}: description is ${description.length} chars (needs ${MIN_CHARS}+) — "${description}"`);
    } else if (description.length > MAX_CHARS) {
      findings.push(`${route}: description is ${description.length} chars (max ${MAX_CHARS})`);
    }
    const previous = seen.get(description);
    if (previous) {
      findings.push(`${route}: description is identical to ${previous} — "${description}"`);
    } else {
      seen.set(description, route);
    }
  }
  if (files.length === 0) {
    console.error(`check:descriptions FAIL — no HTML found under ${ROOT}/. Run \`npm run build\` first.`);
    process.exit(1);
  }

  // --- 2. the SPA and the prerender publish the same snippet ---------------
  const collections: Array<{ file: string; kind: "guide" | "news" }> = [
    { file: "guides.json", kind: "guide" },
    { file: "news.json", kind: "news" },
  ];
  let checkedRecords = 0;
  for (const { file, kind } of collections) {
    for (const record of loadRecords(file)) {
      for (const lang of ["en", "zh"] as const) {
        const prerender = prerenderCopy(record, lang);
        const spa = spaCopy(record, lang, kind);
        const fromPrerender = buildArticleMetaDescription({ ...prerender, lang, kind });
        const fromSpa = buildArticleMetaDescription({ ...spa, lang, kind });
        checkedRecords += 1;
        if (fromPrerender !== fromSpa) {
          findings.push(
            `${record.id}/${lang}: the SPA and the prerender disagree on the description\n` +
              `    prerender: ${fromPrerender}\n` +
              `    SPA:       ${fromSpa}`,
          );
          continue;
        }
        if (!seen.has(fromPrerender)) {
          findings.push(
            `${record.id}/${lang}: no built page publishes the description this record resolves to — "${fromPrerender}"`,
          );
        }
      }
    }
  }

  if (findings.length > 0) {
    console.error(`check:descriptions FAIL — ${findings.length} finding(s)\n`);
    for (const finding of findings) console.error(`  - ${finding}\n`);
    process.exit(1);
  }

  console.log(
    `check:descriptions OK — ${withDescription} built page(s) with a description, all ${MIN_CHARS}-${MAX_CHARS} chars and unique; ` +
      `${checkedRecords} CMS record(s) resolve to the same snippet in the SPA and the prerender`,
  );
}

main();
