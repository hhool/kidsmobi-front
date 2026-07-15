import React, { useState, useEffect } from "react";
import { 
  Globe,
  AlertCircle,
  HelpCircle,
  X,
  Key,
  Copy,
  Check,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../lib/firebase";
import Sidebar from "./admin/Sidebar";
import Dashboard from "./admin/Dashboard";
import ProductManager from "./admin/ProductManager";
import CategoryManager from "./admin/CategoryManager";
import ScenarioManager from "./admin/ScenarioManager";
import EvaluationManager from "./admin/EvaluationManager";
import GuideManager from "./admin/GuideManager";
import NewsManager from "./admin/NewsManager";
import SettingsManager from "./admin/SettingsManager";
import ImportReviewManager from "./admin/ImportReviewManager";
import OperationsCenter from "./admin/OperationsCenter";
import { getD1Health } from "../lib/cmsD1Service";
const AssetUploader = React.lazy(() => import("./admin/AssetUploader"));

type AdminMenu = "dashboard" | "categories" | "scenarios" | "products" | "evaluations" | "guides" | "news" | "settings" | "assets" | "imports";

const ADMIN_MENU_PATHS: Record<AdminMenu, string> = {
  dashboard: "/dashborad",
  categories: "/categories",
  scenarios: "/scenarios",
  products: "/products",
  evaluations: "/reviews",
  guides: "/guides",
  news: "/news",
  settings: "/settings",
  assets: "/assets",
  imports: "/imports",
};

const ADMIN_PATH_TO_MENU: Record<string, AdminMenu> = {
  "/dashborad": "dashboard",
  "/dashboard": "dashboard",
  "/categories": "categories",
  "/scenarios": "scenarios",
  "/products": "products",
  "/reviews": "evaluations",
  "/evaluations": "evaluations",
  "/guides": "guides",
  "/news": "news",
  "/settings": "settings",
  "/assets": "assets",
  "/imports": "imports",
};

const ADMIN_MENU_SET = new Set<AdminMenu>([
  "dashboard",
  "categories",
  "scenarios",
  "products",
  "evaluations",
  "guides",
  "news",
  "settings",
  "assets",
  "imports",
]);

const parseAdminRouteHash = (hashValue: string, pathnameValue: string): { menu: AdminMenu; productId: string } | null => {
  const hash = String(hashValue || "").trim();
  if (!hash.startsWith("#cms")) return null;

  const queryIndex = hash.indexOf("?");
  const query = queryIndex >= 0 ? hash.slice(queryIndex + 1) : "";
  const params = new URLSearchParams(query);
  const pathMenu = ADMIN_PATH_TO_MENU[String(pathnameValue || "").trim().toLowerCase()] || "dashboard";
  const rawMenu = String(params.get("menu") || pathMenu).trim().toLowerCase();
  const menu = ADMIN_MENU_SET.has(rawMenu as AdminMenu) ? (rawMenu as AdminMenu) : "dashboard";
  const productId = String(params.get("productId") || "").trim();

  return { menu, productId };
};

const navigateToAdminMenu = (menu: AdminMenu, options?: { productId?: string; replace?: boolean }) => {
  const targetPath = ADMIN_MENU_PATHS[menu] || "/dashborad";
  const params = new URLSearchParams();
  params.set("menu", menu);
  if (options?.productId) {
    params.set("productId", options.productId);
  }
  const nextUrl = `${targetPath}#cms?${params.toString()}`;
  if (options?.replace) {
    window.history.replaceState({}, "", nextUrl);
  } else {
    window.history.pushState({}, "", nextUrl);
  }
  window.dispatchEvent(new PopStateEvent("popstate"));
};

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
  const [activeMenu, setActiveMenu] = useState<AdminMenu>("dashboard");
  const [targetProductId, setTargetProductId] = useState<string>("");
  const [showHelpTip, setShowHelpTip] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [d1Status, setD1Status] = useState<"unknown" | "healthy" | "down">("unknown");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const health = await getD1Health();
        if (!mounted) return;
        setD1Status(health.configured && health.healthy ? "healthy" : "down");
      } catch {
        if (!mounted) return;
        setD1Status("down");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const syncAdminRouteFromHash = () => {
      const parsed = parseAdminRouteHash(window.location.hash, window.location.pathname);
      if (!parsed) return;
      setActiveMenu(parsed.menu);
      setTargetProductId(parsed.menu === "products" ? parsed.productId : "");
    };

    syncAdminRouteFromHash();
    window.addEventListener("hashchange", syncAdminRouteFromHash);
    return () => {
      window.removeEventListener("hashchange", syncAdminRouteFromHash);
    };
  }, []);

  const handleAdminMenuChange = (menu: AdminMenu) => {
    setActiveMenu(menu);
    setTargetProductId("");
    navigateToAdminMenu(menu);
  };

  const handleCopy = (text: string, fieldName: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  };


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
      <Sidebar activeMenu={activeMenu} setActiveMenu={handleAdminMenuChange} lang={lang} onClose={onClose} />
      
      <main className="flex-1 overflow-y-auto bg-slate-50 relative flex flex-col">
        {/* Sticky Utility Header Bar with Force Sync Button */}
        <div className="bg-white border-b border-slate-200 px-10 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-black uppercase tracking-wider">
              {lang === "zh" ? "系统环境: 生产" : "Env: Production"}
            </span>
            <span className="text-xs bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-full font-black uppercase tracking-wider">
              {lang === "zh" ? "权限: 管理员" : "Role: Admin"}
            </span>
            <span
              className={`text-xs px-3 py-1.5 rounded-full font-black uppercase tracking-wider ${
                d1Status === "healthy"
                  ? "bg-emerald-100 text-emerald-700"
                  : d1Status === "down"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {d1Status === "healthy"
                ? lang === "zh"
                  ? "D1: 已连接"
                  : "D1: Connected"
                : d1Status === "down"
                  ? lang === "zh"
                    ? "D1: 未就绪"
                    : "D1: Unavailable"
                  : "D1: Checking"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelpTip(true)}
              className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-705 px-4 py-2 rounded-xl font-bold uppercase tracking-wide flex items-center gap-1.5 cursor-pointer transition active:scale-95 text-slate-700"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
              {lang === "zh" ? "权限说明与排错" : "Permissions Guide"}
            </button>
          </div>
        </div>

        <div className="p-10 max-w-7xl mx-auto w-full flex-1">
          <OperationsCenter lang={lang} />

          {localStorage.getItem("dev_admin_bypass") === "true" && (
            <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-[28px] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex gap-4">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl shrink-0">
                  <ShieldAlert className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h4 className="font-black text-amber-900 text-sm">
                    {lang === "zh" ? "⚡ 开发者快捷登录模式激活" : "⚡ Developer Bypass Active"}
                  </h4>
                  <p className="text-xs text-amber-700/80 mt-1 leading-relaxed max-w-2xl">
                    {lang === "zh" 
                      ? "您当前正在使用本地开发者影子账户进行离线预览和浏览。由于未完成云端真实鉴权，发布和强制同步操作会被 Cloudflare D1 权限策略拒绝。若需持久化发布，请回到首页使用 Google 账号登录。"
                      : "You are active via developer bypass. Since this session is not securely authenticated for cloud access, publish/force-sync operations can be blocked by Cloudflare D1 access policy. Sign in with Google from Account section for persistent publish."}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  localStorage.removeItem("dev_admin_bypass");
                  onClose();
                  onRedirectAuth();
                }}
                className="px-6 py-3 bg-amber-900 hover:bg-amber-950 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap cursor-pointer"
              >
                {lang === "zh" ? "立即登录 Google" : "Login Google"}
              </button>
            </div>
          )}
           {activeMenu === "dashboard" && <Dashboard lang={lang} />}
           {activeMenu === "categories" && <CategoryManager lang={lang} />}
           {activeMenu === "scenarios" && <ScenarioManager lang={lang} />}
           {activeMenu === "products" && (
             <ProductManager
               lang={lang}
               focusProductId={targetProductId}
               onFocusProductHandled={() => setTargetProductId("")}
             />
           )}
           {activeMenu === "evaluations" && <EvaluationManager lang={lang} />}
           {activeMenu === "guides" && <GuideManager lang={lang} />}
           {activeMenu === "news" && <NewsManager lang={lang} />}
           {activeMenu === "imports" && <ImportReviewManager lang={lang} />}
           {activeMenu === "settings" && <SettingsManager lang={lang} />}
           {activeMenu === "assets" && (
             <div className="p-6">
               <React.Suspense fallback={<div className="animate-pulse">Loading Asset Manager...</div>}>
                 <AssetUploader lang={lang} />
               </React.Suspense>
             </div>
           )}
        </div>
      </main>

      {/* Help Tip Sidebar Drawer */}
      <AnimatePresence>
        {showHelpTip && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelpTip(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[200] cursor-pointer"
            />

            {/* Slide-out Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl z-[210] flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500 animate-pulse" />
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-tight">
                    {lang === "zh" ? "权限指引 & 规则排错" : "Permissions & Security Rules"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowHelpTip(false)}
                  title={lang === "zh" ? "关闭面板" : "Close panel"}
                  aria-label={lang === "zh" ? "关闭面板" : "Close panel"}
                  className="p-1.5 rounded-full hover:bg-slate-250 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-600 leading-relaxed">
                
                {/* Intro banner */}
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl">
                  <h4 className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {lang === "zh" ? "什么是 'Missing or insufficient permissions'?" : "What is 'Missing or insufficient permissions'?"}
                  </h4>
                  <p className="text-amber-805 text-xs text-amber-800">
                    {lang === "zh" ? 
                      "当您读取或写入数据时，若操作违反了 Cloudflare D1 的访问控制策略，系统会拒绝该请求。请确保当前管理员身份具备写入权限。" : 
                      "This occurs when your database request violates Cloudflare D1 access policy. Ensure the signed-in administrator identity has write permission."}
                  </p>
                </div>

                {/* Section: Active Session Identity */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-500" />
                    {lang === "zh" ? "当前登录身份凭证" : "Your Security Identity Credentials"}
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between group">
                      <div className="overflow-hidden mr-2 md:mr-4">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{lang === "zh" ? "管理员邮箱" : "Signed-in Email"}</div>
                        <div className="font-mono text-xs text-slate-700 truncate">{auth.currentUser?.email || "Anonymous/Not Authenticated"}</div>
                      </div>
                      {auth.currentUser?.email && (
                        <button
                          onClick={() => handleCopy(auth.currentUser?.email || "", "email")}
                          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer transition flex-shrink-0"
                        >
                          {copiedField === "email" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between group">
                      <div className="overflow-hidden mr-2 md:mr-4">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{lang === "zh" ? "用户标识 (Auth UID)" : "Authentication UID"}</div>
                        <div className="font-mono text-xs text-slate-700 truncate">{auth.currentUser?.uid || "N/A"}</div>
                      </div>
                      {auth.currentUser?.uid && (
                        <button
                          onClick={() => handleCopy(auth.currentUser?.uid || "", "uid")}
                          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer transition flex-shrink-0"
                        >
                          {copiedField === "uid" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section: Code Snippets */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                    {lang === "zh" ? "更新配置方案 (Update Options)" : "Update Configuration Options"}
                  </h4>

                  <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] space-y-3 relative overflow-hidden group">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-bold border-b border-slate-800 pb-2">
                      <span>Option A: Verify D1 credentials</span>
                      <button
                        onClick={() => handleCopy(
`Check env for D1:
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_D1_DATABASE_ID
- CLOUDFLARE_API_TOKEN

Then sign in with Google admin email:
${auth.currentUser?.email || "your-email@gmail.com"}`,
"rules-code")}
                        className="text-slate-500 hover:text-slate-300 flex items-center gap-1 transition cursor-pointer"
                      >
                        {copiedField === "rules-code" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedField === "rules-code" ? "Copied" : "Copy Target"}
                      </button>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                        {lang === "zh" ? 
                          "确认 D1 环境变量已配置，并使用管理员 Google 账号登录后再执行同步。" : 
                          "Verify D1 environment variables and sign in with an admin Google account before syncing."}
                      </p>
                      <pre className="text-emerald-400 overflow-x-auto p-1 leading-normal">
{`D1 env checklist:
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_D1_DATABASE_ID
- CLOUDFLARE_API_TOKEN

Signed-in admin: ${auth.currentUser?.email || "your-email@gmail.com"}`}
                      </pre>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1">
                      <span className="bg-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]">B</span>
                      {lang === "zh" ? "方案 B: 创建管理员文档" : "Option B: Insert Admin record"}
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-2">
                      {lang === "zh" ? 
                        "确认当前 Cloudflare D1 数据库可写，并在运维配置中允许当前管理员身份进行内容写入。" : 
                        "Ensure the current Cloudflare D1 database is writable and your administrator identity is allowed to write CMS data."}
                    </p>
                  </div>
                </div>

                {/* Section: Deploy explanation */}
                <div className="space-y-2 bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  <h4 className="font-bold text-blue-900 text-xs uppercase flex items-center gap-1.5">
                    {lang === "zh" ? "完成部署 (Deploy Rules)" : "How Rules are Deployed"}
                  </h4>
                  <p className="text-blue-800 text-xs leading-relaxed">
                    {lang === "zh" ? 
                      "系统数据层已切换到 Cloudflare。完成 D1 凭据与管理员登录校验后，点击上方“强制同步数据”即可将默认内容写入 D1。" : 
                      "The data layer is now Cloudflare-based. After validating D1 credentials and admin sign-in, click 'Force Sync Data' to write default content into D1."}
                  </p>
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button
                  onClick={() => setShowHelpTip(false)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase rounded-xl transition cursor-pointer"
                >
                  {lang === "zh" ? "我知道了" : "Got it"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
