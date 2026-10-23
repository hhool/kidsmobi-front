import { ArrowRight } from "lucide-react";
import {
  samePath,
  useReferenceCluster,
  clusterGroupOfHref,
  clusterGroupOfPath,
  CLUSTER_HEADINGS,
} from "../lib/referenceCluster";

/**
 * Contextual navigation inside a category's reference cluster.
 *
 * The reference pages answered 94.7% of this domain's Search Console
 * impressions, yet until now they linked to each other from nothing but the
 * site-wide footer. This block supplies the in-content links in both languages.
 *
 * The list is configuration, not code: `settings.referenceCluster` holds the
 * order, wording and targets, and `scripts/prerender-pages.ts` resolves the
 * same list through the same module — so the static HTML and the hydrated view
 * carry identical links, and the CMS can rearrange them without a code change.
 * Which of those cards a page shows is not configuration: a host renders only
 * its own cluster's cards (see clusterGroupOfPath).
 */
export default function ReferenceClusterNav({
  currentPath,
  lang = "en",
  heading,
}: {
  currentPath?: string;
  lang?: "zh" | "en";
  heading?: string;
}) {
  const assets = useReferenceCluster();
  // The prerender always passes the path explicitly. The SPA falls back to the
  // URL it is rendering, which is the same route by construction — the three
  // shared asset-page shells (ClusterAssetPage, RideOnAssetPage,
  // ScooterAssetPage) render this block without a path and would otherwise
  // link the page to itself.
  const path = currentPath ?? (typeof window !== "undefined" ? window.location.pathname : "");
  const group = clusterGroupOfPath(path);
  const items = assets
    .filter((asset) => clusterGroupOfHref(asset.href) === group)
    .filter((asset) => !samePath(asset.href, path));
  if (!items.length) return null;
  const zh = lang === "zh";
  const title = heading ?? CLUSTER_HEADINGS[group][zh ? "zh" : "en"];

  return (
    <section className="mt-10 border-t border-slate-200 pt-6">
      <h2 className="text-base font-black text-slate-950">{title}</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.map((asset) => (
          <li key={asset.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <a
              href={asset.href}
              className="inline-flex items-center gap-1.5 text-sm font-black text-orange-600 hover:text-orange-700"
            >
              {zh ? asset.labelZh : asset.labelEn}
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <p className="mt-1 text-xs text-slate-600 leading-6">{zh ? asset.blurbZh : asset.blurbEn}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
