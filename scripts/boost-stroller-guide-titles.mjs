/**
 * Put the three core stroller keyword families into the guide SEARCH TITLES.
 *
 * User directive 2026-11-23: "stroller 关键词: travel stroller & jogging
 * stroller & lightweight stroller … 标题中加强一下". Baseline measured on the
 * 21 published stroller guides (exact substring):
 *   travel stroller      8/21 titles
 *   jogging stroller     1/21
 *   lightweight stroller 0/21
 *
 * WHERE THE TITLE COMES FROM. scripts/prerender-pages.ts:renderGuideDetailPage()
 * uses guide.en.title for BOTH the visible <h1> and the <title> stem;
 * src/components/GuidesSection.tsx reads the same CMS field after hydration.
 * `seo.en.title` is NOT read by the renderer, but the repo's guide-write
 * scripts all assert en.title === seo.en.title, so both are written together.
 * The repo-owned <title> override table (src/lib/seoTitleOverrides.ts) exists
 * only to repair colliding/broken titles — it is deliberately NOT used here,
 * because two copies of a title generator drift.
 *
 * THE 38-CHARACTER BUDGET. TITLE_MAX_CHARS = 60 and the brand suffix
 * " | BalanceBikeToddler" is 22 characters, so buildDocumentTitle() caps the
 * stem at 38 by word boundary and then trims dangling words. Every new stem
 * below carries its core term INSIDE the first 38 characters, so the term
 * survives the cap. The authored headline keeps its subtitle after the colon.
 *
 * CONTRACT:
 * - Only en.title and seo.en.title change. zh.title, seo.zh.*, seo.en.description,
 *   seo.en.keywords, both bodies, status, taxonomy, imageUrl and every other
 *   field are copied through byte-for-byte.
 * - Head-frozen title/description guards stay satisfied (<= 60 chars, unique,
 *   h1 == stem source).
 * - Idempotent: an already-boosted record is skipped.
 * - A backup of the original 8 records is written before the first write.
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/boost-stroller-guide-titles.mjs           # dry run
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/boost-stroller-guide-titles.mjs --apply   # write D1
 *   node scripts/boost-stroller-guide-titles.mjs --verify   # assert built <title>s
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

const APPLY = process.argv.includes("--apply");
const VERIFY = process.argv.includes("--verify");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();
const DIST = "dist";
const SNAPSHOT = "scripts/cms-snapshots/guides.json";
const TITLE_STEM_BUDGET = 38; // TITLE_MAX_CHARS(60) - " | BalanceBikeToddler"(22)

/** slug -> { core term, new authored headline (h1 + <title> stem) }. */
const TITLES = {
  "lightweight-travel-stroller": {
    core: "lightweight stroller",
    title: "Lightweight Stroller for Travel: How to Choose Under 15 lb",
  },
  "compact-travel-stroller": {
    core: "lightweight stroller",
    title: "Compact Lightweight Stroller: Folded Size That Actually Fits",
  },
  "stroller-all-terrain": {
    core: "jogging stroller",
    title: "All-Terrain Jogging Stroller Guide",
  },
  "best-jogger-stroller-2026": {
    core: "jogging stroller",
    title: "Best Jogging Stroller 2026",
  },
  "stroller-how-to-clean": {
    core: "travel stroller",
    title: "How to Clean a Travel Stroller",
  },
  "stroller-safety-tips": {
    core: "travel stroller",
    title: "Travel Stroller Safety Tips",
  },
  "stroller-under-200": {
    core: "travel stroller",
    title: "Travel Stroller Under $200",
  },
  "stroller-newborn-picks": {
    core: "travel stroller",
    title: "Newborn Travel Stroller Picks",
  },
};

/** Minimum <title> coverage across the 21 stroller guides after the boost. */
const COVERAGE_MIN = {
  "travel stroller": 10,
  "jogging stroller": 3,
  "lightweight stroller": 2,
};

function unwrap(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return null;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "x-cms-admin-token": TOKEN,
      "user-agent": "Mozilla/5.0",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  try { return JSON.parse(text); } catch { return {}; }
}

/** Every built EN stroller guide <title>. */
function builtTitles() {
  const root = join(DIST, "guides");
  const out = new Map();
  if (!existsSync(root)) return out;
  for (const topic of readdirSync(root)) {
    const dir = join(root, topic);
    if (!statSync(dir).isDirectory()) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".html")) continue;
      const html = readFileSync(join(dir, file), "utf8");
      const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
      if (m) out.set(file.slice(0, -5), m[1].replace(/\s+/g, " ").trim());
    }
  }
  return out;
}

function verify() {
  const records = unwrap(JSON.parse(readFileSync(SNAPSHOT, "utf8"))) || [];
  const slugs = records
    .filter((r) => r.status === "published" && r.taxonomy?.productCategory === "stroller")
    .map((r) => r.slug);
  const titles = builtTitles();
  const problems = [];

  for (const [slug, spec] of Object.entries(TITLES)) {
    const r = records.find((x) => x.slug === slug);
    if (!r) { problems.push(`missing snapshot record ${slug}`); continue; }
    if (r.en?.title !== spec.title) problems.push(`${slug}: en.title is not the boosted headline`);
    if (r.seo?.en?.title !== spec.title) problems.push(`${slug}: seo.en.title drifted from en.title`);
    if (r.zh?.title === spec.title) problems.push(`${slug}: zh.title was overwritten with English`);
    const built = titles.get(slug) || "";
    if (!built.toLowerCase().includes(spec.core)) {
      problems.push(`${slug}: built <title> lost the core term "${spec.core}" → ${built}`);
    }
  }

  const counts = Object.fromEntries(Object.keys(COVERAGE_MIN).map((t) => [t, 0]));
  for (const slug of slugs) {
    const built = (titles.get(slug) || "").toLowerCase();
    for (const term of Object.keys(counts)) if (built.includes(term)) counts[term]++;
  }
  for (const [term, min] of Object.entries(COVERAGE_MIN)) {
    if (counts[term] < min) problems.push(`<title> coverage "${term}" = ${counts[term]}/${slugs.length} (min ${min})`);
  }
  if (problems.length) {
    console.error(`check:guidetitles FAILED (${problems.length})`);
    for (const p of problems.slice(0, 25)) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(
    `check:guidetitles OK — ${slugs.length} stroller <title>s, ` +
    Object.entries(counts).map(([t, n]) => `${t}=${n}`).join(", "),
  );
}

function selfCheck() {
  const problems = [];
  for (const [slug, spec] of Object.entries(TITLES)) {
    const stem = spec.title.toLowerCase();
    if (!stem.slice(0, TITLE_STEM_BUDGET).includes(spec.core)) {
      problems.push(`${slug}: core term falls outside the 38-char <title> stem`);
    }
    if (spec.title.length + 22 > 60 && !spec.title.includes(":")) {
      problems.push(`${slug}: headline has no colon, so a >38-char stem would be capped mid-phrase`);
    }
    if (/\b(we tested|lab|measured)\b/i.test(spec.title)) {
      problems.push(`${slug}: headline carries an unsupported testing claim`);
    }
  }
  return problems;
}

async function main() {
  if (VERIFY) return verify();

  const local = selfCheck();
  if (local.length) {
    console.error("Refusing to write:");
    for (const p of local) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`title self-check OK — ${Object.keys(TITLES).length} headlines keep their core term inside the 38-char stem`);

  if (!TOKEN) { console.error("CMS_ADMIN_ALL_TOKEN is required."); process.exit(1); }
  const records = unwrap(await request(`/api/cms/guides?cb=${Date.now()}`));
  if (!records) { console.error("Unexpected CMS response shape"); process.exit(1); }
  console.log(`CMS guides: ${records.length}`);

  const planned = [];
  for (const [slug, spec] of Object.entries(TITLES)) {
    const r = records.find((x) => x.slug === slug);
    if (!r) { console.error(`[FAIL] missing record ${slug}`); process.exitCode = 1; continue; }
    if (r.status !== "published" || r.taxonomy?.productCategory !== "stroller") {
      console.error(`[FAIL] ${slug} is not a published stroller guide`); process.exitCode = 1; continue;
    }
    if (r.en?.title === spec.title && r.seo?.en?.title === spec.title) {
      console.log(`[skip] ${slug} — already boosted`); continue;
    }
    const next = {
      ...r,
      en: { ...r.en, title: spec.title },
      seo: { ...r.seo, en: { ...r.seo?.en, title: spec.title } },
      updatedAt: new Date().toISOString(),
    };
    const invariants = {
      enTitleSynced: next.en.title === next.seo.en.title,
      zhTitle: next.zh?.title === r.zh?.title,
      zhSeo: JSON.stringify(next.seo?.zh ?? null) === JSON.stringify(r.seo?.zh ?? null),
      enDescription: next.seo?.en?.description === r.seo?.en?.description,
      enKeywords: JSON.stringify(next.seo?.en?.keywords ?? null) === JSON.stringify(r.seo?.en?.keywords ?? null),
      bodies: next.en?.content === r.en?.content && next.zh?.content === r.zh?.content,
      otherFields: ["status", "taxonomy", "imageUrl", "category", "publishedAt", "pinned", "featured", "scenarioIds", "riskCards", "id", "slug"]
        .every((k) => JSON.stringify(next[k] ?? null) === JSON.stringify(r[k] ?? null)),
    };
    const fails = Object.entries(invariants).filter(([, v]) => !v).map(([k]) => k);
    if (fails.length) { console.error(`[FAIL] ${slug} invariants: ${fails.join(",")}`); process.exitCode = 1; continue; }
    planned.push({ slug, before: r, next });
    console.log(`[plan] ${slug.padEnd(42)} "${r.en?.title}"\n      -> "${spec.title}"`);
  }
  if (process.exitCode) { console.error("Plan aborted; nothing written."); process.exit(1); }
  if (!planned.length) { console.log("Nothing to do — all 8 titles already boosted."); return; }
  if (!APPLY) { console.log(`Dry run: ${planned.length} title(s) would change. Re-run with --apply.`); return; }

  const backupDir = join(process.cwd(), ".workbuddy", "tmp", "stroller-titles");
  mkdirSync(dirname(join(backupDir, "x")), { recursive: true });
  mkdirSync(backupDir, { recursive: true });
  const backupFile = join(backupDir, `guides-before-${Date.now()}.json`);
  writeFileSync(backupFile, JSON.stringify(planned.map((p) => p.before), null, 2));
  console.log(`backup: ${backupFile}`);

  let ok = 0;
  for (const { slug, next } of planned) {
    const saved = await request(`/api/cms/guides/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!saved?.data?.saved) { console.error(`[FAIL] ${slug}: ${JSON.stringify(saved).slice(0, 200)}`); process.exitCode = 1; }
    else { ok++; console.log(`[ok] ${slug}`); }
  }
  console.log(`Applied ${ok}/${planned.length} title(s).`);
}

main().catch((err) => { console.error(err); process.exit(1); });
