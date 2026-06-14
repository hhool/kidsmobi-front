import React, { useState, useEffect } from "react";
import { 
  Globe,
  AlertCircle
} from "lucide-react";
import { auth } from "../lib/firebase";
import { checkIsAdmin } from "../lib/cmsService";
import Sidebar from "./admin/Sidebar";
import Dashboard from "./admin/Dashboard";
import ProductManager from "./admin/ProductManager";
import EvaluationManager from "./admin/EvaluationManager";
import GuideManager from "./admin/GuideManager";
import NewsManager from "./admin/NewsManager";
import SettingsManager from "./admin/SettingsManager";

export default function AdminPanel({ 
  onClose, 
  onRedirectAuth, 
  lang,
  isAdmin: isAdminProp,
  loading: loadingProp,
  onDeveloperBypass
}: { 
  onClose: () => void, 
  onRedirectAuth: () => void, 
  lang: "zh" | "en",
  isAdmin: boolean,
  loading: boolean,
  onDeveloperBypass?: () => void
}) {
  const [activeMenu, setActiveMenu] = useState<"dashboard" | "products" | "evaluations" | "guides" | "news" | "settings">("dashboard");

  if (loadingProp) return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[100] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-orange-500 rounded-full animate-spin" />
        <span className="font-black text-slate-900 tracking-tighter">AUTHENTICATING...</span>
      </div>
    </div>
  );
  
  if (!auth.currentUser && !isAdminProp) return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-8 text-center text-slate-950">
      <Globe className="w-16 h-16 text-orange-500 mb-4 animate-pulse" />
      <h2 className="text-2xl font-black mb-2 uppercase">{lang === "zh" ? "需要管理员登录" : "Admin Login Required"}</h2>
      <p className="text-slate-500 mb-8 max-w-xs">{lang === "zh" ? "请先登录您的管理员账号以访问此控制台。" : "Please sign in with your administrator account to access this console."}</p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold transition-all hover:bg-slate-200">{lang === "zh" ? "回到首页" : "Back to Home"}</button>
          <button onClick={() => { onClose(); onRedirectAuth(); }} className="flex-1 py-3 bg-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600">
            {lang === "zh" ? "立即登录" : "Login Now"}
          </button>
        </div>
        {onDeveloperBypass && (
          <button 
            onClick={onDeveloperBypass}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-white rounded-2xl font-black transition-all border border-slate-800 hover:border-amber-500/30 flex items-center justify-center gap-2"
          >
            {lang === "zh" ? "⚡ 开发者一键快捷登录" : "⚡ Developer Instant Login"}
          </button>
        )}
      </div>
    </div>
  );

  if (!isAdminProp) return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-8 text-center text-slate-900">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-black mb-2 uppercase">Access Denied</h2>
      <p className="text-slate-500 mb-8 max-w-xs">You do not have administrator privileges to access this area.</p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button onClick={onClose} className="w-full py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold transition-all hover:bg-slate-200">Return to Site</button>
        {onDeveloperBypass && (
          <button 
            onClick={onDeveloperBypass}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-white rounded-2xl font-black transition-all border border-slate-800 hover:border-amber-500/30 flex items-center justify-center gap-2"
          >
            {lang === "zh" ? "⚡ 提升为开发者权限" : "⚡ Upgrade to Developer Privileges"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-50 z-[100] flex overflow-hidden">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} lang={lang} onClose={onClose} />
      
      <main className="flex-1 overflow-y-auto bg-slate-50 relative">
        <div className="p-10 max-w-7xl mx-auto">
           {activeMenu === "dashboard" && <Dashboard lang={lang} />}
           {activeMenu === "products" && <ProductManager lang={lang} />}
           {activeMenu === "evaluations" && <EvaluationManager lang={lang} />}
           {activeMenu === "guides" && <GuideManager lang={lang} />}
           {activeMenu === "news" && <NewsManager lang={lang} />}
           {activeMenu === "settings" && <SettingsManager lang={lang} />}
        </div>
      </main>
    </div>
  );
}
