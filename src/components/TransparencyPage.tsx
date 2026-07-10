import { ArrowRight, FileText, ShieldCheck } from "lucide-react";
import type { TransparencyPageKey } from "../data/transparencyPages";
import { getTransparencyPageByKey } from "../data/transparencyPages";

type TransparencyPageProps = {
  pageKey: TransparencyPageKey;
  lang?: "zh" | "en";
};

export default function TransparencyPage({ pageKey, lang = "zh" }: TransparencyPageProps) {
  const localized = getTransparencyPageByKey(pageKey)[lang];

  return (
    <article className="max-w-4xl mx-auto py-8 sm:py-14 text-left">
      <div className="space-y-8">
        <div className="space-y-5 border-b border-slate-200 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">
            <ShieldCheck className="w-3.5 h-3.5" />
            {lang === "en" ? "KIDSMOBI Transparency" : "KIDSMOBI 透明度基石"}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 leading-tight max-w-3xl">
            {localized.title}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-8 font-medium max-w-3xl">
            {localized.subtitle}
          </p>
          <p className="text-sm text-slate-500 leading-7 max-w-3xl">
            {localized.intro}
          </p>
        </div>

        <div className="space-y-10">
          {localized.sections.map((section) => (
            <section key={section.title} className="space-y-4 border-b border-slate-100 pb-8 last:border-b-0">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">
                <FileText className="w-3.5 h-3.5" />
                {section.eyebrow}
              </div>
              <h2 className="text-xl font-black text-slate-900 leading-snug">
                {section.title}
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-slate-600 leading-8">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          {[localized.primaryLink, localized.secondaryLink].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-orange-300 hover:shadow-md transition-all"
            >
              <span className="flex items-center justify-between gap-3 text-sm font-black text-slate-900">
                {item.label}
                <ArrowRight className="w-4 h-4 text-orange-500 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="block mt-3 text-xs text-slate-500 leading-6">
                {item.text}
              </span>
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}
