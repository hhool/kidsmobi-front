import React, { useState, useEffect, useMemo } from "react";
import { ToggleRight, Globe, AlertTriangle, ExternalLink } from "lucide-react";
import { CATEGORY_GUIDE_LIST } from "../../data/categoryGuides";
import { getD1CMSHubStatus, saveD1CMSHubStatus } from "../../lib/cmsD1Service";

type HubStatus = "published" | "preview";

const ROLE_LABELS: Record<string, { zh: string; en: string }> = {
  pillar: { zh: "支柱页", en: "Pillar" },
  cluster: { zh: "集群页", en: "Cluster" },
  comparison: { zh: "对比页", en: "Comparison" },
};

function displayTitle(title: string, lang: "zh" | "en"): string {
  // The category guides are English-authored; show the title and fall back
  // gracefully. (No zh field on CategoryGuide.)
  return title || (lang === "zh" ? "(无标题)" : "(No Title)");
}

export default function CategoryHubManager({ lang }: { lang: "zh" | "en" }) {
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingPath, setSavingPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const map = await getD1CMSHubStatus();
      setStatusMap(map || {});
    } catch (e: any) {
      console.error(e);
      setError(lang === "zh" ? "读取发布状态失败，请检查网络或重新登录。" : "Failed to load publish status. Check network or sign in again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const hubStatus = (route: string): HubStatus => {
    const s = String(statusMap[route] || "").trim().toLowerCase();
    return s === "preview" ? "preview" : "published";
  };

  const toggle = async (route: string) => {
    const current = hubStatus(route);
    const next: HubStatus = current === "preview" ? "published" : "preview";
    setSavingPath(route);
    setError(null);
    try {
      const saved = await saveD1CMSHubStatus(route, next);
      if (!saved) throw new Error("Cloud save failed");
      setStatusMap((prev) => ({ ...prev, [route]: next }));
      setSavedFlash(route);
      setTimeout(() => setSavedFlash((cur) => (cur === route ? null : cur)), 2500);
    } catch (e: any) {
      console.error(e);
      let nice = e?.message || String(e);
      if (nice.includes("Missing or insufficient permissions")) {
        nice = lang === "zh"
          ? "权限不足：当前会话未通过可写权限验证。请使用真实管理员 Google 账号登录后重试。"
          : "Permission Denied: please sign in with a real admin Google account and retry.";
      }
      setError(nice);
    } finally {
      setSavingPath(null);
    }
  };

  const counts = useMemo(() => {
    let published = 0;
    let preview = 0;
    for (const g of CATEGORY_GUIDE_LIST) {
      if (hubStatus(g.route) === "preview") preview += 1;
      else published += 1;
    }
    return { published, preview, total: CATEGORY_GUIDE_LIST.length };
  }, [statusMap]);

  const liveHost = typeof window !== "undefined" ? window.location.origin : "https://balancebiketoddler.com";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
            {lang === "zh" ? "类别 Hub 发布开关" : "Category Hub Gate"}
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            {lang === "zh"
              ? "控制每个类别 Hub 页的「正式发布 / 预览」状态。预览态页面公开可见但带 noindex，且不进入站点地图（Phase 2 网关）。"
              : "Toggle each category hub between Published and Preview. Preview hubs are publicly visible but noindex and excluded from the sitemap (Phase 2 gateway)."}
          </p>
          <div className="mt-3 flex items-end gap-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">
            <span className="bg-slate-900 text-white rounded-full px-2.5 py-1">{counts.published} {lang === "zh" ? "正式" : "Published"}</span>
            <span className="bg-amber-100 text-amber-700 rounded-full px-2.5 py-1">{counts.preview} {lang === "zh" ? "预览" : "Preview"}</span>
            <span className="rounded-full px-2.5 py-1 bg-slate-100 text-slate-600">{counts.total} {lang === "zh" ? "总计" : "Total"}</span>
          </div>
        </div>
      </header>

      {error && (
        <div className="p-5 bg-rose-50 border border-rose-150 rounded-2xl flex items-start gap-3 text-rose-900 text-sm leading-relaxed shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="font-bold">{error}</div>
        </div>
      )}

      {loading ? (
        <div className="p-10 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">
          {lang === "zh" ? "读取发布状态中…" : "Loading publish status…"}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {CATEGORY_GUIDE_LIST.map((g) => {
            const isPreview = hubStatus(g.route) === "preview";
            const isSaving = savingPath === g.route;
            const justSaved = savedFlash === g.route;
            return (
              <div
                key={g.route}
                className={`bg-white p-6 rounded-[28px] border shadow-sm flex items-center justify-between group transition-all ${
                  isPreview ? "border-amber-200 bg-amber-50/40" : "border-slate-100 hover:border-blue-200"
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-100">
                    <Globe className="w-7 h-7 text-slate-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${isPreview ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {isPreview ? (lang === "zh" ? "预览" : "Preview") : (lang === "zh" ? "正式" : "Published")}
                      </span>
                      <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                        {ROLE_LABELS[g.role || ""] ? (lang === "zh" ? ROLE_LABELS[g.role || ""].zh : ROLE_LABELS[g.role || ""].en) : (g.role || "—")}
                      </span>
                      {justSaved && (
                        <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                          {lang === "zh" ? "已保存" : "Saved"}
                        </span>
                      )}
                    </div>
                    <h4 className="font-black text-slate-900">{displayTitle(g.title, lang)}</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-0.5">{g.route}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={`${liveHost}${g.route}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 hover:bg-slate-100 rounded-2xl text-slate-500 transition-all"
                    title={lang === "zh" ? "前台预览" : "Preview live"}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => toggle(g.route)}
                    disabled={isSaving}
                    className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black transition-all disabled:opacity-50 ${
                      isPreview
                        ? "bg-slate-900 text-white hover:bg-slate-800"
                        : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    <ToggleRight className="w-4 h-4" />
                    {isSaving
                      ? (lang === "zh" ? "切换中" : "Switching")
                      : isPreview
                        ? (lang === "zh" ? "转为正式" : "Make Published")
                        : (lang === "zh" ? "转为预览" : "Make Preview")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
