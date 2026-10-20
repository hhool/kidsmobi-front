/**
 * Publish the reference-cluster card list to CMS settings.
 *
 * The block's cards, order, wording and targets are configuration
 * (settings.referenceCluster), not code. This script is the ops path for
 * repointing a card at a new CMS article — the default list is imported from
 * its single source so the script cannot ship a different list than the app.
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> npx tsx scripts/set-reference-cluster.ts --dry-run
 *   CMS_ADMIN_ALL_TOKEN=<token> npx tsx scripts/set-reference-cluster.ts --apply
 *
 * Card overrides (id -> fields) are declared in OVERRIDES below.
 */
import { DEFAULT_REFERENCE_CLUSTER } from "../src/lib/referenceCluster";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

/**
 * 2026-10-20: the last three cards had no CMS article and pointed at their data
 * reference page. The three articles now exist, so 8 of 8 cards are CMS-backed
 * and every card in the block can be edited from the admin without a deploy.
 */
const OVERRIDES: Record<string, Partial<(typeof DEFAULT_REFERENCE_CLUSTER)[number]>> = {
  "buyer-feedback": {
    href: "/guides/beginner/balance-bike-what-buyers-say",
    blurbEn: "What the buyer-sentiment summaries mention, where they hedge, and what they cannot tell you.",
    blurbZh: "买家情绪摘要提到了什么、哪里打了折扣，以及它们告诉不了你什么。",
  },
  "by-age": {
    href: "/guides/beginner/balance-bike-by-age",
    blurbEn: "Each maker's age range, where coverage thins out, and how to turn a birthday into a fit check.",
    blurbZh: "各厂商的年龄区间、覆盖变薄的位置，以及怎么把一个生日变成适配检查。",
  },
  stability: {
    href: "/guides/scenario/balance-bike-stability",
    blurbEn: "Wheel spacing, steering limiters and the four-wheel trade-off — published by one in thirteen.",
    blurbZh: "轮距、转向限位与四轮的取舍——13 款中只有 1 款公布数据。",
  },
};

const cluster = DEFAULT_REFERENCE_CLUSTER.map((card) => ({
  id: card.id,
  href: OVERRIDES[card.id]?.href ?? card.href,
  labelEn: OVERRIDES[card.id]?.labelEn ?? card.labelEn,
  labelZh: OVERRIDES[card.id]?.labelZh ?? card.labelZh,
  blurbEn: OVERRIDES[card.id]?.blurbEn ?? card.blurbEn,
  blurbZh: OVERRIDES[card.id]?.blurbZh ?? card.blurbZh,
  visible: true,
}));

console.log(`API base: ${API_BASE}`);
console.log(`Mode: ${APPLY ? "APPLY (writing to D1)" : "DRY RUN"}`);
console.log(`Cards: ${cluster.length}`);
for (const card of cluster) console.log(`  ${card.id.padEnd(16)} -> ${card.href}`);

if (!APPLY) {
  console.log("\nDry run complete. Re-run with --apply to write.");
  process.exit(0);
}
if (!TOKEN) {
  console.error("CMS_ADMIN_ALL_TOKEN is required.");
  process.exit(1);
}

const get = await fetch(`${API_BASE}/api/cms/settings`, { headers: { Accept: "application/json" } });
if (!get.ok) {
  console.error(`settings read failed: HTTP ${get.status}`);
  process.exit(1);
}
const payload = (await get.json()) as { data?: unknown };
const rows = Array.isArray(payload?.data) ? (payload.data as Array<Record<string, unknown>>) : [payload?.data as Record<string, unknown>];
const current = rows[0];
if (!current || typeof current !== "object") {
  console.error("no settings record to merge into");
  process.exit(1);
}

const merged = { ...current, referenceCluster: cluster, updatedAt: new Date().toISOString() };

const post = await fetch(`${API_BASE}/api/cms/settings/save`, {
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
  console.error(`settings save failed: HTTP ${post.status} ${text.slice(0, 200)}`);
  process.exit(1);
}
let saved = false;
try {
  saved = Boolean((JSON.parse(text) as { data?: { saved?: boolean } })?.data?.saved);
} catch {
  /* non-JSON */
}
console.log(saved ? "\n[ok] settings.referenceCluster published" : `\n[?] unexpected response: ${text.slice(0, 160)}`);
if (!saved) process.exit(1);
