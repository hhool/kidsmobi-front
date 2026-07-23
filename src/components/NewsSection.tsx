import React, { useState, useEffect, useMemo } from "react";
import { Search, Calendar, User, Eye, BookOpen, Clock, ArrowLeft, Heart, Share2, Globe, Zap } from "lucide-react";
import { NewsArticle, newsArticles as fallbackNewsArticles } from "../data/newsData";
import { translateNewsArticle } from "../lib/translate";
import { getCMSNews } from "../lib/cmsService";
import { clearJsonLd, setCollectionPageJsonLd, setJsonLd } from "../lib/seoJsonLd";

function translateCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    industry: "行业资讯",
    new_product: "新品发布",
    brand_news: "品牌动态",
    brand_trend: "品牌动态",
    brand_dynamics: "品牌动态",
    regulation: "科普干货",
    science: "科普干货"
  };
  return labels[cat] || "最新动态";
}
import Breadcrumbs from "./Breadcrumbs";

const NEWS_ALLOWED_CATEGORIES = new Set(["industry", "new_product", "brand_news", "science"]);

function normalizeNewsCategory(category: string): NewsArticle["category"] | null {
  const normalized: Record<string, NewsArticle["category"]> = {
    trends: "industry",
    policy: "science",
    brand_trend: "brand_news",
    brand_dynamics: "brand_news",
    industry: "industry",
    new_product: "new_product",
    regulation: "science",
    brand_news: "brand_news",
    science: "science",
  };
  return normalized[category] || null;
}

function withFallbackNews(articles: NewsArticle[]): NewsArticle[] {
  const normalizedArticles = articles
    .map((article) => ({ ...article, category: normalizeNewsCategory(article.category) || article.category }))
    .filter((article) => NEWS_ALLOWED_CATEGORIES.has(article.category));
  const seenIds = new Set(normalizedArticles.map((article) => article.id));
  return [
    ...normalizedArticles,
    ...fallbackNewsArticles.filter((article) => !seenIds.has(article.id)),
  ];
}

interface NewsSectionProps {
  lang?: "zh" | "en";
  currentPage?: number;
  activeCategory?: string;
  activeArticleId?: string;
  onPageChange?: (page: number) => void;
  onPaginationMetaChange?: (meta: { totalPages: number }) => void;
  onCategoryChange?: (category: string) => void;
  onArticleOpen?: (category: string, articleId: string) => void;
  onArticleClose?: () => void;
}

function parseNewsTimestamp(value: unknown): number {
  if (!value) return 0;

  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const raw = value as { seconds?: unknown; _seconds?: unknown; nanoseconds?: unknown; _nanoseconds?: unknown };
  const secondsCandidate =
    typeof raw.seconds === "number"
      ? raw.seconds
      : typeof raw._seconds === "number"
        ? raw._seconds
        : null;
  const nanosCandidate =
    typeof raw.nanoseconds === "number"
      ? raw.nanoseconds
      : typeof raw._nanoseconds === "number"
        ? raw._nanoseconds
        : 0;

  if (secondsCandidate !== null) {
    return secondsCandidate * 1000 + Math.floor(nanosCandidate / 1_000_000);
  }

  return 0;
}

function getCategoryLabel(cat: string, lang: "zh" | "en"): string {
  if (lang === "zh") {
    const labels: Record<string, string> = {
      industry: "行业趋势",
      new_product: "新品发布",
      brand_news: "品牌动态",
      science: "科普干货",
      all: "全部资讯"
    };
    return labels[cat] || "最新动态";
  } else {
    const labels: Record<string, string> = {
      industry: "Industry Trends",
      new_product: "New Launches",
      brand_news: "Brand News",
      science: "Science & Tips",
      all: "All News"
    };
    return labels[cat] || "Latest Updates";
  }
}

export default function NewsSection({
  lang = "zh",
  currentPage = 1,
  activeCategory,
  activeArticleId,
  onPageChange,
  onPaginationMetaChange,
  onCategoryChange,
  onArticleOpen,
  onArticleClose,
}: NewsSectionProps) {
  const [newsArticlesState, setNewsArticlesState] = useState<NewsArticle[]>(fallbackNewsArticles);
  const [loadingNews, setLoadingNews] = useState<boolean>(false);
  const [selectedArticleState, setSelectedArticleState] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date"); // 'date' | 'views'

  // Sync state with activeCategory prop
  useEffect(() => {
    if (activeCategory) {
      setSelectedCategory(activeCategory);
    } else {
      setSelectedCategory("all");
    }
  }, [activeCategory]);

  // Sync state with activeArticleId prop
  useEffect(() => {
    if (activeArticleId) {
      const found = newsArticlesState.find((a) => a.id === activeArticleId);
      if (found) {
        setSelectedArticleState(found);
      } else {
        setSelectedArticleState(null);
      }
    } else {
      setSelectedArticleState(null);
    }
  }, [activeArticleId, newsArticlesState]);

  const handleCategoryClick = (catId: string) => {
    if (onCategoryChange) {
      onCategoryChange(catId);
    } else {
      setSelectedCategory(catId);
    }
  };

  const handleArticleClick = (art: NewsArticle) => {
    if (onArticleOpen) {
      onArticleOpen(art.category, art.id);
    } else {
      setSelectedArticleState(art);
    }
  };

  const handleArticleClose = () => {
    if (onArticleClose) {
      onArticleClose();
    } else {
      setSelectedArticleState(null);
    }
  };

  useEffect(() => {
    if (!selectedArticleState) {
      clearJsonLd("news-detail");
      return;
    }

    const article = translateNewsArticle(selectedArticleState, lang);
    const canonicalUrl = window.location.href;
    setJsonLd("news-detail", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.summary,
      inLanguage: lang,
      author: {
        "@type": "Organization",
        name: article.author || "KIDSMOBI",
      },
      mainEntityOfPage: canonicalUrl,
      url: canonicalUrl,
    });

    return () => clearJsonLd("news-detail");
  }, [selectedArticleState, lang]);

  useEffect(() => {
    setLoadingNews(true);
    // 1. Frist try fetching editable CMS news from the Firestore database
    getCMSNews(true)
      .then((dbNews) => {
        if (dbNews && dbNews.length > 0) {
          const pickLocalized = (item: any, zhValue: string | undefined, enValue: string | undefined, fallback = "") => {
            const zh = String(zhValue || "").trim();
            const en = String(enValue || "").trim();
            if (lang === "en") {
              return en || zh || fallback;
            }
            return zh || en || fallback;
          };

          const mapped: NewsArticle[] = dbNews.map((n) => {
            const updatedMs = parseNewsTimestamp((n as any).updatedAt);
            const publishDate = updatedMs > 0
              ? new Date(updatedMs).toISOString().split("T")[0]
              : "2026-06-15";
            return {
              id: n.id,
              title: pickLocalized(n, n.zh?.title, n.en?.title),
              category: n.category as any,
              categoryLabel: translateCategoryLabel(n.category),
              summary: pickLocalized(n, n.seo?.zh?.description, n.seo?.en?.description, lang === "en" ? "Kidsmobi industry updates and safety insights." : "Kidsmobi 行业动态与科普报告。"),
              content: pickLocalized(n, n.zh?.content, n.en?.content),
              author: lang === "en" ? "Kidsmobi Global Safety Lab" : "Kidsmobi 全球安全实验室",
              readTime: lang === "en" ? "5 min read" : "5 分钟",
              publishDate,
              views: 4200,
            };
          });
          setNewsArticlesState(withFallbackNews(mapped));
          setLoadingNews(false);
        } else {
          throw new Error("No CMS news found in Firestore, falling back to local server endpoint");
        }
      })
      .catch((err) => {
        console.log("Firestore news retrieval failed, fallback to Express API server:", err);
        // 2. Offline fallback to Express local Server API
        fetch("/api/news")
          .then((res) => {
            if (!res.ok) throw new Error("Failed to load news from server");
            return res.json();
          })
          .then((data) => {
            if (Array.isArray(data) && data.length > 0) {
              setNewsArticlesState(withFallbackNews(data));
            }
          })
          .catch((fetchErr) => {
            console.error("Local API server news fetch backup failed:", fetchErr);
          })
          .finally(() => {
            setLoadingNews(false);
          });
      });
  }, [lang]);

  // Like counters holder
  const [likedList, setLikedList] = useState<string[]>([]);
  
  const handleToggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (likedList.includes(id)) {
      setLikedList(likedList.filter(item => item !== id));
    } else {
      setLikedList([...likedList, id]);
    }
  };

  const handleShare = (title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.href} - ${title}`);
    if (lang === "en") {
      alert(`[Link Copied to Clipboard]:\n\nSuccesfully copied "${title}" direct report reference!`);
    } else {
      alert(`【链接已快滑复制到剪切板】:\n\n已成功复制该行业报告/合规解读链接！快去分享给身边的家长等。`);
    }
  };

  const filteredNews = useMemo(() => {
    const sortedSource = [...newsArticlesState].sort((a, b) => {
      const timeDelta = parseNewsTimestamp((b as any).updatedAt) - parseNewsTimestamp((a as any).updatedAt);
      if (timeDelta !== 0) return timeDelta;
      if (sortBy === "views") return b.views - a.views;
      return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
    });

    return sortedSource
      .map(art => translateNewsArticle(art, lang))
      .filter((art) => {
        const normalizedCategory = String(art.category || "").trim().toLowerCase();
        const normalizedSelectedCategory = String(selectedCategory || "all").trim().toLowerCase();
        if (!NEWS_ALLOWED_CATEGORIES.has(normalizedCategory)) return false;
        const matchesCategory = normalizedSelectedCategory === "all" || normalizedCategory === normalizedSelectedCategory;
        const matchesSearch = searchQuery.trim() === "" || 
          art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          art.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      });
  }, [newsArticlesState, searchQuery, selectedCategory, sortBy, lang]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredNews.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pagedNews = filteredNews.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    onPaginationMetaChange?.({ totalPages });
  }, [totalPages, onPaginationMetaChange]);

  useEffect(() => {
    if (selectedArticleState) {
      return;
    }
    const canonicalUrl = window.location.href;
    setCollectionPageJsonLd("news-list", {
      name: lang === "en" ? "E-Mobility News: Kids Electric Bike & Scooter Trends" : "全球童车资讯库",
      url: canonicalUrl,
      items: pagedNews.map((article) => ({
        name: article.title,
        url: canonicalUrl,
      })),
    });
    return () => clearJsonLd("news-list");
  }, [lang, pagedNews, selectedArticleState]);

  return (
    <div id="news_hub" className="space-y-8 animate-fade-in text-left">
      {/* Breadcrumbs (PRD 4.5.2) */}
      {(() => {
        const items = [
          {
            label: lang === "zh" ? "全球资讯" : "GLOBAL NEWS",
            active: selectedCategory === "all" && !selectedArticleState,
            onClick: () => handleCategoryClick("all"),
          },
        ];
        if (selectedCategory && selectedCategory !== "all") {
          items.push({
            label: getCategoryLabel(selectedCategory, lang),
            active: !selectedArticleState,
            onClick: () => handleCategoryClick(selectedCategory),
          });
        }
        if (selectedArticleState) {
          const article = translateNewsArticle(selectedArticleState, lang);
          items.push({
            label: article.title,
            active: true,
            onClick: undefined,
          });
        }
        return (
          <Breadcrumbs
            lang={lang}
            onHomeClick={() => (window as any).setActiveTab?.("home")}
            items={items}
          />
        );
      })()}

      {selectedArticleState ? (() => {
        const article = translateNewsArticle(selectedArticleState, lang);
        return (
          // Detailed Article Post Reader View
          <div className="max-w-3xl mx-auto bg-white border border-slate-100 rounded-[40px] p-8 sm:p-12 space-y-8 shadow-2xl relative animate-fade-in text-left">
            <button
              onClick={handleArticleClose}
              className="flex items-center gap-2 text-xs text-orange-500 hover:text-orange-600 font-black uppercase pb-6 border-b border-slate-50 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              {lang === "en" ? "Back to News" : "返回资讯目录"}
            </button>

            <div className="space-y-4">
              <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-black rounded-full uppercase border border-orange-200">
                {article.categoryLabel}
              </span>
              <h2 className="text-3xl font-black text-slate-900 leading-tight">
                {article.title}
              </h2>

              {/* Author Metadata bar */}
              <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-orange-500" />
                  {article.author}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  {article.publishDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-orange-500" />
                  {lang === "en" ? article.readTime : `阅读约 ${article.readTime}`}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-orange-500" />
                  {lang === "en" 
                    ? `Views: ${article.views + (likedList.includes(article.id) ? 1 : 0)}` 
                    : `累计浏览 ${article.views + (likedList.includes(article.id) ? 1 : 0)} 次`}
                </span>
              </div>
            </div>

            {/* Article Summary Quote */}
            <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100 text-slate-700 text-sm leading-relaxed font-medium italic relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
                <strong>{lang === "en" ? "Summary: " : "摘要："}</strong> {article.summary}
            </div>

            {/* Article Editorial Markdown content body renderer */}
            <div className="text-slate-600 text-sm sm:text-base leading-8 space-y-6 border-t border-slate-50 pt-8">
              {article.content.split("\n\n").map((para: string, ip: number) => {
                if (para.startsWith("### ")) {
                  return <h3 key={ip} className="text-xl font-black text-slate-900 mt-10 mb-4">{para.replace("### ", "")}</h3>;
                }
                if (para.startsWith("#### ")) {
                  return <h4 key={ip} className="text-lg font-bold text-orange-500 mt-8 mb-4">{para.replace("#### ", "")}</h4>;
                }
                if (para.startsWith("* ")) {
                  return (
                    <ul key={ip} className="list-disc list-inside space-y-2 text-slate-500 pl-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      {para.split("\n").map((li, il) => (
                        <li key={il} className="font-medium">{li.replace("* ", "")}</li>
                      ))}
                    </ul>
                  );
                }
                return <p key={ip} className="leading-relaxed text-justify font-medium">{para}</p>;
              })}
            </div>

            {/* KIDSMOBI Lab Recommended Best Picks / Safety Guides Widget */}
            <div className="mt-12 pt-10 border-t border-slate-100 space-y-6">
              <div className="flex items-center gap-2.5">
                <span className="text-sm bg-orange-100 p-1.5 rounded-lg">🔬</span>
                <h4 className="text-md sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                  {lang === "en" ? "KIDSMOBI Lab: Recommended Safety Guides" : "出行实验室：推荐选购安全指南"}
                </h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  {
                    id: "g_stroller",
                    titleZh: "婴儿推车避震与护脊选购硬核指南",
                    titleEn: "Kids Stroller Protection & Ergonomics Master Guide",
                    summaryZh: "科学解析婴儿骨骼负荷，教你如何通过避震连杆、高弹橡胶充气胎阻尼，捍卫宝宝娇嫩的颈椎发育。",
                    summaryEn: "Learn how modern stroller shock absorption and chassis engineering protect toddler's spine development.",
                    slug: "baby-stroller-spine-safety-guide"
                  },
                  {
                    id: "g_bike",
                    titleZh: "儿童自行车与滑步平衡车尺寸安全工效对照表",
                    titleEn: "Kids Bike & Balance Bike Sizing & Safety Chart",
                    summaryZh: "深度解构两轮骑行产品的力学安全偏振，帮助家庭在成长各阶段挑选最合身的轻量化骑行座驾。",
                    summaryEn: "A complete guide on Q-factor, seat heights, and frame geometries for junior bikes.",
                    slug: "toddler-balance-bike-ergonmics"
                  }
                ].map(g => (
                  <div 
                    key={g.id} 
                    onClick={() => {
                      (window as any).setActiveTab?.("guides");
                      (window as any).navigateToPath?.(`/guides/${g.slug}`);
                      if (onArticleClose) {
                        onArticleClose();
                      }
                    }}
                    className="group relative rounded-3xl border border-slate-100 bg-linear-to-b from-white to-slate-50/30 overflow-hidden shadow-xs hover:shadow-xl hover:border-orange-500/20 transition-all cursor-pointer p-6 flex flex-col justify-between space-y-4 animate-fade-in"
                  >
                    <div className="space-y-4 text-left">
                      <span className="text-[10px] font-black uppercase tracking-wider text-orange-500 bg-orange-50 px-2.5 py-0.5 rounded-full inline-block">
                        {lang === "en" ? "Authoritative Guide" : "实验室首选大奖"}
                      </span>
                      <h5 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-orange-500 transition-colors line-clamp-2">
                        {lang === "en" ? g.titleEn : g.titleZh}
                      </h5>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                        {lang === "en" ? g.summaryEn : g.summaryZh}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-black text-slate-400 group-hover:text-orange-500 transition-colors">
                      <span>{lang === "en" ? "Read Guide" : "阅读导购指南"}</span>
                      <span className="group-hover:translate-x-1 transition-transform">➔</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer of article with like and shares */}
            <div className="flex justify-between items-center pt-8 border-t border-slate-50">
              <button
                onClick={handleArticleClose}
                className="px-6 py-3 bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-100 hover:border-slate-200 text-sm rounded-2xl font-black transition-all"
              >
                {lang === "en" ? "Close Reading" : "关闭阅读"}
              </button>
              <div className="flex gap-3">
                <button
                  onClick={(e) => handleToggleLike(article.id, e)}
                  aria-label={lang === "en" ? "Like article" : "点赞文章"}
                  title={lang === "en" ? "Like article" : "点赞文章"}
                  className={`p-3 rounded-2xl border transition-all active:scale-95 ${
                    likedList.includes(article.id)
                      ? "bg-rose-50 border-rose-100 text-rose-500"
                      : "bg-white border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${likedList.includes(article.id) ? "fill-current" : ""}`} />
                </button>
                <button
                  onClick={(e) => handleShare(article.title, e)}
                  aria-label={lang === "en" ? "Share article" : "分享文章"}
                  title={lang === "en" ? "Share article" : "分享文章"}
                  className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-orange-500 hover:border-orange-100 rounded-2xl transition-all active:scale-95"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        );
      })() : (
        // Standard Grid card library list view
        <div className="space-y-12">
          <section className="relative rounded-[48px] bg-slate-950 border border-slate-800 overflow-hidden p-10 sm:p-20 text-center max-w-7xl mx-auto shadow-2xl min-h-[480px] flex items-center justify-center">
            {/* Ambient background with dark overlay */}
            <div className="absolute inset-0 z-0">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                style={{
                  backgroundImage: `url("https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=1600&auto=format&fit=crop")`,
                  opacity: 0.45
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-900/40 to-slate-950/90 mix-blend-multiply"></div>
              {/* Pulsing ambient indicators */}
              <div className="absolute top-0 left-1/4 w-72 h-72 bg-orange-500/10 rounded-full blur-[100px] animate-pulse"></div>
              <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
            </div>

            <div className="relative z-10 space-y-8 w-full max-w-4xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] h-7 font-black uppercase tracking-widest rounded-full shadow-lg backdrop-blur-md">
                <Globe className="w-4 h-4 text-orange-400" />
                {lang === "en" ? "GLOBAL MOBILE SAFETY RESEARCH" : "全球出行安全情报所"}
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                {lang === "en" ? "E-Mobility News: Kids Electric Bike & Scooter Trends" : "全球交通工具动态：儿童电单车与电动滑板车资讯观察"}
              </h1>
              
              <p className="text-slate-200 text-xs sm:text-sm md:text-base max-w-3xl mx-auto leading-relaxed font-semibold drop-shadow-sm">
                {lang === "en"
                  ? "Track industry updates for a premium kids electric bike or a rugged electric dirt bike for kids. We also review foldable electric scooter launches and kids e-scooter safety data."
                  : "深度追踪全球越野电动童车、轻量化儿童滑步车、多档悬挂避震阻尼车架以及可折叠电动滑板车法规标准，权威输出最懂中国供应链的硬核品质指南。"}
              </p>

              {/* Categorization dynamic tabs bar strictly in ordered layout */}
              <div className="flex flex-wrap justify-center gap-3 pt-6 relative z-10">
                {[
                  { id: "all", labelEn: "All Articles", labelZh: "📰 全部文章", descEn: "All published stories", descZh: "查看全部已发布资讯" },
                  { id: "new_product", labelEn: "New Launches", labelZh: "🆕 新品发布", descEn: "First looks at the latest gears", descZh: "最新上市产品的首次亮相及分析" },
                  { id: "science", labelEn: "Science & Tips", labelZh: "🧪 科普干货", descEn: "Ergonomics and child development", descZh: "儿童骨骼发育与产品工效学科普" },
                  { id: "brand_news", labelEn: "Brand News", labelZh: "🏷️ 品牌故事", descEn: "Stories behind major brands", descZh: "主流推车与骑乘品牌背后故事" },
                  { id: "industry", labelEn: "Industry Trends", labelZh: "📊 行业趋势", descEn: "Market analysis and industry shifts", descZh: "全球婴童出行品类发展风向" },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      handleCategoryClick(c.id);
                      setTimeout(() => {
                        const el = document.getElementById("latest-news-grid-anchor");
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }, 100);
                    }}
                    className={`px-5 py-3 rounded-2xl text-xs font-black transition-all border outline-none cursor-pointer ${
                      selectedCategory === c.id
                        ? "bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/20 scale-105"
                        : "bg-white/10 text-slate-200 hover:text-white border-white/15 hover:border-orange-500/30 backdrop-blur-md"
                    }`}
                  >
                    <span>{lang === "zh" ? c.labelZh : c.labelEn}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Cards Render */}
          {filteredNews.length === 0 ? (
            <div className="p-20 text-center bg-white border border-slate-100 rounded-[40px] shadow-sm">
                <span className="text-slate-400 font-medium">
                  {lang === "en" ? "No matches found." : "没找到相关的资讯文章"}
                </span>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="max-w-3xl mx-auto text-center space-y-3">
                <h2 className="text-2xl font-black text-slate-900">
                  {lang === "en" ? "Latest Updates: Foldable Electric Scooter & Dirt Bike Launches" : "最新童车资讯与行业动态"}
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  {lang === "en"
                    ? "Follow kids electric bike safety standards, electric dirt bike for kids launches, and foldable electric scooter commute trends."
                    : "按行业趋势、新品发布与法规政策持续追踪真实市场变化。"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left animate-fade-in">
              {pagedNews.map((art) => (
                <div
                  key={art.id}
                  onClick={() => handleArticleClick(art)}
                  className="bg-white border border-slate-100 hover:border-orange-100 rounded-[40px] p-8 flex flex-col justify-between space-y-6 cursor-pointer hover:shadow-2xl hover:shadow-orange-500/5 transition-all group"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full font-black uppercase border border-orange-100">
                        {art.categoryLabel}
                      </span>
                      <span className="text-slate-400 font-bold">{art.publishDate}</span>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-lg leading-tight group-hover:text-orange-500 transition-colors">
                      {art.title}
                    </h3>
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed font-medium">
                      {art.summary}
                    </p>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-4 border-t border-slate-50 font-bold">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-orange-400" />
                      {art.author.split("-")[0].split(" ")[0]}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-orange-400" />
                        {art.views + (likedList.includes(art.id) ? 1 : 0)}
                      </span>
                      <span className="text-orange-500 group-hover:underline font-black">
                        {lang === "en" ? "read →" : "阅读原文 →"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => onPageChange?.(Math.max(1, safePage - 1))}
                    disabled={safePage <= 1}
                    className="w-10 h-10 rounded-2xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 flex items-center justify-center"
                    aria-label={lang === "en" ? "Go to previous page" : "上一页"}
                  >
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.5 4.5L7 10L12.5 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div
                    className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden"
                    role="progressbar"
                    aria-valuemin={1}
                    aria-valuemax={totalPages}
                    aria-valuenow={safePage}
                    aria-label={lang === "en" ? `Page ${safePage} of ${totalPages}` : `第 ${safePage} 页，共 ${totalPages} 页`}
                  >
                    <div
                      className="h-full bg-slate-900 rounded-full transition-all"
                      style={{ width: `${Math.max(8, (safePage / totalPages) * 100)}%` }}
                    />
                  </div>
                  <button
                    onClick={() => onPageChange?.(Math.min(totalPages, safePage + 1))}
                    disabled={safePage >= totalPages}
                    className="w-10 h-10 rounded-2xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 flex items-center justify-center"
                    aria-label={lang === "en" ? "Go to next page" : "下一页"}
                  >
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.5 4.5L13 10L7.5 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
