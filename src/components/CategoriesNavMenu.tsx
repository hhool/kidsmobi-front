/**
 * CategoriesNavMenu — SPA top-nav entry that mirrors the Products submenu.
 *
 * Pattern (agreed in design discussion): a button + dropdown panel. The panel
 * groups the 20 category hubs by product FAMILY (二级 = family, 三级 = each
 * hub page). Every target is a real hub URL, so the links are crawlable and
 * need no new pages. State is self-contained (open/close), so App.tsx only
 * drops in <CategoriesNavMenu lang={lang} /> without sharing its handlers.
 */
import { useState, useRef, useEffect } from "react";
import { CATEGORY_FAMILY_NAV } from "../data/categoryGuides";

export default function CategoriesNavMenu({
  lang,
  onNavigate,
}: {
  lang: "en" | "zh";
  onNavigate: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="relative group" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="categories_dropdown_menu"
        className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1 ${
          open ? "bg-white text-orange-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <span>{lang === "zh" ? "导购分类" : "Categories"}</span>
        <span className="text-[10px] text-slate-400">▾</span>
      </button>
      {open && (
        <div
          id="categories_dropdown_menu"
          className="fixed inset-x-4 top-20 md:absolute md:top-full md:left-0 md:inset-x-auto md:w-[420px] mt-3 bg-white/98 backdrop-blur-2xl border border-slate-200/80 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] ring-1 ring-slate-900/5 p-6 z-[99] max-h-[80vh] overflow-y-auto md:max-h-none no-scrollbar"
        >
          <div className="hidden md:block absolute -top-1.5 left-10 w-3 h-3 bg-white border-t border-l border-slate-200/80 rotate-45"></div>
          <div className="space-y-5">
            <span className="text-[12px] font-black text-slate-400 block uppercase tracking-wider pl-1 font-display">
              {lang === "zh" ? "🏆 导购家族" : "🏆 Families"}
            </span>
            {CATEGORY_FAMILY_NAV.map((fam) => (
              <div key={fam.familyLabel} className="space-y-2.5">
                <span className="text-[11px] font-black text-slate-700 block uppercase tracking-wider pl-1">
                  {fam.familyLabel}
                </span>
                <div className="flex flex-col gap-1 pr-1 border-l-2 border-slate-100 ml-1 pl-2">
                  {fam.items.map((it) => (
                    <a
                      key={it.route}
                      href={it.route}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(it.route);
                        setOpen(false);
                      }}
                      className="py-2 px-2.5 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between group/cat border border-transparent hover:border-slate-100/70 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                    >
                      <span className="text-slate-800 font-extrabold text-[11px] group-hover/cat:text-orange-500 transition-colors">
                        {it.label}
                      </span>
                      <span className="text-[10px] text-slate-300 group-hover/cat:text-orange-500 group-hover/cat:translate-x-0.5 transition-all">
                        ➔
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
