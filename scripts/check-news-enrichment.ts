/**
 * Guard for the four enriched news articles.
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
  "balance-bike-brand-news-october-2026": {
    en: ["$139.99", "4.9 lb", "3.2 kg", "3 kg", "82–100 cm", "2017", "7–14", "12-inch"],
    zh: ["139.99 美元", "4.9 磅", "3.2 公斤", "3 公斤", "82–100 厘米", "2017 年", "7 至 14 岁", "12 英寸"],
  },
  "balance-bike-research": {
    en: ["2,005", "4.16", "5.97", "7.27", "100%", "77%", "50 children", "six sessions"],
    zh: ["2005", "4.16 岁", "5.97 岁", "7.27 岁", "100%", "77%", "50 名", "六个课时"],
  },
  "new-balance-bikes-2026": {
    en: ["4.9 lb", "3.2 kg", "$139.99", "2017", "nylon composite", "magnesium", "11–15 in", "33.5–40 cm", "45 lb", "50 kg", "6.7 lb", "5.6 lb", "1–3 years", "18 months"],
    zh: ["4.9 磅", "3.2 公斤", "139.99 美元", "2017 年", "尼龙复合", "镁合金", "11–15 英寸", "33.5–40 cm", "45 磅", "50 公斤", "6.7 磅", "5.6 磅", "1–3 岁", "18 个月"],
  },
  "kids-electric-bike-development-trends-2026": {
    en: ["12V eight times", "24V five times", "36V once", "6V once", "11 of 16 titles", "3 of 16 spec sheets", "55 lb to 264 lb", "400W", "37-120 months", "1.5 MPH", "3.5 MPH", "5-8 MPH", "61-132 lb", "65-264 lb"],
    zh: ["12V 八次", "24V 五次", "36V 一次", "6V 一次", "11/16 个标题", "3/16 个规格表", "55 磅到 264 磅", "400W", "37-120 个月", "1.5 MPH", "3.5 MPH", "5-8 MPH", "61-132 磅", "65-264 磅"],
  },
  "ride-on-safety-standards-2026": {
    en: ["8.21", "five of them new tests", "10 N·m", "40, 50, and 60 N", "300 N", "200 N", "28 January 2026", "31 July 2026", "31 July 2027", "2009/48/EC", "25 inches (63.5 cm)", "90 ppm", "100 ppm", "16 CFR 1250", "April 2024"],
    zh: ["8.21", "五项是新测试", "10 N·m", "40、50、60 牛", "300 牛", "200 牛", "2026 年 1 月 28 日", "2026 年 7 月 31 日", "2027 年 7 月 31 日", "2009/48/EC", "25 英寸（63.5 cm）", "90 ppm", "100 ppm", "16 CFR 1250", "2024 年 4 月"],
  },
  "foldable-electric-scooter-brands-worldwide": {
    en: ["Segway-Ninebot", "Xiaomi", "NIU", "Apollo", "Unagi", "Gotrax", "Dualtron", "Kaabo", "Vsett", "NAMI", "50 km/h", "MAX G2", "KQi3 Pro", "Mantis"],
    zh: ["Segway-Ninebot", "Xiaomi", "NIU", "Apollo", "Unagi", "Gotrax", "Dualtron", "Kaabo", "Vsett", "NAMI", "50km/h", "MAX G2", "KQi3 Pro", "Mantis"],
  },
  "electric-dirt-bikes-for-kids": {
    en: ["55 lb", "132 lb", "65 lb", "400W", "4x100W", "5-8 MPH", "14-inch EVA", "37-120 months", "122 minutes", "60.6 lb", "16.8 lb", "0 of 16 spec sheets", "11 of 16 titles", "3 of 16 spec sheets", "55 lb to 264 lb", "36 months"],
    zh: ["55 磅", "132 磅", "65 磅", "400W", "4x100W", "5-8 MPH", "14 英寸 EVA", "37-120 个月", "122 分钟", "60.6 磅", "16.8 磅", "0/16 个规格表", "11/16 个标题", "3/16 个规格表", "55 磅到 264 磅", "36 个月"],
  },
};

const records: Array<{
  slug?: string;
  id: string;
  category?: string;
  en?: { content?: string };
  zh?: { content?: string };
}> = JSON.parse(readFileSync(SNAPSHOT, "utf8"));

/** Chinese panels must read as Chinese: no English units or section labels. */
const ZH_ENGLISH_LEAK = /\b(?:in|cm|kg|lb|FAQ|AT A GLANCE|Source|years|months|Brand|Model)\b/i;

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
    if (lang === "zh") {
      const visible = html.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ");
      const leaks = [...new Set(visible.match(ZH_ENGLISH_LEAK) || [])];
      if (leaks.length) {
        fail(`${slug}/zh`, `English expression(s) in Chinese panel: ${leaks.join(", ")}`);
      }
    }
  }

  // 3. static pages actually carry the section (both languages).
  // Channel comes from the CMS record — never infer it from a slug, or a new
  // article in a third channel would silently skip this assertion.
  const channel = record.category || "science";
  const rel = [`news/${channel}/`, `zh/news/${channel}/`];
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
