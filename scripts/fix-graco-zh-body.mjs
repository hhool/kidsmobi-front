/**
 * Replace the English-only zh body of guide-B07Y5VQYFW:overview with Chinese.
 *
 * The snapshot shows zero CJK characters and 228 Latin characters: the field
 * holds a pipe-separated retailer marketing string, so the Chinese page reads
 * as English. The three source claims are translated one-for-one; nothing is
 * added. `seo` and `en` are copied through unchanged (head freeze).
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/fix-graco-zh-body.mjs
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/fix-graco-zh-body.mjs --apply
 */
const APPLY = process.argv.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();
const ID = "guide-B07Y5VQYFW:overview";
const SENTINEL = "推车模式";

const ZH_BODY = `- 推车模式：可从婴儿提篮载体转换为婴儿平躺推车，再转换为幼儿推车。
- 双向座椅：推车座椅可朝向家长，也可朝向外界，适配宝宝不同成长阶段。
- 婴儿平躺推车：幼儿座椅可转换为婴儿平躺推车，让宝宝舒适外出。`;

function unwrap(p) {
  if (Array.isArray(p?.data)) return p.data;
  if (Array.isArray(p)) return p;
  return null;
}
async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { Accept: "application/json", "x-cms-admin-token": TOKEN, ...(options.headers || {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  try { return JSON.parse(text); } catch { return {}; }
}

async function main() {
  if (!TOKEN) { console.error("CMS_ADMIN_ALL_TOKEN is required."); process.exit(1); }
  const records = unwrap(await request(`/api/cms/guides?cb=${Date.now()}`));
  if (!records) throw new Error("Unexpected CMS response shape");
  const rec = records.find((r) => r.id === ID);
  if (!rec) throw new Error(`Missing record ${ID}`);
  const old = String(rec.zh?.content || "");
  console.log(`old zh: cjk=${(old.match(/[\u4e00-\u9fff]/g) || []).length} latin=${(old.match(/[A-Za-z]/g) || []).length}`);
  if (old.includes(SENTINEL)) { console.log("[skip] already fixed"); return; }

  const next = {
    ...rec,
    zh: { ...rec.zh, content: ZH_BODY },
    updatedAt: new Date().toISOString(),
  };
  if (JSON.stringify(next.seo) !== JSON.stringify(rec.seo) || JSON.stringify(next.en) !== JSON.stringify(rec.en)) {
    throw new Error("seo/en would change — aborting");
  }
  console.log(`new zh: ${ZH_BODY.length} chars, cjk=${(ZH_BODY.match(/[\u4e00-\u9fff]/g) || []).length}`);
  if (!APPLY) { console.log("Dry run. Re-run with --apply."); return; }
  const saved = await request("/api/cms/guides/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(next),
  });
  if (!saved?.data?.saved) throw new Error(`save failed: ${JSON.stringify(saved).slice(0, 200)}`);
  console.log("[ok] guide zh body written to D1");
}
main().catch((e) => { console.error(e); process.exit(1); });
