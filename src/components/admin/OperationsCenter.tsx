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
import { seedProductsToFirestore } from "../../lib/cmsService";
import { productsData as defaultProductsData } from "../../data/modelsData";
import { translateProduct } from "../../lib/translate";
import { getOpsCollectionLabel, OPS_COLLECTIONS, OPS_COPY } from "./operationsConfig";

type Props = {
  lang: "zh" | "en";
};

type Notice = {
  kind: "success" | "error";
  text: string;
};

export default function OperationsCenter({ lang }: Props) {
  const copy = OPS_COPY[lang];
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
    return OPS_COLLECTIONS.reduce((sum, key) => sum + Number(overview.counts[key] || 0), 0);
  }, [overview]);

  const runInit = async () => {
    const confirmText =
      copy.initConfirm(getOpsCollectionLabel(lang, targetCollection), source, mode);
    if (!window.confirm(confirmText)) return;

    setBusy(true);
    setNotice(null);
    try {
      const result = await initCMSOpsCollection(targetCollection, mode, source);
      setNotice({
        kind: "success",
        text:
          copy.initSuccess(getOpsCollectionLabel(lang, result.collection), result.initialized),
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
      copy.purgeConfirm(getOpsCollectionLabel(lang, targetCollection));
    if (!window.confirm(riskText)) return;

    setBusy(true);
    setNotice(null);
    try {
      const result = await purgeCMSOpsCollection(targetCollection);
      setNotice({
        kind: "success",
        text:
          copy.purgeSuccess(getOpsCollectionLabel(lang, result.collection), result.purged),
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
        text: copy.exportSuccess,
      });
    } catch (error: any) {
      setNotice({ kind: "error", text: error?.message || String(error) });
    } finally {
      setBusy(false);
    }
  };

  const runDedupe = async () => {
    if (!window.confirm(copy.dedupeConfirm)) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await dedupeD1CMSCategories();
      setNotice({
        kind: "success",
        text:
          copy.dedupeSuccess(result.removed, result.remaining),
      });
      await refreshOverview();
    } catch (error: any) {
      setNotice({ kind: "error", text: error?.message || String(error) });
    } finally {
      setBusy(false);
    }
  };

  const runForceSync = async () => {
    if (!window.confirm(copy.forceSyncConfirm)) return;
    setBusy(true);
    setNotice(null);
    try {
      const dedupe = await dedupeD1CMSCategories();
      const success = await seedProductsToFirestore(defaultProductsData, translateProduct);
      if (!success) {
        throw new Error(lang === "zh" ? "同步失败，请检查控制台。" : "Sync failed, please consult console logs.");
      }
      setNotice({
        kind: "success",
        text: copy.forceSyncSuccess(dedupe.removed, dedupe.remaining),
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
            {copy.title}
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            {copy.subtitle}
          </p>
        </div>
        <button
          onClick={refreshOverview}
          disabled={busy}
          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-700 flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
          {copy.refresh}
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
        <Metric label={copy.d1Config} value={overview?.configured ? "OK" : "NO"} />
        <Metric label={copy.d1Health} value={overview?.healthy ? "OK" : "DOWN"} />
        <Metric label={getOpsCollectionLabel(lang, "products")} value={String(overview?.counts.products || 0)} />
        <Metric label={getOpsCollectionLabel(lang, "categories")} value={String(overview?.counts.categories || 0)} />
        <Metric label={getOpsCollectionLabel(lang, "scenarios")} value={String(overview?.counts.scenarios || 0)} />
        <Metric label={getOpsCollectionLabel(lang, "evaluations")} value={String(overview?.counts.evaluations || 0)} />
        <Metric label={getOpsCollectionLabel(lang, "guides")} value={String(overview?.counts.guides || 0)} />
        <Metric label={getOpsCollectionLabel(lang, "news")} value={String(overview?.counts.news || 0)} />
      </div>

      <div className="text-[11px] text-slate-500">
        {copy.totalRows}: {totalRows}
        {overview?.updatedAt ? ` · ${overview.updatedAt}` : ""}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <select
          className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
          value={targetCollection}
          onChange={(e) => setTargetCollection(e.target.value as CMSOpsCollection)}
        >
          <option value="all">{getOpsCollectionLabel(lang, "all")}</option>
          {OPS_COLLECTIONS.map((key) => (
            <option key={key} value={key}>
              {getOpsCollectionLabel(lang, key)}
            </option>
          ))}
        </select>

        <select
          className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
          value={source}
          onChange={(e) => setSource(e.target.value as "worker" | "baseline")}
        >
          <option value="baseline">{copy.sourceBaseline}</option>
          <option value="worker">{copy.sourceWorker}</option>
        </select>

        <select
          className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
          value={mode}
          onChange={(e) => setMode(e.target.value as "append" | "replace")}
        >
          <option value="replace">{copy.modeReplace}</option>
          <option value="append">{copy.modeAppend}</option>
        </select>

        <div className="flex items-center gap-2">
          <button
            onClick={runInit}
            disabled={busy}
            className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5" />
            {copy.init}
          </button>
          <button
            onClick={runPurge}
            disabled={busy}
            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black"
            title={copy.purge}
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
          {copy.exportJson}
        </button>
        <button
          onClick={runDedupe}
          disabled={busy}
          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black"
        >
          {copy.dedupe}
        </button>
        <button
          onClick={runForceSync}
          disabled={busy}
          className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black"
        >
          {copy.forceSync}
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
