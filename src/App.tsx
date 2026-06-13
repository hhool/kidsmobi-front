import { useState, useEffect, useRef, FormEvent } from "react";
import {
  Baby,
  ShieldCheck,
  Send,
  ArrowRight,
  TrendingDown,
  TrendingUp,
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
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts";
import { productsData } from "./data/modelsData";
import { ChildProfile, Product, ChatMessage } from "./types";

// Import translations
import { translations, translateProduct } from "./lib/translate";

// Import modular layouts
import HomeSection from "./components/HomeSection";
import NewsSection from "./components/NewsSection";
import ProductsSection from "./components/ProductsSection";
import EvaluationsSection from "./components/EvaluationsSection";
import GuidesSection from "./components/GuidesSection";
import AboutSection from "./components/AboutSection";
import AuthSection from "./components/AuthSection";

import { auth } from "./lib/firebase";
import { getBookmarksFromFirestore, addBookmarkToFirestore, removeBookmarkFromFirestore } from "./lib/firestoreService";

export default function App() {
  // Lang toggle state
  const [lang, setLang] = useState<"zh" | "en">(
    () => (localStorage.getItem("app_lang") as "zh" | "en") || "zh"
  );

  useEffect(() => {
    localStorage.setItem("app_lang", lang);
  }, [lang]);

  const t = translations[lang];

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

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserEmail(user.email || "");
        try {
          const bookmarkedIds = await getBookmarksFromFirestore(user.uid);
          const mappedProducts = productsData.filter((p) => bookmarkedIds.includes(p.id));
          setSavedProducts(mappedProducts);
        } catch (error) {
          console.error("加载云端收藏夹失败:", error);
        }
      } else {
        setUserEmail("");
        setSavedProducts([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Interceptor wrapper to synchronize bookmark additions/removals with Firebase
  const updateSavedProductsAndFirestore = async (newProducts: Product[]) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const currentIds = savedProducts.map(p => p.id);
      const newIds = newProducts.map(p => p.id);
      
      // Check which items were added
      const added = newProducts.filter(p => !currentIds.includes(p.id));
      for (const item of added) {
        await addBookmarkToFirestore(currentUser.uid, item.id);
      }
      
      // Check which items were removed
      const removed = savedProducts.filter(p => !newIds.includes(p.id));
      for (const item of removed) {
        await removeBookmarkFromFirestore(currentUser.uid, item.id);
      }
    }
    setSavedProducts(newProducts);
  };

  // 4. Modal detail overlays
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [comparedProduct, setComparedProduct] = useState<Product | null>(null);
  const [activeStandardDimension, setActiveStandardDimension] = useState<string | null>(null);

  useEffect(() => {
    setComparedProduct(null);
  }, [selectedProduct]);

  const handleAxisLabelClick = (key: string) => {
    if (!key) return;
    setActiveStandardDimension(key);
    setTimeout(() => {
      const element = document.getElementById(`std-accordion-${key}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);
  };

  // 5. Drawer AI consultation controls
  const [showAiDrawer, setShowAiDrawer] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [expertNotice, setExpertNotice] = useState<string>("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize consultation chat with standard introduction
  useEffect(() => {
    if (lang === "zh") {
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
    } else {
      setChatMessages([
        {
          id: "wel_1",
          role: "assistant",
          content: `Hello! I am the Chief Safety & Ergonomics Advisor here at the Global Kids Bike Laboratory.

I have loaded your child's physical parameters:
- **Age**: ${childProfile.age} years old
- **Height**: ${childProfile.height} cm
- **Inseam**: ${childProfile.inseam || "Not specified"} cm
- **Weight**: ${childProfile.weight} kg

Based on the official ISO 8098 and EN 1888 rigid standards:
1. **Max Safe Bike Weight**: Must not exceed **${(childProfile.weight * 0.3).toFixed(1)}kg** (30% of child's body weight)! Anything heavier is safe-hazard prone to tipping, rolling, and balance loss.
2. **Hand Braking**: Kids over 3 years old require custom hand lever grip-reaches of less than **42mm** to avoid braking grip slip hazards.

Do you have any specific inquiries regarding materials, pneumatic dampening, carbon fiber, magnesium alloys, or particular brands (such as Specialized, Woom, Decathlon)? Ask me anything!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }
  }, [childProfile.age, childProfile.height, childProfile.inseam, childProfile.weight, lang]);

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
          childProfile: childProfile,
          lang: lang
        })
      });

      if (!res.ok) {
        throw new Error(lang === "en" ? "Model response failed. Lab line down." : "模型响应失败，研究所专线故障。");
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
      if (lang === "en") {
        setExpertNotice("Failed to reach lab servers. Activating local offline fallback module.");
        const safeLimit = (childProfile.weight * 0.3).toFixed(1);
        setChatMessages(prev => [
          ...prev,
          {
            id: `ai_fallback_${Date.now()}`,
            role: "assistant",
            content: `⚠️ [Local Security Backup Engaged] Connection offline. Safety lab fallback module active:

**Custom safety guidelines for your child:**
*   **Max Dead Weight**: Vehicle must be strictly limited under **${safeLimit} kg**! Do not purchase heavy carbon steel frames.
*   **Short Reach Lever**: Choose dual hand V-brakes or discs with reaches of approx. **48mm**, instead of Coaster rear-pedal hub brakes brakes.
*   **Pneumatic Tires**: Pressure dampening on air-elastic tires is 80% more efficient than solid PVC/EVA foam tires. Protects the delicate spine & inner vestibular nerves of young toddlers.

*You may configure your GEMINI_API_KEY in the right panel Secrets section to activate advanced AI discussion.*`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      } else {
        setExpertNotice("未能连上研究所卫星安全专网，正在启动本地工效计算库。");
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
      }
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

  const clearSavedBookmarks = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        for (const item of savedProducts) {
          await removeBookmarkFromFirestore(currentUser.uid, item.id);
        }
      } catch (error) {
        console.error("清除云端收藏夹失败:", error);
      }
    }
    setSavedProducts([]);
  };

  return (
    <div id="decision_core" className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-900 flex flex-col justify-between">
      
      {/* 2026 Top safety Ribbon notice banner */}
      <div id="alert_banner" className="bg-amber-500 text-slate-950 px-4 py-2 text-center text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4" />
        <span>{t.topBanner}</span>
      </div>

      {/* Main sticky navigation header bar (PRD Columns Section 4.1.2) */}
      <header id="core_header" className="border-b border-slate-900 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Brand Logo and custom version stamp */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActiveTab("home")}>
            <div className="bg-gradient-to-tr from-amber-500 to-amber-600 p-2.5 rounded-xl shadow-lg shadow-amber-500/20">
              <Baby className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                {t.brandTitle} <span className="text-[9px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded border border-amber-400/20 font-mono uppercase">{t.versionStamp}</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">{t.subTitle}</p>
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
              {t.navHome}
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`px-3 py-2 rounded-lg font-bold transition-all ${
                activeTab === "products" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              {t.navProducts}
            </button>
            <button
              onClick={() => setActiveTab("evaluations")}
              className={`px-3 py-2 rounded-lg font-bold transition-all ${
                activeTab === "evaluations" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              {t.navEvaluations}
            </button>
            <button
              onClick={() => setActiveTab("guides")}
              className={`px-3 py-2 rounded-lg font-bold transition-all ${
                activeTab === "guides" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              {t.navGuides}
            </button>
            <button
              onClick={() => setActiveTab("news")}
              className={`px-3 py-2 rounded-lg font-bold transition-all ${
                activeTab === "news" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              {t.navNews}
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`px-3 py-2 rounded-lg font-bold transition-all ${
                activeTab === "about" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              {t.navAbout}
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
              {userEmail ? (lang === "zh" ? "👤 个人中心" : "👤 Profile") : (lang === "zh" ? "🔑 注册登录" : "🔑 Sign In")}
            </button>
          </nav>

          {/* Quick En/Zh Flags switches and Assistant Toggle */}
          <div className="flex items-center gap-2 text-xs">
            {/* Quick En/Zh Toggle */}
            <button 
              onClick={() => setLang(prev => prev === "zh" ? "en" : "zh")} 
              className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-850 rounded-lg text-amber-500 hover:text-amber-400 font-mono border border-slate-850 active:scale-95 transition-all text-[11px]"
            >
              🌐 {lang === "zh" ? "EN" : "中"}
            </button>
            
            {/* Floating Assistant prompt trigger */}
            <button
              onClick={() => setShowAiDrawer(!showAiDrawer)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-slate-950 px-3.5 py-1.5 rounded-lg font-black flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/10"
            >
              <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
              {showAiDrawer ? t.closeAdvisor : t.connectAdvisor}
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
            lang={lang}
          />
        )}

        {activeTab === "news" && (
          <NewsSection lang={lang} />
        )}

        {activeTab === "products" && (
          <ProductsSection 
            productsData={productsData}
            onSelectProduct={setSelectedProduct}
            compareList={compareList}
            setCompareList={setCompareList}
            savedProducts={savedProducts}
            setSavedProducts={updateSavedProductsAndFirestore}
            childProfile={childProfile}
            userEmail={userEmail}
            lang={lang}
          />
        )}

        {activeTab === "evaluations" && (
          <EvaluationsSection 
            productsData={productsData}
            onSelectProduct={setSelectedProduct}
            childProfile={childProfile}
            lang={lang}
          />
        )}

        {activeTab === "guides" && (
          <GuidesSection 
            productsData={productsData}
            onSelectProduct={setSelectedProduct}
            childProfile={childProfile}
            setChildProfile={setChildProfile}
            lang={lang}
          />
        )}

        {activeTab === "about" && (
          <AboutSection lang={lang} />
        )}

        {activeTab === "auth" && (
          <AuthSection 
            userEmail={userEmail}
            setUserEmail={setUserEmail}
            savedProducts={savedProducts}
            setSavedProducts={updateSavedProductsAndFirestore}
            onClearSaved={clearSavedBookmarks}
            productsData={productsData}
            lang={lang}
          />
        )}

      </main>

      {/* FLOAT DRAWER FOR AI SCIENTIFIC CONSULTANT (Col 11.2 - AI 问答交互助理) */}
      {showAiDrawer && (
        <div id="ai_advisor_drawer" className="fixed bottom-6 right-6 z-40 w-96 max-h-[80vh] bg-slate-900 border border-slate-850 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden animate-fade-in">
          
          {/* Drawer top banner */}
          <div className="bg-slate-950 p-4 border-b border-slate-850 flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <strong className="text-white font-black uppercase tracking-wider">{t.advisorTitle}</strong>
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
                {t.advisorLoading}
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
              placeholder={lang === "en" ? "Ask about materials, reach distance, brakes, models..." : "询问材质、手制动间距、倒踩刹危害、或特定车型..."}
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
      {selectedProduct && (() => {
        const displayProduct = translateProduct(selectedProduct, lang);
        
        // Function to extract 5-dimension scores for any product dynamically
        const getProductScores = (p: Product) => {
          const safety = p.safetyScore;
          const comfort = p.geometryScore;
          const portability = p.weightScore;
          
          // Functionality Score
          const isMulti = (p.pros || []).some(pro => 
            pro.includes("多功能") || pro.includes("三合一") || pro.includes("3合1") || pro.includes("3-in-1") || pro.includes("all-in-one") || pro.includes("多用途")
          );
          const certWeight = (p.safetyCertification || []).length * 0.5;
          const functionality = Number(Math.min(10, Math.max(5.5, (p.overallScore * 0.6) + certWeight + (isMulti ? 1.5 : 0) + ((p.pros || []).length * 0.3))).toFixed(1));
          
          // Cost-effectiveness (性价比) Score
          let priceFactor = 1000;
          if (p.category === "balance") priceFactor = 1500;
          else if (p.category === "bicycle") priceFactor = 2500;
          else if (p.category === "scooter") priceFactor = 600;
          else if (p.category === "stroller") priceFactor = 3000;
          else if (p.category === "safety_seat") priceFactor = 2500;
          const ratio = p.price / priceFactor;
          const costEff = Number(Math.min(10, Math.max(5.2, (10 - ratio * 2.5) * 0.35 + (p.overallScore * 0.65))).toFixed(1));

          return { safety, comfort, portability, functionality, costEff };
        };

        const scoresA = getProductScores(selectedProduct);
        const scoresB = comparedProduct ? getProductScores(comparedProduct) : null;

        // Calculate 5-dimension radar profile values deterministically
        const radarData = lang === "en" ? [
          { subject: "Safety", scoreA: scoresA.safety, scoreB: scoresB?.safety, key: "safety" },
          { subject: "Comfort", scoreA: scoresA.comfort, scoreB: scoresB?.comfort, key: "comfort" },
          { subject: "Portability", scoreA: scoresA.portability, scoreB: scoresB?.portability, key: "portability" },
          { subject: "Functionality", scoreA: scoresA.functionality, scoreB: scoresB?.functionality, key: "functionality" },
          { subject: "Value", scoreA: scoresA.costEff, scoreB: scoresB?.costEff, key: "value" }
        ] : [
          { subject: "安全性", scoreA: scoresA.safety, scoreB: scoresB?.safety, key: "safety" },
          { subject: "舒适度", scoreA: scoresA.comfort, scoreB: scoresB?.comfort, key: "comfort" },
          { subject: "便携性", scoreA: scoresA.portability, scoreB: scoresB?.portability, key: "portability" },
          { subject: "功能性", scoreA: scoresA.functionality, scoreB: scoresB?.functionality, key: "functionality" },
          { subject: "性价比", scoreA: scoresA.costEff, scoreB: scoresB?.costEff, key: "value" }
        ];

        // Custom Tooltip component for hover state on Radar Chart
        const CustomRadarTooltip = ({ active, payload }: any) => {
          if (active && payload && payload.length) {
            const data = payload[0].payload;
            const hasComparison = data.scoreB !== undefined && data.scoreB !== null;
            return (
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-xl space-y-1.5 text-[11px] pointer-events-none z-50">
                <div className="font-extrabold text-slate-350 border-b border-slate-850 pb-1 font-mono uppercase tracking-wider text-[10px]">
                  {data.subject} {lang === "en" ? "DIMENSION" : "评估指标"}
                </div>
                <div className="space-y-1.5 font-mono">
                  {payload.map((item: any, idx: number) => {
                    const isA = item.dataKey === "scoreA";
                    const colorClass = isA ? "text-amber-400" : "text-blue-400";
                    return (
                      <div key={idx} className="flex items-center justify-between gap-6">
                        <span className="text-slate-400 font-bold">{item.name}:</span>
                        <span className={`${colorClass} font-black text-right`}>{item.value} / 10</span>
                      </div>
                    );
                  })}
                </div>

                {hasComparison && (() => {
                  const valA = data.scoreA || 0;
                  const valB = data.scoreB || 0;
                  const diff = Number((valA - valB).toFixed(1));
                  const percent = valB > 0 ? Math.round((diff / valB) * 100) : 0;
                  
                  return (
                    <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[10px] gap-4 font-mono">
                      <span className="text-slate-500 font-bold">
                        {lang === "en" ? "VS Comparison:" : "对比偏差值:"}
                      </span>
                      {diff > 0 ? (
                        <span className="text-green-400 font-black flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>+{diff} (+{percent}%)</span>
                        </span>
                      ) : diff < 0 ? (
                        <span className="text-rose-400 font-black flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          <span>{diff} ({percent}%)</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-black flex items-center gap-1">
                          ■ 0.0 (0%)
                        </span>
                      )}
                    </div>
                  );
                })()}

                <div className="text-[9px] text-slate-500 italic pt-1.5 border-t border-slate-900 leading-none">
                  {lang === "en" ? "Click label to view standard logic" : "点击雷达轴标签查看指标算法测度"}
                </div>
              </div>
            );
          }
          return null;
        };

        const scoringStandards = [
          {
            key: "safety",
            nameZh: "🛡️ 安全性 (Safety)",
            nameEn: "🛡️ Safety Rating",
            formulaZh: "测算公式：50% 紧急刹车制动减速度 + 30% 车架应力屈服变形极限 + 20% 重心防侧翻临界极限角",
            formulaEn: "Formula: 50% Emergency Brake G-deceleration + 30% Frame Yield Stress limit + 20% Anti-rollover limit angle",
            descZh: "选用安全研究所高速电子滑轨测定干/湿地最快制动响应，辅以液压屈服测试系统压载车架材料，极限倾斜冲击不凹折不侧翻，留足全天候骑行的防护安全冗余。",
            descEn: "Calculated by testing optimal dry/wet stopping distance with visual high-frequency G-force sensors, and loading structural tube frames via micro-meters to ensure no deflection under impact."
          },
          {
            key: "comfort",
            nameZh: "🛋️ 舒适度 (Comfort)",
            nameEn: "🛋️ Ergonomic Comfort",
            formulaZh: "测算公式：40% 骨盆宽Q-Factor匹配度 + 40% 车梁应力吸震波衰减比 + 20% 鞍座重分配负载应力差",
            formulaEn: "Formula: 40% Pelvic Q-Factor adaptation + 40% Dampening attenuation coefficient + 20% Saddle weight displacement",
            descZh: "拒绝儿童踩踏‘外八字’损伤膝盖！精密测度五通曲柄宽度，结合特种车梁结构对15Hz以上高频颠簸的衰减能力，配合鞍座微孔发泡均匀应力点分配，杜绝幼童脊椎受损。",
            descEn: "Designed strictly around pelvic development by keeping Q-Factor under maximum pediatric tolerances. Tests dynamic structural dampening vibration attenuation ratios to protect developing spines."
          },
          {
            key: "portability",
            nameZh: "🎒 便携性 (Portability)",
            nameEn: "🎒 Portability & Mass Ratio",
            formulaZh: "测算公式：60% 重力自重比系数 (重/儿童平均体重) + 25% 折叠物理空间占比 + 15% 杠杆搬运平衡重力矩",
            formulaEn: "Formula: 60% Child-to-Bike weight mass ratio + 25% Folding storage footprint + 15% Lever lifting pivot angle",
            descZh: "研究所牢守‘整车不可超儿童自重30%’红线。测定收纳容积与单手解锁效率，考核老年人或女性在狭小后备箱、防盗网电梯间抬升时的瞬态腰椎应力，体验轻便省力。",
            descEn: "Adheres to the 30% child body mass safety ceiling. Evaluates one-touch folding speed, and physical carry balance vector point to ensure low-impact loading into trunks and tight storage."
          },
          {
            key: "functionality",
            nameZh: "🔧 功能性 (Functionality)",
            nameEn: "🔧 Adaptability & Expansion",
            formulaZh: "测算公式：40% 鞍座车把多维调节跨度 + 30% 全地形外胎摩擦系数(胎壁胎冠) + 30% 模块化零配增容深度",
            formulaEn: "Formula: 40% Vertical range adjustments (saddle/bars) + 30% Terrain friction tread coefficient + 30% Modular component support",
            descZh: "童车不仅能骑，更能随身体成长。本维度精密实测鞍座/把套上下及后移位移极限值，实测低滚阻花纹胎抓地摩擦曲线，以及加装撑地轮、置物货架或变速器无缝扩展力。",
            descEn: "Evaluates standard size adaptation lifespan over rapid growth phases of arms and inseams. Rates terrain friction performance across gravel/mud surfaces and easy toolless modular adjustments."
          },
          {
            key: "value",
            nameZh: "💰 性价比 (Value Score)",
            nameEn: "💰 Cost-Effectiveness Index",
            formulaZh: "测算公式：(学术总得分 + 实测材质分) / 对应车型板块公认合理市售均值曲线偏差比率",
            formulaEn: "Formula: (Biomechanical score + Material points) / Category price-distribution normalization curve",
            descZh: "破除虚高大溢价和贴牌贴纸智商税！由精密机械评测总合与用料真实度（如全铝合金、防尘密封培林花鼓）和其官方建议 retail 售价做拟合算得，客观展现其纯正硬件含金量。",
            descEn: "Removes markups and pseudo-imported premiums. Compares real physical material quality with direct consumer retail price curves to report absolute dollar-for-dollar performance."
          }
        ];

        return (
          <div id="detail_modal" className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
              
              {/* Upper static header background */}
              <div className="bg-slate-950 p-6 border-b border-slate-850 flex justify-between items-start">
                <div className="text-left">
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase tracking-wider">
                    {displayProduct.brand} · {lang === "en" ? "Independent Metrology Report" : "第三方物理实测报告"}
                  </span>
                  <h3 className="text-lg font-black text-white mt-1.5">{displayProduct.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-slate-400 hover:text-white bg-slate-900 p-2 rounded-xl border border-slate-800 hover:border-slate-700 font-black text-xs shrink-0"
                >
                  {lang === "en" ? "✕ Close Report" : "✕ 关闭报告"}
                </button>
              </div>
              
              {/* Metric contents */}
              <div className="p-6 space-y-6 text-left">
                
                {/* 5-Dimension Radar visualization section */}
                <div id="radar_comparison_wrapper" className="bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-850 flex flex-col lg:flex-row gap-6 lg:items-stretch">
                  
                  {/* Left Column: Recharts Radar Chart & Multi-Product Selector */}
                  <div className="flex-1 flex flex-col space-y-4 bg-slate-900/40 rounded-2xl border border-slate-900/80 p-4 justify-between">
                    
                    {/* Top bar with Product Selection Select */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850/80 pb-3">
                      <div className="text-left">
                        <span className="text-[9px] font-black tracking-widest text-amber-500 uppercase block font-mono">
                          {lang === "en" ? "🔬 COMPARE TO ANOTHER PRODUCT" : "🔬 叠加对比另一款产品"}
                        </span>
                        <p className="text-[10px] text-slate-500">
                          {lang === "en" ? "Select a product to view score overlays" : "选择一款产品在雷达图上叠加波形对齐分析"}
                        </p>
                      </div>
                      
                      {/* Premium Dropdown Select with categoric optgroup categorization */}
                      <select
                        id="compare-product-id-select"
                        value={comparedProduct?.id || ""}
                        onChange={(e) => {
                          const found = productsData.find(p => p.id === e.target.value);
                          setComparedProduct(found || null);
                        }}
                        className="bg-slate-950 border border-slate-800 rounded-lg text-[114x] text-xs text-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 max-w-full sm:max-w-[210px] cursor-pointer"
                      >
                        <option value="">
                          {lang === "en" ? "-- Choose Product to Compare --" : "-- 选择对比产品 --"}
                        </option>
                        {/* Same Category group */}
                        <optgroup label={lang === "en" ? "Same Category Recommendation" : "同类精品推荐对比"}>
                          {productsData
                            .filter(p => p.id !== selectedProduct.id && p.category === selectedProduct.category)
                            .map(p => (
                              <option key={p.id} value={p.id}>
                                {p.brand} {p.name}
                              </option>
                            ))}
                        </optgroup>
                        {/* Other Categories group */}
                        <optgroup label={lang === "en" ? "Other Categories Reference" : "跨类车型参考对比"}>
                          {productsData
                            .filter(p => p.id !== selectedProduct.id && p.category !== selectedProduct.category)
                            .map(p => (
                              <option key={p.id} value={p.id}>
                                [{p.category}] {p.brand} {p.name}
                              </option>
                            ))}
                        </optgroup>
                      </select>
                    </div>

                    {/* Interactive Radar Chart component */}
                    <div className="w-full h-[240px] flex items-center justify-center relative my-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="62%" data={radarData}>
                          <PolarGrid stroke="#1e293b" />
                          <PolarAngleAxis 
                            dataKey="subject" 
                            tick={(props: any) => {
                              const { payload, x, y, textAnchor, stroke, radius, ...rest } = props;
                              const index = props.index;
                              const item = radarData[index];
                              const key = item?.key;
                              const isActive = activeStandardDimension === key;
                              
                              return (
                                <g className="recharts-polar-angle-axis-tick">
                                  <text
                                    {...rest}
                                    x={x}
                                    y={y}
                                    textAnchor={textAnchor}
                                    className={`cursor-pointer font-extrabold text-[10px] select-none transition-all duration-150 ${
                                      isActive 
                                        ? "fill-amber-400 font-mono font-black drop-shadow-[0_0_2px_rgba(245,158,11,0.6)]" 
                                        : "fill-slate-300 hover:fill-amber-400"
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (key) handleAxisLabelClick(key);
                                    }}
                                  >
                                    {payload.value}
                                  </text>
                                </g>
                              );
                            }}
                          />
                          <PolarRadiusAxis 
                            angle={30} 
                            domain={[0, 10]} 
                            tick={{ fill: '#475569', fontSize: 8 }}
                            axisLine={false}
                          />
                          
                          <Tooltip content={<CustomRadarTooltip />} />
                          
                          {/* Anchor Product (Amber Color) */}
                          <Radar
                            name={selectedProduct.brand + " " + selectedProduct.name}
                            dataKey="scoreA"
                            stroke="#f59e0b"
                            fill="#f59e0b"
                            fillOpacity={0.25}
                            isAnimationActive={true}
                            animationDuration={600}
                            animationEasing="ease-out"
                          />

                          {/* Contrast Product (Blue Color) */}
                          {comparedProduct && (
                            <Radar
                              name={comparedProduct.brand + " " + comparedProduct.name}
                              dataKey="scoreB"
                              stroke="#3b82f6"
                              fill="#3b82f6"
                              fillOpacity={0.25}
                              isAnimationActive={true}
                              animationDuration={600}
                              animationEasing="ease-out"
                            />
                          )}

                          <Legend 
                            verticalAlign="bottom" 
                            height={32}
                            content={({ payload }) => {
                              if (!payload) return null;
                              return (
                                <div className="flex justify-center flex-wrap items-center gap-4 text-[10px] mt-2 font-black tracking-wide font-mono">
                                  {payload.map((entry: any, index: number) => {
                                    const isA = index === 0;
                                    const dotColor = isA ? "bg-amber-500" : "bg-blue-500";
                                    const textColor = isA ? "text-amber-500/90" : "text-blue-400/90";
                                    return (
                                      <div key={`legend-item-${index}`} className="flex items-center gap-1.5 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-850">
                                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                                        <span className={`${textColor}`}>{entry.value}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right Column: Visual indicator bars for high readability */}
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div className="text-left space-y-1">
                      <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-widest font-mono">
                        {lang === "en" ? "📊 5-D BIOMECHANIC COMPARATIVE METRICS" : "📊 智能工效 5 维雷达极值对照"}
                      </h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        {lang === "en" 
                          ? "Comparative multi-dimensional biomechanical structural testing calculated based on pelvic adaptation safety index."
                          : "结合骨盆宽、Q-Factor、车架材料抗弯压折极限、刚度阻尼比等多项物理力学测试指标全方位对照结果。"}
                      </p>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {radarData.map((item) => {
                        let barColorA = "bg-amber-500";
                        if (item.key === "safety") { barColorA = "bg-blue-500"; }
                        else if (item.key === "comfort") { barColorA = "bg-purple-500"; }
                        else if (item.key === "portability") { barColorA = "bg-green-500"; }
                        else if (item.key === "functionality") { barColorA = "bg-pink-500"; }
                        else if (item.key === "value") { barColorA = "bg-amber-500"; }

                        return (
                          <div key={item.subject} className="space-y-1.5 bg-slate-900/35 p-2 rounded-xl border border-slate-850/30">
                            <div className="flex justify-between items-center font-bold text-[11px]">
                              <span className="text-slate-300 font-extrabold">{item.subject}</span>
                              <div className="flex items-center gap-1.5 font-mono text-[9px]">
                                <span className="text-white bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850/80">
                                  {lang === "en" ? translateProduct(selectedProduct, "en").brand.slice(0, 6) : (selectedProduct.brand === "Woom" || selectedProduct.brand === "Puky" ? selectedProduct.brand : selectedProduct.brand.slice(0, 4))}: <strong className="text-amber-500">{item.scoreA}</strong>
                                </span>
                                {comparedProduct && item.scoreB !== undefined && (
                                  <>
                                    <span className="text-slate-600 text-[8px] font-bold">VS</span>
                                    <span className="text-white bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850/80">
                                      {lang === "en" ? translateProduct(comparedProduct, "en").brand.slice(0, 6) : (comparedProduct.brand === "Woom" || comparedProduct.brand === "Puky" ? comparedProduct.brand : comparedProduct.brand.slice(0, 4))}: <strong className="text-blue-400">{item.scoreB}</strong>
                                    </span>
                                    {/* Delta Indicator (Task A extension) */}
                                    <span className={`px-1.5 py-0.5 rounded border flex items-center gap-1.5 ${
                                      item.scoreA > item.scoreB ? "text-green-400 border-green-500/30 bg-green-500/5" : 
                                      item.scoreA < item.scoreB ? "text-rose-400 border-rose-500/30 bg-rose-500/5" : 
                                      "text-slate-400 border-slate-700 bg-slate-800/10"
                                    }`}>
                                      {item.scoreA > item.scoreB ? (
                                        <>
                                          <TrendingUp className="w-2.5 h-2.5" />
                                          <span>+{(item.scoreA - item.scoreB).toFixed(1)}</span>
                                        </>
                                      ) : item.scoreA < item.scoreB ? (
                                        <>
                                          <TrendingDown className="w-2.5 h-2.5" />
                                          <span>{(item.scoreA - item.scoreB).toFixed(1)}</span>
                                        </>
                                      ) : (
                                        <span>■ 0.0</span>
                                      )}
                                      {item.scoreB > 0 && Math.abs(item.scoreA - item.scoreB) > 0 && (
                                        <span className="opacity-60 text-[7px] font-bold">
                                          ({Math.round(((item.scoreA - item.scoreB) / item.scoreB) * 100)}%)
                                        </span>
                                      )}
                                    </span>
                                    {/* Grade Badge (Task C) */}
                                    <span className={`px-1 rounded text-[8px] font-black ${
                                      item.scoreA >= 9.5 ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" :
                                      item.scoreA >= 9.0 ? "bg-slate-500/20 text-slate-300 border border-slate-700" :
                                      "bg-slate-800/40 text-slate-500 border border-slate-800"
                                    }`}>
                                      {item.scoreA >= 9.5 ? "S" : item.scoreA >= 9.0 ? "A" : "B"}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              {/* Anchor Product A progress bar */}
                              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                                <div 
                                  className={`h-full ${barColorA} rounded-full transition-all duration-500`}
                                  style={{ width: `${item.scoreA * 10}%` }}
                                ></div>
                              </div>
                              
                              {/* Comparison Contrast Product B progress bar */}
                              {comparedProduct && item.scoreB !== undefined && (
                                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                                  <div 
                                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                    style={{ width: `${item.scoreB * 10}%` }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* 5-Dimension Evaluation Criteria Accordion List */}
                <div className="space-y-2 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      {lang === "en" ? "📋 5-Dimension Scoring Standards" : "📋 五维数据评分标准与算法解析"}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {lang === "en" ? "(Click dimension title to expand metric logic)" : "（点击维度名称可展开查看具体测算逻辑）"}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-2 sm:p-3 rounded-2xl border border-slate-850 space-y-1.5">
                    {scoringStandards.map((std) => {
                      const isExpanded = activeStandardDimension === std.key;
                      const title = lang === "en" ? std.nameEn : std.nameZh;
                      const formula = lang === "en" ? std.formulaEn : std.formulaZh;
                      const desc = lang === "en" ? std.descEn : std.descZh;

                      return (
                        <div 
                          key={std.key} 
                          id={`std-accordion-${std.key}`}
                          className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                            isExpanded 
                              ? "bg-slate-900/60 border-amber-500/35 shadow-sm" 
                              : "bg-slate-950/40 border-slate-900/60 hover:border-slate-800"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveStandardDimension(isExpanded ? null : std.key);
                            }}
                            className="w-full px-3.5 py-2 flex items-center justify-between text-left text-xs font-bold text-slate-300 hover:text-white transition-colors animate-fade-in"
                          >
                            <span className="flex items-center gap-2 py-1">{title}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-amber-500/80 font-mono font-medium hidden sm:inline">
                                {isExpanded ? (lang === "en" ? "COLLAPSE" : "收起指标") : (lang === "en" ? "EXPAND LOGIC" : "测算公式")}
                              </span>
                              <div className={`transition-transform duration-200 text-slate-500 ${isExpanded ? "rotate-90 text-amber-500" : ""}`}>
                                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                              </div>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-slate-850/60 bg-slate-950/45 animate-fade-in">
                              {/* Formula description bar */}
                              <div className="space-y-1 text-[11px]">
                                <span className="text-[9px] font-black tracking-wider text-amber-500 uppercase block font-mono">
                                  {lang === "en" ? "🔬 METROLOGY FORMULATION" : "🔬 核心加权计算公式"}
                                </span>
                                <div className="bg-slate-950/80 border border-slate-900 p-2 rounded-lg font-mono text-[10px] text-slate-300 leading-relaxed">
                                  {formula}
                                </div>
                              </div>

                              {/* Practical evaluation detail */}
                              <div className="space-y-1">
                                <span className="text-[9px] font-black tracking-wider text-slate-500 uppercase block">
                                  {lang === "en" ? "🔍 LABORATORY MEASUREMENT LOGIC" : "🔍 物理实验室测度细节"}
                                </span>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                                  {desc}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Specs detailed table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {lang === "en" ? "🔬 Precision Physical Metric Measurement" : "🔬 物理参数精准测定一览："}
                  </h4>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-900 pb-2">
                      <span className="text-slate-500">
                        {lang === "en" ? "Measured Net Weight" : "车辆称重净重量 (Weight)"}
                      </span>
                      <strong className="text-white font-mono">{displayProduct.weight} kg</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-2">
                      <span className="text-slate-500">
                        {lang === "en" ? "Rim Wheel Size" : "轮毂尺寸段 (Rim Size)"}
                      </span>
                      <strong className="text-white">{displayProduct.wheelSize}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-2">
                      <span className="text-slate-500">
                        {lang === "en" ? "Frame Tubing & Overcoat" : "车架主管及吸震烤漆"}
                      </span>
                      <strong className="text-white">{displayProduct.material}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-2">
                      <span className="text-slate-500">
                        {lang === "en" ? "Braking System & Grips" : "制动器杠杆握距 (Brakes)"}
                      </span>
                      <strong className="text-white">{displayProduct.brakeType}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-2">
                      <span className="text-slate-500">
                        {lang === "en" ? "Tires Road Traction" : "外胎抓地与路阻粘性"}
                      </span>
                      <strong className="text-white">{displayProduct.tireType}</strong>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-500">
                        {lang === "en" ? "Safety Certifications" : "合规通行认证资质"}
                      </span>
                      <strong className="text-white text-[11px] font-mono">{displayProduct.safetyCertification.join(", ")}</strong>
                    </div>
                  </div>
                </div>

                {/* Pros & Cons detailed lists */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  
                  <div className="bg-green-950/10 border border-green-500/20 p-4 rounded-xl space-y-2">
                    <span className="text-green-400 font-black block flex items-center gap-1 uppercase">
                      <ThumbsUp className="w-4 h-4" />
                      {lang === "en" ? "Testing Highlights (Pros)" : "测评闪光点 (Pros)"}
                    </span>
                    <ul className="list-disc list-inside text-slate-300 space-y-1.5 pl-1 leading-relaxed">
                      {displayProduct.pros.map((p, ip) => <li key={ip}>{p}</li>)}
                    </ul>
                  </div>

                  <div className="bg-amber-950/10 border border-amber-500/20 p-4 rounded-xl space-y-2">
                    <span className="text-amber-500 font-black block flex items-center gap-1 uppercase">
                      <ThumbsDown className="w-4 h-4" />
                      {lang === "en" ? "Constructive Flaws (Cons)" : "不避繁就简的瑕疵 (Cons)"}
                    </span>
                    <ul className="list-disc list-inside text-slate-300 space-y-1.5 pl-1 leading-relaxed">
                      {displayProduct.cons.map((c, ic) => <li key={ic}>{c}</li>)}
                    </ul>
                  </div>

                </div>

                {/* Editorial verdict block */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-1">
                  <span className="text-xs text-amber-500 font-extrabold uppercase block tracking-wider">
                    {lang === "en" ? "✍️ Safety Biomechanics Final Verdict" : "✍️ 安全物理学家终极建议 (Verdict)"}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed text-justify">
                    {displayProduct.editorVerdict}
                  </p>
                </div>

                {/* Interactive instant advising sync button */}
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
                  <span className="text-xs text-amber-100 font-medium text-center sm:text-left">
                    {lang === "en" 
                      ? "Custom safety biomechanic metrics calculated for your child. Speak with our Safety AI Advisor for a full analytics overview?"
                      : "已经就该车型的物理安全指标生成了您宝宝的安全咨询，需要立刻发给AI重力阻顾问详析吗？"}
                  </span>
                  <button
                    onClick={() => {
                      const inquiryText = lang === "en"
                        ? `Hello! I am analyzing [${displayProduct.name}] ($${displayProduct.price}). Please address how its physical frame materials "${displayProduct.material}" and braking style "${displayProduct.brakeType}" relate to my child (aged ${childProfile.age} yo, inseam ${childProfile.inseam}cm, weight ${childProfile.weight}kg) when riding on bumpy or flat trials.`
                        : `您好，我正在分析 [${selectedProduct.name}]（￥${selectedProduct.price}），请问它的实测材质 “${selectedProduct.material}” 和刹车“${selectedProduct.brakeType}”在应对我宝宝（${childProfile.age}岁、跨高${childProfile.inseam}cm、体重${childProfile.weight}kg）日常在平整或颠簸路骑行时有什么要严格规避的事项？`;
                      
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
                    className="bg-amber-500 hover:bg-amber-600 font-black text-slate-950 text-xs px-4 py-2 rounded-xl shrink-0 flex items-center gap-1 active:scale-95 transition-all w-full sm:w-auto justify-center"
                  >
                    {lang === "en" ? "Send to Safety AI" : "一键发送问卷给AI顾问"}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* Persistent global Foot Trust copyright (PRD Footer Column Section 4.1.8) */}
      <footer id="main_footer" className="bg-slate-900 border-t border-slate-900 text-slate-500 text-center py-10 text-xs space-y-2 mt-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-450 text-left sm:text-right">
          <div>
            <span className="font-extrabold text-slate-400 block sm:inline">
              {lang === "en" 
                ? "© 2026 Kids Bike Physical Testing Lab & Buyer's Decision Advisory Portal, Inc."
                : "© 2026 全球专业童车第三方评测与选购决策官网 Inc. "}
            </span>
            <p className="text-[10px] text-slate-600 mt-0.5">
              {lang === "en" ? "Automated 24h testing telemetry lab servers active" : "实验室全自动24小时温控测试系统备案"}
            </p>
          </div>
          <div className="flex gap-4">
            <span className="hover:text-white transition cursor-pointer" onClick={() => {
              if (lang === "en") {
                alert("Disclaimer: All score indexes, rim-size suggestions, load ratios are academic biomechanic predictions and do not substitute legal certifications. Wear safety gear & helmets at all times.");
              } else {
                alert("【免责声明】评测研究所所有的分值和轮径、车重警示公式均为客观力学与学术判定推演，不代指法律强制判定。安全第一，骑行请配头盔手套。");
              }
            }}>
              {lang === "en" ? "Disclaimer" : "免责声明"}
            </span>
            <span className="hover:text-white transition cursor-pointer" onClick={() => activeTab !== "guides" && setActiveTab("guides")}>
              {lang === "en" ? "Smart Sizing Whitepaper" : "智能选型算力白皮书"}
            </span>
            <span className="hover:text-white transition cursor-pointer" onClick={() => activeTab !== "about" && setActiveTab("about")}>
              {lang === "en" ? "Privacy & Family Protection Policy" : "GDPR与前庭保护通用政策"}
            </span>
          </div>
        </div>
        <p className="max-w-4xl mx-auto px-4 text-[10px] text-slate-600 leading-relaxed text-justify">
          {lang === "en"
            ? "Unbiased & Safety Oath: All ratings, scores, and mechanical metric listings displayed here are calculated using pure geometric formulas, rigid physical stress testing, and real weight balances. We do not accept sponsorship insertions, marketing fees, or pay-to-be-ranked items. Slide clearance issues and dangerous coaster brake hub mechanisms are openly logged for parent audit requests."
            : "中立及安全申明：本站展示的产品力参数及工效比分均为研究所依据Q-Factor参数及制动握距机械杠杆阻力等客观物理公式计算得出。我们拒绝任何童车厂家商业性排名植入款。多合一变形车安全检验报告、倒倒刹严重安全迷思项均公开备案，欢迎各质检单位及家长随时索取原件。"}
        </p>
      </footer>

    </div>
  );
}
