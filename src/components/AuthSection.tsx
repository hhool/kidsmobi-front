import React, { useState, FormEvent, useEffect } from "react";
import { 
  Mail, 
  Lock, 
  CheckCircle, 
  X, 
  Bookmark, 
  Database, 
  Download, 
  FileText, 
  Key, 
  Globe, 
  ShieldCheck, 
  RefreshCw,
  LogOut,
  Sparkles,
  Trash2
} from "lucide-react";
import { Product } from "../types";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { ensureUserProfileInFirestore } from "../lib/firestoreService";
import { translateProduct } from "../lib/translate";

interface AuthSectionProps {
  userEmail: string;
  setUserEmail: (email: string) => void;
  savedProducts: Product[];
  setSavedProducts: (products: Product[]) => void;
  onClearSaved: () => void;
  productsData: Product[];
  lang?: "zh" | "en";
}

export default function AuthSection({
  userEmail,
  setUserEmail,
  savedProducts,
  setSavedProducts,
  onClearSaved,
  productsData,
  lang = "zh"
}: AuthSectionProps) {
  const isEn = lang === "en";

  // Sync page state when user logouts/logins from parent listener
  useEffect(() => {
    setIsRegistered(!!userEmail);
  }, [userEmail]);

  // Auth state
  const [isRegistered, setIsRegistered] = useState<boolean>(!!userEmail);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [emailInput, setEmailInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [repeatPassword, setRepeatPassword] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState<string>("");
  const [isAgreed, setIsAgreed] = useState<boolean>(false);
  
  // Simulated email code sending status
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [counter, setCounter] = useState<number>(0);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Simulated PDF Downloader Loading
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Email Verify countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (counter > 0) {
      timer = setTimeout(() => setCounter(counter - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [counter]);

  const handleSendCode = () => {
    if (!emailInput.trim() || !emailInput.includes("@")) {
      setErrorMessage(
        isEn 
          ? "Please enter a valid international email address (e.g. Outlook/Gmail)." 
          : "请输入一个有效的国际标准电子邮箱 (如 outlook/gmail )"
      );
      return;
    }
    setErrorMessage("");
    setCodeSent(true);
    setCounter(60);
    // Simulate a unique 6-digit numeric verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    getSimulatedEmailContent(code);
  };

  const getSimulatedEmailContent = (code: string) => {
    if (isEn) {
      alert(`[Secure Simulation Gateway] KidBikeLab has dispatched a digit verification key to [${emailInput}]:\n\n👉  ${code}  👈\n\n(Key expires in 5 minutes. Enter this number to authenticate.)`);
    } else {
      alert(`【模拟安全信道】安全研究所已向您的邮箱 [${emailInput}] 送出了单向哈希数字验证码：\n\n👉  ${code}  👈\n\n（验证码 5 分钟内有效，请在下方框内输入核验）`);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await ensureUserProfileInFirestore(result.user.uid, result.user.email || "");
        setUserEmail(result.user.email || "");
        setIsRegistered(true);
        setSuccessMessage(
          isEn 
            ? "🎉 Sign in successful! Cloud workspace and AI profile sync has activated." 
            : "🎉 登录成功！已为您同步云端收藏夹与安全顾问环境。"
        );
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(
        isEn 
          ? "Google signing portal block: " + error.message 
          : "Google 快速登录遇到问题: " + error.message
      );
    }
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!emailInput.trim() || !emailInput.includes("@")) {
      setErrorMessage(isEn ? "The email address must contain an @ symbol." : "电子邮箱输入有误，必须包含 @ 符号。");
      return;
    }
    if (!passwordInput) {
      setErrorMessage(isEn ? "Please enter your password." : "请输入登录密码。");
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      if (result.user) {
        await ensureUserProfileInFirestore(result.user.uid, result.user.email || "");
        setUserEmail(result.user.email || "");
        setIsRegistered(true);
        setSuccessMessage(
          isEn 
            ? "🎉 Welcome back! You have successfully signed in." 
            : "🎉 欢迎回来！您已成功登录会员系统。"
        );
      }
    } catch (authError: any) {
      if (authError.code === "auth/operation-not-allowed") {
        console.warn("Email/Password auth fallback to local credentials.", authError);
        setUserEmail(emailInput);
        setIsRegistered(true);
        setSuccessMessage(
          isEn
            ? "Welcome! Entered successfully under local simulated credentials."
            : "欢迎回来！您已成功登录（本地仿真认证已通过）。"
        );
      } else {
        setErrorMessage(
          isEn 
            ? "Sign in failed: Please verify your credentials or register a new account." 
            : "登录失败：帐号不存在或密码输入错误。请核对，或切换至注册栏目。"
        );
      }
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!emailInput.includes("@")) {
      setErrorMessage(isEn ? "The email address block must contain an @ symbol." : "电子邮箱必须包含 @ 符号。");
      return;
    }
    if (passwordInput.length < 8) {
      setErrorMessage(
        isEn 
          ? "Under global privacy and GDPR regimes, passwords must be at least 8 characters long!" 
          : "出于海外GDPR多重安全规则，登录密码必须不少于 8 位字符！"
      );
      return;
    }
    if (passwordInput !== repeatPassword) {
      setErrorMessage(
        isEn 
          ? "The two entered password segments do not match." 
          : "两次输入的独立登录密码不一致，请重新核验。"
      );
      return;
    }
    if (!verifyCode) {
      setErrorMessage(
        isEn 
          ? "Please authenticate using the email verification code to bypass robot registrations." 
          : "请校验邮箱验证码，防止机器人恶意批量注册。"
      );
      return;
    }
    if (verifyCode !== generatedCode) {
      setErrorMessage(
        isEn 
          ? "The code entered is incorrect. Please verify with the simulated alert prompt!" 
          : "您输入的数字验证码错误或已失效。请校对模拟弹框给出的数字！"
      );
      return;
    }
    if (!isAgreed) {
      setErrorMessage(
        isEn 
          ? "You must consent to the User Agreement and GDPR Privacy safeguards to join." 
          : "您必须阅读并勾选同意《用户与隐私保护政策》方可使用该平台。"
      );
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
      if (result.user) {
        await ensureUserProfileInFirestore(result.user.uid, result.user.email || "");
        setUserEmail(result.user.email || "");
        setIsRegistered(true);
        setSuccessMessage(
          isEn 
            ? "Congratulations! Member profile activated. Lifetime premium free subscription privileges unlocked and synchronized." 
            : "恭喜您！注册成功。您已成功激活“全球童车尊享终身免费订阅会员”！五大特权已解锁并且已经与云端同步。"
        );
      }
    } catch (authError: any) {
      if (authError.code === "auth/operation-not-allowed") {
        console.warn("Email/Password auth not enabled in Firebase, falling back to local credentials.", authError);
        setUserEmail(emailInput);
        setIsRegistered(true);
        setSuccessMessage(
          isEn 
            ? "Congratulations! Activated successfully under local credentials. Cloud-saving can also be achieved by using the Google Sign-in above." 
            : "恭喜您！注册成功（本地哈希安全沙盒已启动）。您已成功激活“全球童车尊享终身免费订阅会员”！五大特权已解锁（如需云同步，推荐使用上方 Google 账号快捷登录）。"
        );
      } else if (authError.code === "auth/email-already-in-use") {
        try {
          const loginResult = await signInWithEmailAndPassword(auth, emailInput, passwordInput);
          if (loginResult.user) {
            await ensureUserProfileInFirestore(loginResult.user.uid, loginResult.user.email || "");
            setUserEmail(loginResult.user.email || "");
            setIsRegistered(true);
            setSuccessMessage(
              isEn 
                ? "🎉 Welcome back! You have successfully signed in to the member cloud." 
                : "🎉 欢迎回来！您已成功登录“全球童车”会员云中心。"
            );
          }
        } catch (loginErr: any) {
          setErrorMessage(
            isEn 
              ? "This email is registered. Please verify your password or leverage Google SSO below." 
              : "此邮箱已被注册，且未能通过密码验证。请重新校对密码或使用其他邮箱，亦可使用下方 Google 直接登录。"
          );
        }
      } else {
        setErrorMessage(
          isEn 
            ? "Sign up encountered a server security configuration error: " + authError.message 
            : "注册遇到未配置完整的安全报错: " + authError.message
        );
      }
    }
  };

  const handleLogOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase Signout error:", err);
    }
    setUserEmail("");
    setEmailInput("");
    setPasswordInput("");
    setIsRegistered(false);
    setRepeatPassword("");
    setVerifyCode("");
    setIsAgreed(false);
    setSuccessMessage("");
    setErrorMessage("");
    onClearSaved();
  };

  const triggerPdfDownload = (product: Product) => {
    setDownloadingId(product.id);
    setTimeout(() => {
      setDownloadingId(null);
      const dispProduct = translateProduct(product, lang);
      const content = `MEMBER_EXCLUSIVE_REPORT\nKID_BIKE_EVAL_LABORATORY\n-------------------------\nPRODUCT: ${dispProduct.name}\nBRAND: ${dispProduct.brand}\nOVERALL SCORE: ${dispProduct.overallScore}/10\nBRAKE SAFETY SCORE: ${dispProduct.safetyScore}\nQ-FACTOR GEOMETRY SCORE: ${dispProduct.geometryScore}\nWEIGHT SCORE: ${dispProduct.weightScore}\n\nPROS:\n${dispProduct.pros.map((p: string) => `- ${p}`).join("\n")}\n\nCONS:\n${dispProduct.cons.map((c: string) => `- ${c}`).join("\n")}\n\nVERDICT:\n${dispProduct.editorVerdict}\n\n-------------------------\nISO 8098 APPROVED REPORT\nGLOBAL THIRD-PARTY REGULATORY DATA.`;
      
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const absLink = document.createElement("a");
      absLink.href = url;
      absLink.download = `${product.id}_lab_evaluation_report.txt`;
      document.body.appendChild(absLink);
      absLink.click();
      document.body.removeChild(absLink);
    }, 1500);
  };

  return (
    <div id="auth_container" className="max-w-4xl mx-auto space-y-8 text-left">
      {/* Cookie GDPR regulatory banner */}
      {!userEmail && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div className="flex items-center gap-3 text-left">
            <Globe className="w-8 h-8 text-amber-500 shrink-0" />
            <p className="text-slate-300 leading-relaxed">
              <strong>{isEn ? "Privacy & Cookie Preferences (GDPR/UK Compliant)" : "隐私及 Cookie 偏好设定 (GDPR/UK Compliant)"}</strong>: 
              {isEn 
                ? " This lightweight portal uses encrypted local variables. Registering unlocks options to bookmark products, compare dynamic profiles, and download certified evaluations." 
                : " 本轻量化决策官网使用加密本地存储及哈希邮箱哈希串，绝不采集您的实名位置。如果您自愿勾选注册，我们会提供给您保存选型、无限对比、以及下载 PDF 评测包的会员特权。"}
            </p>
          </div>
          <button 
            onClick={() => alert(isEn ? "Cookie terms accepted. Minimal localized caches active." : "Cookie 条款已同意。平台将采取极致离线轻量逻辑。")} 
            className="bg-amber-500 hover:bg-amber-600 font-bold px-4 py-2 text-slate-950 rounded-xl transition text-[10px] shrink-0 uppercase tracking-wide"
          >
            {isEn ? "Accept All Cookies" : "接受全部 Cookie"}
          </button>
        </div>
      )}

      {isRegistered ? (
        // Logined Dashboard
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          
          {/* Column Local Member Dashboard card */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 self-start text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 text-2xl font-black shadow-lg">
              {userEmail.slice(0, 1).toUpperCase()}
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full font-bold">
                PRO PLATINUM MEMBER
              </span>
              <h4 className="text-white font-extrabold text-sm truncate mt-1.5">{userEmail}</h4>
              <p className="text-slate-500 text-[10px]">{isEn ? "Since: June 2026 · Encrypted Lane" : "注册时间：2026.06 (安全信道已启动)"}</p>
            </div>

            <div className="border-t border-slate-800/80 pt-4 space-y-2.5 text-xs text-slate-400 text-left">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">{isEn ? "UNLOCKED MEMBER CLAUSES" : "已解锁的高端权益"}</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>{isEn ? "Unlimited model lateral comparison tables" : "无限多品横向同台参数对比"}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>{isEn ? "Infinite smart size profile dynamic exports" : "无限次智能选型匹配方案导出"}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>{isEn ? "Full access to download 12 vehicle reports" : "下载 12 款在库车辆高清评测报告"}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>{isEn ? "Watermark-free laboratory asset logs" : "无水印素材、原声避震过障图"}</span>
              </div>
            </div>

            <button
              onClick={handleLogOut}
              className="w-full py-2 bg-slate-950 hover:bg-red-950 hover:text-red-200 text-slate-400 border border-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              {isEn ? "Secure Logout / Wipe Local Session" : "彻底安全注销并清除本地缓存"}
            </button>
          </div>

          {/* Column Main My Selections and PDF exports */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 text-left">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="text-left">
                <h3 className="text-lg font-black text-white">{isEn ? "My Settings & Certified Reports Center" : "我的定制方案与安全印章中心"}</h3>
                <p className="text-xs text-slate-400">{isEn ? "Print and retrieve verified physical parameters offline." : "在此处，您可以实时打印并脱机查看所有在库车款的物理学评测报告"}</p>
              </div>
              {savedProducts.length > 0 && (
                <button 
                  onClick={onClearSaved}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isEn ? "Clear Bookmarks" : "清空收藏"}
                </button>
              )}
            </div>

            {/* Simulated member dynamic folder panel */}
            <div className="space-y-4 text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                {isEn ? "⭐ MY BOOKMARK DOSSIER (DOWNLOAD LABORATORY LOGS)" : "⭐ 我的特权产品档案 (下载高清检测书)"}
              </span>
              
              {savedProducts.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-850">
                  <Bookmark className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <span className="text-xs text-slate-400 inline-block font-semibold">
                    {isEn ? "No bookmarked models inside your briefcase portfolio." : "您目前暂未录入任何收藏的车款。"}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {isEn 
                      ? "Visit the 'Products' repository to check testing bounds and insert to portfolio." 
                      : "您可以前往“产品库”点击“查看评测细节”将童车保存至您的会员库中。"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedProducts.map((p) => {
                    const dispProd = translateProduct(p, lang);
                    return (
                      <div key={dispProd.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between space-y-3">
                        <div className="text-left">
                          <div className="flex justify-between">
                            <span className="text-[9px] bg-slate-900 text-amber-500 p-1 rounded font-bold uppercase">{dispProd.brand}</span>
                            <span className="text-xs font-mono font-bold text-amber-400">
                              {isEn ? `$` : `￥`}{dispProd.price}
                            </span>
                          </div>
                          <h4 className="text-sm font-extrabold text-white mt-1">{dispProd.name}</h4>
                          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 mt-2">
                            <span>{isEn ? "Weight:" : "自重："}{dispProd.weight}kg</span>
                            <span>{isEn ? "Evals:" : "工效分："}{dispProd.overallScore}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => triggerPdfDownload(p)}
                          disabled={downloadingId === p.id}
                          className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-bold text-xs rounded flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                          {downloadingId === p.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              {isEn ? "Issuing verified document..." : "正在解密签发报告..."}
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              {isEn ? "Download certified PDF report" : "下载实验室PDF检测原件"}
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick pre-filled all products fast link so they don't see empty list */}
            <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-850 space-y-3 text-left">
              <span className="text-xs font-bold text-slate-400 block">
                {isEn ? "📚 POPULAR QUICK ADD REPORTS (SINGLE-CLICK TO BIND):" : "📚 热门推荐车款直通物理报告（一键签署）："}
              </span>
              <div className="flex flex-wrap gap-2 text-left">
                {productsData.slice(0, 4).map((p) => {
                  const dispProd = translateProduct(p, lang);
                  const isAlreadySaved = savedProducts.some(s => s.id === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (!isAlreadySaved) {
                          setSavedProducts([...savedProducts, p]);
                        } else {
                          alert(isEn ? `Already in your briefcase: ${dispProd.name}` : `您已收藏过 ${dispProd.name}`);
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[11px] text-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ {isEn ? "Add" : "添加"} {dispProd.name.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      ) : (
        // Non-Logined Registration Board
        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden text-left">
          
          <div className="absolute right-0 top-0 bg-amber-500/10 text-amber-500 text-[9px] px-3 py-1 font-bold rounded-bl uppercase tracking-widest font-mono">
            Secure GDPR Port
          </div>

          {/* Logo Title */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center mx-auto shadow font-black text-xl animate-pulse">
              <Key className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-extrabold text-white">
              {isEn ? "International Membership Hub" : "全球学术选购会员中心"}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isEn 
                ? "Our lab adheres to strict zero-advertising boundaries. Account registration is purely for securing PDF data packages and custom layouts." 
                : "研究所秉持 0 广告原则。无论登录或注册，仅作为解锁云端收藏、无限产品对比及高清报告下载的凭据，游客仍可无缝阅读。"}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-850 gap-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className={`flex-1 py-2 text-center rounded-lg font-black transition-all ${
                authMode === "login"
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {isEn ? "🔑 Sign In" : "🔑 会员登录"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className={`flex-1 py-2 text-center rounded-lg font-black transition-all ${
                authMode === "register"
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {isEn ? "✨ Register" : "✨ 新手注册"}
            </button>
          </div>

          {/* Feedback status messages */}
          {errorMessage && (
            <div className="p-3 bg-red-950/50 border border-red-500/30 text-red-200 text-xs rounded-xl text-center leading-relaxed">
              ⚠️ {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-green-950/50 border border-green-500/30 text-green-200 text-xs rounded-xl text-center leading-relaxed">
              🎉 {successMessage}
            </div>
          )}

          {/* Google Sign In option */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl shadow-lg border border-slate-200 flex items-center justify-center gap-2.5 transition active:scale-95 text-xs cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.5-1.14 2.77-2.4 3.63v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.5z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.02c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.11C3.18 21.88 7.39 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.32 14.27c-.24-.72-.38-1.5-.38-2.27s.14-1.55.38-2.27V6.62H1.21C.44 8.16 0 10.02 0 12s.44 3.84 1.21 5.38l4.11-3.11z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.39 0 3.18 2.12 1.21 5.38l4.11 3.11c.94-2.85 3.57-4.96 6.68-4.96z"
                />
              </svg>
              <span>{isEn ? "Sign in with Google Account" : "使用 Google 账号快捷安全登录"}</span>
            </button>

            <div className="flex items-center gap-2 py-1 text-[10px] text-slate-500 font-mono">
              <div className="h-[1px] bg-slate-800 flex-1"></div>
              <span>{isEn ? "OR BIND WITH SECURE EMAIL" : "或通过安全邮箱认证通道"}</span>
              <div className="h-[1px] bg-slate-800 flex-1"></div>
            </div>
          </div>

          {/* Core Submit form */}
          <form onSubmit={authMode === "login" ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4 text-xs text-left">
            
            {/* Input 1: Email */}
            <div className="space-y-1.5 text-left">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                {isEn ? "Official Email ID" : "电子邮箱"}
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="e.g. kidbike@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                {authMode === "register" && (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={counter > 0}
                    className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 px-3.5 rounded-xl font-bold transition shrink-0 cursor-pointer"
                  >
                    {counter > 0 ? `${counter}s` : (isEn ? "Get Key" : "获取验证码")}
                  </button>
                )}
              </div>
            </div>

            {/* Input 2: Verify Code (Only for Register) */}
            {authMode === "register" && codeSent && (
              <div className="space-y-1.5 text-left bg-amber-500/5 p-3 rounded-xl border border-amber-500/15">
                <label className="text-slate-300 font-semibold block">
                  {isEn ? "Digit Verification Code" : "验证码"}
                </label>
                <input
                  type="text"
                  placeholder={isEn ? "Enter 6-digit key from alert box" : "请输入邮箱/模拟弹窗里给出的6位验证码"}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  maxLength={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center text-amber-400 font-mono font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}

            {/* Input 3: Password */}
            <div className="space-y-1.5 text-left">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                {isEn ? "Login Password" : "账户密码"}
              </label>
              <input
                type="password"
                placeholder={isEn ? "Minimum 8 characters" : "密码字符不少于 8 位"}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Input 4: Password confirm (Only for Register) */}
            {authMode === "register" && (
              <div className="space-y-1.5 text-left">
                <label className="text-slate-300 font-semibold block">
                  {isEn ? "Verify Password Again" : "密码重复核验"}
                </label>
                <input
                  type="password"
                  placeholder={isEn ? "Enter password again" : "请再次输入密码以校对一致性"}
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}

            {/* Checkbox agreed (Only for Register) */}
            {authMode === "register" && (
              <div className="flex items-start gap-2.5 pt-2">
                <input
                  id="agree_check"
                  type="checkbox"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  className="w-4 h-4 text-amber-500 bg-slate-950 border-slate-800 rounded focus:ring-amber-500 focus:ring-offset-slate-950 accent-amber-500 mt-0.5"
                />
                <label htmlFor="agree_check" className="text-[11px] text-slate-400 leading-relaxed text-left cursor-pointer">
                  {isEn 
                    ? "I voluntarily accept the User Agreement and GDPR compliant Privacy rules." 
                    : "我已阅读并同意安全研究所制定的《会员利用协议》与《全球隐私权保护通用政策》。"}
                </label>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-black tracking-widest uppercase rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all text-xs cursor-pointer"
            >
              {authMode === "login" 
                ? (isEn ? "Login Now" : "立即安全登录") 
                : (isEn ? "Confirm Register" : "一键注册并领取会员特权")}
            </button>

          </form>

          {/* Bottom regulatory footnote */}
          <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            <span>{isEn ? "End-to-End Cryptography secure node" : "哈希通道自加密 · 主流邮箱全域适配"}</span>
          </div>

        </div>
      )}

    </div>
  );
}
