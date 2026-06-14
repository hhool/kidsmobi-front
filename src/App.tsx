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
  Twitter,
  Facebook,
  Youtube,
  Music,
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
import DetailedProductView from "./components/DetailedProductView";

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

  // 4. Detail view state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [comparedProduct, setComparedProduct] = useState<Product | null>(null);
  const [activeStandardDimension, setActiveStandardDimension] = useState<string | null>(null);
  const [previousTab, setPreviousTab] = useState<string>("home");

  const handleSelectProduct = (product: Product | null) => {
    if (product) {
      setPreviousTab(activeTab);
      setSelectedProduct(product);
      setActiveTab("product_detail");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setSelectedProduct(null);
      setActiveTab(previousTab);
    }
  };

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
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [expertNotice, setExpertNotice] = useState<string>("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Update suggestions based on search term
  useEffect(() => {
    if (globalSearchTerm.trim().length > 0) {
      const term = globalSearchTerm.toLowerCase();
      const filtered = productsData.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      ).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [globalSearchTerm]);

  // Handle suggestion click
  const handleSuggestionClick = (product: Product) => {
    setGlobalSearchTerm(product.name);
    setSuggestions([]);
    setIsSearchFocused(false);
    handleSelectProduct(product);
  };

  // Initialize consultation chat with standard introduction
  useEffect(() => {
    if (lang === "zh") {
      setChatMessages([
        {
          id: "wel_1",
          role: "assistant",
          content: `您好呀！我是您的专属育儿选车顾问。😊

我正在查看宝宝的小档案：
- **宝宝年龄**：${childProfile.age} 岁
- **宝宝身高**：${childProfile.height} cm
- **腿长/跨高**：${childProfile.inseam || "还没测？没关系~"} cm
- **宝宝体重**：${childProfile.weight} kg

作为家长的贴心帮手，我特别给您两个建议：
1. **轻便最重要**：车重最好控制在 **${(childProfile.weight * 0.3).toFixed(1)}kg** 以內。这样宝宝摔倒容易自立，推行也不费劲。
2. **刹车要好捏**：3岁以上的孩子手劲小，我会帮您盯着那些“短间距刹把”的车，让宝宝更有掌控感。

您是想了解 Woom、迪卡侬还是闪电的对比，还是想让我直接推荐最适合现在的车型？`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } else {
      setChatMessages([
        {
          id: "wel_1",
          role: "assistant",
          content: `Hi there! I'm your friendly kids' bike expert. 😊

I'm looking at your little one's profile:
- **Age**: ${childProfile.age} years
- **Height**: ${childProfile.height} cm
- **Inseam**: ${childProfile.inseam || "Not measured yet"} cm
- **Weight**: ${childProfile.weight} kg

Here are my top "parent-to-parent" tips:
1. **Lightweight is Best**: Aim for a bike under **${(childProfile.weight * 0.3).toFixed(1)}kg**. It's much safer and easier for them to handle.
2. **Small Hands, Easy Brakes**: I'll help you find bikes with "short-reach" levers so your child can stop safely and confidently.

Would you like to compare brands like Woom, Specialized, or Decathlon, or should I just show you the best fits?`,
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
        throw new Error(lang === "en" ? "Model response failed. Lab line down." : "模型响应失败，实验室专线故障。");
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
        setExpertNotice("未能连上 KIDSMOBI 安全实验室专网，正在启动本地工效计算库。");
        const safeLimit = (childProfile.weight * 0.3).toFixed(1);
        setChatMessages(prev => [
          ...prev,
          {
            id: `ai_fallback_${Date.now()}`,
            role: "assistant",
            content: `⚠️【检测到本地安全备份】连线受阻，KIDSMOBI 启动脱机算力为您解答：

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
    <div id="decision_core" className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-200 selection:text-slate-900 flex flex-col justify-between">
      
      {/* 2026 Consumer Safe Notice banner */}
      <div id="alert_banner" className="bg-orange-500 text-white px-4 py-2 text-center text-[12px] font-bold tracking-normal flex items-center justify-center gap-2 shadow-sm">
        <ShieldCheck className="w-4 h-4" />
        <span>{lang === "zh" ? "宝宝安全红线：车重请务必控制在体重的 30% 以内哦！" : "Safety Tip: Keep bike weight under 30% of your child's body weight!"}</span>
      </div>

      {/* Main sticky navigation header bar (B2C Refined) */}
      <header id="core_header" className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Brand Logo and custom version stamp */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActiveTab("home")}>
            <div className="bg-orange-500 p-2.5 rounded-2xl shadow-lg shadow-orange-500/20">
              <Baby className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                {t.brandTitle} <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">{t.versionStamp}</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium tracking-normal">{lang === "zh" ? "更科学、更贴心的童车导购助手" : "Your Smart & Safe Kids Bike Guide"}</p>
            </div>
          </div>

          {/* Navigation Tabs (B2C Friendly) */}
          <div className="flex items-center gap-4 lg:gap-6 w-full lg:w-auto overflow-x-auto lg:overflow-visible no-scrollbar">
            <nav className="flex items-center bg-slate-100 p-1.5 rounded-2xl gap-1 text-xs shrink-0 whitespace-nowrap">
              {[
                { id: "home", label: t.navHome },
                { id: "products", label: t.navProducts },
                { id: "evaluations", label: t.navEvaluations },
                { id: "guides", label: t.navGuides },
                { id: "news", label: t.navNews },
                { id: "about", label: t.navAbout },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-xl font-bold transition-all ${
                    activeTab === tab.id ? "bg-white text-orange-500 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Header Search & Auth & Lang */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative group hidden md:block">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors z-10 pointer-events-none ${isSearchFocused ? "text-orange-500" : "text-slate-400"}`} />
                <input 
                  type="text" 
                  value={globalSearchTerm}
                  onChange={(e) => setGlobalSearchTerm(e.target.value)}
                  placeholder={isSearchFocused ? (lang === "zh" ? "搜索..." : "Search...") : ""}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  className={`pl-10 pr-0 py-2 bg-slate-100 border-transparent transition-all duration-500 ease-out focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 rounded-xl text-xs font-medium outline-none cursor-pointer focus:cursor-text focus:pr-4 ${isSearchFocused ? "w-64" : "w-10"}`}
                  onKeyUp={(e) => {
                    if (e.key === "Enter") {
                      setActiveTab("products");
                    }
                  }}
                />
                
                {/* Autocomplete Dropdown */}
                {isSearchFocused && suggestions.length > 0 && (
                  <div className="absolute top-full mt-2 left-0 w-64 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {suggestions.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSuggestionClick(p)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors border-b border-slate-50 last:border-0"
                      >
                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                          <img src={p.imageUrl} alt={p.name} className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[11px] font-black text-slate-900 truncate uppercase">{p.brand}</p>
                          <p className="text-[10px] text-slate-500 truncate">{p.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setLang(prev => prev === "zh" ? "en" : "zh")} 
                  className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 font-bold border border-slate-200 active:scale-95 transition-all flex items-center gap-1.5"
                  title={lang === "zh" ? "Switch to English" : "切换至中文"}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-[10px] uppercase">{lang === "zh" ? "EN" : "ZH"}</span>
                </button>
                
                <button
                  onClick={() => setActiveTab("auth")}
                  className={`p-2 rounded-xl font-bold transition-all border ${
                    activeTab === "auth" 
                      ? "bg-orange-500 text-white border-orange-400" 
                      : userEmail 
                        ? "text-emerald-600 border-emerald-100 bg-emerald-50"
                        : "text-slate-500 border-slate-200 hover:text-slate-900 bg-white"
                  }`}
                  title={userEmail ? (lang === "zh" ? "我的收藏" : "My Space") : (lang === "zh" ? "登录" : "Sign In")}
                >
                  <Award className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setShowAiDrawer(!showAiDrawer)}
                  className="bg-slate-900 hover:bg-slate-800 text-white p-2 sm:px-4 sm:py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-slate-900/10"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="hidden sm:inline text-xs">{showAiDrawer ? t.closeAdvisor : t.connectAdvisor}</span>
                </button>
              </div>
            </div>
          </div>


        </div>
      </header>

      {/* Primary content area container */}
      <main id="primary_tab_viewport" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full position-relative">
        
        {activeTab === "home" && (
          <HomeSection 
            productsData={productsData} 
            onSelectProduct={handleSelectProduct} 
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
            onSelectProduct={handleSelectProduct}
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
            onSelectProduct={handleSelectProduct}
            childProfile={childProfile}
            lang={lang}
          />
        )}

        {activeTab === "guides" && (
          <GuidesSection 
            productsData={productsData}
            onSelectProduct={handleSelectProduct}
            childProfile={childProfile}
            setChildProfile={setChildProfile}
            lang={lang}
          />
        )}

        {activeTab === "product_detail" && selectedProduct && (
          <DetailedProductView
            product={selectedProduct}
            onClose={() => handleSelectProduct(null)}
            lang={lang}
            comparedProduct={comparedProduct}
            setComparedProduct={setComparedProduct}
            activeStandardDimension={activeStandardDimension}
            setActiveStandardDimension={setActiveStandardDimension}
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

      {/* FLOAT DRAWER FOR AI ASSISTANT (B2C Friendly) */}
      {showAiDrawer && (
        <div id="ai_advisor_drawer" className="fixed bottom-6 right-6 z-40 w-96 max-h-[80vh] bg-white border border-slate-200 rounded-[32px] shadow-2xl flex flex-col justify-between overflow-hidden animate-fade-in ring-1 ring-slate-900/5">
          
          {/* Drawer top banner */}
          <div className="bg-orange-50 p-5 border-b border-orange-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/30"></div>
              <strong className="text-orange-950 font-bold">{t.advisorTitle}</strong>
            </div>
            <button 
              onClick={() => setShowAiDrawer(false)}
              className="text-orange-300 hover:text-orange-600 p-1.5 rounded-full hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages viewport */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 max-h-[50vh] text-sm">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col space-y-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div className={`max-w-[85%] p-4 rounded-2xl leading-relaxed whitespace-pre-wrap shadow-sm ${
                  msg.role === "user" 
                    ? "bg-orange-500 text-white rounded-tr-none" 
                    : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50"
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-slate-400 font-bold px-1">{msg.timestamp}</span>
              </div>
            ))}
            
            {isAiLoading && (
              <div className="text-left py-2 flex items-center gap-2 text-slate-400 text-[11px] font-medium">
                <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                {t.advisorLoading}
              </div>
            )}
            
            {expertNotice && (
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl text-[11px] text-center border border-orange-100">
                {expertNotice}
              </div>
            )}

            <div ref={chatBottomRef}></div>
          </div>

          {/* Form area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={lang === "en" ? "Ask a question..." : "问问专家建议..."}
              className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
            <button 
              type="submit"
              disabled={isAiLoading || !userInput.trim()}
              className="p-2.5 bg-orange-500 disabled:bg-slate-200 text-white rounded-2xl font-bold transition-all shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

        </div>
      )}

      {/* Persistent global Foot Trust copyright (PRD Footer Column Section 4.1.8) */}
      <footer id="main_footer" className="bg-slate-900 border-t border-slate-800 pt-20 pb-10 text-xs">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Column 1: Brand */}
            <div className="md:col-span-1 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-lg">K</span>
                </div>
                <span className="text-xl font-black text-white tracking-tighter">KIDSMOBI</span>
              </div>
              <p className="text-slate-500 leading-relaxed font-medium pr-4">
                {lang === "en" 
                  ? "Global safety benchmark lab for premium kids mobility. We turn mechanical data into parenting confidence."
                  : "全球高端童车安全基准实验室。我们将繁琐的机械数据转化为父母的选购自信。"}
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-6">
              <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">
                {lang === "en" ? "Review Categories" : "评测分类"}
              </h4>
              <ul className="space-y-3 font-medium">
                <li 
                  className="hover:text-orange-500 transition-colors cursor-pointer text-slate-400"
                  onClick={() => setActiveTab("products")}
                >
                  {lang === "en" ? "Balance Bikes" : "平衡车系列"}
                </li>
                <li 
                  className="hover:text-orange-500 transition-colors cursor-pointer text-slate-400"
                  onClick={() => setActiveTab("products")}
                >
                  {lang === "en" ? "Pedal Cycles" : "脚踏车系列"}
                </li>
                <li 
                  className="hover:text-orange-500 transition-colors cursor-pointer text-slate-400"
                  onClick={() => setActiveTab("guides")}
                >
                  {lang === "en" ? "Sizing Guide" : "智能选型系统"}
                </li>
              </ul>
            </div>

            {/* Column 3: Policy & Support */}
            <div className="space-y-6">
              <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">
                {lang === "en" ? "Transparency" : "透明度与标准"}
              </h4>
              <ul className="space-y-3 font-medium">
                <li 
                  className="hover:text-orange-500 transition-colors cursor-pointer text-slate-400"
                  onClick={() => {
                    if (lang === "en") {
                      alert("Disclaimer: All score indexes, rim-size suggestions, load ratios are academic biomechanic predictions and do not substitute legal certifications.");
                    } else {
                      alert("【免责声明】KIDSMOBI 所有的分值和轮径、车重警示公式均为客观力学与学术判定推演，不代指法律强制判定。");
                    }
                  }}
                >
                  {lang === "en" ? "Disclaimer" : "免责声明专栏"}
                </li>
                <li 
                  className="hover:text-orange-500 transition-colors cursor-pointer text-slate-400"
                  onClick={() => setActiveTab("about")}
                >
                  {lang === "en" ? "Certification Lab" : "实验室认证说明"}
                </li>
                <li 
                  className="hover:text-orange-500 transition-colors cursor-pointer text-slate-400"
                  onClick={() => setActiveTab("about")}
                >
                  {lang === "en" ? "Privacy Policy" : "隐私与数据政策"}
                </li>
              </ul>
            </div>

            {/* Column 4: Connectivity */}
            <div className="space-y-6">
              <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">
                {lang === "en" ? "Global Network" : "社交分享"}
              </h4>
              <div className="flex flex-wrap gap-3">
                <a 
                  href={`https://x.com/intent/tweet?text=${encodeURIComponent(lang === "en" ? "Check out KIDSMOBI - Premium Kids Mobility Evaluation Platform! #KidsMobility #Safety" : "推荐一个高端垂直童车评测平台 KIDSMOBI，专注安全与工效！#童车评测 #育儿")}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-orange-500/50"
                  title="Share on X (Twitter)"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-orange-500/50"
                  title="Share on Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a 
                  href="https://youtube.com/@kidsmobi"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-orange-500/50"
                  title="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <a 
                  href="https://tiktok.com/@kidsmobi"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-orange-500/50"
                  title="TikTok"
                >
                  <Music className="w-4 h-4" />
                </a>
              </div>
              <div className="pt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-green-500 font-bold tracking-tight">
                    {lang === "en" ? "NODES ONLINE" : "实验室节点在线"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <span className="font-extrabold text-slate-400 block">
                {lang === "en" 
                  ? "© 2026 KIDSMOBI Global Safety Lab & Buyer's Decision Advisory Portal, Inc."
                  : "© 2026 KIDSMOBI · 全球高端垂直童车评测决策平台 · 版权所有"}
              </span>
              <p className="text-[10px] text-slate-600">
                {lang === "en" ? "Automated 24h testing telemetry lab servers active" : "KIDSMOBI 全球安全实验室系统备案：322407969155-AIS-K2"}
              </p>
            </div>
            
            <p className="max-w-2xl text-[10px] text-slate-600 leading-relaxed text-left md:text-right italic">
              {lang === "en"
                ? "Unbiased Oath: We do not accept sponsorship insertions or marketing fees. All scores are objective biomechanical results."
                : "独立性声明：KIDSMOBI 拒绝任何商业品牌广告植入。所有评分均基于生物力学客观公式得出。"}
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="max-w-5xl mx-auto text-[9px] text-slate-750 uppercase tracking-[0.2em] opacity-30">
              CPSC · ISO 8098 · GB 14746 · EN 71 · ASTM F963 · PHYS-DATA INTEGRITY COMPLIANT
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
