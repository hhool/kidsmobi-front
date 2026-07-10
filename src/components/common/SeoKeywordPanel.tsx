interface SeoKeywordPanelProps {
  keywords: string[];
  variant?: "light" | "dark" | "orange";
  columns?: "auto" | "two" | "three" | "four";
  align?: "center" | "left";
  className?: string;
}

const columnClass = {
  auto: "flex flex-wrap",
  two: "grid grid-cols-1 sm:grid-cols-2",
  three: "grid grid-cols-1 sm:grid-cols-3",
  four: "grid grid-cols-2 sm:grid-cols-4",
};

const variantClass = {
  light: "border-slate-200 bg-white text-slate-500 shadow-sm",
  dark: "border-white/10 bg-white/5 text-slate-300",
  orange: "border-orange-100 bg-orange-50 text-orange-600",
};

export default function SeoKeywordPanel({
  keywords,
  variant = "light",
  columns = "auto",
  align = "center",
  className = "",
}: SeoKeywordPanelProps) {
  const normalized = keywords.map((item) => item.trim()).filter(Boolean);
  if (normalized.length === 0) return null;

  return (
    <div className={`${columnClass[columns]} gap-2 ${align === "center" ? "justify-center" : "justify-start"} ${className}`}>
      {normalized.map((keyword) => (
        <span
          key={keyword}
          className={`rounded-2xl border px-3 py-2 text-[11px] font-black uppercase leading-relaxed tracking-wide ${variantClass[variant]}`}
        >
          {keyword}
        </span>
      ))}
    </div>
  );
}