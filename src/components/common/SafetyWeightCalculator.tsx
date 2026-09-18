import { useMemo, useState } from "react";

interface SafetyWeightCalculatorProps {
  lang: "zh" | "en";
  onOpenWizard: () => void;
}

/**
 * Lightweight "30% weight rule" calculator.
 * Input: child body weight + inseam. Output: max bike weight (≤30% of body
 * weight) and flat-foot minimum saddle height (inseam − 2.5 cm guidance).
 */
export default function SafetyWeightCalculator({ lang, onOpenWizard }: SafetyWeightCalculatorProps) {
  const [unit, setUnit] = useState<"imperial" | "metric">("imperial");
  const [weight, setWeight] = useState("");
  const [inseam, setInseam] = useState("");

  const isZh = lang === "zh";

  const result = useMemo(() => {
    const w = parseFloat(weight);
    const i = parseFloat(inseam);
    if (!Number.isFinite(w) || w <= 0) return null;
    // Normalize to kg / cm internally.
    const weightKg = unit === "imperial" ? w * 0.453592 : w;
    const maxBikeKg = weightKg * 0.3;
    const maxBike = unit === "imperial"
      ? { value: maxBikeKg / 0.453592, suffix: "lb" }
      : { value: maxBikeKg, suffix: "kg" };
    let minSaddle: { value: number; suffix: string } | null = null;
    if (Number.isFinite(i) && i > 0) {
      const inseamCm = unit === "imperial" ? i * 2.54 : i;
      const saddleCm = Math.max(inseamCm - 2.5, 0);
      minSaddle = unit === "imperial"
        ? { value: saddleCm / 2.54, suffix: "in" }
        : { value: saddleCm, suffix: "cm" };
    }
    return {
      maxBike: `${maxBike.value.toFixed(1)} ${maxBike.suffix}`,
      minSaddle: minSaddle ? `${minSaddle.value.toFixed(1)} ${minSaddle.suffix}` : null,
    };
  }, [weight, inseam, unit]);

  return (
    <div className="bg-white border-b border-orange-100 shadow-inner">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5 text-left">
        <p className="text-sm text-slate-600 font-medium leading-relaxed">
          {isZh
            ? "输入孩子的体重与内缝高（裆部到地面的净高），即时算出安全选购上限——整车重量不应超过体重的 30%；平脚着地起步时，最低鞍座高应比内缝高约低 2.5 厘米。"
            : "Enter your child's body weight and inseam (crotch-to-floor height) to get instant sizing limits — total bike weight should stay under 30% of body weight, and the minimum saddle height should sit about 2.5 cm below the inseam for flat-foot stability."}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-slate-200 overflow-hidden" role="group">
            {(["imperial", "metric"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors cursor-pointer ${
                  unit === u ? "bg-orange-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                {u === "imperial" ? (isZh ? "磅 / 英寸" : "lb / in") : isZh ? "公斤 / 厘米" : "kg / cm"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              {isZh ? "孩子体重" : "Child's weight"} ({unit === "imperial" ? "lb" : "kg"})
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={unit === "imperial" ? "e.g. 30" : isZh ? "如 14" : "e.g. 14"}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none font-bold text-slate-800"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              {isZh ? "内缝高（选填）" : "Inseam (optional)"} ({unit === "imperial" ? "in" : "cm"})
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="1"
              value={inseam}
              onChange={(e) => setInseam(e.target.value)}
              placeholder={unit === "imperial" ? 'e.g. 13' : isZh ? "如 33" : "e.g. 33"}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none font-bold text-slate-800"
            />
          </label>
        </div>

        {result && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                {isZh ? "整车重量上限（30% 法则）" : "Max bike weight (30% rule)"}
              </p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{result.maxBike}</p>
            </div>
            <div className={`rounded-2xl border px-5 py-4 ${result.minSaddle ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-slate-50"}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest ${result.minSaddle ? "text-orange-600" : "text-slate-400"}`}>
                {isZh ? "最低鞍座高（平脚起步）" : "Min saddle height (flat-foot)"}
              </p>
              <p className={`text-2xl font-black mt-1 ${result.minSaddle ? "text-orange-700" : "text-slate-400"}`}>
                {result.minSaddle || (isZh ? "填写内缝高后显示" : "Enter inseam")}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenWizard}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-widest rounded-full shadow-md shadow-orange-500/20 transition-colors cursor-pointer"
          >
            {isZh ? "按这些条件找车" : "Find matching rides"}
          </button>
          <span className="text-[10px] text-slate-400 leading-relaxed">
            {isZh
              ? "结果为通用选购参考，具体以产品实测页标注的座高调节范围为准。"
              : "General guidance only — always confirm against the seat-height range on each product's test page."}
          </span>
        </div>
      </div>
    </div>
  );
}
