import React, { useState, useMemo } from "react";
import { Search, Calendar, User, Eye, BookOpen, Clock, ArrowLeft, Heart, Share2 } from "lucide-react";
import { NewsArticle, newsArticles } from "../data/newsData";

export default function NewsSection() {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date"); // 'date' | 'views'

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
    alert(`【链接已快滑复制到剪切板】:\n\n已成功复制该行业报告/合规解读链接！快去分享给身边的家长或出海战友。`);
  };

  const filteredNews = useMemo(() => {
    return newsArticles
      .filter((art) => {
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
  }, [searchQuery, selectedCategory, sortBy]);

  return (
    <div id="news_hub" className="space-y-8">
      {selectedArticle ? (
        // Detailed Article Post Reader View
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl relative animate-fade-in">
          <button
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-400 font-bold uppercase pb-4 border-b border-slate-800/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回全球资讯目录
          </button>

          <div className="space-y-4">
            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black rounded-lg uppercase">
              {selectedArticle.categoryLabel}
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
              {selectedArticle.title}
            </h2>

            {/* Author Metadata bar */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-amber-500" />
                {selectedArticle.author}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                {selectedArticle.publishDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                阅读需 {selectedArticle.readTime}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-amber-500" />
                累计浏览 {selectedArticle.views + (likedList.includes(selectedArticle.id) ? 1 : 0)} 次
              </span>
            </div>
          </div>

          {/* Article Summary Quote */}
          <div className="bg-slate-950 p-4 rounded-xl border-l-4 border-amber-500 text-slate-300 text-xs sm:text-sm leading-relaxed italic">
            <strong>摘要：</strong> {selectedArticle.summary}
          </div>

          {/* Article Editorial Markdown content body renderer */}
          <div className="whitespace-pre-wrap text-slate-300 text-xs sm:text-sm leading-8 space-y-6 border-t border-slate-800/80 pt-6">
            {selectedArticle.content.split("\n\n").map((para, ip) => {
              // Custom format headings inside paragraph split block to look stunning
              if (para.startsWith("### ")) {
                return <h3 key={ip} className="text-lg font-bold text-white mt-6 mb-2">{para.replace("### ", "")}</h3>;
              }
              if (para.startsWith("#### ")) {
                return <h4 key={ip} className="text-base font-bold text-amber-400 mt-4 mb-2">{para.replace("#### ", "")}</h4>;
              }
              if (para.startsWith("* ")) {
                return (
                  <ul key={ip} className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                    {para.split("\n").map((li, il) => (
                      <li key={il}>{li.replace("* ", "")}</li>
                    ))}
                  </ul>
                );
              }
              return <p key={ip} className="text-slate-300 leading-relaxed text-justify">{para}</p>;
            })}
          </div>

          {/* Footer of article with like and shares */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-800/80">
            <button
              onClick={() => setSelectedArticle(null)}
              className="px-4 py-2 bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 text-xs rounded-xl font-bold transition"
            >
              关闭阅读
            </button>
            <div className="flex gap-2">
              <button
                onClick={(e) => handleToggleLike(selectedArticle.id, e)}
                className={`p-2.5 rounded-xl border transition ${
                  likedList.includes(selectedArticle.id)
                    ? "bg-red-500/10 border-red-500/30 text-red-500"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Heart className="w-4 h-4 fill-current" />
              </button>
              <button
                onClick={(e) => handleShare(selectedArticle.title, e)}
                className="p-2.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Standard Grid card library list view
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-500" />
              全球童车动态资讯与合规政策库
            </h2>
            <p className="text-xs text-slate-400">
              专注同步欧盟、美国最新召回、产业镁压铸动态，以及积水潭儿童创伤科等权威科普干货。
            </p>
          </div>

          {/* Searching and Categorizing Tags */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="检索资讯关键字、材料、合规标准国标等..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="date">📅 最新发布优先</option>
                <option value="views">🔥 最多点击量热门</option>
              </select>
            </div>

            {/* Categorization dynamic tabs bar */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  selectedCategory === "all"
                    ? "bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                📁 全部资讯
              </button>
              <button
                onClick={() => setSelectedCategory("regulation")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  selectedCategory === "regulation"
                    ? "bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                ⚖️ 合规政策
              </button>
              <button
                onClick={() => setSelectedCategory("recall")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  selectedCategory === "recall"
                    ? "bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                ☠️ 安全预警
              </button>
              <button
                onClick={() => setSelectedCategory("new_product")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  selectedCategory === "new_product"
                    ? "bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                🆕 新品发布
              </button>
              <button
                onClick={() => setSelectedCategory("brand_trend")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  selectedCategory === "brand_trend"
                    ? "bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                🏭 品牌与产业带
              </button>
              <button
                onClick={() => setSelectedCategory("science")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  selectedCategory === "science"
                    ? "bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                🔬 理性科普干货
              </button>
            </div>
          </div>

          {/* Cards Render */}
          {filteredNews.length === 0 ? (
            <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-xs text-slate-500">在这个资讯分类下暂未搜到完全吻合的文章</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredNews.map((art) => (
                <div
                  key={art.id}
                  onClick={() => setSelectedArticle(art)}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/20 rounded-2xl p-5 flex flex-col justify-between space-y-4 cursor-pointer hover:shadow-lg transition group"
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="bg-slate-950 text-amber-500 px-2 py-0.5 rounded border border-slate-850 font-bold uppercase">
                        {art.categoryLabel}
                      </span>
                      <span className="text-slate-500 font-mono">{art.publishDate}</span>
                    </div>

                    <h3 className="font-extrabold text-white text-sm sm:text-base leading-snug group-hover:text-amber-400 transition-colors">
                      {art.title}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-850/80">
                    <span className="medium">作者: {art.author.split("-")[0]}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-0.5">
                        <Eye className="w-3 h-3 text-amber-500" />
                        {art.views + (likedList.includes(art.id) ? 1 : 0)}
                      </span>
                      <span className="text-amber-500 hover:underline font-bold">阅读全文 →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
