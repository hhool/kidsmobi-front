import React from "react";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbsProps {
  items: { label: string; active?: boolean; onClick?: () => void }[];
  lang?: "zh" | "en";
  onHomeClick?: () => void;
}

export default function Breadcrumbs({ items, lang = "zh", onHomeClick }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-[10px] sm:text-xs font-bold text-slate-400 mb-8 overflow-x-auto whitespace-nowrap pb-2 sm:pb-0 hide-scrollbar">
      <button 
        onClick={onHomeClick}
        className="flex items-center gap-1.5 hover:text-orange-500 transition-colors uppercase tracking-widest"
      >
        <Home className="w-3.5 h-3.5" />
        {lang === "zh" ? "首页" : "HOME"}
      </button>
      
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <button
            disabled={item.active}
            onClick={item.onClick}
            className={`uppercase tracking-widest transition-colors ${
              item.active 
                ? "text-orange-500 cursor-default" 
                : "hover:text-slate-900 cursor-pointer"
            }`}
          >
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}
