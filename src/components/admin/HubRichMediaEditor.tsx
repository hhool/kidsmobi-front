import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, ExternalLink, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { CATEGORY_GUIDE_LIST } from "../../data/categoryGuides";
import {
  getD1CMSHubMediaMap,
  saveD1CMSHubMedia,
  setCMSAdminToken,
  hasCMSAdminToken,
  type HubRichMediaBlock,
} from "../../lib/cmsD1Service";
import HubRichMediaBlocks from "../HubRichMediaBlocks";

type BlockType = HubRichMediaBlock["type"];

const BLOCK_TYPES: { value: BlockType; label: string }[] = [
  { value: "heroImage", label: "Hero 图" },
  { value: "heroVideo", label: "Hero 视频" },
  { value: "image", label: "单图" },
  { value: "video", label: "视频" },
  { value: "gallery", label: "图集" },
  { value: "heading", label: "小标题" },
  { value: "paragraph", label: "段落" },
  { value: "cta", label: "行动按钮" },
];

function emptyBlock(type: BlockType): HubRichMediaBlock {
  switch (type) {
    case "heroImage":
      return { type, url: "", alt: "" };
    case "heroVideo":
      return { type, url: "", poster: "", alt: "" };
    case "image":
      return { type, url: "", alt: "", caption: "" };
    case "video":
      return { type, url: "", poster: "", caption: "" };
    case "gallery":
      return { type, items: [] };
    case "heading":
      return { type, text: "" };
    case "paragraph":
      return { type, text: "" };
    case "cta":
      return { type, label: "", href: "" };
    default:
      return { type: "paragraph", text: "" };
  }
}

export default function HubRichMediaEditor({ lang }: { lang: "zh" | "en" }) {
  const [map, setMap] = useState<Record<string, HubRichMediaBlock[]>>({});
  const [selected, setSelected] = useState<string>(CATEGORY_GUIDE_LIST[0]?.route || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [tokenSet, setTokenSet] = useState(false);

  const liveHost = typeof window !== "undefined" ? window.location.origin : "https://balancebiketoddler.com";

  useEffect(() => {
    setTokenSet(hasCMSAdminToken());
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const m = await getD1CMSHubMediaMap();
        if (!mounted) return;
        setMap(m || {});
      } catch (e: any) {
        if (!mounted) return;
        setError(lang === "zh" ? "读取富媒体失败，请检查网络或重新登录。" : "Failed to load rich media. Check network or sign in again.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [lang]);

  const blocks = useMemo<HubRichMediaBlock[]>(() => map[selected] || [], [map, selected]);

  const setBlocksForSelected = (next: HubRichMediaBlock[]) => {
    setMap((prev) => ({ ...prev, [selected]: next }));
  };

  const updateBlock = (index: number, patch: Partial<HubRichMediaBlock>) => {
    setBlocksForSelected(blocks.map((b, i) => (i === index ? ({ ...b, ...patch } as HubRichMediaBlock) : b)));
  };

  const addBlock = (type: BlockType) => {
    setBlocksForSelected([...blocks, emptyBlock(type)]);
  };

  const removeBlock = (index: number) => {
    setBlocksForSelected(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocksForSelected(next);
  };

  const save = async () => {
    if (!hasCMSAdminToken()) {
      setError(
        lang === "zh"
          ? "尚未设置 Admin token：请在上方粘贴并点「设置」，否则写入网关会返回 403。"
          : "Admin token not set — paste it above and click Set, otherwise the write gate returns 403.",
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const ok = await saveD1CMSHubMedia(selected, blocks);
      if (!ok) throw new Error("Cloud save failed");
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    } catch (e: any) {
      let nice = e?.message || String(e);
      if (nice.includes("AdminTokenRequired")) {
        nice = lang === "zh"
          ? "Admin token 无效或已过期，请重新粘贴后重试。"
          : "Admin token is invalid or expired — paste it again above.";
      } else if (nice.includes("Missing or insufficient permissions")) {
        nice = lang === "zh"
          ? "权限不足：当前会话未通过可写权限验证。请使用真实管理员 Google 账号登录后重试。"
          : "Permission Denied: please sign in with a real admin Google account and retry.";
      }
      setError(nice);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">
        {lang === "zh" ? "读取富媒体中…" : "Loading rich media…"}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
            {lang === "zh" ? "类别 Hub 富媒体" : "Category Hub Rich Media"}
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            {lang === "zh"
              ? "为每个类别 Hub 页编辑可排序的富媒体区块（图/视频/图集/标题/段落/按钮）。编辑后需一次重新构建部署才会进入预渲染 HTML（对爬虫可见）。"
              : "Edit sortable rich-media blocks per hub (image/video/gallery/heading/paragraph/cta). A rebuild+deploy is required after saving for the blocks to reach the prerendered HTML (visible to crawlers)."}
          </p>
        </div>
      </header>

      {error && (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900 text-sm leading-relaxed shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="font-bold">{error}</div>
        </div>
      )}

      {/* #48 write gate: runtime-only token, never baked into a public bundle. */}
      <div className={`rounded-[24px] border p-5 ${tokenSet ? "bg-emerald-50/60 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-widest text-slate-700">
              {lang === "zh" ? "Admin token（仅本次标签页）" : "Admin token (this tab only)"}
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl">
              {lang === "zh"
                ? "CMS 写入网关要求管理员令牌。粘贴一次即存于 sessionStorage，对后台所有写操作生效；关闭标签页即失效，绝不写进前端构建产物。"
                : "CMS writes require the admin token. Paste once; it stays in sessionStorage for this tab, applies to every Admin write, and is never baked into the bundle."}
            </p>
          </div>
          <span className={`text-[10px] font-black px-3 py-1.5 rounded-full shrink-0 ${tokenSet ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>
            {tokenSet ? (lang === "zh" ? "已设置" : "SET") : (lang === "zh" ? "未设置" : "NOT SET")}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setCMSAdminToken(tokenInput);
                setTokenSet(hasCMSAdminToken());
                setTokenInput("");
                setError(null);
              }
            }}
            autoComplete="off"
            placeholder={lang === "zh" ? "粘贴 CMS_ADMIN_ALL_TOKEN" : "Paste CMS_ADMIN_ALL_TOKEN"}
            className="flex-1 min-w-[220px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-orange-400"
          />
          <button
            onClick={() => {
              setCMSAdminToken(tokenInput);
              setTokenSet(hasCMSAdminToken());
              setTokenInput("");
              setError(null);
            }}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-black text-white hover:bg-slate-700 transition-all"
          >
            {lang === "zh" ? "设置" : "Set"}
          </button>
          <button
            onClick={() => {
              setCMSAdminToken("");
              setTokenSet(false);
              setTokenInput("");
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all"
          >
            {lang === "zh" ? "清除" : "Clear"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Hub list */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-3 space-y-1 max-h-[70vh] overflow-y-auto">
          {CATEGORY_GUIDE_LIST.map((g) => {
            const has = (map[g.route] || []).length > 0;
            return (
              <button
                key={g.route}
                onClick={() => setSelected(g.route)}
                className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-between ${
                  selected === g.route ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="truncate">{g.title.split(":")[0].trim()}</span>
                {has && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${selected === g.route ? "bg-white/20" : "bg-emerald-100 text-emerald-700"}`}>
                    {(map[g.route] || []).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Editor + preview */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-black text-slate-500 uppercase tracking-widest">
              {CATEGORY_GUIDE_LIST.find((g) => g.route === selected)?.route}
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`${liveHost}${selected}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 hover:bg-slate-100 rounded-2xl text-slate-500 transition-all"
                title={lang === "zh" ? "前台预览" : "Preview live"}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={save}
                disabled={saving}
                className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black transition-all disabled:opacity-50 ${
                  savedFlash ? "bg-emerald-600 text-white" : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                <Save className="w-4 h-4" />
                {saving ? (lang === "zh" ? "保存中" : "Saving") : savedFlash ? (lang === "zh" ? "已保存" : "Saved") : (lang === "zh" ? "保存富媒体" : "Save Media")}
              </button>
            </div>
          </div>

          {/* Add block */}
          <div className="flex flex-wrap gap-2">
            {BLOCK_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => addBlock(t.value)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-orange-200 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Block list */}
          <div className="space-y-4">
            {blocks.length === 0 && (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                {lang === "zh" ? "暂无区块，点上方按钮添加。" : "No blocks yet — add one above."}
              </div>
            )}
            {blocks.map((b, i) => (
              <React.Fragment key={i}>
                <BlockEditor
                  block={b}
                  index={i}
                  total={blocks.length}
                  lang={lang}
                  onChange={(patch) => updateBlock(i, patch)}
                  onRemove={() => removeBlock(i)}
                  onMove={(dir) => moveBlock(i, dir)}
                />
              </React.Fragment>
            ))}
          </div>

          {/* Live preview */}
          <div className="pt-4 border-t border-slate-200">
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
              {lang === "zh" ? "实时预览" : "Live Preview"}
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              {blocks.length === 0 ? (
                <p className="text-slate-400 text-sm text-center">{lang === "zh" ? "（空）" : "(empty)"}</p>
              ) : (
                <HubRichMediaBlocks blocks={blocks} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">{label}</span>
      {children}
    </label>
  );
}

function BlockEditor({
  block,
  index,
  total,
  lang,
  onChange,
  onRemove,
  onMove,
}: {
  block: HubRichMediaBlock;
  index: number;
  total: number;
  lang: "zh" | "en";
  onChange: (patch: Partial<HubRichMediaBlock>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const label = BLOCK_TYPES.find((t) => t.value === block.type)?.label || block.type;
  const inputCls =
    "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-black flex items-center justify-center">{index + 1}</span>
          <span className="text-sm font-black text-slate-700">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onMove(-1)} disabled={index === 0} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 disabled:opacity-30" title="Up">
            <ArrowUp className="w-4 h-4" />
          </button>
          <button onClick={() => onMove(1)} disabled={index === total - 1} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 disabled:opacity-30" title="Down">
            <ArrowDown className="w-4 h-4" />
          </button>
          <button onClick={onRemove} className="p-2 rounded-xl hover:bg-rose-50 text-rose-500" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {("url" in block) && (
          <div className="sm:col-span-2">
            <Field label={lang === "zh" ? "媒体 URL（https）" : "Media URL (https)"}>
              <input className={inputCls} value={block.url} onChange={(e) => onChange({ url: e.target.value } as Partial<HubRichMediaBlock>)} placeholder="https://…" />
            </Field>
          </div>
        )}
        {("poster" in block) && (
          <Field label="Poster URL">
            <input className={inputCls} value={block.poster || ""} onChange={(e) => onChange({ poster: e.target.value } as Partial<HubRichMediaBlock>)} placeholder="https://…" />
          </Field>
        )}
        {("alt" in block) && (
          <Field label="Alt">
            <input className={inputCls} value={block.alt || ""} onChange={(e) => onChange({ alt: e.target.value } as Partial<HubRichMediaBlock>)} />
          </Field>
        )}
        {("caption" in block) && (
          <Field label={lang === "zh" ? "说明文字" : "Caption"}>
            <input className={inputCls} value={block.caption || ""} onChange={(e) => onChange({ caption: e.target.value } as Partial<HubRichMediaBlock>)} />
          </Field>
        )}
        {("text" in block) && (
          <div className="sm:col-span-2">
            <Field label={lang === "zh" ? "文本" : "Text"}>
              <textarea className={inputCls} rows={2} value={block.text} onChange={(e) => onChange({ text: e.target.value } as Partial<HubRichMediaBlock>)} />
            </Field>
          </div>
        )}
        {("label" in block) && (
          <Field label={lang === "zh" ? "按钮文字" : "Button label"}>
            <input className={inputCls} value={block.label} onChange={(e) => onChange({ label: e.target.value } as Partial<HubRichMediaBlock>)} />
          </Field>
        )}
        {("href" in block) && (
          <Field label="Href (https 或 /path)">
            <input className={inputCls} value={block.href} onChange={(e) => onChange({ href: e.target.value } as Partial<HubRichMediaBlock>)} placeholder="https://… 或 /guides" />
          </Field>
        )}
      </div>

      {block.type === "gallery" && (
        <GalleryEditor
          items={block.items}
          lang={lang}
          onChange={(items) => onChange({ items } as Partial<HubRichMediaBlock>)}
        />
      )}
    </div>
  );
}

function GalleryEditor({
  items,
  lang,
  onChange,
}: {
  items: { url: string; alt?: string; caption?: string }[];
  lang: "zh" | "en";
  onChange: (items: { url: string; alt?: string; caption?: string }[]) => void;
}) {
  const inputCls =
    "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-orange-400";
  return (
    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        {lang === "zh" ? "图集图片" : "Gallery images"}
      </div>
      {items.map((it, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
          <input className={inputCls} value={it.url} placeholder="https://…" onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
          <input className={inputCls} value={it.alt || ""} placeholder="alt" onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="p-2 rounded-xl hover:bg-rose-50 text-rose-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, { url: "", alt: "", caption: "" }])}
        className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700"
      >
        <Plus className="w-3.5 h-3.5" />
        {lang === "zh" ? "添加图片" : "Add image"}
      </button>
    </div>
  );
}
