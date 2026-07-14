import React, { useMemo, useState } from "react";
import { X, Search, Check } from "lucide-react";
import { CMSScenario } from "../../types";

export default function ScenarioPicker({
  open,
  lang,
  scenarios,
  selectedCodes,
  onClose,
  onApply,
}: {
  open: boolean;
  lang: "zh" | "en";
  scenarios: CMSScenario[];
  selectedCodes: string[];
  onClose: () => void;
  onApply: (scenarioCodes: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>(selectedCodes || []);

  React.useEffect(() => {
    if (!open) return;
    setSelected(selectedCodes || []);
    setQ("");
  }, [open, selectedCodes]);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return (scenarios || []).filter((item) => {
      if (!keyword) return true;
      const text = `${item.code} ${item.zh?.name || ""} ${item.en?.name || ""}`.toLowerCase();
      return text.includes(keyword);
    });
  }, [q, scenarios]);

  function toggle(code: string) {
    if (selected.includes(code)) {
      setSelected(selected.filter((item) => item !== code));
      return;
    }
    setSelected([...selected, code]);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[130] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl h-[82vh] bg-white rounded-[32px] border border-slate-100 shadow-2xl flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              {lang === "zh" ? "场景可视化选择器" : "Scenario Visual Picker"}
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {lang === "zh" ? "用于 Guide/News 场景关联" : "For Guide/News Scenario Linkage"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="px-6 py-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={lang === "zh" ? "搜索场景 code / 名称" : "Search scenario code / name"}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-bold"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => {
              const checked = selected.includes(item.code);
              return (
                <button
                  key={item.id}
                  onClick={() => toggle(item.code)}
                  className={`text-left p-4 rounded-2xl border transition-all ${checked ? "border-emerald-500 bg-emerald-50" : "border-slate-100 bg-white hover:border-slate-300"}`}
                >
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{item.status}</p>
                  <h4 className="font-black text-slate-900 text-sm">{item.zh?.name || item.code}</h4>
                  <p className="text-[11px] font-bold text-slate-500 mt-1">{item.en?.name || item.code}</p>
                  <p className="text-[10px] font-black uppercase text-slate-400 mt-2">{item.code}</p>
                  {checked && <Check className="w-4 h-4 text-emerald-500 mt-2" />}
                </button>
              );
            })}
          </div>
        </div>

        <footer className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-500">
            {lang === "zh" ? "已选场景" : "Selected Scenarios"}: {selected.length}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-black">
              {lang === "zh" ? "取消" : "Cancel"}
            </button>
            <button
              onClick={() => {
                onApply(selected);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black"
            >
              {lang === "zh" ? "应用选择" : "Apply"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
