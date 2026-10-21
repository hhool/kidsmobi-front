/**
 * Electric-news accuracy pass (2026-10-22).
 *
 * Two operations on the production CMS news collection:
 *
 * Op 1 — PATCH: the dirt-bike article (electric-dirt-bikes-for-kids, shipped
 * earlier today) quotes two counts that a re-extraction proved wrong:
 *   - voltage in titles: wrote "16 of 16 — 12V ten times"; actually 14 of 16
 *     (the two without are the FanttikRide wiggle car and the hidden helmet),
 *     12V eight times, 24V four (one title carries 24V twice), 36V once, 6V once.
 *   - parental remote in titles: wrote "11 of 16"; actually 10 of 16
 *     (the broad count includes "Parent Control" wording; the Bluetooth-only
 *     wiggle car is not a remote mention).
 * Both languages are patched. Every other figure in that article was
 * re-verified against scripts/cms-snapshots/products.json and stands
 * (speed/brakes/tires/motor 0 of 16 spec sheets; battery average life 10,
 * charging 6, capacity 13 (55-264 lb), age floor 15 (13 at >=36 months,
 * outliers 12/18), assembly 15; hub shows 25 products = 15 electric + 4 push
 * ride-ons + 6 kick scooters, helmet hidden).
 *
 * Op 2 — REWRITE: the whitepaper (kids-electric-bike-development-trends-2026)
 * is unsourced marketing copy — "over 35% of the premium youth bicycle
 * market", "motor power is severed within 0.04 seconds", "2,000+ charge
 * cycles", "up to 35% lighter", Bluetooth 5.4, and a raw LaTeX token
 * ($\text{LiFePO}_4$) that renders as garbage. It stays published because it
 * backs the /news hub keyword "kids electric bike", but the copy is replaced
 * with a catalog-grounded piece on the only 2026 trend this site can document:
 * the voltage ladder, the age floors it does NOT map to, and where the stated
 * numbers stop. Slug, id, image and scenario tags are preserved — no URL
 * change, no redirect.
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/fix-electric-news-accuracy.mjs --dry-run
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/fix-electric-news-accuracy.mjs --apply
 *
 * CMS_API_BASE   default https://store.balancebiketoddler.com
 */
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

// ---------------------------------------------------------------------------
// Honesty pre-scan (same subset as write-dirt-bike-news.mjs).
// ---------------------------------------------------------------------------
// diff-review:skip-begin
const FORBIDDEN_PHRASES = [
  "we tested", "hands-on testing", "in our test group", "in our testing",
  "in our test pool", "backed by real testing", "test notes", "in our checks",
  "in our group", "in our jogging stroller field",
  "实测", "实验室", "我们的测试", "我们测试了", "检测团队",
];
// diff-review:skip-end
const FORBIDDEN_MEDICAL = [
  /\btherapeutic\b/, /\btherapy\b/, /\bcures?\b/,
  /\bdiagnos(?:e|es|ed|is|tic)\b/, /\bprescrib(?:e|es|ed)\b/,
  /recommended for children with/, /designed for autism/i, /suitable for disabilit/i,
];
// Numbers that must never come back once the patch is applied.
const RETIRED_STRINGS = [
  "16 of 16 titles",
  "11 of 16 titles",
  "16/16 个标题",
  "11/16 个标题",
  "35% of the premium",
  "0.04 seconds",
  "2,000+ charge",
  "35% lighter",
  "Bluetooth 5.4",
  "LiFePO",
];
const textHas = (patterns, text) => {
  const lower = String(text || "").toLowerCase();
  return patterns.some((p) => (typeof p === "string" ? lower.includes(p) : p.test(lower)));
};

// ---------------------------------------------------------------------------
// Op 2 payload: the rewritten whitepaper (slug and identity preserved).
// ---------------------------------------------------------------------------
const WHITEPAPER = {
  slug: "kids-electric-bike-development-trends-2026",
  seo: {
    en: {
      title: "Kids Electric Bikes 2026: Voltage by Age",
      description:
        "No pedal-assist e-bike is listed here. What the 14 voltage-stated ride-ons publish by tier, the age floors they state, and what spec sheets omit.",
      keywords: ["kids electric bike", "e-bike trends"],
    },
    zh: {
      title: "儿童电动自行车 2026：电压与年龄对照",
      description:
        "本站目录没有踏板助力电动自行车。14 个标了电压的电动骑乘车按档位公布了什么、标了哪些年龄下限、规格表又漏掉了什么。",
      keywords: ["儿童电动自行车", "儿童电动车", "电动骑乘车"],
    },
  },
  en: {
    title: "Kids Electric Bikes 2026: Voltage by Age",
    content: `"Kids electric bike" is a search for a bicycle with a motor and pedals. This catalog lists no pedal-assist e-bike — what it lists under the electric ride-on category is cars, trucks, a UTV, two wiggle cars and a three-wheel motorcycle. So instead of e-bike trends coverage, here is the one 2026 trend this site can document from its own published data: what the electric lineup states, tier by tier, and where the stated numbers stop.

## The voltage ladder

Sixteen listings carry the electric ride-on category tag. The category page shows 25 products in total, because it also pulls in push ride-ons and kick scooters whose copy matches the electric boundary; one helmet listing filed under the category is not shown. Fourteen of the sixteen titles state a voltage — 12V eight times, 24V four times, 36V once, 6V once. The two that do not are a wiggle car and the helmet.

- **6V — one listing.** A three-wheel motorcycle with police decals, reverse and headlights. Stated age 36-60 months, 55 lb capacity, single seat, assembly required.
- **12V — eight listings.** The workhorse tier: licensed trucks, a 3-in-1 push ride-on, a toddler ride-on and two wiggle cars. Stated minimum ages run 12-36 months; where capacity is stated it runs 61-132 lb. Six of the eight titles mention a parental remote.
- **24V — four listings.** Two-seaters and larger frames, with stated capacities of 65-264 lb — the 264 lb figure belongs to a four-seater, the highest stated capacity in the category. All four titles mention a parental remote.
- **36V — one listing.** A two-seater UTV with a 400W motor. Its title states 5-8 MPH and 14-inch EVA wheels; its spec sheet states 132 lb capacity and 37-120 months.

## Voltage is not an age

The ladder's most useful property is also its most misleading one. The 12V tier alone spans stated minimum ages from 12 to 36 months and stated maximum ages from 36 months to 12 years — the same voltage badge sits on a toddler ride-on and on a 132 lb-capacity car. Voltage sets a power ceiling; it does not say which child the listing is built for. The age line and the capacity line do that, and both live in the spec sheet rather than the title.

Fifteen of the sixteen listings state a minimum age. Thirteen of those start at 36 months or later; the two outliers start at 12 and 18 months, both in the 12V tier.

## Where the stated numbers stop

Counting the same sixteen listings: top speed appears in no spec sheet — the speeds that exist, 1.5-4 MPH, 3.5 MPH, 4 MPH and 5-8 MPH, are title copy on four listings. Braking, tire type and motor wattage appear in no spec sheet either; the 400W, 4x100W and twin-35W figures are title copy. Parental remote control appears in 10 of 16 titles but only 3 of 16 spec sheets. Battery average life is stated in 10 spec sheets, charging time in 6, weight capacity in 13, and 15 of the 16 require assembly.

## Three checks that transfer

1. **Match the age floor first, the voltage second.** A 12V listing with a 36-month floor is not a toddler product because it shares a voltage with one that is.
2. **Check capacity against rider plus passenger.** The two-seaters state 65-264 lb; split that number before buying for two children. The tightest stated capacity in the category is 55 lb, on the 6V motorcycle.
3. **Treat title numbers as marketing until the spec sheet repeats them.** Voltage, speed, motor power and remote presence all appear in titles at rates the spec sheets do not match. Ask the seller to confirm against the current listing.

## Method and limits

Every figure is counted from this site's published catalog — the 16 listings filed under the electric ride-on category, October 2026. Nothing here is measured by us; where a listing does not state a spec, this page reports it as not stated. Titles are retailer copy and change without notice, so verify against the current listing before buying.

## Further reading

- [Electric ride-on category](/products/electric-cars/) — the listings behind this page.
- [Off-road electric ride-ons](/news/industry/electric-dirt-bikes-for-kids) — the four off-road-shaped models, listing by listing.
- [News hub](/news/) — the rest of the October 2026 coverage.`,
  },
  zh: {
    title: "儿童电动自行车 2026：电压与年龄对照",
    content: `搜"儿童电动自行车"，想要的是带电机和脚踏的自行车。本站目录里没有——儿童电动车这个品类下收录的是汽车、卡车、一台 UTV、两辆扭扭车和一辆三轮摩托车，全目录没有任何一辆踏板助力电动自行车。所以这里不写行业趋势，只写一件本站能用自己的发布数据记下的 2026 事实：电动骑乘品类各档位公布了什么，以及公布到哪里停。

## 电压阶梯

归在电动骑乘品类下的有 16 个车型。品类页实际展示 25 个产品——它还揽入了文案匹配电动边界的推行骑乘车与脚踏滑板车，归类在该品类下的一个头盔车型不展示。16 个标题里 14 个标了电压——12V 八次、24V 四次、36V 一次、6V 一次。没标电压的两个是一辆扭扭车和那个头盔。

- **6V——一个车型。** 带警用贴花、倒挡、车灯的三轮摩托车。标称年龄 36-60 个月，承重 55 磅，单座，需组装。
- **12V——八个车型。** 主力档：授权皮卡、一台三合一推行骑乘车、一台幼儿骑乘车和两辆扭扭车。标称最低年龄 12-36 个月；标了承重的为 61-132 磅。八个标题里六个提到家长遥控。
- **24V——四个车型。** 双座和更大的车架，标称承重 65-264 磅——264 磅属于一台四座车，是全品类最高的标称承重。四个标题全部提到家长遥控。
- **36V——一个车型。** 双座 UTV，400W 电机。标题写 5-8 MPH、14 英寸 EVA 轮；规格表写承重 132 磅、37-120 个月。

## 电压不是年龄

这个阶梯最有用的属性也最容易骗人。单是 12V 一档，标称最低年龄从 12 个月横跨到 36 个月，标称最高年龄从 36 个月横跨到 12 年——同一个电压徽标既贴在幼儿骑乘车上，也贴在承重 132 磅的车上。电压定的是动力上限，不说明这车是给多大的孩子造的。说明这件事的是年龄行和承重行，而这两行都在规格表里，不在标题里。

16 个车型里 15 个标了最低年龄。其中 13 个从 36 个月起，两个例外从 12 和 18 个月起，都在 12V 档。

## 公布停在哪里

数同样的 16 个车型：最高时速没有出现在任何规格表里——存在的速度 1.5-4 MPH、3.5 MPH、4 MPH 和 5-8 MPH，是四个车型标题里的文案。制动、轮胎类型和电机功率同样不出现在任何规格表里；400W、4x100W 和双 35W 都是标题文案。家长遥控出现在 10/16 个标题里，却只有 3/16 个规格表里。电池平均寿命写在 10 个规格表里，充电时间 6 个，承重 13 个，16 个里 15 个需要组装。

## 可以带走的三项核对

1. **先对年龄下限，再对电压。** 一辆标了 36 个月下限的 12V 车，不会因为和某辆幼儿车同一个电压就变成幼儿车。
2. **承重要罩住骑乘的人加乘客。** 双座车标称 65-264 磅；买给两个孩子之前先把这数字分一半。全品类最紧的标称承重是 55 磅，在那辆 6V 摩托车上。
3. **规格表不复述的数字，都先当营销看。** 电压、速度、电机功率、遥控在标题里出现的频率和规格表完全对不上。找卖家对着当时的 Listing 核一遍。

## 方法与边界

这里每个数字都数自本站已发布目录（2026 年 10 月）——归在电动骑乘品类下的 16 个车型。没有任何一项是我们测量的；Listing 没标的规格，本页就报"未标"。标题是零售商文案，会随时变动，下单前请对照当时的 Listing 再核一遍。

## 延伸阅读

- [电动骑乘品类页](/products/electric-cars/)——本页背后的车型。
- [越野造型电动骑乘车](/news/industry/electric-dirt-bikes-for-kids)——四款越野造型车型，逐辆列。
- [新闻中心](/news/)——2026 年 10 月报道的其余内容。`,
  },
};

// ---------------------------------------------------------------------------
// Op 1 payload: exact string patches for the dirt-bike article.
// ---------------------------------------------------------------------------
const DIRT_BIKE_PATCHES = [
  {
    id: "voltage count",
    from: "- Voltage appears in 16 of 16 titles — 12V ten times, 24V four times, 36V once, 6V once.",
    to: "- Voltage appears in 14 of 16 titles — 12V eight times, 24V four times, 36V once, 6V once; the two without a stated voltage are a wiggle car and a helmet listing.",
  },
  {
    id: "voltage count (zh)",
    from: "- 电压出现在 16/16 个标题里——12V 十次、24V 四次、36V 一次、6V 一次。",
    to: "- 电压出现在 14/16 个标题里——12V 八次、24V 四次、36V 一次、6V 一次；没标电压的两个是一辆扭扭车和一个头盔车型。",
  },
  {
    id: "remote count",
    from: "- Parental remote control appears in 11 of 16 titles but only 3 of 16 spec sheets.",
    to: "- Parental remote control appears in 10 of 16 titles but only 3 of 16 spec sheets.",
  },
  {
    id: "remote count (zh)",
    from: "- 家长遥控出现在 11/16 个标题里，但只有 3/16 个规格表里。",
    to: "- 家长遥控出现在 10/16 个标题里，但只有 3/16 个规格表里。",
  },
  {
    id: "remote count (check 3)",
    from: "Eleven of sixteen titles mention a remote; three of sixteen spec sheets state one.",
    to: "Ten of sixteen titles mention a remote; three of sixteen spec sheets state one.",
  },
  {
    id: "remote count (check 3, zh)",
    from: "16 个标题里 11 个提到遥控，16 个规格表里只有 3 个写了。",
    to: "16 个标题里 10 个提到遥控，16 个规格表里只有 3 个写了。",
  },
];

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const problems = [];
const fail = (id, msg) => problems.push(`${id}: ${msg}`);

const checkText = (id, field, text, { maxDesc } = {}) => {
  const value = String(text || "");
  if (!value.trim()) return fail(id, `${field} is empty`);
  const lower = value.toLowerCase();
  for (const phrase of FORBIDDEN_PHRASES) {
    if (value.includes(phrase) || lower.includes(phrase.toLowerCase())) {
      fail(id, `${field} contains forbidden claim phrase "${phrase}"`);
    }
  }
  if (textHas(FORBIDDEN_MEDICAL, value)) {
    fail(id, `${field} contains a forbidden medical-claim pattern`);
  }
  for (const retired of RETIRED_STRINGS) {
    if (value.includes(retired)) fail(id, `${field} still contains retired string "${retired}"`);
  }
  if (maxDesc && value.length > maxDesc) {
    fail(id, `${field} is ${value.length} chars > ${maxDesc}`);
  }
};

const checkSeo = (id, seo) => {
  for (const lang of ["en", "zh"]) {
    const s = seo?.[lang];
    if (!s) return fail(id, `seo.${lang} missing`);
    const title = String(s.title || "").trim();
    const desc = String(s.description || "").trim();
    if (!title) fail(id, `seo.${lang}.title empty`);
    if (!desc) fail(id, `seo.${lang}.description empty`);
    if (Array.isArray(s.keywords) && s.keywords.length > 5) {
      fail(id, `seo.${lang}.keywords has ${s.keywords.length} entries > 5`);
    }
    checkText(id, `seo.${lang}.title`, title, {});
    checkText(id, `seo.${lang}.description`, desc, { maxDesc: 155 });
    if (lang === "en") {
      const full = `${title} | BalanceBikeToddler`;
      if (full.length > 65) fail(id, `EN title + suffix = ${full.length} > 65`);
      if (title.length > 44) fail(id, `EN title base ${title.length} > 44`);
    }
  }
};

const checkBody = (id, en, zh) => {
  for (const [lang, obj, min] of [["en", en, 1800], ["zh", zh, 900]]) {
    if (!obj?.title?.trim()) fail(id, `${lang}.title empty`);
    if (!obj?.content?.trim()) fail(id, `${lang}.content empty`);
    if (String(obj?.content || "").length < min) {
      fail(id, `${lang}.content is only ${String(obj?.content || "").length} chars < ${min} — too thin`);
    }
    checkText(id, `${lang}.title`, obj?.title, {});
    checkText(id, `${lang}.content`, obj?.content, {});
  }
};

// Whitepaper payload checks (same shape as write-dirt-bike-news.mjs).
const wp = WHITEPAPER;
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(wp.slug)) fail(wp.slug, "slug not URL-safe");
checkSeo("whitepaper", wp.seo);
checkBody("whitepaper", wp.en, wp.zh);
if (String(wp.en.title).trim() !== String(wp.seo.en.title).trim()) {
  fail("whitepaper", "en.title and seo.en.title differ");
}
if (String(wp.zh.title).trim() !== String(wp.seo.zh.title).trim()) {
  fail("whitepaper", "zh.title and seo.zh.title differ");
}
for (const kw of wp.seo.en.keywords) {
  if (!String(wp.en.content).toLowerCase().includes(kw.toLowerCase())) {
    fail("whitepaper", `EN content does not mention its own keyword "${kw}"`);
  }
}
for (const kw of wp.seo.zh.keywords) {
  if (!String(wp.zh.content).includes(kw)) {
    fail("whitepaper", `ZH content does not mention its own keyword "${kw}"`);
  }
}

// ---------------------------------------------------------------------------
// Fetch live records, build the two payloads.
// ---------------------------------------------------------------------------
async function fetchNews() {
  const res = await fetch(`${API_BASE}/api/cms/news?cb=${Date.now()}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`news fetch failed: HTTP ${res.status}`);
  const rows = await res.json();
  return Array.isArray(rows) ? rows : rows?.data || [];
}

async function post(collection, payload) {
  const res = await fetch(`${API_BASE}/api/cms/${collection}/save`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-cms-admin-token": TOKEN,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${text.slice(0, 200)}`);
  let parsed = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    /* non-JSON */
  }
  return { saved: Boolean(parsed?.data?.saved), raw: text.slice(0, 160) };
}

async function main() {
  if (!TOKEN) {
    console.error("CMS_ADMIN_ALL_TOKEN is required.");
    process.exit(1);
  }
  const live = await fetchNews();
  const wpLive = live.find((r) => r.slug === WHITEPAPER.slug);
  const dbLive = live.find((r) => r.slug === "electric-dirt-bikes-for-kids");
  if (!wpLive) fail("whitepaper", "slug not found live");
  if (!dbLive) fail("dirt-bike", "slug not found live");

  // Op 1: patch the dirt-bike article's content in place.
  const dbPayload = dbLive ? { ...dbLive } : null;
  if (dbPayload) {
    for (const lang of ["en", "zh"]) {
      let content = String(dbPayload[lang]?.content || "");
      for (const patch of DIRT_BIKE_PATCHES) {
        // Route each patch to the language whose "from" string it carries.
        const isZh = /[\u4e00-\u9fff]/.test(patch.from);
        if ((lang === "zh") !== isZh) continue;
        if (!content.includes(patch.from)) {
          fail("dirt-bike", `${lang}: patch "${patch.id}" anchor not found (already applied?)`);
          continue;
        }
        content = content.replace(patch.from, patch.to);
      }
      dbPayload[lang] = { ...dbPayload[lang], content };
    }
    checkText("dirt-bike", "en.content", dbPayload.en?.content, {});
    checkText("dirt-bike", "zh.content", dbPayload.zh?.content, {});
    dbPayload.updatedAt = new Date().toISOString();
  }

  // Op 2: rewritten whitepaper, identity fields preserved.
  const wpPayload = wpLive
    ? {
        ...wpLive,
        seo: WHITEPAPER.seo,
        en: { ...WHITEPAPER.en },
        zh: { ...WHITEPAPER.zh },
        updatedAt: new Date().toISOString(),
      }
    : null;

  console.log(`API base: ${API_BASE}`);
  console.log(`Mode: ${APPLY ? "APPLY (writing to D1)" : "DRY RUN"}`);
  console.log(`Op 1 patch: news/electric-dirt-bikes-for-kids (${DIRT_BIKE_PATCHES.length} string patches)`);
  console.log(`Op 2 rewrite: news/${WHITEPAPER.slug} (slug/id/image preserved)`);
  console.log(`Validation: ${problems.length} problem(s)`);
  for (const p of problems) console.error(`  - ${p}`);
  if (problems.length > 0) process.exit(1);
  if (!APPLY) {
    console.log("\nDry run complete. Re-run with --apply to write.");
    return;
  }

  const r1 = await post("news", dbPayload);
  console.log(`[${r1.saved ? "ok" : "?"}] dirt-bike patched — ${r1.raw}`);
  const r2 = await post("news", wpPayload);
  console.log(`[${r2.saved ? "ok" : "?"}] whitepaper rewritten — ${r2.raw}`);

  // Read back with a cache buster and confirm both landed.
  const after = await fetchNews();
  const dbAfter = after.find((r) => r.slug === "electric-dirt-bikes-for-kids");
  const wpAfter = after.find((r) => r.slug === WHITEPAPER.slug);
  const dbOk =
    dbAfter &&
    String(dbAfter.en.content).includes("14 of 16 titles") &&
    String(dbAfter.en.content).includes("10 of 16 titles") &&
    !String(dbAfter.en.content).includes("16 of 16 titles") &&
    !String(dbAfter.en.content).includes("11 of 16 titles") &&
    String(dbAfter.zh.content).includes("14/16 个标题") &&
    String(dbAfter.zh.content).includes("10/16 个标题");
  const wpOk =
    wpAfter &&
    String(wpAfter.en.title) === WHITEPAPER.seo.en.title &&
    String(wpAfter.en.content).includes("Voltage is not an age") &&
    !String(wpAfter.en.content).includes("0.04 seconds");
  console.log(`read-back dirt-bike: ${dbOk ? "OK" : "MISMATCH"}`);
  console.log(`read-back whitepaper: ${wpOk ? "OK" : "MISMATCH"}`);
  if (!dbOk || !wpOk) process.exit(1);
}

main().catch((e) => {
  console.error(`FAILED: ${e.message}`);
  process.exit(1);
});
