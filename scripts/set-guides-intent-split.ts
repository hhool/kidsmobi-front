/**
 * B-track intent split (2026-10-22): four guides articles share a topic with a
 * Plan-B data asset page, and on three of them the two titles were close enough
 * to synonyms that Google had no signal to choose between them. The measurement
 * behind this change is in doc/b-track-duplicate-topic-urls-2026-10-22_*.md:
 * 8-gram Jaccard overlap across all eight pairs sits between 0.02 and 0.08, so
 * these are not duplicate pages — they are two pages chasing one query.
 *
 * That rules out merging: a 301 would delete unique content (the recall record
 * pair overlaps at 0.022). The fix is to make the intent separable, so each
 * page owns a different query:
 *
 *   asset page  = the data angle   (what the catalogue actually says, counted)
 *   guide       = the action angle (how to decide, verify, read, judge)
 *
 * Only the four pairs whose titles collided are touched. The asset pages were
 * already written from the data angle and keep their titles; on three of the
 * four this file changes only the guide. The one exception is
 * balance-bike-what-buyers-say, where both H1s were byte-identical — that asset
 * H1 changed too, in src/data/balanceBikeBuyerFeedback.ts.
 *
 * Fields written: seo.{en,zh}.title, seo.{en,zh}.description, and en.title /
 * zh.title (the article H1, which is what the body renders). Keywords, body
 * content, taxonomy and everything else are carried through untouched.
 *
 * IMPORTANT — why the H1 and the SEO title are the same string here.
 * Unlike the Plan-B asset pages (which carry their own `sizingSeo` /
 * `safetySeo` / ... objects), a guides *article* has no independent title
 * source: the prerender derives both the H1 and the <title> from
 * `guide.en.title` (scripts/prerender-pages.ts, `pickText(guide.en?.title, ...)`)
 * and `seo.en.title` is never read for these routes. TITLE_MAX_CHARS is 65 and
 * the brand suffix is 21, so any H1 longer than 44 gets run through
 * capSeoTitle() and the <title> silently loses its tail — "How to Verify a
 * Balance Bike Meets Safety Standards" shipped as "How to Verify a Balance Bike
 * Meets Safety", dropping the very keyword the page is meant to hold. Keeping
 * the H1 at or under TITLE_MAX keeps the rendered title whole.
 *
 * Guard rails: titles are capped so that " | BalanceBikeToddler" still fits the
 * 65-char limit, descriptions capped at 155, and every write is read back
 * through the same endpoint the prerender uses before the script reports success.
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> npx tsx scripts/set-guides-intent-split.ts --dry-run
 *   CMS_ADMIN_ALL_TOKEN=<token> npx tsx scripts/set-guides-intent-split.ts --apply
 */

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

/** " | BalanceBikeToddler" is appended by the renderer, so 65 - 21. */
const TITLE_MAX = 44;
const DESC_MAX = 155;

type Copy = { seoTitle: string; h1: string; description: string };

const PLAN: Array<{ id: string; slug: string; note: string; en: Copy; zh: Copy }> = [
  {
    id: "guide-2026-safety-standards",
    slug: "balance-bike-safety-standards",
    note: "was \"Balance Bike Safety Standards Guide\" — synonymous with the asset page's \"Explained\"",
    en: {
      seoTitle: "Balance Bike Safety Standards: How to Verify",
      h1: "Balance Bike Safety Standards: How to Verify",
      description:
        "The four rule sets that apply, what no standard covers, which certificates to ask for, and a five-minute check you can run before the first ride.",
    },
    zh: {
      seoTitle: "平衡车安全标准：怎么核验",
      h1: "怎么核验一辆平衡车是否符合安全标准",
      description:
        "适用的四套规则、标准没有覆盖的部分、该索要哪些证书，以及首骑前五分钟就能做完的核验步骤。",
    },
  },
  {
    id: "guide-2026-by-age",
    slug: "balance-bike-by-age",
    note: "was \"Balance Bike by Age: What Fits Each Year\" — near-identical to the asset page's count-led title",
    en: {
      seoTitle: "How to Choose a Balance Bike by Age",
      h1: "How to Choose a Balance Bike by Age",
      description:
        "Why published age ranges disagree, what our snapshot shows at each year, and how to turn a birthday into an inseam number you can shop with.",
    },
    zh: {
      seoTitle: "怎么按年龄选平衡车",
      h1: "怎么按年龄选平衡车：1 岁、2 岁、3 岁",
      description:
        "为什么厂商标注的适用年龄互相矛盾、我们的快照在每个年龄段显示什么，以及怎么把生日换成一个可以直接照着买的内腿长数字。",
    },
  },
  {
    id: "guide-2026-stability",
    slug: "balance-bike-stability",
    note: "was \"Stable Track Balance Bikes: What Holds\" — same stable-track query as the asset page",
    en: {
      seoTitle: "How to Judge Balance Bike Stability",
      h1: "How to Judge Balance Bike Stability",
      description:
        "What actually holds a balance bike up, why almost no listing publishes the geometry, and the checks you can run in person instead.",
    },
    zh: {
      seoTitle: "怎么判断平衡车稳不稳",
      h1: "怎么判断一辆平衡车稳不稳",
      description:
        "到底什么让平衡车站得住、为什么几乎没有厂商公布几何数据，以及你可以到手自己做的几项检查。",
    },
  },
  {
    id: "guide-2026-buyers-say",
    slug: "balance-bike-what-buyers-say",
    note: "was byte-identical to the asset page H1 — the only true collision of the eight",
    en: {
      seoTitle: "How to Read Balance Bike Buyer Reviews",
      h1: "How to Read Balance Bike Buyer Reviews",
      description:
        "We hold no verbatim reviews, only one retailer sentiment summary per listing. What those summaries are, where they hedge, and what they cannot tell you.",
    },
    zh: {
      seoTitle: "怎么读平衡车的买家评价",
      h1: "怎么读平衡车的买家评价",
      description:
        "我们没有逐条评论原文，只有每个商品一条零售商情绪摘要。这些摘要是什么、在哪里打了折扣、以及它们无法告诉你的部分。",
    },
  },
];

for (const item of PLAN) {
  for (const lang of ["en", "zh"] as const) {
    const copy = item[lang];
    if (copy.seoTitle.length > TITLE_MAX) {
      throw new Error(`${item.slug}.${lang}.seoTitle ${copy.seoTitle.length} > ${TITLE_MAX}: "${copy.seoTitle}"`);
    }
    if (copy.description.length > DESC_MAX) {
      throw new Error(`${item.slug}.${lang}.description ${copy.description.length} > ${DESC_MAX}`);
    }
    if (!copy.h1.trim()) throw new Error(`${item.slug}.${lang}.h1 empty`);
  }
}

console.log(`API base: ${API_BASE}`);
console.log(`Mode: ${APPLY ? "APPLY (writing to D1)" : "DRY RUN"}`);
for (const item of PLAN) {
  console.log(`\n  ${item.slug}  (${item.id})`);
  console.log(`    note: ${item.note}`);
  console.log(`    en title: ${item.en.seoTitle}  (${item.en.seoTitle.length})`);
  console.log(`    en H1   : ${item.en.h1}`);
  console.log(`    zh title: ${item.zh.seoTitle}`);
}

if (!APPLY) {
  console.log("\nDry run complete. Re-run with --apply to write.");
  process.exit(0);
}
if (!TOKEN) {
  console.error("CMS_ADMIN_ALL_TOKEN is required.");
  process.exit(1);
}

const read = async (): Promise<Array<Record<string, unknown>>> => {
  const res = await fetch(`${API_BASE}/api/cms/guides?cb=${Date.now()}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`guides read failed: HTTP ${res.status}`);
  const payload = (await res.json()) as { data?: unknown };
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows as Array<Record<string, unknown>>;
};

const rows = await read();
const byId = new Map(rows.map((row) => [String(row.id), row]));

let failed = false;
for (const item of PLAN) {
  const current = byId.get(item.id);
  if (!current) {
    console.error(`  MISSING ${item.id} (${item.slug}) — nothing written for it`);
    failed = true;
    continue;
  }
  if (String(current.slug) !== item.slug) {
    console.error(`  ID/SLUG MISMATCH ${item.id}: expected ${item.slug}, got ${current.slug}`);
    failed = true;
    continue;
  }

  const seo = (current.seo as Record<string, unknown> | undefined) || {};
  const mergedSeo: Record<string, unknown> = { ...seo };
  const merged: Record<string, unknown> = { ...current };

  for (const lang of ["en", "zh"] as const) {
    const copy = item[lang];
    const langSeo = (seo[lang] as Record<string, unknown> | undefined) || {};
    mergedSeo[lang] = { ...langSeo, title: copy.seoTitle, description: copy.description };

    const body = (current[lang] as Record<string, unknown> | undefined) || {};
    if (!("title" in body)) {
      console.error(`  ${item.slug}.${lang} has no body title field — refusing to invent one`);
      failed = true;
      continue;
    }
    const before = String(body.title ?? "");
    merged[lang] = { ...body, title: copy.h1 };
    console.log(`\n  ${item.slug}.${lang}`);
    console.log(`    H1   "${before}" -> "${copy.h1}"`);
    console.log(`    title "${String(langSeo.title ?? "")}" -> "${copy.seoTitle}"`);
  }

  merged.seo = mergedSeo;
  merged.updatedAt = new Date().toISOString();

  const post = await fetch(`${API_BASE}/api/cms/guides/save`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-cms-admin-token": TOKEN,
    },
    body: JSON.stringify(merged),
  });
  const text = await post.text();
  if (!post.ok) {
    console.error(`    save failed: HTTP ${post.status} ${text.slice(0, 200)}`);
    failed = true;
    continue;
  }
  console.log(`    saved`);
}

// Read back through the same endpoint the prerender uses, with a cache buster,
// so a stale edge cache cannot fake a success.
const verifyRows = await read();
const verifyById = new Map(verifyRows.map((row) => [String(row.id), row]));
for (const item of PLAN) {
  const row = verifyById.get(item.id);
  if (!row) {
    console.error(`  VERIFY MISSING ${item.id}`);
    failed = true;
    continue;
  }
  const seo = (row.seo as Record<string, unknown> | undefined) || {};
  for (const lang of ["en", "zh"] as const) {
    const copy = item[lang];
    const liveSeo = (seo[lang] as Record<string, unknown> | undefined) || {};
    const liveBody = (row[lang] as Record<string, unknown> | undefined) || {};
    const checks: Array<[string, unknown, string]> = [
      [`${lang}.seo.title`, liveSeo.title, copy.seoTitle],
      [`${lang}.seo.description`, liveSeo.description, copy.description],
      [`${lang}.title (H1)`, liveBody.title, copy.h1],
    ];
    for (const [field, live, want] of checks) {
      if (live !== want) {
        console.error(`  VERIFY FAILED ${item.slug}.${field}: live=${JSON.stringify(live)}`);
        failed = true;
      }
    }
    // The body must survive the whole-record replace.
    const content = String(liveBody.content ?? "");
    if (content.length < 200) {
      console.error(`  VERIFY FAILED ${item.slug}.${lang}.content truncated (${content.length} chars)`);
      failed = true;
    }
  }
}

if (failed) {
  console.error("\nOne or more writes failed verification.");
  process.exit(1);
}
console.log("\n[ok] four guides re-aimed at the action angle, verified live.");
