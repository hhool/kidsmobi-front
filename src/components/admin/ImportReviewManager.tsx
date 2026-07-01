import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, FolderOpen, Image as ImageIcon, Film, Layers } from "lucide-react";
import { getImportBatchList, getImportBatchSummary, ImportBatchListEntry, ImportBatchProductRow, ImportBatchSummary } from "../../lib/importBatchService";
import { deriveProductReview, formatReviewDecision, summarizeBatchReview } from "../../lib/importReviewRules";

export default function ImportReviewManager({ lang }: { lang: "zh" | "en" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batches, setBatches] = useState<ImportBatchListEntry[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [summary, setSummary] = useState<ImportBatchSummary | null>(null);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const loadBatchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getImportBatchList();
      setBatches(list);
      const current = selectedBatchId || list[0]?.importBatchId || "";
      setSelectedBatchId(current);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async (batchId: string) => {
    if (!batchId) {
      setSummary(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const detail = await getImportBatchSummary(batchId);
      if (!detail) {
        setError(lang === "zh" ? "未找到批次详情文件。" : "Batch detail file not found.");
        setSummary(null);
      } else {
        setSummary(detail);
      }
    } catch (err: any) {
      setError(err?.message || String(err));
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatchList();
  }, []);

  useEffect(() => {
    if (!selectedBatchId) return;
    loadSummary(selectedBatchId);
  }, [selectedBatchId]);

  const rows = useMemo(() => {
    const all = Array.isArray(summary?.products) ? summary.products : [];
    const q = keyword.trim().toLowerCase();
    return all.filter((row) => {
      if (categoryFilter && row.sourceCategoryId !== categoryFilter) return false;
      if (!q) return true;
      const text = `${row.productId} ${row.productDirName} ${row.sourceCategoryId}`.toLowerCase();
      return text.includes(q);
    });
  }, [summary, keyword, categoryFilter]);

  const totalManufacturer = rows.reduce((acc, row) => acc + (row.media?.manufacturerImages || 0), 0);
  const totalGallery = rows.reduce((acc, row) => acc + (row.media?.galleryImages || 0), 0);
  const reviewSnapshot = useMemo(() => summarizeBatchReview(rows), [rows]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {lang === "zh" ? "导入批次审核" : "Import Batch Review"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {lang === "zh" ? "按批次查看产品导入质量与图库结构，便于人工审核。" : "Inspect staged product/media quality by import batch for manual review."}
        </p>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_auto] gap-3">
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            aria-label={lang === "zh" ? "选择导入批次" : "Select import batch"}
            title={lang === "zh" ? "选择导入批次" : "Select import batch"}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold"
          >
            <option value="">{lang === "zh" ? "请选择批次" : "Select batch"}</option>
            {batches.map((item) => (
              <option key={item.importBatchId} value={item.importBatchId}>
                {item.importBatchId}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={lang === "zh" ? "搜索产品ID或目录名" : "Search product id or dir"}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label={lang === "zh" ? "按品类筛选" : "Filter by category"}
              title={lang === "zh" ? "按品类筛选" : "Filter by category"}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold"
            >
              <option value="">{lang === "zh" ? "全部品类" : "All categories"}</option>
              {(summary?.categories || []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            onClick={loadBatchList}
            className="px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {lang === "zh" ? "刷新" : "Refresh"}
          </button>
        </div>

        {error && <p className="text-sm text-rose-600 font-bold">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <StatCard icon={<FolderOpen className="w-4 h-4 text-indigo-500" />} label={lang === "zh" ? "产品数" : "Products"} value={String(rows.length)} />
          <StatCard icon={<ImageIcon className="w-4 h-4 text-orange-500" />} label={lang === "zh" ? "Gallery 图" : "Gallery"} value={String(totalGallery)} />
          <StatCard icon={<Layers className="w-4 h-4 text-emerald-500" />} label={lang === "zh" ? "Manufacturer 图" : "Manufacturer"} value={String(totalManufacturer)} />
          <StatCard icon={<Film className="w-4 h-4 text-sky-500" />} label={lang === "zh" ? "视频数" : "Videos"} value={String(rows.reduce((acc, r) => acc + (r.media?.videos || 0), 0))} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <StatCard icon={<FolderOpen className="w-4 h-4 text-rose-500" />} label={lang === "zh" ? "重复产品" : "Duplicates"} value={String(reviewSnapshot.duplicateProductCount)} />
          <StatCard icon={<ImageIcon className="w-4 h-4 text-amber-500" />} label={lang === "zh" ? "媒体异常" : "Media Issues"} value={String(reviewSnapshot.mediaIssueCount)} />
          <StatCard icon={<Layers className="w-4 h-4 text-violet-500" />} label={lang === "zh" ? "编辑未完成" : "Editorial Incomplete"} value={String(reviewSnapshot.editorialIncompleteCount)} />
          <StatCard icon={<Film className="w-4 h-4 text-slate-500" />} label={lang === "zh" ? "批次结论" : "Batch Decision"} value={formatReviewDecision(lang, reviewSnapshot.batchDecision)} />
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 leading-relaxed">
          <p className="font-black text-slate-900 mb-2">{lang === "zh" ? "审核规则" : "Review Rules"}</p>
          <ul className="space-y-1 list-disc pl-5">
            <li>{lang === "zh" ? "同一批次内同一 productId + sourceCategoryId 只能有 1 条主记录；-dupN 一律视为重复异常。" : "One main row per productId + sourceCategoryId per batch; -dupN rows are duplicate exceptions."}</li>
            <li>{lang === "zh" ? "cover 必须恰好 1 张；manufacturer 图必须独立，不得并入 gallery。" : "Cover must be exactly 1; manufacturer images must stay separate from gallery."}</li>
            <li>{lang === "zh" ? "视频列表只接受真实视频资源，非视频条目自动判为异常。" : "Video lists accept real video assets only; non-video entries are flagged."}</li>
            <li>{lang === "zh" ? "编辑字段、SEO 字段与标签为空时，默认需要复核，不可直接进入 CMS 发布。" : "Empty editorial/SEO/tag fields default to review-required."}</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left">
                <th className="px-4 py-3 font-black text-slate-500 uppercase text-xs">productId</th>
                <th className="px-4 py-3 font-black text-slate-500 uppercase text-xs">category</th>
                <th className="px-4 py-3 font-black text-slate-500 uppercase text-xs">dir</th>
                <th className="px-4 py-3 font-black text-slate-500 uppercase text-xs">gallery</th>
                <th className="px-4 py-3 font-black text-slate-500 uppercase text-xs">manufacturer</th>
                <th className="px-4 py-3 font-black text-slate-500 uppercase text-xs">videos</th>
                <th className="px-4 py-3 font-black text-slate-500 uppercase text-xs">decision</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: ImportBatchProductRow) => {
                const review = deriveProductReview(row);
                return (
                  <tr key={`${row.productId}-${row.productDirName}`} className={`border-b border-slate-100 hover:bg-slate-50/60 ${review.blocked ? "bg-rose-50/50" : ""}`}>
                    <td className="px-4 py-3 font-bold text-slate-900">{row.productId}</td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{row.sourceCategoryId}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{row.productDirName}</td>
                    <td className="px-4 py-3 text-slate-700 font-bold">{row.media?.galleryImages || 0}</td>
                    <td className="px-4 py-3 text-slate-700 font-bold">{row.media?.manufacturerImages || 0}</td>
                    <td className="px-4 py-3 text-slate-700 font-bold">{row.media?.videos || 0}</td>
                    <td className="px-4 py-3 text-slate-700 font-bold">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black uppercase ${review.blocked ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {formatReviewDecision(lang, review.decision)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-bold">
                    {lang === "zh" ? "当前筛选无结果。" : "No rows for current filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex items-center justify-between">
      <div>
        <p className="text-[11px] font-black uppercase text-slate-400">{label}</p>
        <p className="text-xl font-black text-slate-900 mt-1">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}
