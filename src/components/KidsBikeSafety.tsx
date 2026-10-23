import {
  ShieldCheck,
  Scale,
  FileCheck,
  ExternalLink,
  Info,
  Globe,
  CheckCircle2,
  Wrench,
  BookOpen,
} from "lucide-react";
import {
  kidsSafetyStandards,
  kidsSafetyComparison,
  kidsSafetyVerification,
  kidsSafetyCaveats,
  kidsSafetySource,
  kidsSafetyStrings,
  type KidsSafetyStandard,
  type KidsSafetyStrings,
  KIDS_SAFETY_PATH,
} from "../data/kidsBikeSafety";
import ReferenceClusterNav from "./ReferenceClusterNav";

type KidsBikeSafetyProps = {
  lang?: "zh" | "en";
};

const shell = "max-w-5xl mx-auto py-8 sm:py-14 text-left px-4 sm:px-6";

function SectionHeading({
  icon: Icon,
  title,
  lead,
}: {
  icon: typeof ShieldCheck;
  title: string;
  lead?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </div>
      {lead ? <p className="text-sm text-slate-600 leading-7 max-w-3xl">{lead}</p> : null}
    </div>
  );
}

function StandardCard({ s, t }: { s: KidsSafetyStandard; t: KidsSafetyStrings; key?: string }) {
  const l = t === kidsSafetyStrings.zh ? "zh" : "en";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-base font-black text-slate-950 leading-snug max-w-2xl">{s.name}</h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
            s.mandatory
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-slate-100 text-slate-500 border border-slate-200"
          }`}
        >
          {s.mandatory
            ? l === "zh"
              ? "强制"
              : "Mandatory"
            : l === "zh"
              ? "不适用"
              : "Not applicable"}
        </span>
      </div>
      {s.edition ? (
        <div className="mt-1 text-xs font-semibold text-orange-600">{s.edition}</div>
      ) : null}
      <p className="mt-3 text-sm text-slate-600 leading-7">{s.scope[l]}</p>
      <ul className="mt-3 space-y-1.5 pl-5 text-sm text-slate-700 leading-7 list-disc">
        {s.requirements.map((r, i) => (
          <li key={i}>{r[l]}</li>
        ))}
      </ul>
      <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <span className="font-bold text-slate-700">{l === "zh" ? "认准：" : "Verify by: "}</span>
        {s.verifyMark[l]}
      </div>
      <a
        href={s.citation.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        {s.citation.title}
      </a>
    </div>
  );
}

export function KidsBikeSafety({ lang = "en" }: KidsBikeSafetyProps) {
  const t = kidsSafetyStrings[lang ?? "en"];
  const l = lang === "zh" ? "zh" : "en";
  const usStandards = kidsSafetyStandards.filter((s) => s.region === "US");
  const euStandards = kidsSafetyStandards.filter((s) => s.region === "EU_UK");

  return (
    <article className={shell}>
      <div className="space-y-10">
        <header className="space-y-5 border-b border-slate-200 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t.eyebrow}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 leading-tight max-w-4xl">
            {t.heroTitle}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-8 font-medium max-w-3xl">
            {t.heroLead}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              {t.sourceLabel}: {kidsSafetySource.name}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-slate-400" />
              {t.retrievedLabel}: {kidsSafetySource.retrievedAt}
            </span>
          </div>
          <p className="text-sm text-slate-500 leading-7 max-w-3xl">{t.heroNote}</p>
        </header>

        <section className="space-y-4">
          <SectionHeading icon={Info} title={t.introTitle} lead={t.introBody} />
        </section>

        <section className="space-y-4">
          <SectionHeading icon={Scale} title={t.glanceTitle} lead="" />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="py-3 pl-4 pr-3 font-black">{t.colRegion}</th>
                  <th className="py-3 pr-3 font-black">{t.colStandards}</th>
                  <th className="py-3 pr-3 font-black">{t.colCovers}</th>
                  <th className="py-3 pr-3 font-black">{t.colMandatory}</th>
                  <th className="py-3 pr-4 font-black">{t.colLookFor}</th>
                </tr>
              </thead>
              <tbody>
                {kidsSafetyComparison.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-100 align-top last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 pl-4 pr-3 text-sm font-bold text-slate-900">
                      {row.region[l]}
                    </td>
                    <td className="py-3 pr-3 text-sm text-slate-700">{row.standards[l]}</td>
                    <td className="py-3 pr-3 text-sm text-slate-700">{row.covers[l]}</td>
                    <td className="py-3 pr-3 whitespace-nowrap text-sm font-semibold text-emerald-700">
                      {row.mandatory[l]}
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-700">{row.lookFor[l]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading icon={Wrench} title={t.mechTitle} lead={t.mechLead} />
        </section>

        <section className="space-y-5 border-t border-slate-200 pt-8">
          <SectionHeading icon={ShieldCheck} title={t.usTitle} lead={t.usLead} />
          <div className="grid gap-4 sm:grid-cols-2">
            {usStandards.map((s) => (
              <StandardCard key={s.id} s={s} t={t} />
            ))}
          </div>
        </section>

        <section className="space-y-5 border-t border-slate-200 pt-8">
          <SectionHeading icon={Globe} title={t.euTitle} lead={t.euLead} />
          <div className="grid gap-4 sm:grid-cols-2">
            {euStandards.map((s) => (
              <StandardCard key={s.id} s={s} t={t} />
            ))}
          </div>
        </section>

        <section className="space-y-5 border-t border-slate-200 pt-8">
          <SectionHeading icon={CheckCircle2} title={t.verifyTitle} lead={t.verifyLead} />
          <ul className="space-y-2.5">
            {kidsSafetyVerification.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 leading-7">
                <CheckCircle2 className="mt-0.5 w-4 h-4 shrink-0 text-emerald-600" />
                <span>{item[l]}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="flex items-center gap-2 text-base font-black text-slate-950">
            <Info className="w-4 h-4 text-amber-600" />
            {t.caveatsTitle}
          </h2>
          <ul className="mt-3 space-y-2 pl-5 text-sm text-slate-700 leading-7 list-disc">
            {kidsSafetyCaveats.map((c, i) => (
              <li key={i}>{c[l]}</li>
            ))}
          </ul>
        </section>

        <ReferenceClusterNav currentPath={KIDS_SAFETY_PATH} lang={lang} />
        <footer className="border-t border-slate-200 pt-6 text-xs text-slate-400 leading-6">
          {t.sourceLabel}: {kidsSafetySource.name} · {t.retrievedLabel.toLowerCase()}:{" "}
          {kidsSafetySource.retrievedAt} · {kidsSafetySource.note[l]}
        </footer>
      </div>
    </article>
  );
}

// React.lazy in App.tsx resolves the module default export; without this line
// the lazy chunk resolves to undefined and React throws #306 ("Element type
// is invalid") at hydration. The named export above is kept for direct imports.
export default KidsBikeSafety;
