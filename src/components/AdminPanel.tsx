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
  loading: loadingProp
}: { 
  onClose: () => void, 
  onRedirectAuth: () => void, 
  lang: "zh" | "en",
  isAdmin: boolean,
  loading: boolean
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
  
  if (!auth.currentUser) return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-8 text-center">
      <Globe className="w-16 h-16 text-orange-500 mb-4 animate-pulse" />
      <h2 className="text-2xl font-black mb-2 uppercase">{lang === "zh" ? "需要管理员登录" : "Admin Login Required"}</h2>
      <p className="text-slate-500 mb-8 max-w-xs">{lang === "zh" ? "请先登录您的管理员账号以访问此控制台。" : "Please sign in with your administrator account to access this console."}</p>
      <div className="flex gap-4">
        <button onClick={onClose} className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold">{lang === "zh" ? "回到首页" : "Back to Home"}</button>
        <button onClick={() => { onClose(); onRedirectAuth(); }} className="px-8 py-3 bg-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/20">
          {lang === "zh" ? "立即登录" : "Login Now"}
        </button>
      </div>
    </div>
  );

  if (!isAdminProp) return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-black mb-2 uppercase">Access Denied</h2>
      <p className="text-slate-500 mb-8 max-w-xs">You do not have administrator privileges to access this area.</p>
      <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold">Return to Site</button>
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
