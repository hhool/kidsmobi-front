import React, { useState, useEffect } from "react";
import { 
  Globe,
  AlertCircle,
  Database,
  HelpCircle,
  X,
  Key,
  Copy,
  Check,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../lib/firebase";
import { checkIsAdmin, seedProductsToFirestore } from "../lib/cmsService";
import { productsData as defaultProductsData } from "../data/modelsData";
import { translateProduct } from "../lib/translate";
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
  const [syncing, setSyncing] = useState(false);
  const [showHelpTip, setShowHelpTip] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  };

  const handleForceSync = async () => {
    const confirm = window.confirm(lang === "zh" ? "您确定要强制同步数据到 Firestore 吗？这将会使用默认车型数据重新初始化并清空不兼容格式的数据。" : "Are you sure you want to force sync products to Firestore? This will serialize correct default stroller structures directly into your Firestore project.");
    if (!confirm) return;
    setSyncing(true);
    try {
      const success = await seedProductsToFirestore(defaultProductsData, translateProduct);
      if (success) {
        alert(lang === "zh" ? "数据强制同步成功！" : "Database force-sync completed successfully!");
        window.location.reload();
      } else {
        alert(lang === "zh" ? "同步失败，请检查控制台。" : "Sync failed, please consult console logs.");
      }
    } catch (e: any) {
      console.error("Force sync failed:", e);
      let errorMsg = e.message || String(e);
      if (errorMsg.includes("Missing or insufficient permissions")) {
        alert(
          lang === "zh"
            ? "❌ 同步失败（权限不足）：您当前可能没有在 Firebase Auth 进行真实安全登录（请确保您在“我的账户”进行了 Google 账号登录）。本地开发者 bypass 模式仅用于浏览，无法直接对云数据库进行写操作。建议您退出并使用 real hhool.student@gmail.com 谷歌账号登录。"
            : "❌ Sync failed (Missing or insufficient permissions): You might not be securely signed in to Firebase Auth. Check your profile in the Account section and authenticate via Google popup. Developer bypass is read-only on the cloud DB."
        );
      } else {
        alert((lang === "zh" ? "同步出错: " : "Sync Error: ") + errorMsg);
      }
    } finally {
      setSyncing(false);
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
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} lang={lang} onClose={onClose} />
      
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
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelpTip(true)}
              className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-705 px-4 py-2 rounded-xl font-bold uppercase tracking-wide flex items-center gap-1.5 cursor-pointer transition active:scale-95 text-slate-700"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
              {lang === "zh" ? "权限说明与排错" : "Permissions Guide"}
            </button>
            <button
              onClick={handleForceSync}
              disabled={syncing}
              className="text-[11px] bg-amber-500 hover:bg-amber-600 disabled:bg-amber-100 text-slate-950 disabled:text-slate-400 px-4 py-2 rounded-xl font-black uppercase tracking-wide hover:shadow-md disabled:hover:shadow-none disabled:opacity-70 flex items-center gap-1.5 cursor-pointer transition active:scale-95"
            >
              <Database className="w-3.5 h-3.5 animate-pulse" />
              {syncing ? (lang === "zh" ? "同步中..." : "Syncing...") : (lang === "zh" ? "强制同步数据" : "Force Sync Data")}
            </button>
          </div>
        </div>

        <div className="p-10 max-w-7xl mx-auto w-full flex-1">
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
                      ? "您当前正在使用本地开发者影子账户进行离线预览和浏览。由于未在 Firebase Auth 云端服务中完成 Google 真实鉴权，所有发布和强制同步操作都将被 Firestore 安全规则拒绝。若需持久化发布和同步，请回到首页使用 real hhool.student@gmail.com 谷歌账号登录。"
                      : "You are active via developer bypass. Since this session is not securely authenticated on the real Firebase Auth backend, database modifications or synces will fail due to Firestore Security Rules. Authenticate via Google profile from Account section to publish edits sustainably."}
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
           {activeMenu === "products" && <ProductManager lang={lang} />}
           {activeMenu === "evaluations" && <EvaluationManager lang={lang} />}
           {activeMenu === "guides" && <GuideManager lang={lang} />}
           {activeMenu === "news" && <NewsManager lang={lang} />}
           {activeMenu === "settings" && <SettingsManager lang={lang} />}
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
                      "当您（在控制台或自动脚本中）读取或写入数据时，若操作违反了根目录 firestore.rules 里的安全保护限制，Firestore 就会拒绝该请求。您需要更新控制规则来给当前管理员授权。" : 
                      "This occurs when your database request (read/write/update) violates the access constraints configured in your 'firestore.rules' file. Granting read/write access to your logged-in administrator resolves this immediately."}
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
                      <span>Option A: Edit firestore.rules</span>
                      <button
                        onClick={() => handleCopy(
`function isAdmin() {
  return isSignedIn() && (
    exists(/databases/\$(database)/documents/admins/\$(request.auth.uid)) ||
    request.auth.token.email == "${auth.currentUser?.email || "your-email@gmail.com"}"
  );
}`, "rules-code")}
                        className="text-slate-500 hover:text-slate-300 flex items-center gap-1 transition cursor-pointer"
                      >
                        {copiedField === "rules-code" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedField === "rules-code" ? "Copied" : "Copy Target"}
                      </button>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                        {lang === "zh" ? 
                          "在项目根目录找到 firestore.rules 文件，找到 `isAdmin()` 辅助函数，在其中加入基于 token 的邮箱验证：" : 
                          "Locate firestore.rules in the workspace, inspect `isAdmin()`, and add a verification check matching your admin identity email directly:"}
                      </p>
                      <pre className="text-emerald-400 overflow-x-auto p-1 leading-normal">
{`function isAdmin() {
  return isSignedIn() && (
    exists(/databases/$(database)...) ||
    request.auth.token.email == "${auth.currentUser?.email || "your-email@gmail.com"}"
  );
}`}
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
                        "直接在您的 Firestore 数据库中，添加名为 `admins` 的集合。并在其中创建以您 UID (见上方凭证) 为文档 ID (ID) 的空文档。该账户便将获得全组安全访问权限。" : 
                        "Inside your Firestore dashboard, create a collection named 'admins'. Insert an empty document with its Document-ID explicitly set to your UID. The system will recognize your auth context in real-time."}
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
                      "我们自带高效的自动引擎。一旦您检测并修改完毕根目录的 firestore.rules 文件并保存，系统会自动检测该更动并立即为您的 Firestore 执行规则部署。在此之后点击上面的 '强制同步数据' 即可顺利写库。" : 
                      "The platform deploys rules dynamically. Once you modify the local 'firestore.rules' file, our background build automatically compiles and performs a firebase deployment to your live cloud database instance."}
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
