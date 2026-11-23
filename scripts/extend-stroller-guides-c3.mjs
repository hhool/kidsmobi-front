/**
 * C#3 — late-2026 search-language sections for the 21 published stroller guides,
 * plus a real Chinese body for graco-modes-pramette-travel-system (103 chars).
 *
 * WHY THIS IS WORDING, NOT DATA.  The 2026-11-23 trending-keyword report
 * (.workbuddy/reports/stroller-trending-keywords-20261123.html) found 10 clusters
 * of current stroller search language with 0–14/21 coverage. Most of those
 * clusters (2026 model names, carbon-fiber weights, recall conclusions,
 * certification claims, Black Friday prices) are THIRD-PARTY FACTS. The
 * GROUNDING RULE forbids importing them into this site's copy: C3 alone has
 * two conflicting published weights (9.9 lb vs 11.6 lb, different models) and
 * C8 has airline sources unanimously saying there is no single cabin size.
 * So this script appends the words as SEARCH PHRASES and explicitly labels
 * them as such — no figures, no model names, no recall conclusions, no prices.
 *
 * CONTRACT (identical to extend-news-bodies-round3.mjs):
 * - `seo` is copied through byte-for-byte. No title / description / canonical /
 *   hreflang / keyword change; the head stays exactly as published.
 * - Existing en.content / zh.content is preserved verbatim as a PREFIX; only
 *   appended. A backup of the original 21 records is written before any write.
 * - Idempotent: both heading strings act as sentinels; a second --apply skips.
 * - Every record must still be published stroller before it is touched.
 *
 * HONESTY: no first-person measuring/testing claim, no 实测 / 实验室 / 测试方法,
 * no "lab"/"testing"/"we tested" family (check-honesty-claims.ts scans the built
 * EN HTML). The zh sanitiser (guideTextSanitize.ts) deletes ASCII runs >= 30
 * chars, so the Chinese side carries Chinese phrases only — verified below.
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/extend-stroller-guides-c3.mjs            # dry run
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/extend-stroller-guides-c3.mjs --apply    # write D1
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/extend-stroller-guides-c3.mjs --respace  # rebuild ZH tail only
 *   node scripts/extend-stroller-guides-c3.mjs --verify   # assert a refreshed snapshot
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const APPLY = process.argv.includes("--apply");
const VERIFY = process.argv.includes("--verify");
const RESPACE = process.argv.includes("--respace");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();
const SNAPSHOT = "scripts/cms-snapshots/guides.json";

const EN_HEADING = "Late-2026 search language";
const ZH_HEADING = "年底检索用语与核验";

// diff-review:skip-begin
const FORBIDDEN_EN = [
  "we tested", "hands-on testing", "in our test group", "in our testing",
  "in our checks", "in our group", "backed by real testing", "test notes",
  "testing methodology", "lab test", "rig test", "independent safety testing",
  "lab-measured", "lab report", "lab data",
];
const FORBIDDEN_ZH = [
  "实测", "实验室", "测试方法", "本组", "台架测试", "应力测试",
  "连续疲劳测试", "第三方实测", "我们测试", "我们验证",
];
// diff-review:skip-end

/**
 * A "source note" in three grades. Only the high grade needs the full pointer
 * to primary sources; varying it per grade keeps 21 sections from collapsing
 * into one duplicated block.
 */
const SOURCE_NOTE = {
  en: {
    high: "Where a headline names a model, a material, a price or a safety notice, treat it as a pointer: go back to the maker's own specification sheet, the airline's current rule, or the regulator's own notice. This page does not restate third-party figures or recall conclusions.",
    mid: "Treat such phrases as pointers to a primary source — the maker's published sheet or the airline's current rule — rather than as figures this page confirms.",
    low: "Read them as the wording people search with; the concrete checks stay those in the sections above.",
  },
  zh: {
    high: "标题里出现的机型、材质、价位或安全公告，都只当线索：请回到厂商自己的规格表、航司现行规定或监管机构公告核对。本页不转述第三方的数字，也不替任何召回公告下结论。",
    mid: "这类说法只当作回到一手来源的线索——厂商公布的规格表或航司现行规定——本页不据此确认任何数字。",
    low: "把它们当作人们搜索时的措辞来读，具体要核对的项目仍以上文各节为准。",
  },
};

/** Six different prose frames, so the 21 sections do not read as one template. */
const FRAMES = {
  travel: {
    en: (c) => `${c.focusEn} Searches that now lead here tend to arrive as ${c.termsEn.map((q) => `\`${q}\``).join(", ")}. Those are search phrases, not figures this page publishes; the comparison above restates only what the listings themselves state.\n\n${c.checkEn}`,
    zh: (c) => `${c.focusZh}年底常见的检索说法有${c.termsZh}。这些是检索用语，不是本页给出的数字；上文的比较只重述各条信息已写明的内容。\n\n${c.checkZh}`,
  },
  age: {
    en: (c) => `${c.focusEn} Phrases such as ${c.termsEn.map((q) => `\`${q}\``).join(", ")} attach a date to a question about fit. A year tells you which listings were being discussed; it does not describe the child.\n\n${c.checkEn}`,
    zh: (c) => `${c.focusZh}像${c.termsZh}这样的说法，给「合不合适」加了个年份。年份说明当时讨论的是哪批商品，并不描述孩子本身。\n\n${c.checkZh}`,
  },
  scene: {
    en: (c) => `${c.focusEn} Season-and-use wording — ${c.termsEn.map((q) => `\`${q}\``).join(", ")} — describes a trip, not a capability claim. What the trip demands has to be matched against the dimensions and rules the guide already lists.\n\n${c.checkEn}`,
    zh: (c) => `${c.focusZh}${c.termsZh}这类带上季节与场景的说法，描述的是一次出行，不是能力承诺。出行到底要求什么，仍要回到本页已列出的尺寸与规定去对。\n\n${c.checkZh}`,
  },
  value: {
    en: (c) => `${c.focusEn} Price-and-bundle phrases like ${c.termsEn.map((q) => `\`${q}\``).join(", ")} change faster than any stroller spec, so the useful habit is to compare what is in the box at the price actually shown.\n\n${c.checkEn}`,
    zh: (c) => `${c.focusZh}${c.termsZh}这类带价位与套餐的说法，变得比任何推车规格都快，所以更有用的习惯是按实际看到的那个价格去比盒子里有什么。\n\n${c.checkZh}`,
  },
  year: {
    en: (c) => `${c.focusEn} A year in the query is a time window, not a model list. ${c.termsEn.map((q) => `\`${q}\``).join(", ")} are ways readers mark that window; this page does not turn them into a claim about any specific model.\n\n${c.checkEn}`,
    zh: (c) => `${c.focusZh}检索词里的年份是一个时间窗口，不是机型清单。${c.termsZh}是读者给这个窗口做标记的方式，本页不把它们变成对某个具体机型的说法。\n\n${c.checkZh}`,
  },
  care: {
    en: (c) => `${c.focusEn} Notice-and-care phrasing such as ${c.termsEn.map((q) => `\`${q}\``).join(", ")} points at a verification step rather than at a number.\n\n${c.checkEn}`,
    zh: (c) => `${c.focusZh}${c.termsZh}这类与公告、养护有关的说法，指向的是一次核对动作，不是一个数字。\n\n${c.checkZh}`,
  },
};

/**
 * slug -> frame + per-article copy. Terms come from the report's P0/P1 mapping
 * (section 4); they stay as SEARCH PHRASES, never as assertions.
 */
const ARTICLES = {
  "lightweight-travel-stroller": {
    frame: "travel", risk: "high",
    focusEn: "The word \"lightest\" does a lot of work in this guide: it compares what the listings state, not materials ranked against one another.",
    focusZh: "这篇里「最轻」承担了很重的分量：它比较的是各条信息写明的内容，不是替材料排高低。",
    termsEn: ["lightest travel stroller 2026", "carbon fiber travel stroller", "holiday flying stroller", "under 16 lb stroller"],
    termsZh: "「2026 最轻旅行推车」「碳纤维车架」「节日季登机推车」「16 磅以内」",
    checkEn: "Ask a seller to point to the line in the maker's own specification sheet that carries a weight or a frame material; a figure that appears only in a roundup is a different kind of statement.",
    checkZh: "请卖家指出厂商规格表里写着重量或车架材质的那一行；只出现在盘点文章里的数字，是另一种性质的说法。",
  },
  "compact-travel-stroller": {
    frame: "travel", risk: "low",
    focusEn: "Folded size is the one dimension a cabin-bag phrase cannot settle, because each carrier draws its own line.",
    focusZh: "折叠尺寸是「登机箱」这个说法回答不了的一项，因为每家航司划的线都不一样。",
    termsEn: ["cabin-size stroller 2026", "holiday flight stroller", "overhead bin stroller", "self-standing compact fold"],
    termsZh: "「2026 登机箱尺寸推车」「节日航班推车」「可放行李架」「折后自立」",
    checkEn: "Carry the folded dimensions to the airline's current rule rather than to a search result; \"overhead bin\" describes an intention, not a guarantee.",
    checkZh: "把折后尺寸拿去比对航司现行规定，而不是比对搜索结果；「可放行李架」描述的是打算怎么做，不是保证。",
  },
  "travel-stroller-for-toddler": {
    frame: "age", risk: "mid",
    focusEn: "A toddler query is really a fit question, and the age number is the roughest of the three inputs.",
    focusZh: "搜「幼儿推车」其实是在问合不合适，而年龄是几个输入里最粗的一个。",
    termsEn: ["holiday travel stroller for toddler", "travel stroller recall check 2026", "gate check stroller toddler", "JPMA certified travel stroller"],
    termsZh: "「节日季幼儿旅行推车」「2026 推车召回查询」「登机口托运」「JPMA 认证」",
    checkEn: "Read the age line as a filter and the harness and seat dimensions as the decision; when a certificate is mentioned, check the certificate itself.",
    checkZh: "把年龄当筛选，把安全带与座椅尺寸当决定；遇到认证字样，请回到证书本身核对。",
  },
  "travel-stroller-for-cruise": {
    frame: "scene", risk: "low",
    focusEn: "A cruise is a storage-and-sun problem before it is a stroller problem.",
    focusZh: "邮轮出行先是收纳与遮阳的问题，然后才是推车的问题。",
    termsEn: ["holiday cruise stroller", "UPF 50+ stroller canopy", "compact stroller for cruise cabin", "stroller for Christmas cruise"],
    termsZh: "「节日邮轮推车」「UPF 遮阳篷」「适合邮轮客舱的紧凑推车」「圣诞航次推车」",
    checkEn: "A canopy rating belongs to the product's own listing; cabin storage belongs to the operator's current rule, so keep those two checks separate.",
    checkZh: "遮阳等级要看商品自己页面怎么写，客舱收纳要看运营方现行规定，这两项核对要分开做。",
  },
  "travel-stroller-for-2-year-old": {
    frame: "age", risk: "mid",
    focusEn: "Two is an age, not a seat height, and the guide's fit checks are what decide whether the harness still works.",
    focusZh: "两岁是年龄，不是座高；真正决定安全带还合不合用的，是本页的适配核对。",
    termsEn: ["holiday travel stroller 2 year old", "stroller recall 2026 check", "5-point harness travel stroller"],
    termsZh: "「节日季两岁旅行推车」「2026 召回查询」「五点式安全带」",
    checkEn: "A recall phrase is a reason to look up a notice, not a conclusion to copy; the regulator's own notice is the only place that settles a model.",
    checkZh: "召回字样是去查公告的理由，不是可以照抄的结论；具体涉及哪个型号，只有监管机构的公告能定。",
  },
  "best-travel-stroller-for-3-year-old": {
    frame: "age", risk: "mid",
    focusEn: "At three the question shifts from recline to capacity, which is why a year alone cannot pick the frame.",
    focusZh: "到三岁，问题从靠背角度转向承重，所以单看年份挑不出车架。",
    termsEn: ["best travel stroller 2026 for 3 year old", "Black Friday stroller deal", "budget travel stroller 2026"],
    termsZh: "「2026 三岁旅行推车」「黑五推车优惠」「平价旅行推车」",
    checkEn: "A deal phrase is seasonal and a capacity figure is permanent; confirm the latter in the maker's sheet before comparing the former.",
    checkZh: "优惠字样有季节，承重数字是长期参数；比价之前，先在厂商规格表里确认后者。",
  },
  "stroller-travel-airplane": {
    frame: "travel", risk: "low",
    focusEn: "Air travel has two separate questions — what fits and what the carrier allows — and they are answered in different places.",
    focusZh: "坐飞机其实是两个问题：放不放得下、航司让不让带，答案在两个不同的地方。",
    termsEn: ["IATA-compatible stroller 2026", "holiday flying stroller", "gate check vs overhead bin", "airline stroller size rules 2026"],
    termsZh: "「符合登机尺寸的推车」「节日航班推车」「登机口托运与行李架」「航司尺寸规定」",
    checkEn: "Keep the manufacturer's folded dimensions in one hand and the airline's current rule in the other; this guide does not merge them into a single size.",
    checkZh: "一手拿厂商公布的折后尺寸，一手拿航司现行规定；本页没有把两者并成一个统一尺寸。",
    lowNote: true,
  },
  "best-travel-stroller-2026": {
    frame: "year", risk: "high",
    focusEn: "The title carries a year, so this page is read as a roundup of what is current — but a roundup is not a model registry.",
    focusZh: "标题里带着年份，读者容易把它当成当季机型清单；但盘点是盘点，不是机型登记册。",
    termsEn: ["2026 travel stroller models", "Black Friday travel stroller deal 2026", "lightest travel stroller 2026", "carbon fiber travel stroller"],
    termsZh: "「2026 旅行推车机型」「黑五旅行推车优惠」「2026 最轻旅行推车」「碳纤维车架」",
    checkEn: "A model name in a headline is a pointer to the maker's own sheet, and a weight quoted from another site stays that site's figure, not this page's.",
    checkZh: "标题里的机型名是回到厂商规格表的线索；从别处引用的重量仍是别处的数字，不是本页给出的。",
  },
  "graco-modes-pramette-travel-system": {
    frame: "value", risk: "mid",
    focusEn: "A travel system is bought as a bundle, so the useful comparison is what the box contains at the price shown.",
    focusZh: "旅行系统是按套餐买的，所以真正有用的比较，是在看到的那个价格下盒子里有什么。",
    termsEn: ["2026 travel system stroller", "JPMA certified travel system", "Black Friday travel system deal"],
    termsZh: "「2026 旅行系统」「JPMA 认证」「黑五旅行系统优惠」",
    checkEn: "Bundle names differ between listings, and a certificate phrase should be checked against the certificate rather than the headline.",
    checkZh: "不同页面的套餐名并不一致；认证字样请对着证书核，不要对着标题核。",
  },
  "stroller-newborn-picks": {
    frame: "age", risk: "mid",
    focusEn: "For a newborn the load-bearing question is the recline position, and \"from birth\" is a phrase that needs a specification behind it.",
    focusZh: "对新生儿来说，真正吃重的问题是平躺角度；「出生即可用」这个说法，背后得有一条规格支撑。",
    termsEn: ["lie-flat stroller 2026", "from-birth travel stroller", "JPMA certified newborn stroller", "newborn pack vs bassinet"],
    termsZh: "「2026 可平躺推车」「出生即可用的旅行推车」「JPMA 认证」「新生儿套件与睡篮」",
    checkEn: "Ask which mode the maker actually states as suitable from birth, and read the bundle contents before treating a package name as a feature.",
    checkZh: "先问厂商写明的是哪一种模式适用于新生儿，再看清套餐内容，别把套餐名直接当成功能。",
  },
  "how-to-choose-the-perfect-baby-stroller": {
    frame: "value", risk: "low",
    focusEn: "This is the general buyer's page, so the seasonal phrases that land here are best used as a checklist of what to verify, not as a new ranking.",
    focusZh: "这是总纲页，落到这里的季节性说法，最适合当成「要核对什么」的清单，而不是一份新排名。",
    termsEn: ["how to choose a stroller 2026", "stroller recall check before buying", "JPMA ASTM CPSC stroller standard", "holiday travel stroller checklist"],
    termsZh: "「2026 怎么选推车」「下单前查召回」「推车标准」「节日出行核对清单」",
    checkEn: "Standards and notices have primary sources; a checklist that points there is more durable than one that repeats a headline.",
    checkZh: "标准和公告都有一手来源；把核对清单指向那里，比照抄标题更经得起时间。",
  },
  "stroller-double-twins": {
    frame: "scene", risk: "mid",
    focusEn: "A double is a width question before it is a feature question, and holiday wording says nothing about either.",
    focusZh: "双人推车先问宽度、再问功能，而节日季的措辞对这两项都没给信息。",
    termsEn: ["best double stroller 2026 for twins", "Black Friday double stroller deal", "side by side vs tandem 2026"],
    termsZh: "「2026 双胞胎双人推车」「黑五双人推车优惠」「并排与前后」",
    checkEn: "Compare the stated width and folded size against the doorways and car trunk you actually use; those dimensions are in the listings, not in the season.",
    checkZh: "把标称宽度与折后尺寸，拿去和自家门宽、后备箱比对；这些尺寸写在商品信息里，不写在季节里。",
  },
  "stroller-travel-system": {
    frame: "value", risk: "mid",
    focusEn: "A system versus a separate stroller and car seat is a compatibility question, and adapters are where the two answers diverge.",
    focusZh: "整套系统还是推车加安全座椅分开买，本质是适配问题，而分流点往往在转接件上。",
    termsEn: ["2026 travel system vs separate", "JPMA certified travel system", "infant car seat adapter recall check"],
    termsZh: "「整套与分开买」「JPMA 认证」「提篮转接件召回查询」",
    checkEn: "An adapter notice is model-specific, so check the regulator's own notice for the exact adapter rather than applying a general phrase to the whole category.",
    checkZh: "转接件公告是按型号发的，请到监管机构公告里查具体那一个，别把泛泛的说法套到整个品类上。",
  },
  "stroller-under-200": {
    frame: "value", risk: "mid",
    focusEn: "A price ceiling is a filter, not a quality grade; the useful part is which checks still apply inside that band.",
    focusZh: "价格上限是筛选条件，不是质量等级；有用的是在这个价位带里，哪些核对仍然要做。",
    termsEn: ["Black Friday stroller deal under $200", "best stroller under 200 November 2026", "ASTM CPSC compliant budget stroller"],
    termsZh: "「黑五百元档推车优惠」「2026 十一月平价推车」「符合标准的平价推车」",
    checkEn: "A price changes by the day, while the standard a seller cites should be verifiable in a certificate; keep those two checks in that order.",
    checkZh: "价格天天变，而卖家引用的标准应当能在证书里查到；这两项核对按这个先后顺序做。",
  },
  "stroller-safety-tips": {
    frame: "care", risk: "high",
    focusEn: "Safety wording is where a date matters most, because a notice is about a specific model at a specific time.",
    focusZh: "安全相关的说法最怕带错日期，因为公告针对的是某个时间、某个具体型号。",
    termsEn: ["stroller recall 2026", "is there a stroller recall right now", "CPSC stroller safety standard", "5-point harness check"],
    termsZh: "「2026 推车召回」「当前是否有召回」「推车安全标准」「五点式安全带核对」",
    checkEn: "A recall phrase can only be settled in the regulator's own notice, and a standard phrase only in the certificate the seller can produce; neither belongs in a headline.",
    checkZh: "召回字样只有监管机构公告能定，标准字样只有卖家能出示的证书能定；两者都不该只靠标题下判断。",
  },
  "stroller-all-terrain": {
    frame: "scene", risk: "low",
    focusEn: "\"All terrain\" describes a surface, so the phrases readers add to it are really questions about wheels, canopy and where the trip happens.",
    focusZh: "「全地形」描述的是路面，所以读者往上加的那些说法，其实是在问轮胎、遮阳和出行地点。",
    termsEn: ["all terrain stroller 2026", "UPF 50+ canopy stroller", "holiday outdoor stroller", "ASTM certified all terrain stroller"],
    termsZh: "「2026 全地形推车」「UPF 遮阳篷」「节日户外推车」「符合标准的全地形推车」",
    checkEn: "Tire type and canopy coverage are listing fields; a certification phrase is a document check. Keep the two beside each other, not merged.",
    checkZh: "轮胎类型与遮阳覆盖是商品信息里的字段，认证字样则要查文件；两项并排看，别混成一项。",
  },
  "stroller-jogging-guide": {
    frame: "scene", risk: "mid",
    focusEn: "Jogging adds a use case with its own constraints, and a year in the query does not change what a fixed front wheel means.",
    focusZh: "慢跑是附加了约束的使用场景，检索词里带年份，并不会改变固定前轮意味着什么。",
    termsEn: ["best jogging stroller 2026", "JPMA certified jogging stroller", "jogging stroller recall check", "5-point harness jogging stroller"],
    termsZh: "「2026 慢跑推车」「JPMA 认证」「慢跑推车召回查询」「五点式安全带」",
    checkEn: "Wheel configuration belongs to the specification sheet and a notice belongs to the regulator; neither should be inferred from a seasonal phrase.",
    checkZh: "轮子结构看规格表，公告看监管机构；都不该从季节性措辞里推出来。",
  },
  "best-jogger-stroller-2026": {
    frame: "year", risk: "mid",
    focusEn: "This title promises a year, so readers expect a current shortlist — but the checks that make a jogger usable do not change with the calendar.",
    focusZh: "标题承诺了年份，读者自然期待当季清单；但决定慢跑车能不能用的那些核对，不随日历变化。",
    termsEn: ["2026 jogging stroller models", "Black Friday jogger stroller deal", "lightweight jogging stroller 2026"],
    termsZh: "「2026 慢跑推车机型」「黑五慢跑推车优惠」「轻量慢跑推车」",
    checkEn: "A deal and a wheel specification expire on different schedules; confirm the latter in the maker's sheet before weighing the former.",
    checkZh: "优惠和轮子规格的时效完全不同；掂量前者之前，先在厂商规格表里确认后者。",
  },
  "best-double-stroller-2026": {
    frame: "year", risk: "mid",
    focusEn: "For a double, the year in the query mostly marks a shopping window; the width and folded size stay the deciding numbers.",
    focusZh: "对双人推车来说，检索词里的年份主要标记购物窗口，宽度与折后尺寸仍是决定性的数字。",
    termsEn: ["2026 double stroller models", "holiday double stroller", "Black Friday double stroller", "cabin-size double stroller"],
    termsZh: "「2026 双人推车机型」「节日双人推车」「黑五双人推车」「登机箱尺寸双人推车」",
    checkEn: "\"Cabin size\" for a double is especially worth checking against a carrier's current rule, because it is the phrase least likely to survive a folded-size comparison.",
    checkZh: "双人车的「登机箱尺寸」尤其该拿航司现行规定核一遍，因为这个说法最经不起折后尺寸的比对。",
  },
  "stroller-how-to-clean": {
    frame: "care", risk: "low",
    focusEn: "Cleaning advice becomes seasonal only after a trip, and the season changes the timing, not the fabric instructions.",
    focusZh: "清洁建议之所以带季节，是因为出行之后才用得上；变的是时机，不是面料说明。",
    termsEn: ["post-holiday stroller cleaning", "OEKO-TEX stroller fabric care", "stroller maintenance after travel"],
    termsZh: "「节后推车清洁」「面料养护标识」「旅行后保养」",
    checkEn: "Care labels and any fabric claim live on the product itself; a seasonal phrase only tells you when to read them.",
    checkZh: "洗护标识和面料说明都在商品本身上；季节性说法只提醒你什么时候去读它。",
  },
  "stroller-umbrella-vs-full": {
    frame: "value", risk: "mid",
    focusEn: "An umbrella-versus-full comparison is a fold-and-storage trade-off, and a material phrase should not be allowed to decide it on its own.",
    focusZh: "伞车与全尺寸推车的比较，本质是折叠与收纳的取舍，不该让一个材质说法单独替你决定。",
    termsEn: ["umbrella vs full size stroller 2026", "carbon fiber umbrella stroller", "holiday travel umbrella stroller", "one-hand fold umbrella stroller"],
    termsZh: "「2026 伞车与全尺寸」「碳纤维伞车」「节日出行伞车」「单手收折伞车」",
    checkEn: "Folded dimensions and one-hand operation are listing fields; a material name needs the maker's own sheet before it can carry a weight claim.",
    checkZh: "折后尺寸与单手收折是商品信息里的字段；材质名称要有厂商规格表支撑，才谈得上承重说法。",
  },
};

/**
 * graco's zh.content is 103 characters (en 2068). This is a faithful Chinese
 * restatement of THAT article's OWN published body — no new facts, no outside
 * figures. It lands before the C#3 section so the two are a single write.
 */
const GRACO_ZH = `## Graco Modes Pramette 是什么

Graco Modes Pramette 旅行系统把推车车架与婴儿安全座椅配成一套，一次购买覆盖从新生儿到幼儿的阶段。厂商标明三种模式：婴儿提篮载体（安全座椅直接卡上车架）、婴儿平躺推车（给新生儿的平躺位置）与幼儿推车（可朝家长或朝外，供月龄较大的宝宝使用）。

## 关键规格一览

- 标价：约 274–290 美元，取决于随附的 SnugRide 套餐
- 推车重量：配 SnugRide 35 套餐为 15.25 磅，配 SnugRide LX 套餐为 20.9 磅
- 随附座椅：Graco SnugRide 婴儿安全座椅
- 适用年龄：家长推行约 6 个月至 3 岁，新生儿阶段由提篮覆盖
- 买家反馈：主零售页面约 4.6 星、约 6900 条评分

## 适合谁

想要一套系统、而不是分别买推车和汽车安全座椅的家庭，且大多在人行道与平整路面推行。平躺模式是这套系统的差异点：同价位的多数旅行系统只提供提篮载体与幼儿推车两种模式，想要新生儿平躺通常得另买睡篮。

## 下单前要确认的几件事

1. 车椅适配。确认随附的 SnugRide 型号能装进自家车的安全带或 LATCH 固定路径；按具体车型、配置与座位排数核对。
2. 套餐内容。不同页面的清单不一样：有的附 SnugRide 35，有的附 SnugRide LX，少数再加一个底座。按实际看到的价格比对盒内物品。
3. 重量与折叠。15–21 磅的车架比轻便伞车重；如果常坐飞机或通勤搭火车，请和更轻的替代款比较。
4. 航司规定。旅行系统有的在登机口托运、有的随行李托运，出发前先查承运航司的现行规定。

## 关于本页的评分口径

本页的评分把已公布的规格与公开买家反馈汇总在一起，属于编辑整理，不补充未公布的结论。上面的价格、重量与评分都照录本页已列出的信息，不从别处引入新数字。`;

function enSection(slug) {
  const c = ARTICLES[slug];
  return `## ${EN_HEADING}\n\n${FRAMES[c.frame].en(c)} ${SOURCE_NOTE.en[c.risk]}`;
}
function zhSection(slug) {
  const c = ARTICLES[slug];
  // Chinese prose is joined without half-width spaces; the source note is its
  // own paragraph so a re-space pass can rebuild the tail unambiguously.
  return `## ${ZH_HEADING}\n\n${FRAMES[c.frame].zh(c)}\n\n${SOURCE_NOTE.zh[c.risk]}`;
}

function zhExtra(slug) {
  return slug === "graco-modes-pramette-travel-system" ? GRACO_ZH : "";
}

/** Long ASCII runs are deleted by sanitizeGuideTextForZh() on hydration. */
function longestAsciiRun(text) {
  let best = 0;
  for (const run of String(text).match(/[A-Za-z0-9'&/.,;:()\- \t]+/g) || []) best = Math.max(best, run.length);
  return best;
}

function scanText(slug, lang, text) {
  const bad = (lang === "en" ? FORBIDDEN_EN : FORBIDDEN_ZH)
    .filter((p) => text.toLowerCase().includes(p.toLowerCase()));
  if (bad.length) return `${slug}/${lang} forbidden phrase(s): ${bad.join(", ")}`;
  if (lang === "zh" && longestAsciiRun(text) >= 30) return `${slug}/zh contains an ASCII run >= 30 (zh sanitiser would delete it)`;
  if (lang === "zh") {
    const latin = (text.match(/[A-Za-z]/g) || []).length;
    const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    if (latin >= 60 && cjk < latin * 0.12) return `${slug}/zh is mostly English (cjk=${cjk}, latin=${latin})`;
  }
  return null;
}

/** 8-gram Jaccard: catches a template collapse without punishing shared framing. */
function ngrams(text, n = 8) {
  const words = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  const set = new Set();
  for (let i = 0; i + n <= words.length; i++) set.add(words.slice(i, i + n).join(" "));
  return set;
}

function selfCheck() {
  const failures = [];
  const sets = new Map();
  for (const slug of Object.keys(ARTICLES)) {
    for (const [lang, text] of [["en", enSection(slug)], ["zh", zhSection(slug)]]) {
      const err = scanText(slug, lang, text);
      if (err) failures.push(err);
    }
    const zhExtraText = zhExtra(slug);
    if (zhExtraText) {
      const err = scanText(slug, "zh", zhExtraText);
      if (err) failures.push(err);
    }
    sets.set(slug, ngrams(enSection(slug)));
  }
  const slugs = [...sets.keys()];
  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      const a = sets.get(slugs[i]), b = sets.get(slugs[j]);
      let shared = 0;
      for (const g of a) if (b.has(g)) shared++;
      const ratio = shared / Math.max(1, Math.min(a.size, b.size));
      if (ratio > 0.6) failures.push(`${slugs[i]} / ${slugs[j]} EN sections are too similar (8-gram Jaccard ${ratio.toFixed(2)})`);
    }
  }
  return failures;
}

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

function readSnapshotRecords() {
  const raw = readFileSync(SNAPSHOT, "utf8");
  return unwrap(JSON.parse(raw)) || [];
}

/** --verify: assert a freshly built snapshot carries the C#3 sections. */
function verify() {
  const records = readSnapshotRecords();
  const failures = [];
  let found = 0;
  for (const [slug, c] of Object.entries(ARTICLES)) {
    const r = records.find((x) => x.slug === slug);
    if (!r) { failures.push(`missing in snapshot: ${slug}`); continue; }
    const en = String(r.en?.content || ""), zh = String(r.zh?.content || "");
    if (!en.includes(`## ${EN_HEADING}`)) failures.push(`${slug}: EN heading absent`);
    if (!zh.includes(`## ${ZH_HEADING}`)) failures.push(`${slug}: ZH heading absent`);
    const sectionEn = enSection(slug), sectionZh = zhSection(slug);
    if (!en.includes(sectionEn.trim())) failures.push(`${slug}: EN section text drifted`);
    if (!zh.includes(sectionZh.trim())) failures.push(`${slug}: ZH section text drifted`);
    if (slug === "graco-modes-pramette-travel-system" && !zh.includes(GRACO_ZH.trim())) failures.push(`${slug}: Chinese body missing`);
    if (c && String(r.taxonomy?.productCategory) !== "stroller") failures.push(`${slug}: category changed`);
    found++;
  }
  const graco = records.find((x) => x.slug === "graco-modes-pramette-travel-system");
  if (graco && String(graco.zh?.content || "").length < 800) {
    failures.push(`graco zh body still thin (${String(graco.zh?.content || "").length} chars)`);
  }
  if (failures.length) {
    console.error(`check:c3 FAILED (${failures.length})`);
    for (const f of failures.slice(0, 30)) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`check:c3 OK — ${found}/21 stroller guides carry EN+ZH C#3 sections; graco zh body ${String(graco?.zh?.content || "").length} chars`);
}

/**
 * Rebuild only the appended Chinese tail from the current template. Used once
 * after the first apply removed half-width spaces between Chinese sentences.
 * The EN body, seo, taxonomy, status and everything before the C#3 heading are
 * left byte-identical.
 */
async function respace(records) {
  let ok = 0;
  for (const slug of Object.keys(ARTICLES)) {
    const r = records.find((x) => x.slug === slug);
    if (!r) { console.error(`[FAIL] missing record: ${slug}`); process.exitCode = 1; continue; }
    const zh = String(r.zh?.content || "");
    const at = zh.indexOf(`## ${ZH_HEADING}`);
    if (at < 0) { console.log(`[skip] ${slug} — no C#3 tail`); continue; }
    const head = zh.slice(0, at);
    const nextZh = `${head}${zhSection(slug)}`;
    if (nextZh === zh) { console.log(`[ok] ${slug} already clean`); ok++; continue; }

    const next = { ...r, zh: { ...r.zh, content: nextZh }, updatedAt: new Date().toISOString() };
    const invariants = {
      seo: JSON.stringify(next.seo ?? null) === JSON.stringify(r.seo ?? null),
      en: next.en.content === r.en.content,
      head: next.zh.content.startsWith(head),
      gracoBody: slug !== "graco-modes-pramette-travel-system" || next.zh.content.includes(GRACO_ZH.trim()),
    };
    const fails = Object.entries(invariants).filter(([, v]) => !v).map(([k]) => k);
    if (fails.length) { console.error(`[FAIL] ${slug} invariants: ${fails.join(",")}`); process.exitCode = 1; continue; }

    const saved = await request(`/api/cms/guides/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!saved?.data?.saved) { console.error(`[FAIL] ${slug} save: ${JSON.stringify(saved).slice(0, 200)}`); process.exitCode = 1; }
    else { ok++; console.log(`[respace] ${slug}`); }
  }
  console.log(`respace: ${ok}/${Object.keys(ARTICLES).length} guide(s).`);
}

async function main() {
  if (VERIFY) return verify();

  const localFailures = selfCheck();
  if (localFailures.length) {
    console.error(`Refusing to write — ${localFailures.length} copy problem(s):`);
    for (const f of localFailures.slice(0, 30)) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`copy self-check OK — ${Object.keys(ARTICLES).length} sections, 6 frames, no forbidden claims, no zh ASCII runs, no collapsed template`);

  if (!TOKEN) { console.error("CMS_ADMIN_ALL_TOKEN is required for dry run / apply."); process.exit(1); }

  const payload = await request(`/api/cms/guides?cb=${Date.now()}`);
  const records = unwrap(payload);
  if (!records) { console.error("Unexpected CMS response shape"); process.exit(1); }
  console.log(`CMS guides: ${records.length}`);
  if (RESPACE) return respace(records);

  const planned = [];
  for (const slug of Object.keys(ARTICLES)) {
    const r = records.find((x) => x.slug === slug);
    if (!r) { console.error(`[FAIL] missing record: ${slug}`); process.exitCode = 1; continue; }
    if (r.status !== "published" || String(r.taxonomy?.productCategory) !== "stroller") {
      console.error(`[FAIL] ${slug} is not a published stroller guide`); process.exitCode = 1; continue;
    }
    const en = String(r.en?.content || ""), zh = String(r.zh?.content || "");
    if (en.includes(`## ${EN_HEADING}`) || zh.includes(`## ${ZH_HEADING}`)) {
      console.log(`[skip] ${slug} — C#3 sentinel already present`);
      continue;
    }
    const extra = zhExtra(slug);
    const next = {
      ...r,
      en: { ...r.en, content: `${en.trimEnd()}\n\n${enSection(slug)}` },
      zh: { ...r.zh, content: `${zh.trimEnd()}\n\n${extra ? `${extra}\n\n` : ""}${zhSection(slug)}` },
      updatedAt: new Date().toISOString(),
    };
    if (JSON.stringify(next.seo ?? null) !== JSON.stringify(r.seo ?? null)) {
      console.error(`[FAIL] ${slug} seo would change — aborting`); process.exitCode = 1; continue;
    }
    if (!next.en.content.startsWith(en.trimEnd()) || !next.zh.content.startsWith(zh.trimEnd())) {
      console.error(`[FAIL] ${slug} original body not preserved — aborting`); process.exitCode = 1; continue;
    }
    planned.push({ slug, before: r, next });
    console.log(`[plan] ${slug.padEnd(42)} EN +${enSection(slug).split(/\s+/).length}w  ZH +${(extra.length + zhSection(slug).length)} chars${extra ? "  (incl. Chinese body)" : ""}`);
  }

  if (process.exitCode) { console.error("Plan aborted; nothing written."); process.exit(1); }
  if (!planned.length) { console.log("Nothing to do — all 21 guides already carry C#3."); return; }

  if (!APPLY) {
    console.log(`Dry run: ${planned.length} guide(s) would change. Re-run with --apply.`);
    return;
  }

  const backupDir = join(process.cwd(), ".workbuddy", "tmp", "stroller-c3");
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
    if (!saved?.data?.saved) {
      console.error(`[FAIL] ${slug} save response: ${JSON.stringify(saved).slice(0, 200)}`);
      process.exitCode = 1;
    } else { ok++; console.log(`[ok] ${slug}`); }
  }
  console.log(`Applied ${ok}/${planned.length} guide(s).`);
}

main().catch((err) => { console.error(err); process.exit(1); });
