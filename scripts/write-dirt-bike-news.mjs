/**
 * Write the news article that supports the /news hub keyword
 * "electric dirt bike for kids" — the one keyword in the hub's published set
 * with no article behind it (the other two, "kids electric bike" and
 * "foldable electric scooter", already have articles in the CMS).
 *
 * Grounding discipline (same as write-3-guides.mjs): every figure is counted
 * from the site's PUBLISHED catalog (stage-1 + stage-2 prune applied), so the
 * article and the hub it links to can never quote different numbers. The
 * article states plainly what the catalog does NOT hold — no dirt-bike-shaped
 * ride-on, no pedal-assist e-bike — instead of implying coverage.
 *
 * Verified figures (2026-10-22, scripts/cms-snapshots/products.json):
 *   electric ride-on category: 16 published listings, 15 shown on the hub
 *   (one helmet listing hidden). Voltage in 16/16 titles (12V x10, 24V x4,
 *   36V x1, 6V x1). Speed in 0/16 spec sheets. Braking 0/16. Tire type 0/16.
 *   Motor wattage 0/16 in specs. Remote: 11/16 titles vs 3/16 specs.
 *   Battery life 10/16, charging time 6/16, weight capacity 13/16 (55-264 lb),
 *   age minimum stated 15/16 (13 at >=36 months, outliers 18 and 12),
 *   assembly required 15/16.
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/write-dirt-bike-news.mjs --dry-run
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/write-dirt-bike-news.mjs --apply
 *
 * CMS_API_BASE   default https://store.balancebiketoddler.com
 */
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

// ---------------------------------------------------------------------------
// Honesty pre-scan. Mirrors the phrases check-honesty-claims.ts guards
// (subset sufficient for authored copy — the full guard runs on dist anyway).
// ---------------------------------------------------------------------------
// Enforcement data — not published copy. The diff-review honesty-claim rule
// skips the marked region so the ban list does not flag its own vocabulary;
// every payload string below the markers stays fully checked.
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
const textHas = (patterns, text) => {
  const lower = String(text || "").toLowerCase();
  return patterns.some((p) => (typeof p === "string" ? lower.includes(p) : p.test(lower)));
};

// ---------------------------------------------------------------------------
// Payload
// ---------------------------------------------------------------------------
const ARTICLE = {
  id: "news-2026-dirt-bike",
  slug: "electric-dirt-bikes-for-kids",
  category: "industry",
  seo: {
    en: {
      title: "Electric Dirt Bikes for Kids: What to Check",
      description:
        "No dirt bike is listed in this catalog. What the four off-road-shaped electric ride-ons publish, what they leave out, and the checks that transfer.",
      keywords: ["electric dirt bike for kids", "kids dirt bike", "kids electric motorcycle", "off-road ride-on toys"],
    },
    zh: {
      title: "儿童电动越野车选购：先核对这五项",
      description:
        "本站目录里并没有儿童越野电动摩托车。四款越野造型电动骑乘车公布了什么、没公布什么，以及可以带走的五项核对。",
      keywords: ["儿童电动越野车", "儿童电动摩托车", "越野骑乘玩具", "儿童电动车"],
    },
  },
  en: {
    title: "Electric Dirt Bikes for Kids: What to Check",
    content: `"Electric dirt bike for kids" is a search that lands in a category with no dirt bike in it. This guide covers what the off-road ride-on toys in this catalog actually publish, what they leave out, and the checks that transfer to a dirt-bike-shaped ride-on wherever you end up buying one.

## What the catalog holds

The catalog files 16 listings under the electric ride-on category. The category page shows 25 products in total, because it also pulls in push ride-ons and kick scooters whose copy matches the electric boundary; one helmet listing filed under the category is not shown. Four of the 16 are off-road shaped:

- **A 6V three-wheel kids electric motorcycle** — the only one in the catalog — with police decals, reverse and headlights. 16.8 lb, 55 lb capacity, ages 3-5, plastic, assembly required.
- **A 24V two-seater licensed Bronco Raptor** — 132 lb capacity, ages 3-8, metal and PP plastic, assembly required.
- **A 36V two-seater UTV** with a 400W motor — its title states 5-8 MPH and 14-inch EVA wheels; its spec sheet states 132 lb capacity and 37-120 months, while the title says 6+. Metal frame, assembly required.
- **A 24V two-seater licensed F-150** with 4x100W all-terrain motors — 60.6 lb, 65 lb capacity, ages 3-8, 122 minutes of stated battery life, assembly required.

None of the four is a dirt bike: no kids dirt bike listing, no pedal-assist e-bike and no off-road motorcycle beyond the 6V three-wheeler above appears in this catalog. What follows is about the gap between what that search expects and what this category publishes.

## The publication gap

Counting all 16 listings in the electric ride-on category:

- Voltage appears in 16 of 16 titles — 12V ten times, 24V four times, 36V once, 6V once.
- Top speed appears in 0 of 16 spec sheets. The speeds that exist — 1.5, 3.5, 4 and 5-8 MPH — are title copy on four listings, not published specs.
- Braking appears in 0 of 16 spec sheets.
- Tire type appears in 0 of 16 spec sheets; the only tire material stated anywhere in the category is the UTV's 14-inch EVA wheels, in its title.
- Motor wattage appears in 0 of 16 spec sheets; the 400W, 4x100W and twin-35W figures are title copy.
- Parental remote control appears in 11 of 16 titles but only 3 of 16 spec sheets.
- Battery life is stated in 10 of 16 spec sheets, charging time in 6.
- Weight capacity is stated in 13 of 16 spec sheets, and the stated values run from 55 lb to 264 lb.
- A minimum age is stated by 15 of 16; 13 of those start at 36 months or later, and the two outliers start at 18 and 12 months.
- Assembly is required by 15 of 16.

So the one powertrain number this category publishes consistently — voltage — is the one that says least about how a ride-on behaves, and the numbers that describe the ride itself (speed, braking, tires, motor power) live in title copy where they cannot be compared.

## Five checks that transfer

1. **Read voltage as a speed class, not a spec.** In this category the 12V models state 1.5-4 MPH in title copy and the 36V UTV states 5-8 MPH. Voltage sets the ceiling; it does not tell you the limit the manufacturer actually ships.
2. **Tires before terrain.** EVA foam cannot puncture and transmits what it rolls over; pneumatic tyres grip and need air. The only tire material stated in the whole category is the UTV's EVA, in its title. On dirt, this is the first thing to check in person.
3. **Verify the parental control exists as hardware.** Eleven of sixteen titles mention a remote; three of sixteen spec sheets state one. Ask whether the remote is included, what it controls — speed, direction, or both — and its range.
4. **Match capacity to rider plus gear.** The off-road cluster states 55-132 lb, and the 6V motorcycle's 55 lb is the tightest in the category. A rider at the limit has no margin for a jacket, let alone a passenger.
5. **Check the age floor against your child.** Fifteen of sixteen listings state a minimum, and 13 of those start at 36 months or later. A three-year-old on a 24V two-seater is inside the stated range; a two-year-old is below it on all but one listing in the category.

## What this catalog does not list

No dirt-bike-shaped electric ride-on, no pedal-assist e-bike, and no off-road motorcycle beyond the 6V three-wheeler above. If a listing elsewhere promises dirt-bike performance, the five checks above are the ones to put to it — and the [electric ride-on category](/products/electric-cars/) shows what a published spec sheet looks like in this market.

## Method and limits

Every figure is counted from this site's published catalog — the 16 listings filed under the electric ride-on category, October 2026. Nothing here is measured by us; where a listing does not state a spec, this page reports it as not stated. Titles are retailer copy and change without notice, so verify against the current listing before buying.

## Further reading

- [Electric ride-on category](/products/electric-cars/) — the products behind this page.
- [News hub](/news/) — the rest of the October 2026 coverage.`,
  },
  zh: {
    title: "儿童电动越野车选购：先核对这五项",
    content: `搜"儿童电动越野车"，落进来的却是一个目录里没有越野车的品类。这篇讲清楚：儿童电动车这个品类里，越野骑乘玩具公布了什么、没公布什么，以及不管最后在哪买，都能带走的五项核对。

## 目录里有什么

目录里归在电动骑乘品类下的有 16 个车型。品类页实际展示 25 个产品——它还揽入了文案匹配电动边界的推行骑乘车与脚踏滑板车；归类在该品类下的一个头盔车型不展示。16 个里有 4 个是越野造型：

- **6V 三轮儿童电动摩托车**——目录里唯一一辆——带警用贴花、倒挡、车灯。16.8 磅，承重 55 磅，3-5 岁，塑料件，需组装。
- **24V 双座 licensed Bronco Raptor**——承重 132 磅，3-8 岁，金属与 PP 塑料，需组装。
- **36V 双座 UTV**，400W 电机——标题写 5-8 MPH、14 英寸 EVA 轮；规格表写承重 132 磅、37-120 个月，而标题写 6 岁以上。金属车架，需组装。
- **24V 双座 licensed F-150**，4x100W 全地形电机——60.6 磅，承重 65 磅，3-8 岁，标称续航 122 分钟，需组装。

四款都不是越野摩托车。本站目录没有越野造型的骑乘车，也没有踏板助力电动自行车，这篇不假装有——下面讲的是这类搜索的期待和这个品类的公布现状之间的落差。

## 公布的落差

数完电动骑乘品类全部 16 个车型：

- 电压出现在 16/16 个标题里——12V 十次、24V 四次、36V 一次、6V 一次。
- 最高时速出现在 0/16 个规格表里。存在的速度——1.5、3.5、4 和 5-8 MPH——是四个车型标题里的文案，不是公布的规格。
- 制动出现在 0/16 个规格表里。
- 轮胎类型出现在 0/16 个规格表里；全品类唯一标出的轮胎材质是 UTV 标题里的 14 英寸 EVA。
- 电机功率出现在 0/16 个规格表里；400W、4x100W 和双 35W 都是标题文案。
- 家长遥控出现在 11/16 个标题里，但只有 3/16 个规格表里。
- 续航写在 10/16 个规格表里，充电时间 6/16。
- 承重写在 13/16 个规格表里，标称值从 55 磅到 264 磅。
- 15/16 标了最低年龄；其中 13 个从 36 个月起，两个例外从 18 和 12 个月起。
- 15/16 需要组装。

所以这个品类唯一公布得一致的动力数字——电压——恰恰是对骑行行为说明最少的那一个，而描述骑行本身的数字（速度、制动、轮胎、电机功率）都住在无法互相比较的标题文案里。

## 可以带走的五项核对

1. **把电压当速度档位读，不当规格读。** 这个品类里 12V 车型在标题里写 1.5-4 MPH，36V UTV 写 5-8 MPH。电压定的是上限，不告诉你厂商实际发货的限速。
2. **先看轮胎，再看地形。** EVA 发泡扎不破，但路面反馈直接传导；充气胎抓地好，但要打气。全品类唯一标出的轮胎材质就是 UTV 标题里的 EVA。走非铺装路面，这是到手第一件该用眼睛查的事。
3. **把家长遥控当硬件核实。** 16 个标题里 11 个提到遥控，16 个规格表里只有 3 个写了。要问清：遥控是否随附、控制什么——速度、方向还是两者——以及遥控距离。
4. **承重要罩住骑乘的人加装备。** 越野簇标称 55-132 磅，其中 6V 摩托车的 55 磅是全品类最紧的。贴着上限骑的人，连一件外套的余量都没有，更别说带人。
5. **最低年龄对照自家孩子。** 16 个车型里 15 个标了最低年龄，其中 13 个从 36 个月起。三岁孩子上 24V 双座在标称范围内；两岁孩子在除一个车型外的全部车型之下。

## 本站目录没有列出的

没有越野造型的电动骑乘车，没有踏板助力电动自行车，除那辆 6V 三轮外也没有越野摩托车。如果别处的 Listing 承诺越野性能，就用上面五项去核对——而[电动骑乘品类页](/products/electric-cars/)可以看到这个市场里一份公布齐全的规格表长什么样。

## 方法与边界

这里每个数字都数自本站已发布目录（2026 年 10 月）——归在电动骑乘品类下的 16 个车型。没有任何一项是我们测量的；Listing 没标的规格，本页就报"未标"。标题是零售商文案，会随时变动，下单前请对照当时的 Listing 再核一遍。

## 延伸阅读

- [电动骑乘品类页](/products/electric-cars/)——本页背后的产品。
- [新闻中心](/news/)——2026 年 10 月报道的其余内容。`,
  },
};

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

const item = ARTICLE;
if (!/^news-[a-z0-9-]+$/.test(item.id)) fail(item.id, "id format");
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) fail(item.id, `slug "${item.slug}" not URL-safe`);
checkSeo(item.id, item.seo);
checkBody(item.id, item.en, item.zh);
if (String(item.en.title).trim() !== String(item.seo.en.title).trim()) {
  fail(item.id, "en.title and seo.en.title differ (prerender reads en.title for the <title> stem)");
}
if (String(item.zh.title).trim() !== String(item.seo.zh.title).trim()) {
  fail(item.id, "zh.title and seo.zh.title differ");
}
// The hub keyword this article exists to support must appear in the EN copy.
for (const kw of item.seo.en.keywords) {
  if (!String(item.en.content).toLowerCase().includes(kw.toLowerCase())) {
    fail(item.id, `EN content does not mention its own keyword "${kw}"`);
  }
}

// Duplicate-slug guard against what is already live.
const taken = new Set();
for (const collection of ["guides", "news"]) {
  try {
    const res = await fetch(`${API_BASE}/api/cms/${collection}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    for (const row of rows?.data || []) taken.add(`${collection}:${String(row.slug || "").trim().toLowerCase()}`);
  } catch (error) {
    console.error(`[warn] could not list live ${collection} for slug-collision check: ${error.message}`);
  }
}
if (taken.has(`news:${item.slug.toLowerCase()}`)) {
  fail(item.id, `slug "${item.slug}" already exists live in news`);
}

console.log(`Validation: ${problems.length} problem(s)`);
for (const p of problems) console.error(`  - ${p}`);
if (problems.length > 0) process.exit(1);

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------
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
  const payload = {
    ...item,
    status: "published",
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log(`API base: ${API_BASE}`);
  console.log(`Mode: ${APPLY ? "APPLY (writing to D1)" : "DRY RUN"}`);
  console.log(`Article: news/${item.slug} (channel: ${item.category})`);
  if (!APPLY) {
    console.log("\nDry run complete. Re-run with --apply to write.");
    return;
  }

  try {
    const result = await post("news", payload);
    if (result.saved) {
      console.log(`[ok] news/${item.slug}`);
    } else {
      console.error(`[?] news/${item.slug} — response: ${result.raw}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`[FAILED] news/${item.slug}: ${error.message}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
