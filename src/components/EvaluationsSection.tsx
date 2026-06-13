import { useState, useMemo } from "react";
import { Award, Filter, ShieldCheck, Scale, Search, CheckCircle, Flame, Star, Sparkles, BookOpen } from "lucide-react";
import { Product } from "../types";

interface EvaluationsSectionProps {
  productsData: Product[];
  onSelectProduct: (p: Product) => void;
  childProfile: any;
}

// Custom SVG Radar Polygon Chart
function SafetyRadarChart({ product }: { product: Product }) {
  // Let the 5 dimensions map to:
  // 0: SafetyScore (制动与材质安全度)
  // 1: ComfortScore (舒适度/气胎缓冲阻力) -> let's compute as (10 - weight/2) or map standard logic
  // 2: PortabilityScore (轻量化车重比评分) -> WeightScore
  // 3: Functions (五通与角度几何设计) -> GeometryScore
  // 4: Best Value (性价比/价格实测) -> we will calculate from price (higher is cheaper or computed)
  
  const scores = useMemo(() => {
    // Standardize scores to 0-10 bounds
    const comfort = product.category === "stroller" ? 10.0 : product.category === "scooter" ? 8.5 : product.tireType.includes("充气") ? 9.5 : 6.0;
    const value = product.price < 600 ? 10.0 : product.price < 2000 ? 8.5 : product.price < 4000 ? 7.0 : 5.0;
    
    return [
      { name: "物理安全度", val: product.safetyScore },
      { name: "减震舒适度", val: comfort },
      { name: "车重轻便度", val: product.weightScore },
      { name: "脊椎工效几何", val: product.geometryScore },
      { name: "性价比契合", val: value }
    ];
  }, [product]);

  const size = 180;
  const center = size / 2;
  const radius = center - 30;

  // Compute coordinate points
  const points = useMemo(() => {
    return scores.map((s, index) => {
      const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2;
      const pct = s.val / 10;
      const x = center + radius * pct * Math.cos(angle);
      const y = center + radius * pct * Math.sin(angle);
      return { x, y, name: s.name, val: s.val };
    });
  }, [scores, radius, center]);

  const polyPath = useMemo(() => {
    if (points.length === 0) return "";
    return points.map(p => `${p.x},${p.y}`).join(" ");
  }, [points]);

  // Guidelines pentagons (at 20%, 40%, 60%, 80%, 100%)
  const guidlines = useMemo(() => {
    return [0.2, 0.4, 0.6, 0.8, 1.0].map((scale) => {
      return scores.map((s, index) => {
        const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2;
        const x = center + radius * scale * Math.cos(angle);
        const y = center + radius * scale * Math.sin(angle);
        return `${x},${y}`;
      }).join(" ");
    });
  }, [scores, radius, center]);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-4 rounded-2xl border border-slate-800/60 relative overflow-hidden">
      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wide mb-1">工效五维力学判定雷达 (Laboratory Radar)</span>
      
      <svg width={size} height={size} className="overflow-visible select-none">
        {/* Render grid lines */}
        {guidlines.map((p, i) => (
          <polygon
            key={i}
            points={p}
            fill="none"
            stroke="rgba(245, 158, 11, 0.08)"
            strokeWidth="1"
          />
        ))}

        {/* Axis ray lines */}
        {scores.map((_, index) => {
          const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2;
          const targetX = center + radius * Math.cos(angle);
          const targetY = center + radius * Math.sin(angle);
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={targetX}
              y2={targetY}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeDasharray="2,2"
              strokeWidth="0.8"
            />
          );
        })}

        {/* Score polygon path */}
        <polygon
          points={polyPath}
          fill="rgba(245, 158, 11, 0.22)"
          stroke="#f59e0b"
          strokeWidth="1.8"
          className="transition-all duration-300"
        />

        {/* Data points nodes */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="#ffffff"
            stroke="#f59e0b"
            strokeWidth="1.5"
          />
        ))}

        {/* Dimension title labels */}
        {points.map((p, i) => {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          // Place labels slightly outside
          const textDist = radius + 15;
          const x = center + textDist * Math.cos(angle);
          const y = center + textDist * Math.sin(angle);
          
          let textAnchor = "middle";
          if (Math.cos(angle) > 0.1) textAnchor = "start";
          else if (Math.cos(angle) < -0.1) textAnchor = "end";

          return (
            <text
              key={i}
              x={x}
              y={y + 3}
              fill="#94a3b8"
              fontSize="9"
              fontWeight="bold"
              textAnchor={textAnchor}
            >
              {p.name}
            </text>
          );
        })}
      </svg>

      {/* Mini score table footnote */}
      <div className="grid grid-cols-5 gap-1 pt-3.5 mt-2 border-t border-slate-900 w-full text-center text-[9px] text-slate-400">
        {scores.map((s, idx) => (
          <div key={idx} className="flex flex-col">
            <span className="text-[8px] text-slate-600 font-medium leading-none truncate">{s.name.slice(2)}</span>
            <span className="font-mono font-bold text-amber-500 mt-0.5">{s.val.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EvaluationsSection({ 
  productsData, 
  onSelectProduct,
  childProfile
}: EvaluationsSectionProps) {
  const [selectedReviewType, setSelectedReviewType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Categorize our custom reviews to perfectly represent:
  // 单品实测 (single), 多品横评 (cross), 新品首发 (new), 跨境专项 (cross_border), 性价比评测 (value), 实测甄别 (authentication)
  const reviewTypes = [
    { id: "all", label: "📁 全部评测报告" },
    { id: "single", label: "🔍 单品深度实测" },
    { id: "cross", label: "⚖️ 多品横向横评" },
    { id: "new", label: "🆕 新品首发解密" },
    { id: "cross_border", label: "✈️ 跨境合规专项" },
    { id: "value", label: "💎 极致性价比测评" },
    { id: "authentication", label: "🛠️ 研究所实测甄别" }
  ];

  // Map products of the DB dynamically to these review types to simulate rich reviews
  const reviewsList = useMemo(() => {
    return productsData.map((p) => {
      // Dynamic mapping logic
      let reviewType = "single";
      let reviewBadge = "单品实测";
      
      if (p.id === "bal_2" || p.id === "bike_2") {
        reviewType = "cross";
        reviewBadge = "多品横评";
      } else if (p.id === "bal_1" || p.id === "scoot_1") {
        reviewType = "new";
        reviewBadge = "新品首发";
      } else if (p.id === "cross_1" || p.id === "stroll_1") {
        reviewType = "cross_border";
        reviewBadge = "跨境专项";
      } else if (p.id === "belt_1") {
        reviewType = "value";
        reviewBadge = "性价比评测";
      } else if (p.id === "scoot_2" || p.id === "bal_3") {
        reviewType = "authentication";
        reviewBadge = "实测甄别";
      }

      return {
        product: p,
        reviewType,
        reviewBadge
      };
    });
  }, [productsData]);

  const filteredReviews = useMemo(() => {
    return reviewsList.filter((r) => {
      const matchesType = selectedReviewType === "all" || r.reviewType === selectedReviewType;
      const matchesSearch = searchQuery.trim() === "" ||
        r.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.product.editorVerdict.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [reviewsList, selectedReviewType, searchQuery]);

  return (
    <div id="evaluations_hub" className="space-y-8">
      
      {/* Upper header details */}
      <section className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
          <Award className="w-6 h-6 text-amber-500" />
          第三方实测中心 (Testing Laboratory)
        </h2>
        <p className="text-xs text-slate-400">
          公示采购证据，拒绝一切赞助排名，完全采用 ISO 安全力学仪器，输出多维客观雷达分判定。
        </p>
      </section>

      {/* Sifting control dashboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        
        {/* Compliance checklist notice to show deep neutrality */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between flex-wrap gap-2 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            测试经费自理：平均每款车实测耗资 ￥4500 (仪器磨损+匿名自购)
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            五维雷达核验：杜绝单纯的评分拼贴，用数学公式校准重心
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-600 absolute left-3 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜产品、品牌或专家研判词..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Review categories buttons list */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {reviewTypes.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedReviewType(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                selectedReviewType === t.id
                  ? "bg-amber-500 text-slate-950 border-amber-400"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

      </div>

      {/* Grid listing */}
      {filteredReviews.length === 0 ? (
        <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-500">在这个评测分类下暂未搜到完全吻合的主题</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredReviews.map(({ product, reviewBadge }) => {
            const isWeightOver = product.category === "bicycle" || product.category === "balance"
              ? product.weight > childProfile.weight * 0.3
              : false;

            return (
              <div
                key={product.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-6 flex flex-col md:flex-row gap-6 justify-between transition group shadow shadow-slate-950"
              >
                {/* Column Left: Visual Radar and basic badges */}
                <div className="md:w-1/2 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                        {reviewBadge}
                      </span>
                      <span className="text-slate-500 font-mono font-bold leading-none">ID: {product.id}</span>
                    </div>

                    <span className="text-xs text-slate-500 font-medium block">{product.brand}</span>
                    <h3 className="font-extrabold text-white text-base leading-snug group-hover:text-amber-400 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  {/* Core metric panel */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-[11px] text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>车辆重：</span>
                      <strong className={`font-mono ${isWeightOver ? "text-amber-500" : "text-green-400"}`}>
                        {product.weight} kg
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>安全证：</span>
                      <strong className="text-slate-300 truncate max-w-[110px]">{product.safetyCertification.join(", ")}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectProduct(product)}
                    className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                  >
                    研习实验室检测原稿 →
                  </button>
                </div>

                {/* Column Right: Live Interactive Vector Radar Component */}
                <div className="md:w-1/2 flex items-center justify-center">
                  <SafetyRadarChart product={product} />
                </div>
                
              </div>
            );
          })}
        </div>
      )}

      {/* Annual hot award showcase block to map standard PRD Section 4.4.4 '年度权威榜单' */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-950 border border-amber-500/10 rounded-3xl p-6 mt-12 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-5">
          <Sparkles className="w-64 h-64 text-amber-500" />
        </div>
        
        <div className="space-y-4 relative z-15 max-w-2xl">
          <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black rounded-lg uppercase tracking-wider flex items-center gap-1.5 w-max">
            <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
            2026 年度童车物理安全大奖榜单 (Annual Golden Safety Awards)
          </span>
          <h3 className="text-xl font-extrabold text-white">权威推荐榜已正式开锁</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            经历研究所长达百天的连续极限耐震疲劳碰撞、手制动力矩折耗和塑化剂渗析大测定，我们精选出了各分类下最具有骨工力学支撑、安全冗余度最高的年度标兵车款：
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <strong className="text-amber-400 block mb-0.5">🏆 最佳平衡滑步车</strong>
              <span className="text-slate-300">Woom 1 (3.0kg 极致轻而小握距)</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <strong className="text-amber-400 block mb-0.5">🏆 最佳幼童自行车</strong>
              <span className="text-slate-300">Woom 2 (绿漆安全双手刹+5kg自重)</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <strong className="text-amber-400 block mb-0.5">🏆 最佳产业带匠心之作</strong>
              <span className="text-slate-300">Ninenoble「青追」 (性价比神级镁一体)</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <strong className="text-amber-400 block mb-0.5">🏆 最佳高避震婴儿推车</strong>
              <span className="text-slate-300">Bugaboo Fox 5 (双重空气阻尼)</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
