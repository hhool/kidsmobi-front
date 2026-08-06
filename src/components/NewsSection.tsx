import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, Calendar, User, Eye, BookOpen, Clock, ArrowLeft, Heart, Share2, Globe, Zap } from "lucide-react";
import { NewsArticle, newsArticles as fallbackNewsArticles } from "../data/newsData";
import { getCMSNews } from "../lib/cmsService";
import { clearJsonLd, setCollectionPageJsonLd, setJsonLd } from "../lib/seoJsonLd";

import Breadcrumbs from "./Breadcrumbs";
import { getPageCopy } from "../config/pageCopy";

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

function normalizeAndFilterNews(articles: NewsArticle[]): NewsArticle[] {
  return articles
    .map((article) => ({ ...article, category: normalizeNewsCategory(article.category) || article.category }))
    .filter((article) => NEWS_ALLOWED_CATEGORIES.has(article.category));
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

function hasCjk(value: string): boolean {
  return /[\u3400-\u9FFF]/.test(value);
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
  const newsCopy = getPageCopy(lang).news;
  const [newsArticlesState, setNewsArticlesState] = useState<NewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState<boolean>(false);
  const [selectedArticleState, setSelectedArticleState] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date"); // 'date' | 'views'
  const breadcrumbsAnchorRef = useRef<HTMLDivElement | null>(null);

  const alignViewportToBreadcrumbs = () => {
    if (typeof window === "undefined") return;
    const el = breadcrumbsAnchorRef.current;
    if (!el) return;
    const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 96);
    window.scrollTo({ top, behavior: "auto" });
  };

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

  useEffect(() => {
    if (!activeArticleId || !selectedArticleState) return;
    const timer = window.setTimeout(() => {
      alignViewportToBreadcrumbs();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeArticleId, selectedArticleState]);

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

  const scrollToNewsListModule = () => {
    const anchor = document.getElementById("latest-news-grid-anchor") || document.getElementById("news_hub");
    if (!anchor) return;
    window.requestAnimationFrame(() => {
      const absoluteTop = anchor.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: Math.max(0, absoluteTop), behavior: "smooth" });
    });
  };

  const handleNewsPageNavigate = (page: number) => {
    localStorage.setItem("scrollToNewsList", "true");
    onPageChange?.(page);
  };

  useEffect(() => {
    if (localStorage.getItem("scrollToNewsList") !== "true") return;
    localStorage.removeItem("scrollToNewsList");
    const timer = window.setTimeout(() => {
      scrollToNewsListModule();
    }, 140);
    return () => window.clearTimeout(timer);
  }, [currentPage]);

  useEffect(() => {
    if (!selectedArticleState) {
      clearJsonLd("news-detail");
      return;
    }

    const article = selectedArticleState;
    const canonicalUrl = window.location.href;
    setJsonLd("news-detail", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.summary,
      inLanguage: lang,
      author: {
        "@type": "Organization",
        name: article.author || "BalanceBikeToddler",
      },
      mainEntityOfPage: canonicalUrl,
      url: canonicalUrl,
    });

    return () => clearJsonLd("news-detail");
  }, [selectedArticleState, lang]);

  useEffect(() => {
    setLoadingNews(true);
    // 1. Fetch editable CMS news from current CMS API.
    getCMSNews(true)
      .then((dbNews) => {
        if (dbNews && dbNews.length > 0) {
          const pickLocalized = (
            item: any,
            zhValue: string | undefined,
            enValue: string | undefined,
            fallback = "",
            options?: { allowZhFallbackInEnglish?: boolean },
          ) => {
            const zh = String(zhValue || "").trim();
            const en = String(enValue || "").trim();
            if (lang === "en") {
              if (en) return en;
              if (options?.allowZhFallbackInEnglish && zh && !hasCjk(zh)) return zh;
              return fallback;
            }
            return zh || en || fallback;
          };

          const mapped: NewsArticle[] = dbNews.map((n) => {
            const updatedMs = parseNewsTimestamp((n as any).updatedAt);
            const publishDate = updatedMs > 0
              ? new Date(updatedMs).toISOString().split("T")[0]
              : "2026-06-15";
            const normalizedCategory = normalizeNewsCategory(String(n.category || "")) || "industry";
            return {
              id: n.id,
              title: pickLocalized(n, n.zh?.title, n.en?.title, "News Update"),
              category: normalizedCategory,
              categoryLabel: getCategoryLabel(normalizedCategory, lang),
              summary: pickLocalized(n, n.seo?.zh?.description, n.seo?.en?.description, newsCopy.fallbackSummary),
              content: pickLocalized(n, n.zh?.content, n.en?.content, newsCopy.fallbackContent),
              author: newsCopy.fallbackAuthor,
              readTime: newsCopy.fallbackReadTime,
              publishDate,
              views: 4200,
            };
          });
          setNewsArticlesState(normalizeAndFilterNews(mapped));
          setLoadingNews(false);
        } else {
          throw new Error("No published CMS news found, falling back to local server endpoint");
        }
      })
      .catch((err) => {
        console.log("CMS news retrieval failed, fallback to Express API server:", err);
        // 2. Offline fallback to Express local Server API
        fetch("/api/news")
          .then((res) => {
            if (!res.ok) throw new Error("Failed to load news from server");
            return res.json();
          })
          .then((data) => {
            if (Array.isArray(data) && data.length > 0) {
              const normalizedFallback = data.map((item) => {
                const normalizedCategory = normalizeNewsCategory(String(item?.category || "")) || "industry";
                const titleRaw = String(item?.title || "").trim();
                const summaryRaw = String(item?.summary || "").trim();
                const contentRaw = String(item?.content || "").trim();
                return {
                  ...item,
                  category: normalizedCategory,
                  categoryLabel: getCategoryLabel(normalizedCategory, lang),
                  title: lang === "en" && hasCjk(titleRaw) ? "News Update" : titleRaw,
                  summary: lang === "en" && hasCjk(summaryRaw)
                    ? newsCopy.fallbackSummary
                    : summaryRaw,
                  content: lang === "en" && hasCjk(contentRaw)
                    ? newsCopy.fallbackContent
                    : contentRaw,
                };
              });
              setNewsArticlesState(normalizeAndFilterNews(normalizedFallback));
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

  useEffect(() => {
    setNewsArticlesState((prev) =>
      prev.map((item) => ({
        ...item,
        categoryLabel: getCategoryLabel(String(item.category || "all"), lang),
      })),
    );
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
      alert(`[Link Copied to Clipboard]:\n\nSuccessfully copied "${title}" direct report reference!`);
    } else {
      alert(`【链接已复制到剪切板】:\n\n已成功复制该行业报告/合规解读链接，快去分享给身边的家长。`);
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
      name: newsCopy.globalNewsSeoName,
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
            label: newsCopy.breadcrumbGlobal,
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
          const article = selectedArticleState;
          items.push({
            label: article.title,
            active: true,
            onClick: undefined,
          });
        }
        return (
          <div ref={breadcrumbsAnchorRef}>
            <Breadcrumbs
              lang={lang}
              onHomeClick={() => (window as any).setActiveTab?.("home")}
              items={items}
            />
          </div>
        );
      })()}

      {selectedArticleState ? (() => {
        const article = selectedArticleState;
        return (
          // Detailed Article Post Reader View
          <div className="max-w-3xl mx-auto bg-white border border-slate-100 rounded-[40px] p-8 sm:p-12 space-y-8 shadow-2xl relative animate-fade-in text-left">
            <button
              onClick={handleArticleClose}
              className="flex items-center gap-2 text-xs text-orange-500 hover:text-orange-600 font-black uppercase pb-6 border-b border-slate-50 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              {newsCopy.detailBack}
            </button>

            <div className="space-y-4">
              <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-black rounded-full uppercase border border-orange-200">
                {getCategoryLabel(article.category, lang)}
              </span>
              <h2 className="km-page-title text-slate-900">
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
                  {lang === "en" ? article.readTime : `${newsCopy.detailReadPrefix} ${article.readTime}`}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-orange-500" />
                  {lang === "en" 
                    ? `${newsCopy.detailViewsPrefix}${article.views + (likedList.includes(article.id) ? 1 : 0)}` 
                    : `${newsCopy.detailViewsPrefix} ${article.views + (likedList.includes(article.id) ? 1 : 0)} 次`}
                </span>
              </div>
            </div>

            {/* Article Summary Quote */}
            <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100 text-slate-700 text-sm leading-relaxed font-medium italic relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
              <strong>{newsCopy.detailSummary}</strong> {article.summary}
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

            {/* BalanceBikeToddler Lab Recommended Best Picks / Safety Guides Widget */}
            <div className="mt-12 pt-10 border-t border-slate-100 space-y-6">
              <div className="flex items-center gap-2.5">
                <span className="text-sm bg-orange-100 p-1.5 rounded-lg">🔬</span>
                <h4 className="text-md sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                  {newsCopy.guidesTitle}
                </h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  {
                    id: "g_stroller",
                    titleZh: "婴儿推车避震与护脊选购硬核指南",
                    titleEn: "Stroller Protection & Ergonomics Master Guide",
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
                        {newsCopy.guideBadge}
                      </span>
                      <h5 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-orange-500 transition-colors line-clamp-2">
                        {lang === "en" ? g.titleEn : g.titleZh}
                      </h5>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                        {lang === "en" ? g.summaryEn : g.summaryZh}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-black text-slate-400 group-hover:text-orange-500 transition-colors">
                      <span>{newsCopy.guideRead}</span>
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
                {newsCopy.closeReading}
              </button>
              <div className="flex gap-3">
                <button
                  onClick={(e) => handleToggleLike(article.id, e)}
                  aria-label={newsCopy.likeAria}
                  title={newsCopy.likeAria}
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
                  aria-label={newsCopy.shareAria}
                  title={newsCopy.shareAria}
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

            <div className="relative z-10 space-y-10 w-full">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] h-7 font-black uppercase tracking-widest rounded-full shadow-lg backdrop-blur-md">
                <Globe className="w-4 h-4 text-orange-400" />
                {newsCopy.heroBadge}
              </div>
              
              <h1 className="km-page-title km-home-statement-title text-white max-w-5xl mx-auto drop-shadow-md">
                {newsCopy.heroTitle}
              </h1>
              
              <p className="km-body-copy text-slate-200 text-sm md:text-base max-w-3xl mx-auto font-semibold drop-shadow-sm">
                {newsCopy.heroSubtitle}
              </p>

              {/* Categorization dynamic tabs bar strictly in ordered layout */}
              <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-white/10 relative z-10">
                {[
                  { id: "all", labelEn: newsCopy.categoryTabs.all, labelZh: newsCopy.categoryTabs.all, descEn: "", descZh: "" },
                  { id: "new_product", labelEn: newsCopy.categoryTabs.newProduct, labelZh: newsCopy.categoryTabs.newProduct, descEn: "", descZh: "" },
                  { id: "science", labelEn: newsCopy.categoryTabs.science, labelZh: newsCopy.categoryTabs.science, descEn: "", descZh: "" },
                  { id: "brand_news", labelEn: newsCopy.categoryTabs.brandNews, labelZh: newsCopy.categoryTabs.brandNews, descEn: "", descZh: "" },
                  { id: "industry", labelEn: newsCopy.categoryTabs.industry, labelZh: newsCopy.categoryTabs.industry, descEn: "", descZh: "" },
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
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[11px] font-black tracking-widest uppercase shadow-md transition-all cursor-pointer group backdrop-blur-md border outline-none ${
                      selectedCategory === c.id
                        ? "bg-white/20 border border-white/45 text-slate-100"
                        : "bg-white/10 hover:bg-white/20 border border-white/25 text-slate-100 hover:border-white/45"
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
                  {newsCopy.noMatches}
                </span>
            </div>
          ) : (
            <div className="space-y-8">
              <div id="latest-news-grid-anchor" className="max-w-3xl mx-auto text-center space-y-3">
                <h2 className="km-section-title text-slate-900">
                  {newsCopy.latestTitle}
                </h2>
                <p className="km-heading-copy km-body-copy text-sm text-slate-500 font-medium">
                  {newsCopy.latestDesc}
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
                        {getCategoryLabel(art.category, lang)}
                      </span>
                      <span className="text-slate-400 font-bold">{art.publishDate}</span>
                    </div>

                    <h3 className="km-card-title text-slate-900 group-hover:text-orange-500 transition-colors">
                      {art.title}
                    </h3>
                    <p className="km-heading-copy km-body-copy text-slate-500 text-xs line-clamp-2 font-medium">
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
                        {newsCopy.readMore}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => handleNewsPageNavigate(Math.max(1, safePage - 1))}
                    disabled={safePage <= 1}
                    className="w-10 h-10 rounded-2xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 flex items-center justify-center"
                    aria-label={newsCopy.prevPageAria}
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
                    onClick={() => handleNewsPageNavigate(Math.min(totalPages, safePage + 1))}
                    disabled={safePage >= totalPages}
                    className="w-10 h-10 rounded-2xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 flex items-center justify-center"
                    aria-label={newsCopy.nextPageAria}
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
