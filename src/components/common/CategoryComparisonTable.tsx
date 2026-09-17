import { useMemo } from "react";
import type { Product } from "../../types";

interface CategoryComparisonTableProps {
  products: Product[];
  lang: "zh" | "en";
  onSelectProduct?: (product: Product) => void;
}

const compact = (value: unknown): string => String(value || "").replace(/\s+/g, " ").trim();

/**
 * Best-effort lookup inside the nested scraped spec blob. Returns the first
 * non-empty value whose key matches the pattern, or "" when absent.
 */
function findSpecValue(product: Product, keyPattern: RegExp): string {
  const specs = (product as Product & { Product_Specifications?: Record<string, unknown> }).Product_Specifications;
  if (!specs || typeof specs !== "object") return "";

  const stack: unknown[] = [specs];
  const fallbacks: string[] = [];
  while (stack.length > 0) {
    const node = stack.shift();
    if (!node || typeof node !== "object") continue;
    if (Array.isArray(node)) {
      stack.push(...node);
      continue;
    }
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (keyPattern.test(key)) {
        const text = compact(typeof value === "string" ? value : JSON.stringify(value ?? "")).replace(/^"|"$/g, "");
        if (text && text !== "{}" && text.length <= 90) {
          if (keyPattern.test(text)) fallbacks.push(text);
          else return text;
        }
      } else if (value && typeof value === "object") {
        stack.push(value);
      }
    }
  }
  return fallbacks[0] || "";
}

function shortBrake(product: Product, lang: "zh" | "en"): string {
  const raw = findSpecValue(product, /brake/i);
  if (!raw) return lang === "en" ? "—" : "—";
  if (/hand\s?brake|lever/i.test(raw)) return lang === "en" ? "Handbrake" : "手刹";
  if (/coaster|foot\s?brake/i.test(raw)) return lang === "en" ? "Coaster" : "脚刹";
  if (/no brake|none|brakeless/i.test(raw)) return lang === "en" ? "None" : "无";
  return raw.length > 24 ? `${raw.slice(0, 24)}…` : raw;
}

function shortTire(product: Product, lang: "zh" | "en"): string {
  const raw =
    findSpecValue(product, /tire\s?(?:type|material)|wheel\s?(?:type|material)|tire|wheel\s?size|wheel/i) || "";
  if (!raw) return lang === "en" ? "—" : "—";
  if (/eva|foam/i.test(raw)) return lang === "en" ? "EVA foam" : "EVA 发泡";
  if (/air|pneumatic|inflat/i.test(raw)) return lang === "en" ? "Air / Rubber" : "充气橡胶";
  if (/pu|polyurethane/i.test(raw)) return lang === "en" ? "PU" : "PU 实心";
  if (/rubber/i.test(raw)) return lang === "en" ? "Rubber" : "橡胶";
  return raw.length > 24 ? `${raw.slice(0, 24)}…` : raw;
}

function shortSeat(product: Product, lang: "zh" | "en"): string {
  const raw = findSpecValue(product, /seat\s?height|saddle\s?height|seat\s?(?:to\s?floor)|minimum\s?height|seat/i);
  if (raw) return raw.length > 26 ? `${raw.slice(0, 26)}…` : raw;
  const dims = findSpecValue(product, /item\s?dimensions(?:\s?l\s?x\s?w\s?x\s?h)?$|dimensions/i);
  if (dims) return dims.length > 26 ? `${dims.slice(0, 26)}…` : dims;
  return lang === "en" ? "—" : "—";
}

function shortWeight(product: Product, lang: "zh" | "en"): string {
  const weight = Number(product.weight);
  if (Number.isFinite(weight) && weight > 0) return `${weight} lb`;
  return lang === "en" ? "—" : "—";
}

/**
 * Compact side-by-side comparison matrix (up to 4 top-scored products of the
 * active category). Missing data renders as "—" instead of being invented.
 */
export default function CategoryComparisonTable({ products, lang, onSelectProduct }: CategoryComparisonTableProps) {
  const rows = useMemo(() => {
    return [...products]
      .filter((p) => Number(p.overallScore) > 0)
      .sort((a, b) => Number(b.overallScore) - Number(a.overallScore))
      .slice(0, 4);
  }, [products]);

  if (rows.length < 2) return null;

  const en = lang === "en";
  const headers = en
    ? ["Model", "Tested Weight", "Brake", "Tire", "Seat / Size", "Score", ""]
    : ["型号", "实测自重", "制动", "轮胎", "座高 / 尺寸", "评分", ""];

  return (
    <section
      className="bg-white border border-slate-100 rounded-[40px] p-6 md:p-8 shadow-sm overflow-hidden"
      aria-label={en ? "Quick spec comparison" : "参数快速对比"}
    >
      <div className="flex items-baseline justify-between gap-4 mb-5">
        <h2 className="text-lg md:text-xl font-black text-slate-900">
          {en ? "Side-by-Side Comparison" : "横向参数对比"}
        </h2>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          {en ? "Top picks by overall score" : "按综合评分排序"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b-2 border-slate-100">
              {headers.map((header, index) => (
                <th
                  key={`${header}-${index}`}
                  className={`py-3 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${index === 0 ? "text-left" : "text-center"}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((product) => (
              <tr key={product.id} className="border-b border-slate-50 hover:bg-orange-50/30 transition-colors">
                <td className="py-3.5 px-3 text-sm font-bold text-slate-900 max-w-[220px]">
                  {compact(product.cardTitle || product.name).slice(0, 48)}
                </td>
                <td className="py-3.5 px-3 text-center text-sm text-slate-600 font-semibold">{shortWeight(product, lang)}</td>
                <td className="py-3.5 px-3 text-center text-sm text-slate-600 font-semibold">{shortBrake(product, lang)}</td>
                <td className="py-3.5 px-3 text-center text-sm text-slate-600 font-semibold">{shortTire(product, lang)}</td>
                <td className="py-3.5 px-3 text-center text-sm text-slate-600 font-semibold">{shortSeat(product, lang)}</td>
                <td className="py-3.5 px-3 text-center">
                  <strong className="text-orange-500 font-black">{Number(product.overallScore).toFixed(1)}</strong>
                  <span className="text-slate-300 text-xs font-bold"> /10</span>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectProduct?.(product);
                    }}
                    className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {en ? "View" : "详情"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-[10px] text-slate-400 font-semibold leading-relaxed">
        {en
          ? "Weights are lab-measured; brake, tire, and seat data come from manufacturer specs — a dash means the maker did not publish it."
          : "自重为实测值；制动、轮胎与座高信息来自厂商公开规格，\"—\" 表示厂商未公布。"}
      </p>
    </section>
  );
}
