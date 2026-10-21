/**
 * Correct the figures the two electric ride-on news articles publish, and give
 * them separate jobs.
 *
 * Why. A derived duplication scan (check:pairdrift phase 2) flagged the pair at
 * 0.6 subhead similarity — "Five checks that transfer" against "Three checks
 * that transfer" — two pages drawing the same buyer checklist from the same
 * 16-listing catalog. Reading them side by side turned up something worse than
 * overlap: both pages publish counts that the catalog does not support, and the
 * two pages disagree with each other.
 *
 * Every replacement below is a recount. The ground truth is the published
 * catalog, electric ride-on category, October 2026 — 17 listings carry the tag,
 * one is a helmet listing the category page does not show, so 16 are counted:
 *
 *   voltage in title        15/16  (12V x8, 24V x5, 36V x1, 6V x1; the one
 *                                  without is a wiggle car)
 *   top speed in spec       0/16   (title copy on four listings: 1.5 MPH on a
 *                                  12V, 3.5 MPH on a 12V, 4 MPH on a wiggle
 *                                  car with no stated voltage, 5-8 MPH on the
 *                                  36V UTV)
 *   braking in spec         0/16
 *   tire type in spec       0/16   (UTV title: 14-inch EVA; one other title
 *                                  states an 8-inch tire, no material)
 *   motor wattage in spec   0/16   (400W / 4x100W / twin 35W are title copy)
 *   remote                  11/16 titles, 3/16 spec sheets
 *                                  (12V 6 of 8, 24V 5 of 5)
 *   battery average life    10/16
 *   charging time           0/16   (no listing states one)
 *   weight capacity         14/16  (55 lb to 264 lb)
 *   minimum age             16/16  (14 start at >= 36 months; outliers 12 and
 *                                  18 months, both 12V)
 *   assembly required       16/16
 *
 * `node scripts/count-electric-rideon-figures.mjs` reprints that table from the
 * live catalog, so the next person can check these numbers instead of trusting
 * them.
 *
 * The intent split is the smaller half of the change: the off-road article now
 * runs checks that only apply off pavement and points at the voltage article for
 * the tier-by-tier counts, instead of both pages ending on the same generic
 * "checks that transfer" list.
 *
 * Usage:
 *   node scripts/fix-electric-news-figures.mjs            (dry run)
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/fix-electric-news-figures.mjs --apply
 */
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

const WP_ID = "news_1786363572306";
const WP_SLUG = "kids-electric-bike-development-trends-2026";
const DIRT_ID = "news-2026-dirt-bike";
const DIRT_SLUG = "electric-dirt-bikes-for-kids";

const WP = {
  en: [
    [
      "Sixteen listings carry the electric ride-on category tag. The category page shows 25 products in total, because it also pulls in push ride-ons and kick scooters whose copy matches the electric boundary; one helmet listing filed under the category is not shown. Fourteen of the sixteen titles state a voltage — 12V eight times, 24V four times, 36V once, 6V once. The two that do not are a wiggle car and the helmet.",
      "Seventeen listings carry the electric ride-on category tag. The category page shows 25 products in total, because it also pulls in push ride-ons and kick scooters whose copy matches the electric boundary; one of the seventeen is a helmet listing the category page does not show, so every count below covers the other sixteen. Fifteen of those sixteen titles state a voltage — 12V eight times, 24V five times, 36V once, 6V once. The one that does not is a wiggle car.",
    ],
    [
      "- **24V — four listings.** Two-seaters and larger frames, with stated capacities of 65-264 lb — the 264 lb figure belongs to a four-seater, the highest stated capacity in the category. All four titles mention a parental remote.",
      "- **24V — five listings.** Two-seaters and larger frames, with stated capacities of 65-264 lb — the 264 lb figure belongs to a four-seater, the highest stated capacity in the category. All five titles mention a parental remote.",
    ],
    [
      "Fifteen of the sixteen listings state a minimum age. Thirteen of those start at 36 months or later; the two outliers start at 12 and 18 months, both in the 12V tier.",
      "All sixteen listings state a minimum age. Fourteen of them start at 36 months or later; the two outliers start at 12 and 18 months, both in the 12V tier.",
    ],
    [
      "Counting the same sixteen listings: top speed appears in no spec sheet — the speeds that exist, 1.5-4 MPH, 3.5 MPH, 4 MPH and 5-8 MPH, are title copy on four listings.",
      "Counting the same sixteen listings: top speed appears in no spec sheet — the speeds that exist, 1.5 MPH, 3.5 MPH, 4 MPH and 5-8 MPH, are title copy on four listings.",
    ],
    [
      "Parental remote control appears in 10 of 16 titles but only 3 of 16 spec sheets. Battery average life is stated in 10 spec sheets, charging time in 6, weight capacity in 13, and 15 of the 16 require assembly.",
      "Parental remote control appears in 11 of 16 titles but only 3 of 16 spec sheets. Battery average life is stated in 10 spec sheets and weight capacity in 14 — 55 lb to 264 lb — and all sixteen require assembly. No listing states a charging time.",
    ],
  ],
  zh: [
    [
      "归在电动骑乘品类下的有 16 个车型。品类页实际展示 25 个产品——它还揽入了文案匹配电动边界的推行骑乘车与脚踏滑板车，归类在该品类下的一个头盔车型不展示。16 个标题里 14 个标了电压——12V 八次、24V 四次、36V 一次、6V 一次。没标电压的两个是一辆扭扭车和那个头盔。",
      "归在电动骑乘品类下的有 17 个车型。品类页实际展示 25 个产品——它还揽入了文案匹配电动边界的推行骑乘车与脚踏滑板车；17 个里有一个是品类页不展示的头盔车型，所以下面的每个数字都数其余 16 个。16 个标题里 15 个标了电压——12V 八次、24V 五次、36V 一次、6V 一次。没标电压的那个是一辆扭扭车。",
    ],
    [
      "- **24V——四个车型。** 双座和更大的车架，标称承重 65-264 磅——264 磅属于一台四座车，是全品类最高的标称承重。四个标题全部提到家长遥控。",
      "- **24V——五个车型。** 双座和更大的车架，标称承重 65-264 磅——264 磅属于一台四座车，是全品类最高的标称承重。五个标题全部提到家长遥控。",
    ],
    [
      "16 个车型里 15 个标了最低年龄。其中 13 个从 36 个月起，两个例外从 12 和 18 个月起，都在 12V 档。",
      "16 个车型全部标了最低年龄。其中 14 个从 36 个月起，两个例外从 12 和 18 个月起，都在 12V 档。",
    ],
    [
      "存在的速度 1.5-4 MPH、3.5 MPH、4 MPH 和 5-8 MPH",
      "存在的速度 1.5 MPH、3.5 MPH、4 MPH 和 5-8 MPH",
    ],
    [
      "家长遥控出现在 10/16 个标题里，却只有 3/16 个规格表里。电池平均寿命写在 10 个规格表里，充电时间 6 个，承重 13 个，16 个里 15 个需要组装。",
      "家长遥控出现在 11/16 个标题里，却只有 3/16 个规格表里。电池平均寿命写在 10 个规格表里，承重 14 个——55 磅到 264 磅——16 个全部需要组装。没有一个车型标了充电时间。",
    ],
  ],
};

const DIRT = {
  en: [
    [
      "The catalog files 16 listings under the electric ride-on category. The category page shows 25 products in total, because it also pulls in push ride-ons and kick scooters whose copy matches the electric boundary; one helmet listing filed under the category is not shown. Four of the 16 are off-road shaped:",
      "The catalog files 17 listings under the electric ride-on category. The category page shows 25 products in total, because it also pulls in push ride-ons and kick scooters whose copy matches the electric boundary; one of the seventeen is a helmet listing the category page does not show, so every count below covers the other sixteen. Four of those sixteen are off-road shaped:",
    ],
    [
      "- Voltage appears in 14 of 16 titles — 12V eight times, 24V four times, 36V once, 6V once; the two without a stated voltage are a wiggle car and a helmet listing.",
      "- Voltage appears in 15 of 16 titles — 12V eight times, 24V five times, 36V once, 6V once; the one without a stated voltage is a wiggle car.",
    ],
    [
      "- Tire type appears in 0 of 16 spec sheets; the only tire material stated anywhere in the category is the UTV's 14-inch EVA wheels, in its title.",
      "- Tire type appears in 0 of 16 spec sheets; the only tire material stated anywhere in the category is the UTV's 14-inch EVA wheels, in its title, and one other title states an 8-inch tire with no material at all.",
    ],
    [
      "- Parental remote control appears in 10 of 16 titles but only 3 of 16 spec sheets.",
      "- Parental remote control appears in 11 of 16 titles but only 3 of 16 spec sheets.",
    ],
    [
      "- Battery life is stated in 10 of 16 spec sheets, charging time in 6.",
      "- Battery life is stated in 10 of 16 spec sheets; no listing states a charging time.",
    ],
    [
      "- Weight capacity is stated in 13 of 16 spec sheets, and the stated values run from 55 lb to 264 lb.",
      "- Weight capacity is stated in 14 of 16 spec sheets, and the stated values run from 55 lb to 264 lb.",
    ],
    [
      "- A minimum age is stated by 15 of 16; 13 of those start at 36 months or later, and the two outliers start at 18 and 12 months.",
      "- All sixteen state a minimum age; 14 of those start at 36 months or later, and the two outliers start at 18 and 12 months.",
    ],
    [
      "- Assembly is required by 15 of 16.",
      "- Assembly is required by all sixteen.",
    ],
    [
      "the checks that transfer to a dirt-bike-shaped ride-on wherever you end up buying one.",
      "the checks to run on a dirt-bike-shaped ride-on wherever you end up buying one.",
    ],
    // The intent split: same job, different surface. Off pavement only.
    [
      "## Five checks that transfer",
      "## Five checks before it goes off-road",
    ],
    [
      "In this category the 12V models state 1.5-4 MPH in title copy and the 36V UTV states 5-8 MPH.",
      "In this category two 12V titles state 1.5 and 3.5 MPH in title copy, a wiggle car with no stated voltage states 4 MPH, and the 36V UTV states 5-8 MPH.",
    ],
    [
      "Ten of sixteen titles mention a remote; three of sixteen spec sheets state one.",
      "Eleven of sixteen titles mention a remote; three of sixteen spec sheets state one.",
    ],
    [
      "**Check the age floor against your child.** Fifteen of sixteen listings state a minimum, and 13 of those start at 36 months or later. A three-year-old on a 24V two-seater is inside the stated range; a two-year-old is below it on all but one listing in the category.",
      "**Check the age floor against your child.** All sixteen listings state a minimum, and 14 of those start at 36 months or later. A three-year-old on a 24V two-seater is inside the stated range; a two-year-old is below it on all but one listing in the category. The tier-by-tier floors are in [Kids Electric Bikes 2026: Voltage by Age](/news/industry/kids-electric-bike-development-trends-2026).",
    ],
    [
      "- [News hub](/news/) — the rest of the October 2026 coverage.",
      "- [Kids electric bikes by voltage](/news/industry/kids-electric-bike-development-trends-2026) — the tier-by-tier counts behind the voltage and age checks above.\n- [News hub](/news/) — the rest of the October 2026 coverage.",
    ],
  ],
  zh: [
    [
      "目录里归在电动骑乘品类下的有 16 个车型。品类页实际展示 25 个产品——它还揽入了文案匹配电动边界的推行骑乘车与脚踏滑板车；归类在该品类下的一个头盔车型不展示。16 个里有 4 个是越野造型：",
      "目录里归在电动骑乘品类下的有 17 个车型。品类页实际展示 25 个产品——它还揽入了文案匹配电动边界的推行骑乘车与脚踏滑板车；17 个里有一个是品类页不展示的头盔车型，所以下面的每个数字都数其余 16 个。16 个里有 4 个是越野造型：",
    ],
    [
      "- 电压出现在 14/16 个标题里——12V 八次、24V 四次、36V 一次、6V 一次；没标电压的两个是一辆扭扭车和一个头盔车型。",
      "- 电压出现在 15/16 个标题里——12V 八次、24V 五次、36V 一次、6V 一次；没标电压的那个是一辆扭扭车。",
    ],
    [
      "- 轮胎类型出现在 0/16 个规格表里；全品类唯一标出的轮胎材质是 UTV 标题里的 14 英寸 EVA。",
      "- 轮胎类型出现在 0/16 个规格表里；全品类唯一标出的轮胎材质是 UTV 标题里的 14 英寸 EVA，另有一个标题只标了 8 英寸轮胎尺寸，没标材质。",
    ],
    [
      "- 家长遥控出现在 10/16 个标题里，但只有 3/16 个规格表里。",
      "- 家长遥控出现在 11/16 个标题里，但只有 3/16 个规格表里。",
    ],
    [
      "- 续航写在 10/16 个规格表里，充电时间 6/16。",
      "- 续航写在 10/16 个规格表里；没有一个车型标了充电时间。",
    ],
    [
      "- 承重写在 13/16 个规格表里，标称值从 55 磅到 264 磅。",
      "- 承重写在 14/16 个规格表里，标称值从 55 磅到 264 磅。",
    ],
    [
      "- 15/16 标了最低年龄；其中 13 个从 36 个月起，两个例外从 18 和 12 个月起。",
      "- 16 个全部标了最低年龄；其中 14 个从 36 个月起，两个例外从 18 和 12 个月起。",
    ],
    [
      "- 15/16 需要组装。",
      "- 16 个全部需要组装。",
    ],
    [
      "以及不管最后在哪买，都能带走的五项核对。",
      "以及不管最后在哪买，都能带着去核对的五件事。",
    ],
    [
      "## 可以带走的五项核对",
      "## 上非铺装路面前的五项核对",
    ],
    [
      "这个品类里 12V 车型在标题里写 1.5-4 MPH，36V UTV 写 5-8 MPH。",
      "这个品类里两辆 12V 车型在标题里分别写 1.5 和 3.5 MPH，一辆没标电压的扭扭车写 4 MPH，36V UTV 写 5-8 MPH。",
    ],
    [
      "16 个标题里 10 个提到遥控，16 个规格表里只有 3 个写了。",
      "16 个标题里 11 个提到遥控，16 个规格表里只有 3 个写了。",
    ],
    [
      "16 个车型里 15 个标了最低年龄，其中 13 个从 36 个月起。三岁孩子上 24V 双座在标称范围内；两岁孩子在除一个车型外的全部车型之下。",
      "16 个车型全部标了最低年龄，其中 14 个从 36 个月起。三岁孩子上 24V 双座在标称范围内；两岁孩子在除一个车型外的全部车型之下。逐档的年龄下限见[儿童电动自行车 2026：电压与年龄对照](/news/industry/kids-electric-bike-development-trends-2026)。",
    ],
    [
      "- [新闻中心](/news/)——2026 年 10 月报道的其余内容。",
      "- [按电压看儿童电动骑乘车](/news/industry/kids-electric-bike-development-trends-2026)——上面电压和年龄两项核对背后的逐档数字。\n- [新闻中心](/news/)——2026 年 10 月报道的其余内容。",
    ],
  ],
};

/** The white paper's published description counts the voltage-stated listings. */
const WP_DESC = {
  en: ["the 14 voltage-stated ride-ons", "the 15 voltage-stated ride-ons"],
  zh: ["14 个标了电压的电动骑乘车", "15 个标了电压的电动骑乘车"],
};

/** Must not survive anywhere: these are the counts that were wrong. */
const FORBIDDEN = [
  "14 of 16 titles",
  "14/16 个标题",
  "24V four times",
  "24V 四次",
  "1.5-4 MPH",
  "charging time in 6",
  "充电时间 6/16",
  "10 of 16 titles",
  "10/16 个标题里",
  "13 of 16 spec sheets",
  "13/16 个规格表",
  "15 of the 16 require assembly",
  "16 个里 15 个需要组装",
  "A minimum age is stated by 15 of 16",
  "15/16 标了最低年龄",
  "Assembly is required by 15 of 16",
  "15/16 需要组装",
];

const apply = (text, patches, label) => {
  let out = text;
  for (const [from, to] of patches) {
    const n = out.split(from).length - 1;
    if (n !== 1) throw new Error(`${label}: expected 1 occurrence, found ${n} — "${from.slice(0, 70)}"`);
    out = out.replace(from, to);
  }
  return out;
};

const read = async () => {
  const res = await fetch(`${API_BASE}/api/cms/news?cb=${Date.now()}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`news read failed: HTTP ${res.status}`);
  const payload = await res.json();
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  if (!rows.length) throw new Error("news collection came back empty — refusing to write");
  return rows;
};

const rows = await read();
const plan = [];
for (const [id, slug, patches] of [
  [WP_ID, WP_SLUG, WP],
  [DIRT_ID, DIRT_SLUG, DIRT],
]) {
  const row = rows.find((r) => String(r.id) === id);
  if (!row) throw new Error(`${id} not found in the news collection`);
  if (String(row.slug) !== slug) throw new Error(`slug mismatch for ${id}: expected ${slug}, got ${String(row.slug)}`);
  const next = { ...row };
  for (const lang of ["en", "zh"]) {
    const body = { ...(row[lang] || {}) };
    if (!("title" in body) || !("content" in body)) throw new Error(`${id}.${lang} has no title/content — refusing`);
    body.content = apply(String(body.content), patches[lang], `${id}.${lang}`);
    next[lang] = body;
  }
  const seo = { ...(row.seo || {}) };
  if (id === WP_ID) {
    for (const lang of ["en", "zh"]) {
      const block = { ...(seo[lang] || {}) };
      if (typeof block.description === "string") {
        const [from, to] = WP_DESC[lang];
        if (!block.description.includes(from)) throw new Error(`wp seo.${lang}.description does not contain "${from}"`);
        block.description = block.description.replace(from, to);
        if (block.description.length > 155) throw new Error(`wp seo.${lang}.description is ${block.description.length} chars (max 155)`);
        seo[lang] = block;
      }
    }
  }
  next.seo = seo;
  plan.push({ id, slug, row, next, patches });
}

for (const { id, next } of plan) {
  for (const lang of ["en", "zh"]) {
    for (const bad of FORBIDDEN) {
      if (String(next[lang].content).includes(bad)) throw new Error(`${id}.${lang} still publishes "${bad}"`);
    }
  }
  console.log(`\n${id}`);
  for (const lang of ["en", "zh"]) {
    const before = String((plan.find((p) => p.id === id).row[lang] || {}).content ?? "");
    const after = String(next[lang].content);
    console.log(`  ${lang}: ${before.length} -> ${after.length} chars`);
  }
  console.log(`  headings: ${(String(next.en.content).match(/^## .*/gm) || []).join(" | ")}`);
}

if (!APPLY) {
  console.log("\nDry run complete — every patch matched exactly once and no wrong count survives.");
  console.log("Re-run with --apply to write.");
  process.exit(0);
}
if (!TOKEN) {
  console.error("CMS_ADMIN_ALL_TOKEN is required.");
  process.exit(1);
}

for (const { id, next } of plan) {
  next.updatedAt = new Date().toISOString();
  const post = await fetch(`${API_BASE}/api/cms/news/save`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", "x-cms-admin-token": TOKEN },
    body: JSON.stringify(next),
  });
  if (!post.ok) throw new Error(`save failed for ${id}: HTTP ${post.status} ${(await post.text()).slice(0, 300)}`);
  console.log(`  saved ${id}`);
}

let failed = false;
const verify = await read();
for (const { id, next } of plan) {
  const row = verify.find((r) => String(r.id) === id);
  if (!row) throw new Error(`verification read could not find ${id}`);
  for (const lang of ["en", "zh"]) {
    const live = String((row[lang] || {}).content ?? "");
    if (live !== String(next[lang].content)) {
      console.error(`  VERIFY FAILED ${id}.${lang}: ${live.length} vs ${String(next[lang].content).length} chars`);
      failed = true;
    } else {
      console.log(`  ${id}.${lang} verified (${live.length} chars)`);
    }
  }
  if (id === WP_ID) {
    for (const lang of ["en", "zh"]) {
      const want = WP_DESC[lang][1];
      if (!String((row.seo?.[lang] || {}).description ?? "").includes(want)) {
        console.error(`  VERIFY FAILED wp seo.${lang}.description missing "${want}"`);
        failed = true;
      }
    }
  }
}
if (failed) process.exit(1);
console.log("\n[ok] both electric articles now publish the recounted figures.");
