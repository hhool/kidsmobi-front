/**
 * Give the "vs training wheels" guide and the research article separate jobs.
 *
 * Why. The derived duplication scan (check:pairdrift phase 2) flagged this pair
 * at subhead similarity 1.0 — both pages carry a section headed, word for word,
 * "What the studies measured", and both walk through the same two Portuguese
 * studies with the same figures (4.16 / 5.97 / 7.27 years, 100% vs ~77%). The
 * body 8-gram overlap stays low only because the phrasing differs; the substance
 * is the same research written twice, which is exactly the failure mode
 * what-buyers-say had.
 *
 * The split, same rule as B-track: the buying guide keeps the decision — what the
 * research actually settles, in one paragraph — and hands the study detail to the
 * research page. Nothing is deleted: both numbers still appear, once at length,
 * and the guide now links to where the detail lives.
 *
 * Usage:
 *   node scripts/separate-research-duplication.mjs            (dry run)
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/separate-research-duplication.mjs --apply
 */
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

const ID = "guide-2026-vs-training-wheels";
const SLUG = "balance-bike-vs-training-wheels";
const RESEARCH_URL = "/news/science/balance-bike-research";

const OLD_EN_HEADING = "## What the studies measured";
const NEW_EN_HEADING = "## What the research settles about learning age";
const OLD_ZH_HEADING = "## 研究测了什么";
const NEW_ZH_HEADING = "## 研究能定下来的只有学习年龄";

const OLD_EN_BODY = `Two peer-reviewed studies from the same Portuguese research group dominate the English-language literature on this question, and both compared balance bikes against bicycles with training wheels.

The first, [published in 2022 in the International Journal of Environmental Research and Public Health](https://www.mdpi.com/1660-4601/19/3/1814), surveyed 2,005 parents in Portugal. Children whose first bike was a balance bike learned to cycle independently at an average age of 4.16 years, versus 5.97 years for training wheels and 7.27 years for starting directly on a pedal bike. The differences were statistically significant, and the authors concluded the balance bike should come first in the learning process.

The second, [published in 2025 in the Journal of Functional Morphology and Kinesiology](https://www.mdpi.com/2411-5142/10/1/53), ran an actual intervention: 50 children who could not yet cycle were split into two groups, spent six sessions on either a balance bike or a bike with training wheels, then moved to a conventional bike. Independent-cycling success was 100% in the balance-bike group versus about 77% in the training-wheels group, and the balance-bike group learned each milestone — self-launch, riding, braking — faster.`;

const NEW_EN_BODY = `Two peer-reviewed studies from the same Portuguese research group carry most of the English-language evidence on this question, and both compared balance bikes against bicycles with training wheels directly. They point the same way: children who started on a balance bike reached independent cycling sooner — an average of 4.16 years against 5.97 for training wheels across 2,005 parent responses in the 2022 survey, and 100% against roughly 77% of 50 children riding independently after six sessions in the 2025 intervention.

That is the whole finding this decision rests on. Study design, sample sizes and the objections peer reviewers raised are on [What Research Says About Balance Bikes](${RESEARCH_URL}) — read that page before treating any of these numbers as settled.`;

const OLD_ZH_BODY = `英文文献里主导这个问题的是同一支葡萄牙研究团队的两项同行评审研究，都对比了平衡车与带训练轮的自行车。

第一篇[2022 年发表于《国际环境研究与公共卫生杂志》](https://www.mdpi.com/1660-4601/19/3/1814)，调查了葡萄牙 2005 名家长。第一辆车是平衡车的孩子，独立骑行的平均年龄为 4.16 岁；从训练轮起步的为 5.97 岁；直接上脚踏车的为 7.27 岁。差异具有统计显著性，作者结论是平衡车应放在学习过程的最前面。

第二篇[2025 年发表于《功能形态学与运动学杂志》](https://www.mdpi.com/2411-5142/10/1/53)，是一项真实干预实验：50 名还不会骑车的孩子分成两组，分别用平衡车或带训练轮的车练习六个课时，再转到普通自行车。独立骑行成功率在平衡车组为 100%，训练轮组约 77%；平衡车组在每个里程碑——自主起步、骑行、刹车——上都学得更快。`;

const NEW_ZH_BODY = `英文文献里几乎全部证据来自同一支葡萄牙研究团队的两项同行评审研究，两项都直接对比了平衡车与带训练轮的自行车，结论方向一致：先骑平衡车的孩子更早独立骑行——2022 年那份 2005 份家长问卷里，平均独立骑行年龄 4.16 岁，训练轮组 5.97 岁；2025 年那次干预里，50 名孩子练六个课时之后，平衡车组 100% 能独立骑行，训练轮组约 77%。

这个购买决定能依据的就是这一条。研究设计、样本量以及同行评审提出的质疑，都在[关于平衡车，研究到底说了什么](${RESEARCH_URL})那一页——要把这些数字当定论之前，先读那一页。`;

const swap = (text, from, to, label) => {
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(`${label}: expected 1 occurrence, found ${n}`);
  return text.replace(from, to);
};

const read = async () => {
  const res = await fetch(`${API_BASE}/api/cms/guides?cb=${Date.now()}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`guides read failed: HTTP ${res.status}`);
  const payload = await res.json();
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  if (!rows.length) throw new Error("guides collection came back empty — refusing to write");
  return rows;
};

const rows = await read();
const current = rows.find((r) => String(r.id) === ID);
if (!current) throw new Error(`${ID} not found`);
if (String(current.slug) !== SLUG) throw new Error(`slug mismatch: expected ${SLUG}, got ${String(current.slug)}`);

const next = { ...current };
for (const lang of ["en", "zh"]) {
  const body = { ...(current[lang] || {}) };
  if (!("title" in body) || !("content" in body)) throw new Error(`${lang} body has no title/content — refusing`);
  let content = String(body.content);
  if (lang === "en") {
    content = swap(content, OLD_EN_HEADING, NEW_EN_HEADING, "en heading");
    content = swap(content, OLD_EN_BODY, NEW_EN_BODY, "en body");
  } else {
    content = swap(content, OLD_ZH_HEADING, NEW_ZH_HEADING, "zh heading");
    content = swap(content, OLD_ZH_BODY, NEW_ZH_BODY, "zh body");
  }
  if (!content.includes(RESEARCH_URL)) throw new Error(`${lang} content does not link the research page`);
  body.content = content;
  next[lang] = body;
}

for (const lang of ["en", "zh"]) {
  const before = String((current[lang] || {}).content ?? "");
  const after = String(next[lang].content);
  console.log(`  ${lang}: ${before.length} -> ${after.length} chars`);
}
console.log(`  headings: ${(String(next.en.content).match(/^## .*/gm) || []).join(" | ")}`);

if (!APPLY) {
  console.log("\nDry run complete. Re-run with --apply to write.");
  process.exit(0);
}
if (!TOKEN) {
  console.error("CMS_ADMIN_ALL_TOKEN is required.");
  process.exit(1);
}

next.updatedAt = new Date().toISOString();
const post = await fetch(`${API_BASE}/api/cms/guides/save`, {
  method: "POST",
  headers: { Accept: "application/json", "Content-Type": "application/json", "x-cms-admin-token": TOKEN },
  body: JSON.stringify(next),
});
if (!post.ok) throw new Error(`save failed: HTTP ${post.status} ${(await post.text()).slice(0, 300)}`);
console.log("  saved");

const verifyRows = await read();
const row = verifyRows.find((r) => String(r.id) === ID);
if (!row) throw new Error("verification read could not find the guide");
let failed = false;
for (const lang of ["en", "zh"]) {
  const live = String((row[lang] || {}).content ?? "");
  if (live !== String(next[lang].content)) {
    console.error(`  VERIFY FAILED ${lang}: ${live.length} vs ${String(next[lang].content).length} chars`);
    failed = true;
  } else {
    console.log(`  ${lang} verified (${live.length} chars)`);
  }
}
if (failed) process.exit(1);
console.log("\n[ok] the guide now states the finding once and points at the research page for the detail.");
