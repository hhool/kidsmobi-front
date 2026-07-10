import React, { useState, useEffect, useMemo } from "react";
import { Search, Calendar, User, Eye, BookOpen, Clock, ArrowLeft, Heart, Share2 } from "lucide-react";
import { NewsArticle, newsArticles as fallbackNewsArticles } from "../data/newsData";
import { translateNewsArticle } from "../lib/translate";
import { getCMSNews } from "../lib/cmsService";
import { clearJsonLd, setCollectionPageJsonLd, setJsonLd } from "../lib/seoJsonLd";
import SeoKeywordPanel from "./common/SeoKeywordPanel";

function translateCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    industry: "行业资讯",
    new_product: "新品发布",
    regulation: "合规政策",
    brand_news: "品牌动态",
    brand_trend: "品牌动态",
    brand_dynamics: "品牌动态",
    science: "科普干货"
  };
  return labels[cat] || "最新动态";
}
import Breadcrumbs from "./Breadcrumbs";

const NEWS_ALLOWED_CATEGORIES = new Set(["industry", "new_product", "regulation", "brand_news", "science"]);

function normalizeNewsCategory(category: string): NewsArticle["category"] | null {
  const normalized: Record<string, NewsArticle["category"]> = {
    trends: "industry",
    policy: "regulation",
    brand_trend: "brand_news",
    brand_dynamics: "brand_news",
    industry: "industry",
    new_product: "new_product",
    regulation: "regulation",
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
  onPageChange?: (page: number) => void;
  onPaginationMetaChange?: (meta: { totalPages: number }) => void;
}

export default function NewsSection({ lang = "zh", currentPage = 1, onPageChange, onPaginationMetaChange }: NewsSectionProps) {
  const [newsArticlesState, setNewsArticlesState] = useState<NewsArticle[]>(fallbackNewsArticles);
  const [loadingNews, setLoadingNews] = useState<boolean>(false);
  const [selectedArticleState, setSelectedArticleState] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date"); // 'date' | 'views'

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

          const mapped: NewsArticle[] = dbNews.map((n) => ({
            id: n.id,
            title: pickLocalized(n, n.zh?.title, n.en?.title),
            category: n.category as any,
            categoryLabel: translateCategoryLabel(n.category),
            summary: pickLocalized(n, n.seo?.zh?.description, n.seo?.en?.description, lang === "en" ? "Kidsmobi industry updates and safety insights." : "Kidsmobi 行业动态与科普报告。"),
            content: pickLocalized(n, n.zh?.content, n.en?.content),
            author: lang === "en" ? "Kidsmobi Global Safety Lab" : "Kidsmobi 全球安全实验室",
            readTime: lang === "en" ? "5 min read" : "5 分钟",
            publishDate: n.updatedAt && n.updatedAt.seconds
              ? new Date(n.updatedAt.seconds * 1000).toISOString().split("T")[0]
              : "2026-06-15",
            views: 4200
          }));
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
    return newsArticlesState
      .map(art => translateNewsArticle(art, lang))
      .filter((art) => {
        if (!NEWS_ALLOWED_CATEGORIES.has(art.category)) return false;
        const matchesCategory = selectedCategory === "all" || art.category === selectedCategory;
        const matchesSearch = searchQuery.trim() === "" || 
          art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          art.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "views") return b.views - a.views;
        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
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
      name: lang === "en" ? "Global Kids Bike Insights" : "全球童车资讯库",
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
      <h1 className="sr-only">
        {lang === "en"
          ? "Kids Bike, Kids Scooter, Balance Bike and Jogging Stroller News"
          : "stroller 与 jogging stroller 行业资讯"}
      </h1>
      
      {/* Breadcrumbs (PRD 4.5.2) */}
      <Breadcrumbs 
        lang={lang} 
        onHomeClick={() => (window as any).setActiveTab?.("home")}
        items={[{ label: lang === "zh" ? "全球资讯" : "GLOBAL NEWS", active: true }]} 
      />

      {selectedArticleState ? (() => {
        const article = translateNewsArticle(selectedArticleState, lang);
        return (
          // Detailed Article Post Reader View
          <div className="max-w-3xl mx-auto bg-white border border-slate-100 rounded-[40px] p-8 sm:p-12 space-y-8 shadow-2xl relative animate-fade-in text-left">
            <button
              onClick={() => setSelectedArticleState(null)}
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

            {/* Footer of article with like and shares */}
            <div className="flex justify-between items-center pt-8 border-t border-slate-50">
              <button
                onClick={() => setSelectedArticleState(null)}
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
        <div className="space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="flex justify-center">
                <div className="bg-orange-100 p-3 rounded-2xl">
                  <BookOpen className="w-6 h-6 text-orange-500" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-slate-900">
                {lang === "en" ? "Kids Bike, Kids Scooter & Balance Bike Insights" : "全球童车资讯库"}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {lang === "en" 
                  ? "Track kids bike, kids electric bike, kids scooter, balance bike, and jogging stroller trends, launches, regulations, and practical science tips." 
                    : "聚焦行业趋势、新品发布、法规政策、品牌动态与科学选购内容，用软文方式讲清楚市场变化。"}
              </p>
              {lang === "en" && (
                <SeoKeywordPanel
                  className="pt-2"
                  keywords={[
                    "kids bike news",
                    "kids electric bike launches",
                    "kids scooter news",
                    "balance bike trends",
                    "jogging stroller safety news",
                    "kids dirt bike updates",
                    "electric dirt bike for kids",
                  ]}
                />
              )}
          </div>

          {/* Searching and Categorizing Tags */}
          <div className="bg-white border border-slate-100 rounded-4xl p-6 shadow-xl shadow-slate-200/50 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === "en" ? "Search news keyword..." : "检索核心安全术语、合规标准、品牌动态..."}
                  aria-label={lang === "en" ? "Search news keywords" : "检索资讯关键词"}
                  title={lang === "en" ? "Search news keywords" : "检索资讯关键词"}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label={lang === "en" ? "Sort news articles" : "排序资讯文章"}
                title={lang === "en" ? "Sort news articles" : "排序资讯文章"}
                className="bg-white border border-slate-100 rounded-2xl px-4 py-3 text-sm text-slate-700 font-bold focus:outline-none focus:border-orange-500 transition-all cursor-pointer"
              >
                <option value="date">{lang === "en" ? "📅 Newest" : "📅 最新发布"}</option>
                <option value="views">{lang === "en" ? "🔥 Popular" : "🔥 最热门"}</option>
              </select>
            </div>

            {/* Categorization dynamic tabs bar */}
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { id: "all", label: lang === "en" ? "All News" : "全部资讯", icon: "📁" },
                { id: "industry", label: lang === "en" ? "Industry Trends" : "行业趋势", icon: "🏭" },
                { id: "new_product", label: lang === "en" ? "New Launches" : "新品发布", icon: "🆕" },
                { id: "regulation", label: lang === "en" ? "Regulations" : "合规政策", icon: "⚖️" },
                { id: "brand_news", label: lang === "en" ? "Brand News" : "品牌动态", icon: "🏢" },
                { id: "science", label: lang === "en" ? "Science & Tips" : "科普干货", icon: "🔬" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                    selectedCategory === c.id
                      ? "bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/20 scale-105"
                      : "bg-white text-slate-500 border-slate-100 hover:border-orange-100 hover:text-orange-500"
                  }`}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Render */}
          {filteredNews.length === 0 ? (
            <div className="p-20 text-center bg-white border border-slate-100 rounded-[40px] shadow-sm">
                <span className="text-slate-400 font-medium">
                  {lang === "en" ? "No matches found." : "没找到相关的资讯文章"}
                </span>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left animate-fade-in">
              {pagedNews.map((art) => (
                <div
                  key={art.id}
                  onClick={() => setSelectedArticleState(art)}
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
                        {lang === "en" ? "Read More →" : "阅读原文 →"}
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
                    className="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-slate-600 font-black text-xs disabled:opacity-40"
                  >
                    {lang === "en" ? "Previous" : "上一页"}
                  </button>
                  <span className="text-xs font-black text-slate-400">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    onClick={() => onPageChange?.(Math.min(totalPages, safePage + 1))}
                    disabled={safePage >= totalPages}
                    className="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-slate-600 font-black text-xs disabled:opacity-40"
                  >
                    {lang === "en" ? "Next" : "下一页"}
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
