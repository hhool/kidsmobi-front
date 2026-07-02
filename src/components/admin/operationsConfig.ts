import { CMSOpsCollection } from "../../lib/cmsD1Service";

export const OPS_COLLECTIONS: Array<Exclude<CMSOpsCollection, "all">> = [
  "products",
  "categories",
  "scenarios",
  "evaluations",
  "guides",
  "news",
  "settings",
];

const OPS_COLLECTION_LABELS: Record<"zh" | "en", Record<CMSOpsCollection, string>> = {
  zh: {
    all: "全站",
    products: "产品中心",
    categories: "品类管理",
    scenarios: "场景管理",
    evaluations: "评测中心",
    guides: "选购指南",
    news: "全球资讯",
    settings: "首页与配置",
  },
  en: {
    all: "All",
    products: "Products",
    categories: "Categories",
    scenarios: "Scenarios",
    evaluations: "Evaluations",
    guides: "Guides",
    news: "News",
    settings: "Settings",
  },
};

export function getOpsCollectionLabel(lang: "zh" | "en", value: CMSOpsCollection): string {
  return OPS_COLLECTION_LABELS[lang][value];
}

export const OPS_COPY = {
  zh: {
    title: "集中辅助操作中心",
    subtitle: "初始化/清空/导出/去重/强制同步统一入口。避免辅助按钮分散在各页面。",
    refresh: "刷新概览",
    d1Config: "D1 配置",
    d1Health: "D1 健康",
    totalRows: "当前总条数",
    sourceBaseline: "初始化来源：本地基线",
    sourceWorker: "初始化来源：Worker",
    modeReplace: "模式：覆盖重建",
    modeAppend: "模式：追加",
    init: "初始化",
    purge: "清空",
    exportJson: "导出全站 JSON",
    dedupe: "品类去重",
    forceSync: "强制同步产品",
    initConfirm: (collection: string, source: string, mode: string) => `确认初始化 ${collection}？来源=${source} 模式=${mode}`,
    initSuccess: (collection: string, initialized: number) => `初始化完成：${collection}，写入 ${initialized} 条。`,
    purgeConfirm: (collection: string) => `危险操作：确认清空 ${collection} 吗？`,
    purgeSuccess: (collection: string, purged: number) => `清空完成：${collection}，删除 ${purged} 条。`,
    exportSuccess: "导出成功，JSON 已开始下载。",
    dedupeConfirm: "确认执行品类去重？",
    dedupeSuccess: (removed: number, remaining: number) => `去重完成：删除 ${removed} 条，剩余 ${remaining} 条。`,
    forceSyncConfirm: "确认执行强制同步产品吗？将先执行品类去重，再使用默认车型数据写入 CMS。",
    forceSyncSuccess: (removed: number, remaining: number) => `强制同步完成：已去重 ${removed} 条，当前品类 ${remaining} 条。`,
  },
  en: {
    title: "Centralized Ops Center",
    subtitle: "Unified entry for init/purge/export/dedupe/force-sync to avoid scattered helper actions.",
    refresh: "Refresh",
    d1Config: "D1 Config",
    d1Health: "D1 Health",
    totalRows: "Current total rows",
    sourceBaseline: "Source: Baseline",
    sourceWorker: "Source: Worker",
    modeReplace: "Mode: Replace",
    modeAppend: "Mode: Append",
    init: "Init",
    purge: "Purge",
    exportJson: "Export JSON",
    dedupe: "Dedupe Categories",
    forceSync: "Force Sync Products",
    initConfirm: (collection: string, source: string, mode: string) => `Initialize ${collection}? source=${source} mode=${mode}`,
    initSuccess: (collection: string, initialized: number) => `Initialization completed: ${collection}, ${initialized} rows written.`,
    purgeConfirm: (collection: string) => `Dangerous action: purge ${collection}?`,
    purgeSuccess: (collection: string, purged: number) => `Purge completed: ${collection}, ${purged} rows removed.`,
    exportSuccess: "Export succeeded, JSON download started.",
    dedupeConfirm: "Run category dedupe now?",
    dedupeSuccess: (removed: number, remaining: number) => `Dedupe completed: removed ${removed}, remaining ${remaining}.`,
    forceSyncConfirm: "Run force-sync for products now? This will dedupe categories first, then seed default product models.",
    forceSyncSuccess: (removed: number, remaining: number) => `Force sync completed. Category dedupe removed ${removed} duplicates, ${remaining} categories remain.`,
  },
} as const;
