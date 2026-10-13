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
            {lang === "en" ? "BalanceBikeToddler Transparency" : "BalanceBikeToddler 透明度基石"}
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
          {localized.measuredLine ? (
            <p className="text-xs font-mono text-slate-400 leading-6 max-w-3xl">{localized.measuredLine}</p>
          ) : null}
        </div>

        {localized.metrics && localized.metrics.length > 0 ? (
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {localized.metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{metric.label}</dt>
                <dd className="mt-2 text-2xl font-black text-slate-950 leading-none">{metric.value}</dd>
                <p className="mt-2 text-xs text-slate-500 leading-5">{metric.note}</p>
              </div>
            ))}
          </dl>
        ) : null}

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
              {section.table ? (
                <figure className="space-y-2 overflow-x-auto pt-2">
                  <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                    <thead>
                      <tr>
                        {section.table.columns.map((column) => (
                          <th
                            key={column}
                            scope="col"
                            className="border-b-2 border-slate-300 pb-2 pr-4 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row) => (
                        <tr key={row.join(" | ")}>
                          {row.map((cell, index) => (
                            <td
                              key={`${row.join(" | ")}-${section.table?.columns[index] ?? index}`}
                              className={`border-b border-slate-200 py-2 pr-4 align-top leading-6 ${
                                index === 0 ? "font-semibold text-slate-800" : "text-slate-600"
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {section.table.caption ? (
                    <figcaption className="text-xs text-slate-500 leading-6">{section.table.caption}</figcaption>
                  ) : null}
                </figure>
              ) : null}
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
