import { useState, useEffect, useRef, FormEvent } from "react";
import {
  Baby,
  ShieldCheck,
  Send,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  Globe,
  Award,
  BookOpen,
  Search,
  Scale,
  LogOut,
  Maximize2,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  ChevronLeft,
  X
} from "lucide-react";
import { productsData } from "./data/modelsData";
import { ChildProfile, Product, ChatMessage } from "./types";

// Import modular layouts
import HomeSection from "./components/HomeSection";
import NewsSection from "./components/NewsSection";
import ProductsSection from "./components/ProductsSection";
import EvaluationsSection from "./components/EvaluationsSection";
import GuidesSection from "./components/GuidesSection";
import AboutSection from "./components/AboutSection";
import AuthSection from "./components/AuthSection";

export default function App() {
  // 1. Core child mechanics states
  const [childProfile, setChildProfile] = useState<ChildProfile>({
    age: 4,
    height: 102,
    inseam: 38,
    weight: 16,
    experience: "beginner",
  });

  // 2. Active Tab Router: home, news, products, evaluations, guides, about, auth
  const [activeTab, setActiveTab] = useState<string>("home");

  // 3. User local bookmarks, up to 3 compares, and session login email
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");

  // 4. Modal detail overlays
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // 5. Drawer AI consultation controls
  const [showAiDrawer, setShowAiDrawer] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [expertNotice, setExpertNotice] = useState<string>("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize consultation chat with standard introduction
  useEffect(() => {
    setChatMessages([
      {
        id: "wel_1",
        role: "assistant",
        content: `您好！我是“全球童车安全工效研究所”的AI首席重力与安全顾问。

我已经获取了您输入的宝宝当前身体指标：
- **年龄**：${childProfile.age} 岁
- **身高**：${childProfile.height} cm
- **腿内侧跨高 (Inseam)**：${childProfile.inseam || "未测定"} cm
- **体重**：${childProfile.weight} kg

根据国家强制 3C 及欧盟 EN 1888 刚性要求：
1. **最高推荐危险车重**：不得超过 **${(childProfile.weight * 0.3).toFixed(1)}kg**！车重如果超出此死线，哪怕售价再便宜也极易发生转弯侧滚侧摔骨折！
2. **手制动**：3岁以上宝宝必须配置握距小于 **42mm** 的窄距机械刹把，杜绝后蹬倒踩刹隐患。

有什么关于童车车架材质、气胎缓冲、避震疲劳，或具体品牌车款（如 Woom、闪电、九能镁合金）的选择疑问吗？请随时提问！`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  }, [childProfile.age, childProfile.height, childProfile.inseam, childProfile.weight]);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Call API for backend consultation
  const triggerAiResponse = async (messagesHistory: any[]) => {
    setIsAiLoading(true);
    setExpertNotice("");
    try {
      const cleanedMessagesForApi = messagesHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: cleanedMessagesForApi,
          childProfile: childProfile
        })
      });

      if (!res.ok) {
        throw new Error("模型响应失败，研究所专线故障。");
      }

      const data = await res.json();
      setChatMessages(prev => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setExpertNotice("未能连上研究所卫星安全专网，正在启动本地工效计算库。");
      
      // Dynamic fallback based on user inputs
      const safeLimit = (childProfile.weight * 0.3).toFixed(1);
      
      setChatMessages(prev => [
        ...prev,
        {
          id: `ai_fallback_${Date.now()}`,
          role: "assistant",
          content: `⚠️【检测到本地安全备份】连线受阻，安全研究所启动脱机算力为您解答：

**结合宝宝特征的专属规约：**
*   **极限配重**：车辆必须限制在 **${safeLimit} kg** 以内，请勿网购过重的大铁架车。
*   **短距刹把**：选择手刹连杆在 **40mm 左右**的手拉V刹，而非Coaster脚倒刹。
*   **气橡胶胎**：橡胶轮胎因富弹性，泄压缓冲比PVC发泡胎好80%以上，更利于支撑小屁股并降低前庭震荡。

*您可以在右手Secrets面板配置 GEMINI_API_KEY，解锁无阻多轮AI高级专线咨询。*`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isAiLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: userInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setUserInput("");

    await triggerAiResponse(updatedMessages);
  };

  const clearSavedBookmarks = () => {
    setSavedProducts([]);
  };

  return (
    <div id="decision_core" className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-900 flex flex-col justify-between">
      
      {/* 2026 Top safety Ribbon notice banner */}
      <div id="alert_banner" className="bg-amber-500 text-slate-950 px-4 py-2 text-center text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4" />
        <span>全球专业童车第三方实测决策平台 · 遵循 ISO 8098 制动与重力工效规范 · 自费自购 0 赞助</span>
      </div>

      {/* Main sticky navigation header bar (PRD Columns Section 4.1.2) */}
      <header id="core_header" className="border-b border-slate-900 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Brand Logo and custom version stamp */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActiveTab("home")}>
            <div className="bg-gradient-to-tr from-amber-500 to-amber-600 p-2.5 rounded-xl shadow-lg shadow-amber-500/20">
              <Baby className="w-5.5 h-5.5 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                童车评测实验室 <span className="text-[9px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded border border-amber-400/20 font-mono uppercase">2026 OFFICIAL</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">KidBikeLab · 全球选购决策官网</p>
            </div>
          </div>

          {/* Six Column Interactive Tabs Menu (PRD Section 4.1.2) */}
          <nav className="flex flex-wrap bg-slate-950/60 p-1 rounded-xl border border-slate-850 gap-0.5 text-xs">
            <button
              onClick={() => setActiveTab("home")}
              className={`px-3 py-2 rounded-lg font-bold transition-all ${
                activeTab === "home" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              首页
            </button>
            <button
              onClick={() => setActiveTab("news")}
              className={`px-3 py-2 rounded-lg font-bold transition-all ${
                activeTab === "news" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              全球资讯
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`px-3 py-2 rounded-lg font-bold transition-all ${
                activeTab === "products" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              产品大全
            </button>
            <button
              onClick={() => setActiveTab("evaluations")}
              className={`px-3 py-2 rounded-lg font-bold transition-all ${
                activeTab === "evaluations" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              评测中心
            </button>
            <button
              onClick={() => setActiveTab("guides")}
              className={`px-3 py-2 rounded-lg font-bold transition-all ${
                activeTab === "guides" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              选购指南
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`px-3 py-2 rounded-lg font-bold transition-all ${
                activeTab === "about" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              关于我们
            </button>
            <button
              onClick={() => setActiveTab("auth")}
              className={`px-3 py-2 rounded-lg font-bold transition-all border ${
                activeTab === "auth" 
                  ? "bg-amber-500 text-slate-950 border-amber-400" 
                  : userEmail 
                    ? "text-green-400 border-green-500/20 hover:text-green-300"
                    : "text-slate-400 border-transparent hover:text-white"
              }`}
            >
              {userEmail ? "👤 个人中心" : "🔑 注册登录"}
            </button>
          </nav>

          {/* Quick En/Zh Flags switches and Assistant Toggle */}
          <div className="flex items-center gap-2 text-xs">
            {/* Quick En/Zh Toggle */}
            <button onClick={() => alert("【语言通知】平台已自动检测您的浏览器内核为 简体中文。全球翻译站系统正在冷启动中。")} className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white font-mono border border-slate-850">
              🌐 ZH / EN
            </button>
            
            {/* Floating Assistant prompt trigger */}
            <button
              onClick={() => setShowAiDrawer(!showAiDrawer)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-slate-950 px-3.5 py-1.5 rounded-lg font-black flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/10"
            >
              <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
              {showAiDrawer ? "关闭智能顾问" : "连线AI顾问"}
            </button>
          </div>

        </div>
      </header>

      {/* Primary content area container */}
      <main id="primary_tab_viewport" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full position-relative">
        
        {activeTab === "home" && (
          <HomeSection 
            productsData={productsData} 
            onSelectProduct={setSelectedProduct} 
            setActiveTab={setActiveTab}
            childProfile={childProfile}
            setChildProfile={setChildProfile}
          />
        )}

        {activeTab === "news" && (
          <NewsSection />
        )}

        {activeTab === "products" && (
          <ProductsSection 
            productsData={productsData}
            onSelectProduct={setSelectedProduct}
            compareList={compareList}
            setCompareList={setCompareList}
            savedProducts={savedProducts}
            setSavedProducts={setSavedProducts}
            childProfile={childProfile}
            userEmail={userEmail}
          />
        )}

        {activeTab === "evaluations" && (
          <EvaluationsSection 
            productsData={productsData}
            onSelectProduct={setSelectedProduct}
            childProfile={childProfile}
          />
        )}

        {activeTab === "guides" && (
          <GuidesSection 
            productsData={productsData}
            onSelectProduct={setSelectedProduct}
            childProfile={childProfile}
            setChildProfile={setChildProfile}
          />
        )}

        {activeTab === "about" && (
          <AboutSection />
        )}

        {activeTab === "auth" && (
          <AuthSection 
            userEmail={userEmail}
            setUserEmail={setUserEmail}
            savedProducts={savedProducts}
            setSavedProducts={setSavedProducts}
            onClearSaved={clearSavedBookmarks}
            productsData={productsData}
          />
        )}

      </main>

      {/* FLOAT DRAWER FOR AI SCIENTIFIC CONSULTANT (Col 11.2 - AI 问答交互助理) */}
      {showAiDrawer && (
        <div id="ai_advisor_drawer" className="fixed bottom-6 right-6 z-40 w-96 max-h-[80vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden animate-fade-in">
          
          {/* Drawer top banner */}
          <div className="bg-slate-950 p-4 border-b border-slate-850 flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <strong className="text-white font-black uppercase tracking-wider">物理学安全重力 AI 专线顾问</strong>
            </div>
            <button 
              onClick={() => setShowAiDrawer(false)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[50vh] text-xs">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col space-y-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div className={`max-w-[85%] p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user" 
                    ? "bg-amber-500 text-slate-950 font-medium rounded-tr-none" 
                    : "bg-slate-950 text-slate-300 rounded-tl-none border border-slate-850"
                }`}>
                  {msg.content}
                </div>
                <span className="text-[9px] text-slate-600 font-mono px-1">{msg.timestamp}</span>
              </div>
            ))}
            
            {isAiLoading && (
              <div className="text-left py-2 flex items-center gap-2 text-slate-500 text-[10px]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                正在深度解算多重物理工工力学公称公差...
              </div>
            )}
            
            {expertNotice && (
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded text-[10px] text-center border border-amber-500/20">
                {expertNotice}
              </div>
            )}

            <div ref={chatBottomRef}></div>
          </div>

          {/* Form write-in area */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-850 flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="询问材质、手制动间距、倒踩刹危害、或特定车型..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button 
              type="submit"
              disabled={isAiLoading || !userInput.trim()}
              className="px-3 py-2 bg-amber-500 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 rounded-xl font-bold transition flex items-center justify-center shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}

      {/* DETAIL MODAL PANEL DRAWER */}
      {selectedProduct && (
        <div id="detail_modal" className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            
            {/* Upper static header background */}
            <div className="bg-slate-950 p-6 border-b border-slate-850 flex justify-between items-start">
              <div className="text-left">
                <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  {selectedProduct.brand} · 第三方物理实测报告
                </span>
                <h3 className="text-lg font-black text-white mt-1.5">{selectedProduct.name}</h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-white bg-slate-900 p-2 rounded-xl border border-slate-80) hover:border-slate-700 font-black text-xs shrink-0"
              >
                ✕ 关闭报告
              </button>
            </div>

            {/* Metric contents */}
            <div className="p-6 space-y-6 text-left">
              
              {/* Overall Ratings */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                  <span className="text-slate-500 text-[10px] block font-bold leading-none mb-1">科学综合工效分</span>
                  <span className="text-amber-500 text-lg font-black font-mono">{selectedProduct.overallScore}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                  <span className="text-slate-500 text-[10px] block font-bold leading-none mb-1">物理自重比优越值</span>
                  <span className="text-green-400 text-lg font-black font-mono">{selectedProduct.weightScore}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                  <span className="text-slate-500 text-[10px] block font-bold leading-none mb-1">制动与配件安全率</span>
                  <span className="text-blue-400 text-lg font-black font-mono">{selectedProduct.safetyScore}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                  <span className="text-slate-500 text-[10px] block font-bold leading-none mb-1">五通与轴深工效值</span>
                  <span className="text-purple-400 text-lg font-black font-mono">{selectedProduct.geometryScore}</span>
                </div>

              </div>

              {/* Specs detailed table */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">🔬 物理参数精准测定一览：</h4>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-500">车辆称重净重量 (Weight)</span>
                    <strong className="text-white font-mono">{selectedProduct.weight} kg</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-500">轮毂尺寸段 (Rim Size)</span>
                    <strong className="text-white">{selectedProduct.wheelSize}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-500">车架主管及吸震烤漆</span>
                    <strong className="text-white">{selectedProduct.material}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-500">制动器杠杆握距 (Brakes)</span>
                    <strong className="text-white">{selectedProduct.brakeType}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-500">外胎抓地与路阻粘性</span>
                    <strong className="text-white">{selectedProduct.tireType}</strong>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-500">合规通行认证资质</span>
                    <strong className="text-white text-[11px] font-mono">{selectedProduct.safetyCertification.join(", ")}</strong>
                  </div>
                </div>
              </div>

              {/* Pros & Cons detailed lists */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                <div className="bg-green-950/10 border border-green-500/20 p-4 rounded-xl space-y-2">
                  <span className="text-green-400 font-black block flex items-center gap-1 uppercase">
                    <ThumbsUp className="w-4 h-4" />
                    测评闪光点 (Pros)
                  </span>
                  <ul className="list-disc list-inside text-slate-300 space-y-1.5 pl-1 leading-relaxed">
                    {selectedProduct.pros.map((p, ip) => <li key={ip}>{p}</li>)}
                  </ul>
                </div>

                <div className="bg-amber-950/10 border border-amber-500/20 p-4 rounded-xl space-y-2">
                  <span className="text-amber-500 font-black block flex items-center gap-1 uppercase">
                    <ThumbsDown className="w-4 h-4" />
                    不避繁就简的瑕疵 (Cons)
                  </span>
                  <ul className="list-disc list-inside text-slate-300 space-y-1.5 pl-1 leading-relaxed">
                    {selectedProduct.cons.map((c, ic) => <li key={ic}>{c}</li>)}
                  </ul>
                </div>

              </div>

              {/* Editorial verdict block */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-1">
                <span className="text-xs text-amber-500 font-extrabold uppercase block tracking-wider">
                  ✍️ 安全物理学家终极建议 (Verdict)
                </span>
                <p className="text-xs text-slate-300 leading-relaxed text-justify">
                  {selectedProduct.editorVerdict}
                </p>
              </div>

              {/* Interactive instant advising sync button */}
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
                <span className="text-xs text-amber-100 font-medium text-center sm:text-left">
                  已经就该车型的物理安全指标生成了您宝宝的安全咨询，需要立刻发给AI重力阻顾问详析吗？
                </span>
                <button
                  onClick={() => {
                    const inquiryText = `您好，我正在分析 [${selectedProduct.name}]（￥${selectedProduct.price}），请问它的实测材质 “${selectedProduct.material}” 和刹车“${selectedProduct.brakeType}”在应对我宝宝（${childProfile.age}岁、跨高${childProfile.inseam}cm、体重${childProfile.weight}kg）日常在平整或颠簸路骑行时有什么要严格规避的事项？`;
                    setSelectedProduct(null);
                    setShowAiDrawer(true);
                    
                    // Trigger dynamic instant chat user message simulation
                    setChatMessages(prev => [
                      ...prev,
                      {
                        id: `usr_${Date.now()}`,
                        role: "user",
                        content: inquiryText,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    ]);
                    triggerAiResponse([...chatMessages, { id: `usr_${Date.now()}`, role: "user", content: inquiryText }]);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 font-black text-slate-950 text-xs px-4 py-2 rounded-xl shrink-0 flex items-center gap-1 active:scale-95 transition-all"
                >
                  一键发送问卷给AI顾问
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Persistent global Foot Trust copyright (PRD Footer Column Section 4.1.8) */}
      <footer id="main_footer" className="bg-slate-900 border-t border-slate-900 text-slate-500 text-center py-10 text-xs space-y-2 mt-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-450 text-left sm:text-right">
          <div>
            <span className="font-extrabold text-slate-400 block sm:inline">© 2026 全球专业童车第三方评测与选购决策官网 Inc. </span>
            <p className="text-[10px] text-slate-600 mt-0.5">实验室全自动24小时温控测试系统备案</p>
          </div>
          <div className="flex gap-4">
            <span className="hover:text-white transition cursor-pointer" onClick={() => alert("【免责声明】评测研究所所有的分值和轮径、车重警示公式均为客观力学与学术判定推演，不代指法律强制判定。安全第一，骑行请配头盔手套。")}>免责声明</span>
            <span className="hover:text-white transition cursor-pointer" onClick={() => activeTab !== "guides" && setActiveTab("guides")}>智能选型算力白皮书</span>
            <span className="hover:text-white transition cursor-pointer" onClick={() => activeTab !== "about" && setActiveTab("about")}>GDPR与前庭保护通用政策</span>
          </div>
        </div>
        <p className="max-w-4xl mx-auto px-4 text-[10px] text-slate-600 leading-relaxed text-justify">
          中立及安全申明：本站展示的产品力参数及工效比分均为研究所依据Q-Factor参数及制动握距机械杠杆阻力等客观物理公式计算得出。我们拒绝任何童车厂家商业性排名植入款。多合一变形车安全检验报告、倒倒刹严重安全迷思项均公开备案，欢迎各质检单位及家长随时索取原件。
        </p>
      </footer>

    </div>
  );
}
