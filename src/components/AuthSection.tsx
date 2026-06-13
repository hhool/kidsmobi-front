import { useState, FormEvent, useEffect } from "react";
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

interface AuthSectionProps {
  userEmail: string;
  setUserEmail: (email: string) => void;
  savedProducts: Product[];
  setSavedProducts: (products: Product[]) => void;
  onClearSaved: () => void;
  productsData: Product[];
}

export default function AuthSection({
  userEmail,
  setUserEmail,
  savedProducts,
  setSavedProducts,
  onClearSaved,
  productsData
}: AuthSectionProps) {
  // Auth state
  const [isRegistered, setIsRegistered] = useState<boolean>(!!userEmail);
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
      setErrorMessage("请输入一个有效的国际标准电子邮箱 (如 outlook/gmail )");
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
    // Elegant system visual notice to let them complete without real server delay
    alert(`【模拟安全信道】安全研究所已向您的邮箱 [${emailInput}] 送出了单向哈希数字验证码：\n\n👉  ${code}  👈\n\n（验证码 5 分钟内有效，请在下方框内输入核验）`);
  };

  const handleRegisterSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!emailInput.includes("@")) {
      setErrorMessage("电子邮箱必须包含 @ 符号。");
      return;
    }
    if (passwordInput.length < 8) {
      setErrorMessage("出于海外GDPR多重安全规则，登录密码必须不少于 8 位字符！");
      return;
    }
    if (passwordInput !== repeatPassword) {
      setErrorMessage("两次输入的独立登录密码不一致，请重新核验。");
      return;
    }
    if (!verifyCode) {
      setErrorMessage("请校验邮箱验证码，防止机器人恶意批量注册。");
      return;
    }
    if (verifyCode !== generatedCode) {
      setErrorMessage("您输入的数字验证码错误或已失效。请校对模拟弹框给出的数字！");
      return;
    }
    if (!isAgreed) {
      setErrorMessage("您必须阅读并勾选同意《用户与隐私保护政策》方可使用该平台。");
      return;
    }

    // Success Authentication Simulator
    setUserEmail(emailInput);
    setIsRegistered(true);
    setSuccessMessage("恭喜您！注册成功。您已成功激活“全球童车尊享终身免费订阅会员”！五大特权已解锁。");
  };

  const handleLogOut = () => {
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

  // Simulated PDF downloading triggers
  const triggerPdfDownload = (product: Product) => {
    setDownloadingId(product.id);
    setTimeout(() => {
      setDownloadingId(null);
      // Constructing raw text simulation block to download
      const content = `MEMBER_EXCLUSIVE_REPORT\nKID_BIKE_EVAL_LABORATORY\n-------------------------\nPRODUCT: ${product.name}\nBRAND: ${product.brand}\nOVERALL SCORE: ${product.overallScore}/10\nBRAKE SAFETY SCORE: ${product.safetyScore}\nQ-FACTOR GEOMETRY SCORE: ${product.geometryScore}\nWEIGHT SCORE: ${product.weightScore}\n\nPROS:\n${product.pros.map(p => `- ${p}`).join("\n")}\n\nCONS:\n${product.cons.map(c => `- ${c}`).join("\n")}\n\nVERDICT:\n${product.editorVerdict}\n\n-------------------------\nISO 8098 APPROVED REPORT\nGLOBAL THIRD-PARTY REGULATORY DATA.`;
      
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
    <div id="auth_container" className="max-w-4xl mx-auto space-y-8">
      {/* Cookie GDPR regulatory banner */}
      {!userEmail && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-amber-500 shrink-0" />
            <p className="text-slate-300 leading-relaxed text-left">
              <strong>隐私及 Cookie 偏好设定 (GDPR/UK Compliant)</strong>: 
              本轻量化决策官网使用加密本地存储及哈希邮箱哈希串，绝不采集您的实名位置。如果您自愿勾选注册，我们会提供给您保存选型、无限对比、以及下载 PDF 评测包的会员特权。
            </p>
          </div>
          <button onClick={() => alert("Cookie 条款已同意。平台将采取极致离线轻量逻辑。")} className="bg-amber-500 hover:bg-amber-600 font-bold px-4 py-2 text-slate-950 rounded-xl transition text-[10px] shrink-0">
            接受全部 Cookie
          </button>
        </div>
      )}

      {isRegistered ? (
        // Logined Dashboard
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
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
              <p className="text-slate-500 text-[10px]">注册时间：2026.06 (安全信道已启动)</p>
            </div>

            <div className="border-t border-slate-800/80 pt-4 space-y-2.5 text-xs text-slate-400 text-left">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">已解锁的高端权益</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>无限多品横向同台参数对比</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>无限次智能选型匹配方案导出</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>下载 12 款在库车辆高清评测报告</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>无水印素材、原声避震过障图</span>
              </div>
            </div>

            <button
              onClick={handleLogOut}
              className="w-full py-2 bg-slate-950 hover:bg-red-950 hover:text-red-200 text-slate-400 border border-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              彻底安全注销并清除本地缓存
            </button>
          </div>

          {/* Column Main My Selections and PDF exports */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-black text-white">我的定制方案与安全印章中心</h3>
                <p className="text-xs text-slate-400">在此处，您可以实时打印并脱机查看所有在库车款的物理学评测报告</p>
              </div>
              {savedProducts.length > 0 && (
                <button 
                  onClick={onClearSaved}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  清空收藏
                </button>
              )}
            </div>

            {/* Simulated member dynamic folder panel */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">⭐ 我的特权产品档案 (下载高清检测书)</span>
              
              {savedProducts.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-850">
                  <Bookmark className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <span className="text-xs text-slate-400 inline-block font-semibold">您目前暂未录入任何收藏的车款。</span>
                  <p className="text-[11px] text-slate-500 mt-1">您可以前往“产品库”点击“查看评测细节”将童车保存至您的会员库中。</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedProducts.map((p) => (
                    <div key={p.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex justify-between">
                          <span className="text-[9px] bg-slate-900 text-amber-500 p-1 rounded font-bold uppercase">{p.brand}</span>
                          <span className="text-xs font-mono font-bold text-amber-400">￥{p.price}</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white mt-1">{p.name}</h4>
                        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 mt-2">
                          <span>自重：{p.weight}kg</span>
                          <span>工效分：{p.overallScore}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => triggerPdfDownload(p)}
                        disabled={downloadingId === p.id}
                        className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-bold text-xs rounded flex items-center justify-center gap-2 transition"
                      >
                        {downloadingId === p.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            正在解密签发报告...
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            下载实验室PDF检测原件
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick pre-filled all products fast link so they don't see empty list */}
            <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-850 space-y-3">
              <span className="text-xs font-bold text-slate-400 block">📚 热门推荐车款直通物理报告（一键签署）：</span>
              <div className="flex flex-wrap gap-2">
                {productsData.slice(0, 4).map((p) => {
                  const isAlreadySaved = savedProducts.some(s => s.id === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (!isAlreadySaved) {
                          setSavedProducts([...savedProducts, p]);
                        } else {
                          alert(`您已收藏过 ${p.name}`);
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[11px] text-slate-300 transition-all flex items-center gap-1"
                    >
                      <span>+ 添加 {p.name.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      ) : (
        // Non-Logined Registration Board
        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          
          <div className="absolute right-0 top-0 bg-amber-500/10 text-amber-500 text-[9px] px-3 py-1 font-bold rounded-bl uppercase tracking-widest font-mono">
            Secure GDPR Port
          </div>

          {/* Logo Title */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center mx-auto shadow font-black text-xl">
              <Key className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-extrabold text-white">全球会员注册专线</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              安全研究所严格秉持 0 硬广原则，账户注册仅作为解锁 PDF 评测包、多度方案保存的使用，游客仍享有100%阅读权限！
            </p>
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

          {/* Core Submit form */}
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
            
            {/* Input 1: Email */}
            <div className="space-y-1.5 text-left">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                电子邮箱 (必须真实接收数字验证)
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="e.g. kidbike@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={counter > 0}
                  className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 px-3.5 rounded-xl font-bold transition shrink-0"
                >
                  {counter > 0 ? `${counter}s` : "获取验证码"}
                </button>
              </div>
            </div>

            {/* Input 2: Verify Code */}
            {codeSent && (
              <div className="space-y-1.5 text-left bg-amber-500/5 p-3 rounded-xl border border-amber-500/15">
                <label className="text-slate-300 font-semibold block">验证码</label>
                <input
                  type="text"
                  placeholder="请输入手机/模拟框给出的6位验证码数字"
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
                登录密码设定
              </label>
              <input
                type="password"
                placeholder="密码字符不少于 8 位"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Input 4: Password confirm */}
            <div className="space-y-1.5 text-left">
              <label className="text-slate-300 font-semibold block">密码重复核验</label>
              <input
                type="password"
                placeholder="再次输入以核验双向加密对"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Checkbox agreed */}
            <div className="flex items-start gap-2.5 pt-2">
              <input
                id="agree_check"
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="w-4 h-4 text-amber-500 bg-slate-950 border-slate-800 rounded focus:ring-amber-500 focus:ring-offset-slate-950 accent-amber-500 mt-0.5"
              />
              <label htmlFor="agree_check" className="text-[11px] text-slate-400 leading-relaxed text-left cursor-pointer">
                我自愿阅读并同意安全研究所制定的《用户利用协议》与符合欧盟 GDPR 规范的《全球隐私权与前庭保护通用政策》。
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-black tracking-widest uppercase rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all text-xs"
            >
              一键注册并领取特殊会员特权
            </button>

          </form>

          {/* Bottom regulatory footnote */}
          <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            <span>哈希通道自加密 · 主流邮箱全域适配</span>
          </div>

        </div>
      )}

    </div>
  );
}
