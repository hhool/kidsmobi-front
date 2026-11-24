/**
 * Shared machinery for the guides gap-fill batches (R48).
 *
 * WHY THIS IS A MODULE AND NOT COPIED INTO EACH BATCH.
 *
 * The batches add articles one product category at a time: stroller (7, shipped
 * 2026-11-25), then balance, bicycle, scooter and electric_car. Every batch has
 * to answer the same four questions the same way, and each of them has already
 * produced a real defect when it was answered in only one place:
 *
 *   1. Is the title short enough that buildDocumentTitle() will not cut it
 *      mid-clause? (Batch 1 shipped two truncated titles on the first draft.)
 *   2. Does the title END on a function word close enough to the cap that the
 *      title guard mistakes an authored "for" for a truncation scar? (Batch 1
 *      shipped one; check:titles caught it.)
 *   3. Does every in-body link resolve to a PUBLISHED slug, AND to the topic
 *      segment that slug is actually filed under? (Batch 1 shipped eight 404s
 *      because the check compared only the slug — see assertLinks below.)
 *   4. Is the cover shared by more than two guides? (check:covers tolerates two,
 *      never three.)
 *
 * Batch 1 carries all four checks inline in fill-guides-stroller-gaps.mjs. A
 * second copy in each later batch is the exact shape the repo's own notes warn
 * about — "two implementations of one rule will drift" — so the checks and the
 * record builder live here, once, and each batch contributes only its editorial
 * content plus the one field that differs (productCategory).
 *
 * The content contract every batch must satisfy is in GROUNDING_RULES below and
 * is enforced by assertCopy().
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { adminHeaders } from "../_cmsAdminToken.mjs";

/** Claims this site cannot make about itself. Scanned before any write. */
// diff-review:skip-begin
// Enforcement data, not published copy. The diff-review honesty-claim rule
// scans added source lines and would otherwise match its own vocabulary and
// fail the push gate (2026-11-24: this file reported 4 honesty-claim findings
// whose "claim" was the ban list itself). The markers are the documented
// opt-out — payload copy outside them stays fully checked.
export const FORBIDDEN_EN = [
  "we tested", "hands-on testing", "in our test group", "in our testing",
  "in our checks", "backed by real testing", "lab test", "lab-measured",
  "independent safety testing", "we measured", "our laboratory",
];
export const FORBIDDEN_ZH = [
  "实测", "实验室", "测试方法", "台架测试", "我们测试", "我们验证", "本组实测",
];
// diff-review:skip-end

/**
 * The channel pages that actually exist: /guides/<topic>.
 *
 * "best" is deliberately absent. Its guides are the commercial cluster, not one
 * of the six topic channel pages (see GUIDE_TOPIC_IDS vs the channel vocabulary
 * in src/lib/guidesCategoryTopic.ts), so a link to /guides/best is a 404.
 */
export const CHANNEL_TOPICS = new Set([
  "beginner", "scenario", "budget", "risk", "special", "maintenance",
]);

/** Every topic id, including the one with no channel page. */
export const ALL_TOPICS = new Set([...CHANNEL_TOPICS, "best"]);

/** Category id -> the productCategory value the CMS taxonomy must carry. */
export const GUIDE_CATEGORY_IDS = ["stroller", "balance", "bicycle", "scooter", "electric_car"];

/**
 * Stem budget for a <title>.
 *
 * buildDocumentTitle() appends " | BalanceBikeToddler" (21 chars) and, when the
 * result exceeds TITLE_MAX_CHARS (60), cuts the STEM at a word boundary. A stem
 * over 39 therefore publishes a truncated title. Checking the raw stem here is
 * the only way to catch it before the CMS row exists.
 */
export const TITLE_STEM_MAX = 60 - " | BalanceBikeToddler".length;

/**
 * Function words that must not be the LAST word of a title this close to the
 * cap. Mirrors TITLE_DANGLING_WORDS in src/lib/documentTitle.ts and the
 * >=56-char rule in scripts/check-prerender-titles.mjs: at that length the
 * guard cannot tell an authored trailing function word from a truncation.
 */
export const TITLE_DANGLING_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "nor", "as", "at", "by", "for", "from",
  "in", "of", "on", "to", "with", "than", "then", "that", "this", "these",
  "those", "it", "its", "is", "are", "was", "we", "our", "you", "your", "who",
  "how", "what", "when", "where", "why", "&",
]);

/** Same window as the title guard: below 56 chars a trailing function word is
 *  unambiguously authored, so only the near-cap case is a defect. */
export const TITLE_TRUNCATION_MIN_LEN = 60 - 4;

/** Minimum body sizes. The content guard needs 800 visible chars on the page. */
export const MIN_EN_WORDS = 350;
export const MIN_ZH_CHARS = 500;

/** check:covers tolerates a cover used by two guides, never three. */
export const MAX_COVER_SHARERS = 2;

export function wordCount(text) {
  return (String(text || "").match(/[A-Za-z0-9']+/g) || []).length;
}

/**
 * Cover identity for the >2-sharers check.
 *
 * The two sides of this catalogue write the same asset two different ways: the
 * products snapshot stores `scrape_store/<dir>/Rank_1_ASIN_<id>_<name>/images/
 * primary.jpg`, while a guide record stores the absolute
 * `https://store.../<dir>/Rank_1_ASIN_<id>_<name>/images/primary.jpg`. Some of
 * them percent-encode spaces and some carry literal spaces (%20 vs " "). A
 * string comparison therefore reports two different covers for one image, and
 * the guard stops counting a third share — which is the only failure it exists
 * to catch. Key on the ASIN tail with the encoding normalised away.
 */
export function coverKey(url) {
  let s = String(url || "");
  const i = s.indexOf("ASIN_");
  if (i >= 0) s = s.slice(i);
  return s
    .replace(/%20/gi, " ")
    .replace(/\+/g, " ")
    .replace(/%[0-9a-f]{2}/gi, (m) => {
      try { return decodeURIComponent(m); } catch { return m; }
    })
    .toLowerCase();
}

/**
 * Every check that can be run without the network.
 *
 * `publishedSlugs` -> the live published set (so a cross-link to an existing
 * article is not reported as a 404). `topicBySlug` -> slug to topic for those
 * published records, so a link can be checked for BOTH segments.
 */
export function assertCopy(articles, { publishedSlugs, topicBySlug, coverUse, productCategory, knownRoutes }) {
  const problems = [];
  const seen = new Set();

  if (!GUIDE_CATEGORY_IDS.includes(productCategory)) {
    problems.push(`productCategory "${productCategory}" is not a guide category id — every URL would 404`);
  }

  // Links inside a batch resolve against the batch itself, so a cross-link
  // between two new articles must not be reported as unpublished.
  for (const a of articles) topicBySlug.set(a.slug, a.topic);

  const batchCovers = new Map();
  for (const a of articles) {
    if (a.category && a.category !== productCategory) {
      problems.push(`${a.slug}: category "${a.category}" does not match this batch (${productCategory})`);
    }
    if (seen.has(a.slug)) problems.push(`${a.slug}: duplicate slug in this batch`);
    seen.add(a.slug);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.slug)) problems.push(`${a.slug}: slug is not kebab-case`);
    if (!ALL_TOPICS.has(a.topic)) problems.push(`${a.slug}: topic "${a.topic}" is not a guides topic id`);

    for (const f of FORBIDDEN_EN) {
      if (a.en.toLowerCase().includes(f)) problems.push(`${a.slug}: EN contains forbidden claim "${f}"`);
    }
    for (const f of FORBIDDEN_ZH) {
      if (a.zh.includes(f)) problems.push(`${a.slug}: ZH contains forbidden claim "${f}"`);
    }

    if (wordCount(a.en) < MIN_EN_WORDS) problems.push(`${a.slug}: EN only ${wordCount(a.en)} words (min ${MIN_EN_WORDS})`);
    if (a.zh.length < MIN_ZH_CHARS) problems.push(`${a.slug}: ZH only ${a.zh.length} chars (min ${MIN_ZH_CHARS})`);
    if (!/^##\s/m.test(a.en) || !/##/.test(a.zh)) problems.push(`${a.slug}: missing section headings`);

    if (a.title.length > TITLE_STEM_MAX) {
      problems.push(`${a.slug}: title stem ${a.title.length} chars — truncates (max ${TITLE_STEM_MAX} before the brand suffix)`);
    }
    {
      const full = `${a.title} | BalanceBikeToddler`;
      const tail = a.title.split(" ").pop().toLowerCase().replace(/[^a-z0-9.]/g, "");
      if (tail && TITLE_DANGLING_WORDS.has(tail) && full.length >= TITLE_TRUNCATION_MIN_LEN) {
        problems.push(`${a.slug}: title ends on "${tail}" at ${full.length} chars — reads as truncated (check:titles)`);
      }
    }

    if (a.description.length > 158) problems.push(`${a.slug}: description ${a.description.length} chars (>158)`);
    // The Chinese SEO block is not optional: prerender gates the /zh edition on
    // zh.title + zh.content, so an undefined zhTitle silently drops the whole
    // translated URL from the site (and from zh-routes.json / hreflang).
    if (!String(a.zhTitle || "").trim()) problems.push(`${a.slug}: zhTitle is empty — /zh edition would not be built`);
    if (!String(a.zhDescription || "").trim()) problems.push(`${a.slug}: zhDescription is empty`);
    if (String(a.zhDescription || "").length > 158) problems.push(`${a.slug}: zhDescription ${a.zhDescription.length} chars (>158)`);
    if (!Array.isArray(a.zhKeywords) || !a.zhKeywords.length) problems.push(`${a.slug}: zhKeywords is empty`);
    if (!Array.isArray(a.keywords) || !a.keywords.length) problems.push(`${a.slug}: keywords is empty`);
    for (const [field, list] of [["keywords", a.keywords], ["zhKeywords", a.zhKeywords]]) {
      if (Array.isArray(list) && list.length > 5) problems.push(`${a.slug}: ${field} has ${list.length} entries (>5)`);
    }

    // Cover budget. check-guide-covers.mjs fails at three sharers, so the batch
    // has to respect the same ceiling BEFORE the rows exist.
    const key = coverKey(a.cover);
    if (!key) problems.push(`${a.slug}: cover is empty`);
    else {
      const already = (coverUse.get(key) || 0);
      const inBatch = (batchCovers.get(key) || 0);
      const total = already + inBatch + 1;
      if (total > MAX_COVER_SHARERS) {
        problems.push(`${a.slug}: cover shared by ${total} guides after this write (max ${MAX_COVER_SHARERS})`);
      }
      batchCovers.set(key, inBatch + 1);
    }

    // Every internal link must resolve to a published slug, a sibling article in
    // this batch, or an existing topic channel — AND the topic segment must be
    // the topic that article is actually filed under.
    //
    // The first version of this check (batch 1) compared only the SLUG. That let
    // eight links to /guides/special/<slug> through while the article is filed
    // under maintenance: the slug existed, so the check passed, and the batch
    // was ready to publish a 404 from four different pages. The URL is
    // /guides/<topic>/<slug> and BOTH segments have to be right.
    const targets = [
      ...String(a.en).matchAll(/\]\((\/guides\/[^)]+)\)/g),
      ...String(a.zh).matchAll(/\]\((\/guides\/[^)]+)\)/g),
    ].map((m) => m[1]);

    // The Chinese body links the ENGLISH path. Every one of the 490 guide links
    // across the 85 published Chinese bodies is /guides/..., none carries /zh,
    // and prerender does not prefix them — so a /zh/guides/ link in a Chinese
    // body points at a route the site never advertises. All 53 such links in
    // batch 3 had to be corrected by hand because nothing caught them.
    for (const m of String(a.zh).matchAll(/\]\((\/zh\/guides\/[^)]+)\)/g)) {
      problems.push(`${a.slug}: ZH body links ${m[1]} — Chinese bodies link /guides/... (no /zh prefix)`);
    }

    for (const t of targets) {
      const seg = t.replace(/^\/guides\//, "").replace(/\/$/, "").split("/");
      if (seg.length === 1) {
        if (!CHANNEL_TOPICS.has(seg[0])) problems.push(`${a.slug}: link target channel does not exist -> ${t}`);
        continue;
      }
      const [topic, slug] = seg;
      const actual = topicBySlug.get(slug);
      if (!actual && !publishedSlugs.has(slug)) {
        problems.push(`${a.slug}: link target not published -> ${t}`);
      } else if (actual && actual !== topic) {
        problems.push(`${a.slug}: link topic "${topic}" != article topic "${actual}" -> ${t}`);
      }
    }

    // Non-guides internal links (asset pages, hubs) must also resolve. These are
    // prerendered routes rather than CMS records, so they cannot be checked
    // against the published slug set — they are checked against the build's own
    // route list. When no route list is supplied (a dry run on a fresh clone
    // before any build) the check is skipped rather than passed silently: the
    // caller is told which links went unchecked so the gap is visible.
    if (knownRoutes) {
      for (const t of nonGuideTargets(a)) {
        const bare = t.replace(/\/+$/, "") || "/";
        if (!knownRoutes.has(bare) && !knownRoutes.has(`${bare}/`)) {
          problems.push(`${a.slug}: link target not a prerendered route -> ${t}`);
        }
      }
    }
  }
  return problems;
}

/**
 * Every route the last build prerendered, or null when dist is absent.
 *
 * Body copy links to prerendered asset pages (/balance-bike-stability/,
 * /products/balance-bikes/) as well as to CMS articles, and no CMS fetch can
 * prove those exist — they are built by scripts/prerender-pages.ts from data
 * the CMS does not carry. Reading the build is the only honest source.
 *
 * Returning null (rather than an empty set) matters: an empty set would fail
 * every such link, and a skipped check would pass them silently. The caller
 * reports how many went unchecked.
 */
export function collectKnownRoutes(distDir) {
  if (!existsSync(distDir)) return null;
  const routes = new Set(["/"]);
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) { walk(full, `${prefix}/${entry.name}`); continue; }
      if (!entry.name.endsWith(".html")) continue;
      if (entry.name === "index.html") { routes.add(`${prefix}/`); continue; }
      const stem = entry.name.slice(0, -".html".length);
      routes.add(`${prefix}/${stem}`);
      routes.add(`${prefix}/${stem}/`);
    }
  };
  walk(distDir, "");
  return routes;
}
export function nonGuideTargets(a) {
  const out = new Set();
  for (const t of [
    ...String(a.en).matchAll(/\]\((\/[^)]+)\)/g),
    ...String(a.zh).matchAll(/\]\((\/[^)]+)\)/g),
  ].map((m) => m[1])) {
    if (!t.startsWith("/guides/")) out.add(t);
  }
  return out;
}

/** The record shape the Worker's saveCMSRecord() stores verbatim in `payload`. */
export function buildRecord(a, productCategory) {
  const now = new Date().toISOString();
  return {
    id: `guide-2026-${a.slug}`,
    slug: a.slug,
    category: a.topic,
    status: "published",
    taxonomy: {
      productCategory,
      topicCategory: a.topic,
      topicOrder: a.topicOrder,
      hub: "all_guides",
      hierarchyPath: [productCategory, "all_guides", a.topic],
      pinOrder: 0,
    },
    seo: {
      en: { title: a.title, description: a.description, keywords: a.keywords },
      zh: { title: a.zhTitle, description: a.zhDescription, keywords: a.zhKeywords },
    },
    en: { title: a.title, content: a.en },
    zh: { title: a.zhTitle, content: a.zh },
    imageUrl: a.cover,
    publishedAt: now.slice(0, 10),
    updatedAt: now,
  };
}

export async function request(apiBase, path, init = {}) {
  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: adminHeaders({ Accept: "application/json", ...(init.headers || {}) }),
  });
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 300) }; }
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  return body;
}

export function unwrap(payload) {
  if (Array.isArray(payload)) return payload;
  for (const key of ["data", "records", "rows", "items"]) {
    const v = payload?.[key];
    if (Array.isArray(v)) return v;
  }
  return null;
}

/**
 * Writes the D1 insert script.
 *
 * --sql exists because the admin token is a Worker SECRET. Writing cms_records
 * directly is the precedent already used for the 2026-09-29 compare evaluations
 * and for batch 1. The file is produced from the same buildRecord() output as
 * --apply, so the two paths cannot diverge in content.
 *
 * ON CONFLICT is DO NOTHING, not DO UPDATE: these are new records, and a slug
 * that appeared since the dry run must fail loudly rather than silently
 * overwrite an editor's work.
 */
export function emitSql({ planned, outDir, label, header }) {
  mkdirSync(outDir, { recursive: true });
  const sqlFile = join(outDir, `insert-guides-${label}.sql`);
  const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
  const lines = [
    ...header.map((line) => `-- ${line}`),
    "--",
    "-- The INSERT matches the Worker's saveCMSRecord() upsert shape exactly:",
    "-- payload is the entire record as one JSON blob, not a column per field.",
    "-- ON CONFLICT is deliberately DO NOTHING, not DO UPDATE: these are new",
    "-- records, and a slug that has appeared since the dry run must fail loudly",
    "-- rather than silently overwrite an editor's work.",
    "",
  ];
  for (const { rec } of planned) {
    lines.push(
      `INSERT INTO cms_records (collection, id, payload, updated_at)`,
      `VALUES ('guides', ${q(rec.id)}, ${q(JSON.stringify(rec))}, ${q(new Date().toISOString())})`,
      `ON CONFLICT(collection, id) DO NOTHING;`,
      "",
    );
  }
  writeFileSync(sqlFile, lines.join("\n"), "utf8");
  const recordsFile = join(outDir, `records-${label}.json`);
  writeFileSync(recordsFile, JSON.stringify(planned.map((p) => p.rec), null, 2));
  return { sqlFile, recordsFile, bytes: lines.join("\n").length };
}
/**
 * The whole batch driver: fetch, check, plan, and either emit SQL or apply.
 *
 * WHY THIS IS HERE AND NOT IN EACH BATCH SCRIPT.
 *
 * The driver is ~150 lines and it is identical in every batch: the same token
 * gate, the same retired-guide filter, the same cover-budget accumulation, the
 * same route check, the same idempotent skip, the same --verify assertions. It
 * had already been copied verbatim once (stroller inline, balance importing the
 * checks but pasting the driver). Copying it three more times for bicycle,
 * scooter and electric_car would recreate the exact failure the top of this
 * file exists to prevent, and the driver is where the retired-guide filter
 * lives — the one thing that decides whether a combination is really at 3.
 *
 * A batch script now supplies only: its articles, its PRODUCT_CATEGORY, and a
 * BATCH_LABEL. Everything else is this function.
 *
 * @param {object} opts
 * @param {string} opts.apiBase        CMS origin, no trailing slash
 * @param {string} opts.productCategory  'bicycle' | 'scooter' | 'electric_car' | ...
 * @param {string} opts.batchLabel     short id used for the output folder
 * @param {Array}  opts.articles       the batch's editorial content
 * @param {string} opts.token          CMS admin token (required for --apply only)
 * @param {boolean} opts.apply
 * @param {boolean} opts.emitSql
 * @param {boolean} opts.verify
 * @param {string} [opts.distDir]      where to read prerendered routes from
 * @param {string[]} [opts.retiredSlugs] published-but-retired slugs to exclude
 * @param {string[]} [opts.topics]     topic ids, for the combination table
 * @param {string} [opts.sqlHeaderExtra]
 */
export async function runBatch({
  apiBase,
  productCategory,
  batchLabel,
  articles,
  token = "",
  apply = false,
  emitSql: wantSql = false,
  verify = false,
  distDir = join(process.cwd(), "dist"),
  retiredSlugs = [],
  topics = ["beginner", "scenario", "budget", "risk", "special", "maintenance", "best"],
  sqlHeaderExtra = [],
}) {
  if (!token && apply) {
    console.error("CMS_ADMIN_ALL_TOKEN is required for --apply (POST /api/cms/guides/save returns 403 without it).");
    process.exit(1);
  }

  const payload = await request(apiBase, `/api/cms/guides?cb=${Date.now()}`);
  const records = unwrap(payload);
  if (!records) { console.error("Unexpected CMS response shape"); process.exit(1); }

  // Counts are computed over the LIVE published set the prerender actually
  // renders. A retired guide is still published in the CMS but 301s to an asset
  // page, and the prerender drops it before counting anything — counting raw CMS
  // rows overstates the combination and would ship a batch that leaves it below
  // the threshold.
  const RETIRED = new Set(retiredSlugs);
  const published = records.filter((r) => String(r.status || "published") === "published");
  const livePublished = published.filter((r) => !RETIRED.has(r.slug));
  const bySlug = new Map(published.map((r) => [r.slug, r]));
  const publishedSlugs = new Set(livePublished.map((r) => r.slug));
  const topicBySlug = new Map(
    livePublished.map((r) => [r.slug, String(r.taxonomy?.topicCategory || r.category || "").trim()]),
  );
  console.log(`CMS guides: ${records.length} total, ${published.length} published, ${livePublished.length} live (retired excluded)`);

  if (verify) {
    let bad = 0;
    for (const a of articles) {
      const r = bySlug.get(a.slug);
      if (!r) { console.error(`[MISSING] ${a.slug}`); bad++; continue; }
      const okEn = String(r.en?.content || "").includes("##");
      const okZh = String(r.zh?.content || "").includes("##");
      const okTax = r.taxonomy?.productCategory === productCategory && r.taxonomy?.topicCategory === a.topic;
      const okSeo = Boolean(r.seo?.en?.title && r.seo?.zh?.title);
      if (!(okEn && okZh && okTax && okSeo)) {
        console.error(`[FAIL] ${a.slug} en=${okEn} zh=${okZh} tax=${okTax} seo=${okSeo}`); bad++;
      } else {
        console.log(`[ok] ${a.slug}  en=${wordCount(r.en.content)}w zh=${String(r.zh.content).length}c`);
      }
    }

    const counts = new Map();
    for (const r of published.filter((x) => !RETIRED.has(x.slug))) {
      const k = `${r.taxonomy?.productCategory}/${r.taxonomy?.topicCategory}`;
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    console.log(`\n${productCategory} combinations after fill:`);
    for (const t of topics) {
      const n = counts.get(`${productCategory}/${t}`) || 0;
      console.log(`  ${t.padEnd(14)} ${n}  ${n >= 3 ? "indexable" : "STILL BELOW 3"}`);
    }
    process.exit(bad ? 1 : 0);
  }

  // Cover budget: how many other LIVE guides already use each cover, so the
  // batch cannot push any one image to three sharers (check:covers fails at 3).
  //
  // "Other" is the load-bearing word. A cover already used by a record THIS
  // batch owns is the same article, not a second sharer: re-running an applied
  // batch would otherwise count its own ten covers again and report every one
  // of them as "shared by 3 after this write". That made a second run fail its
  // own self-check about a state that is valid, and would have made the same
  // batch un-rerunnable by an editor trying to confirm state. Idempotence has
  // to cover the checks, not just the writes.
  const ownSlugs = new Set(articles.map((a) => a.slug));
  const coverUse = new Map();
  for (const r of livePublished) {
    if (ownSlugs.has(r.slug)) continue;
    const k = coverKey(r.imageUrl);
    if (k) coverUse.set(k, (coverUse.get(k) || 0) + 1);
  }

  // Body copy links to prerendered asset pages, which no CMS fetch can prove
  // exist. Read the build when it is there; report the gap when it is not,
  // rather than passing those links silently.
  const knownRoutes = collectKnownRoutes(distDir);
  if (knownRoutes) {
    console.log(`route check: ${knownRoutes.size} prerendered routes read from dist`);
  } else {
    const unchecked = new Set(articles.flatMap((a) => [...nonGuideTargets(a)]));
    console.log(`route check: dist absent — ${unchecked.size} non-guides link target(s) NOT verified:`);
    for (const t of unchecked) console.log(`  ? ${t}`);
  }

  const problems = assertCopy(articles, {
    publishedSlugs,
    topicBySlug,
    coverUse,
    productCategory,
    knownRoutes,
  });
  if (problems.length) {
    console.error(`Refusing to write — ${problems.length} copy problem(s):`);
    for (const p of problems.slice(0, 40)) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`copy self-check OK — ${articles.length} articles, grounded, covers within budget, all links resolve`);

  const planned = [];
  for (const a of articles) {
    if (publishedSlugs.has(a.slug)) { console.log(`[skip] ${a.slug} — already published`); continue; }
    const rec = buildRecord(a, productCategory);
    planned.push({ slug: a.slug, rec });
    console.log(`[plan] ${a.slug.padEnd(44)} ${productCategory}/${a.topic}  en=${wordCount(a.en)}w zh=${a.zh.length}c`);
  }

  if (!planned.length) { console.log(`Nothing to do — all ${articles.length} already exist.`); return; }

  if (wantSql) {
    const outDir = join(process.cwd(), ".workbuddy", "tmp", `guides-fill-${batchLabel}`);
    const { sqlFile, recordsFile, bytes } = emitSql({
      planned,
      outDir,
      label: batchLabel,
      header: [
        `R48 batch: ${articles.length} ${productCategory} guides.`,
        `Generated by the batch script via lib/guide-batch.mjs.`,
        `Apply: wrangler d1 execute my_d1_j13_binder --remote --file <this file>`,
        ...sqlHeaderExtra,
      ],
    });
    console.log(`wrote ${sqlFile}  (${planned.length} INSERT, ${bytes} bytes)`);
    console.log(`wrote ${recordsFile} (same payloads, for --verify cross-check)`);
    return;
  }

  if (!apply) { console.log(`\nDry run: ${planned.length} record(s) would be created. Re-run with --apply.`); return; }

  const backupDir = join(process.cwd(), ".workbuddy", "tmp", `guides-fill-${batchLabel}`);
  mkdirSync(backupDir, { recursive: true });
  const backupFile = join(backupDir, `created-${Date.now()}.json`);
  writeFileSync(backupFile, JSON.stringify(planned.map((p) => p.rec), null, 2));
  console.log(`backup of created records: ${backupFile}`);

  let ok = 0;
  for (const { slug, rec } of planned) {
    const saved = await request(apiBase, "/api/cms/guides/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rec),
    });
    if (!saved?.data?.saved) {
      console.error(`[FAIL] ${slug}: ${JSON.stringify(saved).slice(0, 200)}`);
      process.exitCode = 1;
    } else { ok++; console.log(`[ok] ${slug}`); }
  }
  console.log(`\nCreated ${ok}/${planned.length} guide(s).`);
}
