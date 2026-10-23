/**
 * /kids-tricycle-what-buyers-say/ — the buyer-signal view of the tricycle cluster.
 *
 * This site holds no verbatim customer reviews, only the retailer-written
 * "customers say" summary each listing carries. Ten of the eleven tricycles have
 * one; the eleventh, the near-empty duplicate, has none. The page counts what is
 * actually in those summaries rather than pretending to quote reviewers.
 *
 * Two patterns survive the summary text. First, every single summary praises how
 * easy the trike is to assemble — a uniform claim that says more about the
 * category's copy than about any one product. Second, the ratings are crushed
 * into a 4.5–4.7 band, so the stars cannot distinguish a trike; the summaries
 * can, but only on the points parents raise (sturdiness, value, light-up wheels).
 */
import { MessageSquare, Star, Tags, AlertTriangle, Table2 } from "lucide-react";
import { TRICYCLE_DATASET } from "./tricycleData.generated";
import { clusterLabel } from "../components/ClusterAssetPage";

export { TRICYCLE_DATASET };
export const KIDS_TRICYCLE_FEEDBACK_PATH = "/kids-tricycle-what-buyers-say/";

const d = TRICYCLE_DATASET;
const total = d.totals.tricycles;

type TRow = typeof TRICYCLE_DATASET.rows[number];

const summaryRows = d.rows.filter((r) => (r.customersSay || "").trim().length > 0);

function countTheme(needle: RegExp): number {
  return summaryRows.filter((r) => needle.test(r.customersSay)).length;
}

const assemblyCount = countTheme(/assembl/i);
const sturdyCount = countTheme(/sturdy|sturdiness|durab|build quality/i);
const valueCount = countTheme(/value|worth the price/i);
const lightUpCount = countTheme(/light[- ]?up|wheels that light/i);
const mixedCount = countTheme(/mixed/i);

const ratingTally: Record<string, number> = {};
for (const r of summaryRows) {
  if (r.rating == null) continue;
  ratingTally[String(r.rating)] = (ratingTally[String(r.rating)] || 0) + 1;
}
const ratingEntries = Object.entries(ratingTally)
  .map(([r, c]) => ({ rating: r, count: c }))
  .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

const totalReviews = summaryRows.reduce(
  (s, r) => s + (r.reviewCount != null ? (r.reviewCount as number) : 0),
  0
);

const themes = [
  { theme: "Easy to assemble", count: assemblyCount, labels: "all rated summaries" },
  { theme: "Sturdy / durable", count: sturdyCount, labels: "build and materials" },
  { theme: "Good value", count: valueCount, labels: "price versus quality" },
  { theme: "Light-up wheels", count: lightUpCount, labels: "fun features" },
];

export const kidsTricycleFeedbackVars = {
  total,
  withSummary: summaryRows.length,
  withRating: d.totals.withRating,
  withReviewCount: d.totals.withReviewCount,
  ratingEntries,
  totalReviews,
  themes,
  mixedCount,
};

export interface TricycleFeedbackStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  ratingTitle: string;
  ratingLead: string;
  ratingNote: string;
  themeTitle: string;
  themeIntro: string;
  themeColTopic: string;
  themeColCount: string;
  themeColWho: string;
  hedgeTitle: string;
  hedgeLead: string;
  hedgeColKind: string;
  hedgeColCount: string;
  hedgeColWho: string;
  hedgeMixed: string;
  hedgeMissing: string;
  gapTitle: string;
  gapLead: string;
  gapNoSummary: string;
  gapNoText: string;
  listingTitle: string;
  listingLead: string;
  colBrand: string;
  colModel: string;
  colRating: string;
  colReviews: string;
  colSummary: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsTricycleFeedbackStrings: Record<"en" | "zh", TricycleFeedbackStrings> = {
  en: {
    eyebrow: "Plan-B asset · buyer signals",
    navLabel: "Buyer says",
    h1: `What Buyers Say About Tricycles: ${total} Listings`,
    lead: `This site keeps no verbatim reviews — only the retailer-written "customers say" line each listing carries. ${summaryRows.length} of the ${total} tricycles have one; the remaining ${total - summaryRows.length} is the near-empty duplicate that omits it. The page counts what those summaries actually contain rather than quoting reviewers we do not hold.`,
    ratingTitle: "Ratings across the range",
    ratingLead: `The stars are too tight to pick a winner.`,
    ratingNote: `All ${d.totals.withRating} rated trikes land between 4.5 and 4.7 stars, and together their ${totalReviews.toLocaleString()} reviews are dominated by two products. A parent cannot use the rating to choose; the summaries are where the real differences show.`,
    themeTitle: "Themes in what buyers write",
    themeIntro: `Four phrases scanned across the ${summaryRows.length} summaries.`,
    themeColTopic: "Theme",
    themeColCount: "Count",
    themeColWho: "Appears in",
    hedgeTitle: "The hedges buyers add",
    hedgeLead: `Where the praise is qualified.`,
    hedgeColKind: "Kind",
    hedgeColCount: "Count",
    hedgeColWho: "Appears in",
    hedgeMixed: `Mixed durability`,
    hedgeMissing: `No summary at all`,
    gapTitle: "What the summaries cannot tell you",
    gapLead: `Two limits of the retailer-written line.`,
    gapNoSummary: `${total - summaryRows.length} trike has no summary, so it contributes nothing to any theme count and cannot be compared on buyer experience.`,
    gapNoText: `The summaries are retailer-edited copy, not raw reviews, so they never contain complaints the seller would not print; "mixed durability" is the closest they come to a caveat.`,
    listingTitle: "Every trike, with its buyer signal",
    listingLead: `Sorted by rating. The summary column is the retailer's line, trimmed.`,
    colBrand: "Brand",
    colModel: "Model",
    colRating: "Rating",
    colReviews: "Reviews",
    colSummary: "Customers say",
    notStated: "not stated",
    methodTitle: "Method: counting word themes in retailer summaries",
    methodBody: [
      `Source: the CMS product snapshot, gated to the id namespace kids_tricycles-* with category "kids_tricycles" — ${total} in-stock tricycles, ${summaryRows.length} with a non-empty customersSay.`,
      `Theme counts are case-insensitive scans of the summary text for a small set of phrases (assemble, sturdy/durable, value, light-up); a summary is counted once per theme it contains.`,
      `Ratings and review counts are the retailer's own figures; the ${total - d.totals.withRating} listing with neither is the empty duplicate.`,
      `No verbatim review text is held, so the themes describe the retailer's paraphrase of buyers, not direct quotations.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 买家信号",
    navLabel: "买家说",
    h1: `买家怎么看三轮车：${total} 个 listing`,
    lead: `本站没有逐条评论原文——只有每个 listing 自带的零售商撰写「顾客说」一句。${total} 款中有 ${summaryRows.length} 款有这句；剩下 ${total - summaryRows.length} 款是几乎空白、省略了它的重复 listing。本页统计这些摘要实际包含什么，而非引用我们并未掌握的评论。`,
    ratingTitle: "各款的评分",
    ratingLead: `星标太集中，选不出赢家。`,
    ratingNote: `已评分的 ${d.totals.withRating} 款星标都在 4.5 到 4.7 之间，加起来 ${totalReviews.toLocaleString()} 条评论被两款产品主导。家长无法用评分来选；差异真正出现在摘要里。`,
    themeTitle: "买家文字里的主题",
    themeIntro: `在 ${summaryRows.length} 条摘要中扫描出的四类短语。`,
    themeColTopic: "主题",
    themeColCount: "次数",
    themeColWho: "出现在",
    hedgeTitle: "买家加上的保留",
    hedgeLead: `赞美在何处打了折扣。`,
    hedgeColKind: "类别",
    hedgeColCount: "次数",
    hedgeColWho: "出现在",
    hedgeMixed: `耐用性褒贬不一`,
    hedgeMissing: `完全没有摘要`,
    gapTitle: "摘要无法告诉你的事",
    gapLead: `零售商撰写这句的两处局限。`,
    gapNoSummary: `${total - summaryRows.length} 款没有摘要，因此它对任何主题计数都无贡献，也无法在买家体验上作比较。`,
    gapNoText: `摘要是经过零售商编辑的文案，而非原始评论，所以从不包含卖家不会印出的抱怨；「耐用性褒贬不一」是它们最接近保留意见的表述。`,
    listingTitle: "每一款车及其买家信号",
    listingLead: `按评分排序。摘要列为零售商的文字，已截断。`,
    colBrand: "品牌",
    colModel: "型号",
    colRating: "评分",
    colReviews: "评论",
    colSummary: "顾客说",
    notStated: "未说明",
    methodTitle: "方法：统计零售商摘要中的词主题",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 kids_tricycles-* 且 category 为 "kids_tricycles"，共 ${total} 款在售三轮车，其中 ${summaryRows.length} 款 customersSay 非空。`,
      `主题计数是对摘要文本的一组小短语（assemble、sturdy/durable、value、light-up）做不区分大小写的扫描；一条摘要在每个命中的主题中各计一次。`,
      `评分与评论数为零售商自有数字；两者皆无的那 ${total - d.totals.withRating} 款即空白重复款。`,
      `未掌握任何逐条评论原文，因此主题描述的是零售商对买家的转述，而非直接引语。`,
    ],
  },
};

export const kidsTricycleFeedbackColumns = (t: TricycleFeedbackStrings) => [
  {
    key: "brand",
    header: t.colBrand,
    render: (r: never) => (r as TRow).brand || t.notStated,
  },
  {
    key: "model",
    header: t.colModel,
    render: (r: never) => clusterLabel(r as never) || t.notStated,
  },
  {
    key: "rating",
    header: t.colRating,
    numeric: true,
    render: (r: never) => {
      const v = (r as TRow).rating;
      return v == null ? t.notStated : `${v}`;
    },
  },
  {
    key: "reviews",
    header: t.colReviews,
    numeric: true,
    render: (r: never) => {
      const v = (r as TRow).reviewCount;
      return v == null ? t.notStated : String(v);
    },
  },
  {
    key: "summary",
    header: t.colSummary,
    render: (r: never) => {
      const s = (r as TRow).customersSay;
      if (!s) return t.notStated;
      return s.length > 90 ? `${s.slice(0, 90)}…` : s;
    },
  },
];

export const kidsTricycleFeedbackIcons = {
  message: MessageSquare,
  star: Star,
  tags: Tags,
  gap: AlertTriangle,
  table: Table2,
};
