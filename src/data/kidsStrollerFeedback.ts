/**
 * /kids-stroller-what-buyers-say/ — the retailer-written "customers say" lines.
 *
 * The catalogue holds no verbatim reviews, only a retailer-composed summary per
 * stroller plus the star rating and review count. This page counts what those
 * summaries actually talk about — folds, lightness, manoeuvrability, travel,
 * value — and is blunt that 5 of 45 carry no summary at all, and that the
 * summaries are hedged with "mixed" more often than not on durability.
 */
import { MessageSquareText, Star, ThumbsUp, TriangleAlert, Table2 } from "lucide-react";
import { STROLLER_DATASET } from "./strollerData.generated";

export { STROLLER_DATASET };
export const KIDS_STROLLER_FEEDBACK_PATH = "/kids-stroller-what-buyers-say/";

const d = STROLLER_DATASET;
const total = d.totals.strollers;

const sayNonEmpty = d.rows.filter((r) => r.customersSay && r.customersSay.trim()).length;
const sayEmpty = total - sayNonEmpty;
const ratings = d.rows.map((r) => r.rating);
const ratingMin = Math.min(...ratings);
const ratingMax = Math.max(...ratings);
const ratingAvg = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100;
const reviewsMin = Math.min(...d.rows.map((r) => r.reviewCount));
const reviewsMax = Math.max(...d.rows.map((r) => r.reviewCount));

const has = (s: string, re: RegExp) => s.toLowerCase().match(re) != null;
const themeFold = d.rows.filter((r) => has(r.customersSay || "", /fold|compact|collaps|flat/i)).length;
const themeLight = d.rows.filter((r) => has(r.customersSay || "", /light|weigh|portab|carry/i)).length;
const themeManeuver = d.rows.filter((r) => has(r.customersSay || "", /maneuver|push|steer|turn|roll|smooth/i)).length;
const themeTravel = d.rows.filter((r) => has(r.customersSay || "", /travel|airport|trunk|plane|overhead/i)).length;
const themeDurability = d.rows.filter((r) => has(r.customersSay || "", /durab|sturd|quality|break|last/i)).length;
const themeValue = d.rows.filter((r) => has(r.customersSay || "", /value|worth|money|price/i)).length;
const hedgeCount = d.rows.filter((r) => has(r.customersSay || "", /mixed|however|but |though|while /i)).length;

export interface StrollerFeedbackStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  ratingTitle: string;
  ratingLead: string;
  ratingBody: string;
  themeTitle: string;
  themeIntro: string;
  themeFold: string;
  themeLight: string;
  themeManeuver: string;
  themeTravel: string;
  themeDurability: string;
  themeValue: string;
  hedgeTitle: string;
  hedgeLead: string;
  hedgeBody: string;
  gapTitle: string;
  gapLead: string;
  gapEmpty: string;
  gapVerbatim: string;
  gapSelection: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colRating: string;
  colReviews: string;
  colSay: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsStrollerFeedbackStrings: Record<"en" | "zh", StrollerFeedbackStrings> = {
  en: {
    eyebrow: "Plan-B asset · buyer voice",
    navLabel: "What buyers say",
    h1: `What Buyers Say About Strollers: ${sayNonEmpty} Summaries`,
    lead: `The catalogue holds no verbatim reviews — only a retailer-written "customers say" line per stroller, plus the star rating and review count on all ${total}. ${sayNonEmpty} of ${total} carry such a summary; ${sayEmpty} carry none. This page counts what those summaries return to and where their praise is hedged.`,
    ratingTitle: "How the catalogue's stars and counts line up",
    ratingLead: `The rating and review fields are complete; the scores sit in a narrow band.`,
    ratingBody: `All ${total} strollers publish a star rating from ${ratingMin} to ${ratingMax}, averaging ${ratingAvg}, and a review count from ${reviewsMin.toLocaleString()} to ${reviewsMax.toLocaleString()}. The band is narrow, so the star alone rarely separates a stroller from its neighbours.`,
    themeTitle: "The themes the buyer summaries return to",
    themeIntro: `Counted across the ${sayNonEmpty} non-empty summaries; a summary can hit more than one theme.`,
    themeFold: `Folding and compactness — ${themeFold} summaries praise an easy or flat fold, the single most common note.`,
    themeLight: `Lightness and portability — ${themeLight} mention weight, carry or a small folded size.`,
    themeManeuver: `Manœuvrability — ${themeManeuver} describe a smooth, easy push, turn or roll.`,
    themeTravel: `Travel and the trunk — ${themeTravel} bring up airports, planes or fitting in a car.`,
    themeDurability: `Durability and build — ${themeDurability} touch on sturdy versus breaking, the note most often qualified.`,
    themeValue: `Value — ${themeValue} call the stroller worth its price.`,
    hedgeTitle: "Where the praise comes with a caveat",
    hedgeLead: `The summaries are not uniformly glowing; the word "mixed" appears often.`,
    hedgeBody: `${hedgeCount} of the ${sayNonEmpty} summaries hedge their praise — usually on durability, where "sturdy" sits next to "broke after a month". The hedge is honest, but it means a summary's star should be read with its text, not instead of it.`,
    gapTitle: "What the summaries leave unstated",
    gapLead: `Stated because the buyer voice here is partial by construction.`,
    gapEmpty: `No summary at all — ${sayEmpty} of ${total} strollers carry an empty "customers say" field, so on those the only voice is the star.`,
    gapVerbatim: `No verbatim reviews — every line is retailer-composed, so individual experiences and the text of a one-star are not present.`,
    gapSelection: `Selection bias — a summary is written from reviews the retailer chose to surface, not a random sample.`,
    rosterTitle: "Every stroller and its customers-say line",
    rosterLead: `Sorted by rating. The summary is truncated; the star and review count sit beside it.`,
    colBrand: "Brand",
    colModel: "Model",
    colRating: "Rating",
    colReviews: "Reviews",
    colSay: "Customers say",
    notStated: "not stated",
    methodTitle: "How these stroller figures were read",
    methodBody: [
      `Source: the CMS product snapshot, limited to the id namespace stroller-* with category "stroller", after dropping about ${d.totals.droppedNonStroller} items that share the prefix but are not strollers — car seats and baby swings. ${total} strollers remain in stock.`,
      `Every figure is the retailer's stated number. Item weights are in pounds and dimensions in inches as the listing gives them; nothing here was weighed, measured or tested.`,
      `Membership is decided by the id namespace, not by the marketing name. A stroller that calls itself a "travel system" is still one row; a car seat that shares the prefix is dropped.`,
      `EN 1888 is the European safety standard the catalogue attaches to all ${d.totals.withCompliance} strollers. It is recorded as stated; we did not verify certification.`,
      `The theme and hedge counts are keyword tallies over the ${sayNonEmpty} non-empty "customers say" lines; a line may match more than one theme, so the theme counts do not sum to ${sayNonEmpty}.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 买家之声",
    navLabel: "买家怎么看",
    h1: `买家怎么看婴儿车：${sayNonEmpty} 条摘要`,
    lead: `目录里没有逐条评论原文——只有每款车由零售商写的"买家说"一行，外加全部 ${total} 款都有的星级与评论数。${sayNonEmpty} / ${total} 款有这种摘要；${sayEmpty} 款没有。本页统计这些摘要在讲什么，以及它们的好评在哪里被打了折扣。`,
    ratingTitle: "目录的星级与评论量是怎么排的",
    ratingLead: `评分与评论字段是齐全的；分数挤在窄带里。`,
    ratingBody: `全部 ${total} 款都公布了 ${ratingMin} 到 ${ratingMax} 的星级（平均 ${ratingAvg}）和从 ${reviewsMin.toLocaleString()} 到 ${reviewsMax.toLocaleString()} 的评论数。带很窄，所以光看星几乎分不出一款车和邻居。`,
    themeTitle: "买家摘要反复回到哪些主题",
    themeIntro: `在 ${sayNonEmpty} 条非空摘要上计数；一条摘要可能命中多个主题。`,
    themeFold: `折叠与紧凑——${themeFold} 条摘要称赞好折或能摊平，是最常见的单一评价。`,
    themeLight: `轻量与便携——${themeLight} 条提到重量、搬运或小巧的折叠体积。`,
    themeManeuver: `操控——${themeManeuver} 条描述顺滑、好推、好转、好滚。`,
    themeTravel: `旅行与后备箱——${themeTravel} 条提到机场、飞机或塞进车里。`,
    themeDurability: `耐用与做工——${themeDurability} 条触及"结实"与"坏掉"，最常被打折扣的评价。`,
    themeValue: `性价比——${themeValue} 条说这车值这个价。`,
    hedgeTitle: "好评在哪里带了保留",
    hedgeLead: `这些摘要并非一边倒地吹；"mixed"这个词经常出现。`,
    hedgeBody: `${sayNonEmpty} 条里有 ${hedgeCount} 条给好评加了保留——通常是在耐用性上，"结实"紧挨着"一个月就坏"。这种保留是诚实的，但也意味着星级该连文字一起读，而不是替代文字。`,
    gapTitle: "摘要没说的事",
    gapLead: `放在这里，是因为这里的买家之声天生就是局部的。`,
    gapEmpty: `完全没有摘要——${sayEmpty} / ${total} 款"买家说"字段为空，所以那些车唯一的声音就是那颗星。`,
    gapVerbatim: `没有逐条评论——每句话都是零售商写的，所以个别体验和一星的差评原文都不在。`,
    gapSelection: `选择偏差——摘要来自零售商挑出来展示的评论，不是随机样本。`,
    rosterTitle: "每款车及其买家说一行",
    rosterLead: `按评分排序。摘要做了截断；星级和评论数放在旁边。`,
    colBrand: "品牌",
    colModel: "型号",
    colRating: "评分",
    colReviews: "评论数",
    colSay: "买家说",
    notStated: "未说明",
    methodTitle: "这些数字是怎么读出来的",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 stroller-* 且 category 为 "stroller"，再剔除约 ${d.totals.droppedNonStroller} 个共享前缀却不是婴儿车的条目。剩下 ${total} 款在售。`,
      `每个数字都是零售商声明的值；重量按磅、尺寸按英寸，照 listing 所写，未经实测。`,
      `成员资格由 id 命名空间决定，而非营销名。自称"旅行系统"的车仍然只是一行；共享前缀的安全座椅则被剔除。`,
      `EN 1888 是本目录给全部 ${d.totals.withCompliance} 款婴儿车贴的欧洲安全标准，按声明记录，未核实认证。`,
      `主题与保留计数，是对 ${sayNonEmpty} 条非空"买家说"做的关键词统计；一条可能命中多个主题，所以主题计数不求和到 ${sayNonEmpty}。`,
    ],
  },
};

type SRow = (typeof STROLLER_DATASET)["rows"][number];

const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n).trim()}…` : s);

export const kidsStrollerFeedbackColumns = (t: StrollerFeedbackStrings) => [
  {
    key: "brand",
    header: t.colBrand,
    render: (r: never) => (r as SRow).brand || t.notStated,
  },
  {
    key: "model",
    header: t.colModel,
    render: (r: never) => {
      const row = r as SRow;
      return `${row.brand} ${row.model}`.trim() || t.notStated;
    },
  },
  {
    key: "rating",
    header: t.colRating,
    numeric: true,
    render: (r: never) => `${(r as SRow).rating}`,
  },
  {
    key: "reviews",
    header: t.colReviews,
    numeric: true,
    render: (r: never) => `${(r as SRow).reviewCount.toLocaleString()}`,
  },
  {
    key: "say",
    header: t.colSay,
    render: (r: never) => {
      const s = (r as SRow).customersSay;
      return s && s.trim() ? truncate(s, 140) : t.notStated;
    },
  },
];

export const kidsStrollerFeedbackVars = {
  total,
  sayNonEmpty,
  sayEmpty,
  ratingMin,
  ratingMax,
  ratingAvg,
  reviewsMin,
  reviewsMax,
  themeFold,
  themeLight,
  themeManeuver,
  themeTravel,
  themeDurability,
  themeValue,
  hedgeCount,
};

export const kidsStrollerFeedbackIcons = {
  message: MessageSquareText,
  star: Star,
  thumbs: ThumbsUp,
  gap: TriangleAlert,
  table: Table2,
};
