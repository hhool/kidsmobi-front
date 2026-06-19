import React from "react";
import { 
  LayoutDashboard, 
  Package, 
  Star, 
  BookOpen, 
  Globe, 
  Settings as SettingsIcon, 
  X 
} from "lucide-react";
import { auth } from "../../lib/firebase";

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: any) => void;
  lang: "zh" | "en";
  onClose: () => void;
}

export default function Sidebar({ activeMenu, setActiveMenu, lang, onClose }: SidebarProps) {
  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/20">K</div>
          <span className="font-black tracking-tighter text-slate-900">CMS 2.0</span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-6 space-y-2">
        <MenuItem 
          active={activeMenu === "dashboard"} 
          onClick={() => setActiveMenu("dashboard")} 
          icon={<LayoutDashboard className="w-5 h-5" />} 
          label={lang === "zh" ? "控制台" : "Dashboard"} 
        />
        <MenuItem 
          active={activeMenu === "products"} 
          onClick={() => setActiveMenu("products")} 
          icon={<Package className="w-5 h-5" />} 
          label={lang === "zh" ? "产品中心" : "Products"} 
        />
        <MenuItem 
          active={activeMenu === "evaluations"} 
          onClick={() => setActiveMenu("evaluations")} 
          icon={<Star className="w-5 h-5" />} 
          label={lang === "zh" ? "评测中心" : "Reviews"} 
        />
        <MenuItem 
          active={activeMenu === "guides"} 
          onClick={() => setActiveMenu("guides")} 
          icon={<BookOpen className="w-5 h-5" />} 
          label={lang === "zh" ? "选购指南" : "Guides"} 
        />
        <MenuItem 
          active={activeMenu === "news"} 
          onClick={() => setActiveMenu("news")} 
          icon={<Globe className="w-5 h-5" />} 
          label={lang === "zh" ? "全球资讯" : "Global News"} 
        />
        <MenuItem 
          active={activeMenu === "settings"} 
          onClick={() => setActiveMenu("settings")} 
          icon={<SettingsIcon className="w-5 h-5" />} 
          label={lang === "zh" ? "首页与配置" : "Home & Config"} 
        />
      </nav>

      <div className="p-6 border-t border-slate-100 flex flex-col gap-1">
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Operator</div>
        <div className="text-xs font-black text-slate-600 truncate">{auth.currentUser?.email}</div>
      </div>
    </aside>
  );
}

function MenuItem({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${active ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10" : "text-slate-500 hover:bg-slate-100"}`}
    >
      <div className={active ? "text-orange-500" : ""}>{icon}</div>
      {label}
    </button>
  );
}
