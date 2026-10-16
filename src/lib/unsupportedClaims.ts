/**
 * Stage-0 honesty guard (see plan-B-execution.md).
 *
 * CMS records still carry legacy copy ("lab-tested", "our lab", "we have
 * tested") describing measurement work this project never performed.
 *
 * This lives in src/ (not inside the prerender script) because both renderers
 * emit these strings: scripts/prerender-pages.ts scrubs the whole document,
 * and src/App.tsx must scrub the meta description it writes at runtime.
 * Keeping one copy is the difference between "the site stopped claiming it"
 * and "the crawler's copy stopped claiming it".
 */
const UNSUPPORTED_CLAIM_REWRITES: Array<[RegExp, string]> = [
  [/lab[\s-]?tested/gi, "evidence-based"],
  [/lab[\s-]?reviewed/gi, "source-reviewed"],
  [/lab[\s-]?verified/gi, "source-reviewed"],
  [/lab[\s-]?matrix/gi, "standards matrix"],
  [/lab[\s-]?measurements?/gi, "published specifications"],
  [/expert lab database/gi, "specification database"],
  [/lab database/gi, "specification database"],
  [/lab scores/gi, "source-based scores"],
  [/from our lab/gi, "from this category"],
  [/we have tested/gi, "we cover"],
  [/we test them/gi, "we compare them"],
  [/independent physical testing lab/gi, "independent analysis"],
  [/our lab checklist/gi, "our source checklist"],
  [/specs our lab extracts/gi, "specs we extract"],
  [/lab[\s-]?style/gi, "source-based"],
  // Hyphenated forms: `/transparency/certification-lab-notes/` must stay a
  // working URL, so nothing that sits directly after a hyphen is rewritten
  // (see the `(?<!-)` guard in sanitizeUnsupportedClaims).
  [/lab[- ]notes?\b(?!\/)/gi, "source notes"],
  [/lab[- ]best[- ]case/gi, "best-case"],
  [/lab score/gi, "source-based score"],
  [/full lab review/gi, "full source-based review"],
  [/lab reviews/gi, "source-based reviews"],
  // Stage-0 wave 4 (2026-10-16 dynamic-check fallout): the front-end copy layer
  // carried a second family of claims the dist scans could not see — dist is an
  // EN-only prerender, so zh copy and non-sanitized body copy were invisible.
  // These are the backstop for CMS writes; the source copy was rewritten the
  // same day (translate.ts legacy dictionaries, transparency pages, hub copy).
  // Ordered BEFORE the catch-all below so specific phrases get readable
  // replacements instead of "source-based" glued mid-sentence.
  [/lab recommendations for you/gi, "recommendations for you"],
  [/highest lab score/gi, "highest-scoring"],
  [/safety benchmark lab/gi, "safety benchmark"],
  [/benchmark lab/gi, "benchmark"],
  [/testing methodology/gi, "methodology"],
  [/rig fatigue tests?/gi, "spec-based analysis"],
  [/rig tests?/gi, "spec-based analysis"],
  [/lab inspection/gi, "inspection"],
  [/lab checklist/gi, "source checklist"],
  [/lab extracts/gi, "source extracts"],
  [/lab data/gi, "published data"],
  [/lab reports\b/gi, "reports"],
  [/lab report\b/gi, "report"],
  [/lab[\s-]?measured/gi, "manufacturer-published"],
  [/lab[\s-]?weight/gi, "listed weight"],
  [/laboratory scores/gi, "scores"],
  [/certified lab evaluation/gi, "specification-based evaluation"],
  [/mechanics lab/gi, "published specifications"],
  [/independent safety testing/gi, "spec-based comparisons"],
  // zh mirrors of the same family.
  [/实验室为您推荐/g, "为您推荐"],
  [/实验室最高分/g, "评分最高"],
  [/实验室数据/g, "公开数据"],
  [/实验室报告/g, "对比报告"],
  [/实验室评分/g, "评分"],
  [/实验室首选/g, "首选"],
  [/实验室测评/g, "深度测评"],
  [/实验室主推/g, "编辑精选"],
  [/安全基准实验室/g, "安全基准"],
  [/安全实验室/g, "安全标准"],
  [/测试方法/g, "方法论"],
  [/双盲实测/g, "多源交叉核对"],
  [/匿名采购/g, "公开资料"],
  [/自购样品检验/g, "公开资料核对"],
  [/自购样品/g, "公开资料"],
  [/台架测试/g, "规格分析"],
  // Honest negations must survive the 实测 catch-all below: "不是我们实测"
  // ("not measured by us") and "本页面没有任何数据是实测的" are disclaimers on
  // the asset pages, and rewriting them would invert their meaning. They run
  // first so the catch-all never sees the 实测 inside them.
  [/参数以实测为准/g, "参数以厂商公开规格为准"],
  [/不是我们实测/g, "不是我们测量的"],
  [/没有任何数据是实测的/g, "没有任何数据是我们测量的"],
  // Fallback for any remaining adjective use of the word. The lookahead keeps
  // the legacy /transparency/certification-lab-notes/ route readable, and the
  // "lab coat" phrase is figurative, not a measurement claim.
  [/\blab\b(?![-/])(?! coat)/gi, "source-based"],
  // Stage-1 honesty guard, second wave (2026-10-16 data audit): the cardSummary
  // template claimed hands-on testing ("Test notes:", "our test group",
  // "backed by real testing", zh "实测："), one evaluation claimed a "test pool"
  // and "independent hands-on testing", and one product description carried the
  // manufacturer's own "We tested". Scoring is published specs + aggregated
  // owner feedback (see /transparency/), so none of these may render. The CMS
  // data was bulk-rewritten the same day; these rules are the backstop.
  [/Test notes:/gi, "Spec highlights:"],
  [/in our test(?:ing| group)/gi, "in this category"],
  [/in our ([\w-]+) test group/gi, "for $1s"],
  [/in our group/gi, "in this category"],
  [/(?:in|of) our ([\w -]+?) field/gi, "among the $1s we scored"],
  [/\s*in our checks/gi, ""],
  [/backed by real testing/gi, "based on published specs and owner feedback"],
  [/in our test pool/gi, "in this comparison"],
  [/hands-on testing/gi, "published owner feedback"],
  [/we tested/gi, "the manufacturer tested"],
  [/delivered up to (\d+) minutes of ride time/gi, "is rated for up to $1 minutes of ride time"],
  // zh mirrors of the cardSummary template. The catch-all keeps a consumer
  // instruction ("下单前必须实测孩子头围" — measure your child's head before
  // ordering) intact via the lookbehind: that is advice to the reader, not a
  // site testing claim. Recorded compliance data ("规格信息：ASTM F963 | CPSC")
  // carries no 实测 and is factual spec data, so it survives untouched.
  [/我们实测池/g, "本次对比"],
  [/实测池/g, "对比池"],
  [/第三方实测/g, "公开用户反馈"],
  [/实测整备/g, "规格整备"],
  [/实测：/g, "规格要点："],
  [/经实测验证/g, "基于公开规格与用户反馈"],
  [/本组测试/g, "同品类"],
  [/本组对比/g, "本次对比"],
  [/本组(?!测试|对比)/g, "本次对比"],
  [/岁组测试中/g, "岁年龄段中"],
  [/测试组(?=[中里内])/g, "对比"],
  [/实验室评测/g, "深度评测"],
  [/(?<!必须)实测/g, "规格"],
];

export function sanitizeUnsupportedClaims(html: string): string {
  const restoreCase = (replacement: string, matched: string): string => {
    if (matched.length > 2 && matched === matched.toUpperCase()) return replacement.toUpperCase();
    if (/^[A-Z]/.test(matched)) return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    return replacement;
  };
  // `(?<!-)` keeps every rule away from hyphenated URL slugs such as
  // /transparency/certification-lab-notes/, which must stay clickable.
  return UNSUPPORTED_CLAIM_REWRITES.reduce((acc, [pattern, replacement]) => {
    const urlSafe = new RegExp(`(?<!-)${pattern.source}`, pattern.flags);
    return acc.replace(urlSafe, (match, ...groups) => {
      // Expand $1..$9 capture groups (used by the ride-time rule) before the
      // case restore, so "delivered up to 120 minutes" keeps its number.
      const expanded = replacement.replace(/\$(\d+)/g, (_full, index) => groups[Number(index) - 1] ?? "");
      return restoreCase(expanded, match);
    });
  }, html);
}
