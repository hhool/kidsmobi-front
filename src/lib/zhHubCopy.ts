/**
 * The Chinese edition of the two article hubs (/zh/guides, /zh/news).
 *
 * These two pages are the front door to the Chinese corpus: 68 guides and 9
 * stories, none of which a crawler could reach before them. Their opening
 * paragraph is written here rather than in the CMS because it is page copy,
 * not editorial data — the CMS holds the section TDK, the hub holds the
 * paragraph that explains what the hub is.
 *
 * It lives in src/lib/ because two renderers need it: the prerender prints it
 * as the hub's first paragraph, and the Chinese section TDK resolver appends
 * it to the CMS teaser when that teaser is too short to survive a search
 * result (the CMS Chinese teasers are 40-47 characters, and a snippet below
 * 70 characters is a fragment).
 */

/** The hub's opening paragraph, in Chinese. */
export const ZH_HUB_INTRO: Record<"guides" | "news", string> = {
  guides:
    "这里是 BalanceBikeToddler 的中文选购指南库：每篇指南都写清了适用年龄、尺寸判断、安全标准与预算取舍，并标注了数据来源，方便直接对照自家孩子的身高体重做决定。",
  news:
    "这里是 BalanceBikeToddler 的中文资讯频道：新品发布、标准修订、召回与安全研究，每条都带日期与来源，方便判断哪些变化真的影响到自家孩子的出行装备。",
};
