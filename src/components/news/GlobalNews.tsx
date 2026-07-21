import React, { useState } from 'react';
import { newsArticles, NewsArticle } from '../../data/newsData';

const GlobalNews: React.FC = () => {
  const sortedArticles = [...newsArticles].sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  const featuredArticles = sortedArticles.slice(0, 2);
  const latestArticles = sortedArticles; // Removing filter completely

  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const totalPages = Math.ceil(latestArticles.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagedArticles = latestArticles.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // If reading mode is active, display the article
  if (selectedArticle) {
    return (
      <div className="bg-slate-50 min-h-screen pb-20">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-10">
          <button 
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-orange-500 font-semibold mb-8 group transition-colors"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Back to Global News
          </button>
          
          <article className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            {selectedArticle.imageUrl && (
              <div className="w-full h-[400px] sm:h-[500px] relative">
                <img src={selectedArticle.imageUrl} alt={selectedArticle.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              </div>
            )}
            
            <div className="p-8 sm:p-12">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-black uppercase tracking-wider text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
                  {selectedArticle.categoryLabel}
                </span>
                <span className="text-sm font-semibold text-slate-400">{selectedArticle.publishDate}</span>
              </div>
              
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight mb-6">
                {selectedArticle.title}
              </h1>
              
              <div className="flex items-center gap-4 mb-10 pb-10 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                  {selectedArticle.author?.[0] || 'A'}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{selectedArticle.author || 'Author'}</div>
                  <div className="text-sm text-slate-500">{selectedArticle.readTime} read</div>
                </div>
              </div>
              
              {/* Rich text content rendered via dangerouslySetInnerHTML using Typography prose styles */}
              <div 
                className="prose prose-slate prose-lg max-w-none 
                  prose-headings:font-black prose-headings:text-slate-900 
                  prose-a:text-orange-500 
                  prose-img:rounded-2xl prose-img:shadow-md"
                dangerouslySetInnerHTML={{ __html: selectedArticle.content }} 
              />

              {/* KIDSMOBI Lab Recommended Best Picks / Safety Guides Widget */}
              <div className="mt-12 pt-10 border-t border-slate-100 space-y-6">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm bg-orange-100 p-1.5 rounded-lg">🔬</span>
                  <h4 className="text-md sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                    KIDSMOBI Lab: Recommended Safety Guides
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    {
                      id: "g_stroller",
                      titleEn: "Kids Stroller Protection & Ergonomics Master Guide",
                      summaryEn: "Learn how modern stroller shock absorption and chassis engineering protect toddler's spine development.",
                      slug: "baby-stroller-spine-safety-guide"
                    },
                    {
                      id: "g_bike",
                      titleEn: "Kids Bike & Balance Bike Sizing & Safety Chart",
                      summaryEn: "A complete guide on Q-factor, seat heights, and frame geometries for junior bikes.",
                      slug: "toddler-balance-bike-ergonmics"
                    }
                  ].map(g => (
                    <div 
                      key={g.id} 
                      onClick={() => {
                        (window as any).setActiveTab?.("guides");
                        (window as any).navigateToPath?.(`/guides/${g.slug}`);
                        setSelectedArticle(null);
                      }}
                      className="group relative rounded-3xl border border-slate-100 bg-linear-to-b from-white to-slate-50/30 overflow-hidden shadow-xs hover:shadow-xl hover:border-orange-500/20 transition-all cursor-pointer p-6 flex flex-col justify-between space-y-4 animate-fade-in"
                    >
                      <div className="space-y-4 text-left">
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-500 bg-orange-50 px-2.5 py-0.5 rounded-full inline-block">
                          Authoritative Guide
                        </span>
                        <h5 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-orange-500 transition-colors line-clamp-2">
                          {g.titleEn}
                        </h5>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                          {g.summaryEn}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-black text-slate-400 group-hover:text-orange-500 transition-colors">
                        <span>Read Guide</span>
                        <span className="group-hover:translate-x-1 transition-transform">➔</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1380px] mx-auto">
          <div className="text-sm font-semibold text-slate-400 mb-4 tracking-wide uppercase flex items-center gap-2">
            <span className="cursor-pointer hover:text-orange-500 transition-colors">Home</span>
            <span>/</span>
            <span className="text-orange-500">Global News</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-8">
            Global News & Safety Risk Watch
          </h1>
        </div>
      </div>

      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col lg:flex-row gap-8">
        
        {/* Main Content Area */}
        <div className="flex-1 space-y-10">
          
          {/* Featured Breaking News */}
          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <span className="text-orange-500 bg-orange-100 p-1.5 rounded-lg">⚡</span> Featured Stories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredArticles.map((article) => (
                <div key={article.id} onClick={() => setSelectedArticle(article)} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group cursor-pointer hover:shadow-xl transition-all">
                  <div className="h-48 bg-slate-200 relative overflow-hidden">
                     {article.imageUrl ? (
                      <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <span className="absolute bottom-4 left-4 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">BREAKING</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-orange-500 transition-colors line-clamp-2 mb-2">
                      {article.title}
                    </h3>
                    <p className="text-slate-500 text-sm font-semibold line-clamp-2">
                      {article.summary}
                    </p>
                    <div className="text-xs text-slate-400 font-bold mt-4">{article.publishDate} • {article.categoryLabel}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Grid Library */}
          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <span className="text-blue-500 bg-blue-100 p-1.5 rounded-lg">📚</span> Latest Articles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pagedArticles.map((article) => (
                <div key={article.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group cursor-pointer hover:border-orange-500 transition-all hover:shadow-md flex flex-col" onClick={() => setSelectedArticle(article)}>
                  {article.imageUrl ? (
                    <div className="h-40 overflow-hidden mb-4 m-2 rounded-xl shrink-0">
                      <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                  ) : (
                    <div className="h-40 bg-slate-100 mb-4 m-2 rounded-xl flex items-center justify-center text-slate-300 shrink-0">Image: {article.categoryLabel}</div>
                  )}
                  <div className="px-4 pb-4 flex-1 flex flex-col">
                    <span className="text-[10px] text-blue-500 font-black uppercase tracking-wider mb-2 block">{article.categoryLabel}</span>
                    <h3 className="font-black text-md text-slate-800 group-hover:text-orange-500 transition-colors line-clamp-2 mb-2">
                      {article.title}
                    </h3>
                    <p className="text-slate-500 text-xs font-medium line-clamp-2 mt-auto">
                      {article.summary}
                    </p>
                    <div className="text-[10px] text-slate-400 font-bold mt-3 border-t border-slate-100 pt-2">{article.publishDate} • {article.views} views</div>
                  </div>
                </div>
              ))}
            </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100 relative z-30">
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 flex items-center justify-center cursor-pointer hover:bg-slate-50 relative"
                aria-label="Previous page"
              >
                <svg aria-hidden="true" viewBox="0 0 20 20" className="w-4 h-4 relative" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.5 4.5L7 10L12.5 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <span className="text-xs font-bold text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 flex items-center justify-center cursor-pointer hover:bg-slate-50 relative"
                aria-label="Next page"
              >
                <svg aria-hidden="true" viewBox="0 0 20 20" className="w-4 h-4 relative" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 4.5L13 10L7.5 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
</section>

        </div>

        {/* Sidebar Space */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 sticky top-24 shadow-sm">
            <h3 className="font-black text-red-600 text-lg flex items-center gap-2 mb-4">
              ⚠️ Safety Recalls
            </h3>
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-xl p-3 border border-red-100 cursor-pointer hover:shadow-md transition-all">
                  <span className="text-[10px] text-white bg-red-500 font-bold px-1.5 py-0.5 rounded-md mb-1.5 inline-block">URGENT</span>
                  <h4 className="font-bold text-sm text-slate-900 leading-tight mb-1">Stroller Model XYZ Recalled</h4>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2">Potential latch failure reported by CPSC.</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 bg-red-100 text-red-600 hover:bg-red-200 font-bold py-2 rounded-xl text-sm transition-colors">
              View All Recalls
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GlobalNews;