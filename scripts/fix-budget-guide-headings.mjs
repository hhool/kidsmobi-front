/**
 * fix-budget-guide-headings.mjs — separate two budget guides whose section
 * headings had drifted into the same wording.
 *
 * check-topic-pair-drift flagged guides/budget/kids-ride-on-under-200 and
 * guides/budget/kids-scooter-under-50 (subhead similarity 0.75 > 0.6): both
 * opened with "Non-negotiable under $<price>", and both closed with
 * "Safety is not budget-dependent" and "Further reading". Two pages in one
 * topic that answer the same question in the same words compete with each
 * other; the ride-on page keeps the data angle, the scooter page takes the
 * action angle.
 *
 * Usage: CMS_ADMIN_ALL_TOKEN=<token> node scripts/fix-budget-guide-headings.mjs
 */

const API_BASE = "https://store.balancebiketoddler.com";
const TOKEN = process.env.CMS_ADMIN_ALL_TOKEN || "";
const SLUG = "kids-scooter-under-50";

const EN_REPLACEMENTS = [
  ["## Non-negotiable under $50", "## The $50 floor: what has to be true"],
  ["## Safety is not budget-dependent", "## What a $50 scooter still has to pass"],
  ["## Further reading", "## Sources and next steps"],
];

const ZH_REPLACEMENTS = [
  ["## 百元内不可妥协", "## 50 美元底线：必须成立的条件"],
  ["## 安全不随预算变", "## 便宜车也要过的安全线"],
  ["## 延伸阅读", "## 来源与延伸阅读"],
];

async function main() {
  if (!TOKEN) {
    console.error("CMS_ADMIN_ALL_TOKEN is required");
    process.exit(1);
  }

  const res = await fetch(`${API_BASE}/api/cms/ops/export`, {
    headers: { "x-cms-admin-token": TOKEN },
  });
  if (!res.ok) throw new Error(`export HTTP ${res.status}`);
  const guides = (await res.json())?.data?.collections?.guides || [];
  const guide = guides.find((g) => String(g?.slug || "") === SLUG);
  if (!guide) throw new Error(`guide ${SLUG} not found`);

  const en = { ...(guide.en || {}) };
  const zh = { ...(guide.zh || {}) };
  const applied = [];
  for (const [from, to] of EN_REPLACEMENTS) {
    if (String(en.content || "").includes(from)) {
      en.content = String(en.content).split(from).join(to);
      applied.push(from.replace(/^## /, ""));
    }
  }
  for (const [from, to] of ZH_REPLACEMENTS) {
    if (String(zh.content || "").includes(from)) {
      zh.content = String(zh.content).split(from).join(to);
      applied.push(from.replace(/^## /, ""));
    }
  }
  if (!applied.length) {
    console.log("Nothing to replace — headings already differ.");
    return;
  }

  const payload = { ...guide, en, zh };
  const save = await fetch(`${API_BASE}/api/cms/guides/save`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-cms-admin-token": TOKEN,
    },
    body: JSON.stringify(payload),
  });
  if (!save.ok) {
    console.error(`save failed HTTP ${save.status}: ${(await save.text()).slice(0, 200)}`);
    process.exit(1);
  }
  console.log(`rewrote ${applied.length} heading(s) in ${SLUG}:`);
  applied.forEach((a) => console.log(`  - ${a}`));
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
