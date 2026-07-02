import React, { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, ShieldAlert, Trash2, Wand2 } from "lucide-react";
import {
  CMSOpsCollection,
  getCMSOpsOverview,
  initCMSOpsCollection,
  purgeCMSOpsCollection,
  downloadCMSOpsExport,
  dedupeD1CMSCategories,
} from "../../lib/cmsD1Service";

type Props = {
  lang: "zh" | "en";
};

type Notice = {
  kind: "success" | "error";
  text: string;
};

const collections: Array<Exclude<CMSOpsCollection, "all">> = [
  "products",
  "categories",
  "scenarios",
  "evaluations",
  "guides",
  "news",
  "settings",
];

function collectionLabel(lang: "zh" | "en", value: CMSOpsCollection): string {
  const mapZh: Record<CMSOpsCollection, string> = {
    all: "全站",
    products: "产品中心",
    categories: "品类管理",
    scenarios: "场景管理",
    evaluations: "评测中心",
    guides: "选购指南",
    news: "全球资讯",
    settings: "首页与配置",
  };
  const mapEn: Record<CMSOpsCollection, string> = {
    all: "All",
    products: "Products",
    categories: "Categories",
    scenarios: "Scenarios",
    evaluations: "Evaluations",
    guides: "Guides",
    news: "News",
    settings: "Settings",
  };
  return lang === "zh" ? mapZh[value] : mapEn[value];
}

export default function OperationsCenter({ lang }: Props) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [overview, setOverview] = useState<{
    configured: boolean;
    healthy: boolean;
    counts: Record<Exclude<CMSOpsCollection, "all">, number>;
    updatedAt: string;
  } | null>(null);

  const [targetCollection, setTargetCollection] = useState<CMSOpsCollection>("all");
  const [source, setSource] = useState<"worker" | "baseline">("baseline");
  const [mode, setMode] = useState<"append" | "replace">("replace");

  const refreshOverview = async () => {
    setBusy(true);
    try {
      const data = await getCMSOpsOverview();
      setOverview(data);
    } catch (error: any) {
      setNotice({ kind: "error", text: error?.message || String(error) });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    refreshOverview();
  }, []);

  const totalRows = useMemo(() => {
    if (!overview) return 0;
    return collections.reduce((sum, key) => sum + Number(overview.counts[key] || 0), 0);
  }, [overview]);

  const runInit = async () => {
    const confirmText =
      lang === "zh"
        ? `确认初始化 ${collectionLabel(lang, targetCollection)}？来源=${source} 模式=${mode}`
        : `Initialize ${collectionLabel(lang, targetCollection)}? source=${source} mode=${mode}`;
    if (!window.confirm(confirmText)) return;

    setBusy(true);
    setNotice(null);
    try {
      const result = await initCMSOpsCollection(targetCollection, mode, source);
      setNotice({
        kind: "success",
        text:
          lang === "zh"
            ? `初始化完成：${collectionLabel(lang, result.collection)}，写入 ${result.initialized} 条。`
            : `Initialization completed: ${collectionLabel(lang, result.collection)}, ${result.initialized} rows written.`,
      });
      await refreshOverview();
    } catch (error: any) {
      setNotice({ kind: "error", text: error?.message || String(error) });
    } finally {
      setBusy(false);
    }
  };

  const runPurge = async () => {
    const riskText =
      lang === "zh"
        ? `危险操作：确认清空 ${collectionLabel(lang, targetCollection)} 吗？`
        : `Dangerous action: purge ${collectionLabel(lang, targetCollection)}?`;
    if (!window.confirm(riskText)) return;

    setBusy(true);
    setNotice(null);
    try {
      const result = await purgeCMSOpsCollection(targetCollection);
      setNotice({
        kind: "success",
        text:
          lang === "zh"
            ? `清空完成：${collectionLabel(lang, result.collection)}，删除 ${result.purged} 条。`
            : `Purge completed: ${collectionLabel(lang, result.collection)}, ${result.purged} rows removed.`,
      });
      await refreshOverview();
    } catch (error: any) {
      setNotice({ kind: "error", text: error?.message || String(error) });
    } finally {
      setBusy(false);
    }
  };

  const runExport = async () => {
    setBusy(true);
    setNotice(null);
    try {
      await downloadCMSOpsExport();
      setNotice({
        kind: "success",
        text: lang === "zh" ? "导出成功，JSON 已开始下载。" : "Export succeeded, JSON download started.",
      });
    } catch (error: any) {
      setNotice({ kind: "error", text: error?.message || String(error) });
    } finally {
      setBusy(false);
    }
  };

  const runDedupe = async () => {
    if (!window.confirm(lang === "zh" ? "确认执行品类去重？" : "Run category dedupe now?")) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await dedupeD1CMSCategories();
      setNotice({
        kind: "success",
        text:
          lang === "zh"
            ? `去重完成：删除 ${result.removed} 条，剩余 ${result.remaining} 条。`
            : `Dedupe completed: removed ${result.removed}, remaining ${result.remaining}.`,
      });
      await refreshOverview();
    } catch (error: any) {
      setNotice({ kind: "error", text: error?.message || String(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-5 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-4 flex-col lg:flex-row">
        <div>
          <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            {lang === "zh" ? "集中辅助操作中心" : "Centralized Ops Center"}
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            {lang === "zh"
              ? "初始化/清空/导出/去重统一入口。避免辅助按钮分散在各页面。"
              : "Unified entry for init/purge/export/dedupe to avoid scattered helper actions."}
          </p>
        </div>
        <button
          onClick={refreshOverview}
          disabled={busy}
          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-700 flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
          {lang === "zh" ? "刷新概览" : "Refresh"}
        </button>
      </div>

      {notice && (
        <div
          className={`text-xs px-3 py-2 rounded-xl border ${
            notice.kind === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
        <Metric label={lang === "zh" ? "D1 配置" : "D1 Config"} value={overview?.configured ? "OK" : "NO"} />
        <Metric label={lang === "zh" ? "D1 健康" : "D1 Health"} value={overview?.healthy ? "OK" : "DOWN"} />
        <Metric label={collectionLabel(lang, "products")} value={String(overview?.counts.products || 0)} />
        <Metric label={collectionLabel(lang, "categories")} value={String(overview?.counts.categories || 0)} />
        <Metric label={collectionLabel(lang, "scenarios")} value={String(overview?.counts.scenarios || 0)} />
        <Metric label={collectionLabel(lang, "evaluations")} value={String(overview?.counts.evaluations || 0)} />
        <Metric label={collectionLabel(lang, "guides")} value={String(overview?.counts.guides || 0)} />
        <Metric label={collectionLabel(lang, "news")} value={String(overview?.counts.news || 0)} />
      </div>

      <div className="text-[11px] text-slate-500">
        {lang === "zh" ? "当前总条数" : "Current total rows"}: {totalRows}
        {overview?.updatedAt ? ` · ${overview.updatedAt}` : ""}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <select
          className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
          value={targetCollection}
          onChange={(e) => setTargetCollection(e.target.value as CMSOpsCollection)}
        >
          <option value="all">{collectionLabel(lang, "all")}</option>
          {collections.map((key) => (
            <option key={key} value={key}>
              {collectionLabel(lang, key)}
            </option>
          ))}
        </select>

        <select
          className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
          value={source}
          onChange={(e) => setSource(e.target.value as "worker" | "baseline")}
        >
          <option value="baseline">{lang === "zh" ? "初始化来源：本地基线" : "Source: Baseline"}</option>
          <option value="worker">{lang === "zh" ? "初始化来源：Worker" : "Source: Worker"}</option>
        </select>

        <select
          className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
          value={mode}
          onChange={(e) => setMode(e.target.value as "append" | "replace")}
        >
          <option value="replace">{lang === "zh" ? "模式：覆盖重建" : "Mode: Replace"}</option>
          <option value="append">{lang === "zh" ? "模式：追加" : "Mode: Append"}</option>
        </select>

        <div className="flex items-center gap-2">
          <button
            onClick={runInit}
            disabled={busy}
            className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5" />
            {lang === "zh" ? "初始化" : "Init"}
          </button>
          <button
            onClick={runPurge}
            disabled={busy}
            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black"
            title={lang === "zh" ? "清空" : "Purge"}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={runExport}
          disabled={busy}
          className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          {lang === "zh" ? "导出全站 JSON" : "Export JSON"}
        </button>
        <button
          onClick={runDedupe}
          disabled={busy}
          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black"
        >
          {lang === "zh" ? "品类去重" : "Dedupe Categories"}
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
      <div className="text-[10px] text-slate-400 font-bold uppercase">{label}</div>
      <div className="text-sm font-black text-slate-800 mt-1">{value}</div>
    </div>
  );
}
