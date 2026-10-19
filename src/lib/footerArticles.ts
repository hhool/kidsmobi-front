/**
 * Footer "Guides & News" column — the ten articles from the 2026-10-19
 * editorial batch (6 guides + 4 news). Shared by the SPA footer (App.tsx)
 * and the prerendered footer (scripts/prerender-pages.ts) so both render
 * paths expose the same internal links.
 *
 * Routes use the canonical no-trailing-slash form (see canonicalPath.ts);
 * the prerendered HTML is the EN shell, so its labels come from `en`.
 */
export const FOOTER_ARTICLE_LINKS: Array<{ path: string; en: string; zh: string }> = [
  { path: "/guides/budget/balance-bike-price-tiers", en: "Price Tiers Explained", zh: "价格档位解析" },
  { path: "/guides/beginner/balance-bike-vs-training-wheels", en: "Balance Bike vs Training Wheels", zh: "平衡车对比训练轮" },
  { path: "/guides/scenario/where-to-ride-balance-bike", en: "Where to Ride", zh: "骑行地形指南" },
  { path: "/guides/risk/balance-bike-safety-checks", en: "Pre-Ride Safety Checks", zh: "行前安全检查" },
  { path: "/guides/maintenance/balance-bike-maintenance", en: "Maintenance Basics", zh: "保养要点" },
  { path: "/guides/special/balance-bikes-extra-support", en: "Bikes for Extra Support", zh: "额外支持车型" },
  { path: "/news/science/balance-bike-research", en: "What Research Says", zh: "研究综述" },
  { path: "/news/industry/ride-on-safety-standards-2026", en: "2026 Safety Standards", zh: "2026 安全标准" },
  { path: "/news/new_product/new-balance-bikes-2026", en: "New Bikes 2026", zh: "2026 新车盘点" },
  { path: "/news/brand_news/balance-bike-brand-news-october-2026", en: "Brand News Oct 2026", zh: "10 月品牌动态" },
];
