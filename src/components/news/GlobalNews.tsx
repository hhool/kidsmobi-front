import React, { useState } from 'react';
import { newsArticles } from '../../data/newsData';

const categoryMap: Record<string, string> = {
  'Industry Trends': 'industry',
  'New Launches': 'new_product',
  'Regulations': 'regulation',
  'Brand News': 'brand_news',
  'Science & Tips': 'science'
};

const GlobalNews: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  
  const filters = ['All', 'Industry Trends', 'New Launches', 'Regulations', 'Brand News', 'Science & Tips'];

  const sortedArticles = [...newsArticles].sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  const featuredArticles = sortedArticles.slice(0, 2);
  const latestArticles = activeFilter === 'All' 
    ? sortedArticles 
    : sortedArticles.filter(article => article.category === categoryMap[activeFilter]);

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
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
              {filters.map(f => (
                <button 
                  key={f} 
                  onClick={() => setActiveFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                    activeFilter === f 
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            
          </div>
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
                <div key={article.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group cursor-pointer hover:shadow-xl transition-all">
                  <div className="h-48 bg-slate-200 relative overflow-hidden">
                     {/* Placeholder Image */}
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
              {latestArticles.map((article) => (
                <div key={article.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group cursor-pointer hover:border-orange-500 transition-all hover:shadow-md">
                  <div className="h-40 bg-slate-100 mb-4 m-2 rounded-xl flex items-center justify-center text-slate-300">Image: {article.categoryLabel}</div>
                  <div className="px-4 pb-4">
                    <span className="text-[10px] text-blue-500 font-black uppercase tracking-wider mb-2 block">{article.categoryLabel}</span>
                    <h3 className="font-black text-md text-slate-800 group-hover:text-orange-500 transition-colors line-clamp-2 mb-2">
                      {article.title}
                    </h3>
                    <p className="text-slate-500 text-xs font-medium line-clamp-2">
                      {article.summary}
                    </p>
                    <div className="text-[10px] text-slate-400 font-bold mt-3 border-t border-slate-100 pt-2">{article.publishDate} • {article.views} views</div>
                  </div>
                </div>
              ))}
            </div>
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