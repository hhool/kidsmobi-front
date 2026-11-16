/**
 * Guard for the two enriched news articles.
 *
 * Checks three things the generic dist guards cannot:
 *   1. GROUNDING — every number shown in the enrichment panels is a literal
 *      string already present in that article's published CMS body. A future
 *      edit to the panels that adds a fact the article never stated fails here.
 *   2. COVERAGE — each treated slug renders a non-empty block in both languages
 *      and no other article gets one.
 *   3. HYDRATION PARITY — the SPA imports the shared renderer (it cannot keep
 *      its own copy), and the built pages carry the static section.
 *
 * Run: npm run check:newsenrich   (after `npm run build`)
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  ENRICHED_NEWS_SLUGS,
  renderNewsVisualEnrichmentHtml,
} from "../src/lib/newsVisualEnrichment";

const ROOT = resolve(".");
const DIST = join(ROOT, "dist");
const SNAPSHOT = join(ROOT, "scripts/cms-snapshots/news.json");
const SPA = join(ROOT, "src/components/NewsSection.tsx");

const problems: string[] = [];
const fail = (where: string, msg: string) => problems.push(`${where}: ${msg}`);

/** Numbers/labels the panels display, each must appear in the CMS body. */
const GROUNDING: Record<string, { en: string[]; zh: string[] }> = {
  "strider-bikes-kellys-juvenile-models": {
    en: ["three Kellys models", "18-inch", "20-inch", "24-inch", "7-speed", "1991", "exclusive authorized retailer", "will not be wholesaling"],
    zh: ["三款", "18 英寸", "20 英寸", "24 英寸", "7 速", "1991", "不会批发"],
  },
  "choosing-and-using-child-safety-seats": {
    en: ["70%", "50%", "15 months", "4 to 12", "ISOFIX", "2-3 cm"],
    zh: ["70%", "50%", "15个月", "4岁至12岁", "ISOFIX", "3厘米"],
  },
};

const records: Array<{ slug?: string; id: string; en?: { content?: string }; zh?: { content?: string } }> =
  JSON.parse(readFileSync(SNAPSHOT, "utf8"));

for (const slug of ENRICHED_NEWS_SLUGS) {
  const record = records.find((r) => r.slug === slug);
  if (!record) {
    fail(slug, "not found in scripts/cms-snapshots/news.json");
    continue;
  }

  // 1. grounding: strings the panels assert must be in the published body.
  const anchors = GROUNDING[slug];
  for (const lang of ["en", "zh"] as const) {
    const body = String((record[lang]?.content) || "");
    for (const anchor of anchors[lang]) {
      if (!body.includes(anchor)) {
        fail(`${slug}/${lang}`, `panel quotes "${anchor}" but the CMS body does not contain it`);
      }
    }

    // 2. coverage: non-empty in both languages, with the section marker.
    const html = renderNewsVisualEnrichmentHtml(slug, lang);
    if (!html) {
      fail(`${slug}/${lang}`, "renderNewsVisualEnrichmentHtml returned empty");
      continue;
    }
    if (!html.includes(`data-news-enrichment="${slug}"`)) {
      fail(`${slug}/${lang}`, "section marker missing from rendered HTML");
    }
    if (!html.includes("Source:") && !html.includes("来源：")) {
      fail(`${slug}/${lang}`, "source note missing — panels must say where the numbers came from");
    }
    if (/<h1\b|<title\b|<meta\b|rel="canonical"/i.test(html)) {
      fail(`${slug}/${lang}`, "enrichment leaked a head-level element (h1/title/meta/canonical)");
    }
    if (/we tested|in our testing|hands-on testing|实测|实验室/i.test(html)) {
      fail(`${slug}/${lang}`, "enrichment contains an unsupportable testing claim");
    }
  }

  // 3. static pages actually carry the section (both languages).
  const rel = slug === "strider-bikes-kellys-juvenile-models"
    ? ["news/new_product/", "zh/news/new_product/"]
    : ["news/science/", "zh/news/science/"];
  for (const dir of rel) {
    const file = join(DIST, dir, `${slug}.html`);
    if (!existsSync(file)) {
      fail(slug, `built page missing: dist/${dir}${slug}.html`);
      continue;
    }
    const html = readFileSync(file, "utf8");
    if (!html.includes(`data-news-enrichment="${slug}"`)) {
      fail(slug, `static page dist/${dir}${slug}.html has no enrichment block`);
    }
  }
}

// Every other article must stay untouched.
for (const record of records) {
  const slug = String(record.slug || record.id);
  if ((ENRICHED_NEWS_SLUGS as readonly string[]).includes(slug)) continue;
  if (renderNewsVisualEnrichmentHtml(slug, "en")) {
    fail(slug, "unexpected enrichment block for an untreated article");
  }
}

// Hydration parity: one renderer, imported by the SPA.
const spa = readFileSync(SPA, "utf8");
if (!spa.includes('from "../lib/newsVisualEnrichmentHtml"')) {
  fail("hydration", "NewsSection.tsx does not import the shared renderer");
}
if (!spa.includes("renderNewsVisualEnrichmentHtml(article.slug || article.id, lang)")) {
  fail("hydration", "NewsSection.tsx does not call the shared renderer with the article slug");
}

if (problems.length) {
  console.error(`check:newsenrich FAILED — ${problems.length} problem(s)\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(
  `check:newsenrich OK — ${ENRICHED_NEWS_SLUGS.length} article(s) x 2 languages grounded, static blocks present, SPA shares the renderer`,
);
