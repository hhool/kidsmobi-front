/**
 * Shared renderer for the "Buying guides by category" index on /guides.
 *
 * WHY ONE HTML STRING RENDERER
 * ----------------------------
 * main.tsx mounts with createRoot().render(), not hydrateRoot, so the
 * prerendered DOM inside #root is discarded on hydration. Whatever the React
 * side emits is what a reader sees; whatever the prerender emits is what a
 * crawler reads. Two hand-written renderers would drift (that already happened
 * with rich-content blocks — see scripts/check-rich-parity.tsx).
 *
 * So both consumers use THIS function's return value verbatim:
 *   - scripts/prerender-pages.ts  -> renderGuidesPage() body
 *   - src/components/GuidesSection.tsx -> dangerouslySetInnerHTML
 * The generated data module is the single source of truth; this file only
 * structures it. Output is pure <section>/<details>/<a> with inline styles,
 * so it renders identically in a static document and inside the SPA.
 *
 * English edition only. The Chinese /zh/guides hub has no Chinese-language
 * category hubs (all 20 hub pages are English-only) and check:zh-english
 * forbids English UI strings on /zh pages, so neither renderer emits this
 * index when lang === "zh". All 68 Chinese articles remain listed there.
 *
 * Zero authored prose: article labels are verbatim CMS en.title, hub labels
 * are verbatim CategoryGuide.h1, family labels are the owner-supplied keywords.
 */
import { GUIDE_CATEGORY_INDEX } from "../data/guideCategoryIndex.generated";
import type { GuideCategoryIndex } from "./guideCategoryIndexTypes";

/**
 * Widened view of the generated data.
 *
 * The generated module is `as const`, so a family whose `hubs` array is empty
 * infers `readonly []` and every element access becomes `never` — which is
 * exactly what happens now that all 20 category pillars are retired (S8) and
 * the list may be repopulated later. The runtime value is unchanged; this only
 * gives TypeScript a stable shape to check against.
 */
const INDEX = GUIDE_CATEGORY_INDEX as unknown as GuideCategoryIndex;

const esc = (value: string): string =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const LINK_STYLE = "color:#334155;text-decoration:none;";
const SUB_STYLE = "margin:0 0 8px;color:#475569;";

/**
 * The complete index section. Deterministic: same bytes on every call, so the
 * parity guard can compare the delivered HTML against this exact string.
 */
export function renderGuideCategoryIndexHtml(): string {
  const groups = INDEX.groups
    .map((group) => {
      const articles = group.articles
        .map(
          (a) =>
            `<li style="margin:0 0 6px;font-size:0.9rem;line-height:1.45;"><a href="${esc(a.href)}" style="${LINK_STYLE}">${esc(a.title)}</a></li>`,
        )
        .join("\n            ");
      const hubs = group.hubs.length
        ? `<p style="margin:12px 0 6px;font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;">Category buying guides</p>
          <ul style="margin:0;padding-left:1.15rem;">
            ${group.hubs
              .map(
                (h) =>
                  `<li style="margin:0 0 6px;font-size:0.9rem;line-height:1.45;"><a href="${esc(h.href)}" style="${LINK_STYLE}">${esc(h.title)}</a></li>`,
              )
              .join("\n            ")}
          </ul>`
        : "";
      return `        <details style="border-top:1px solid #e2e8f0;padding:14px 0;">
          <summary style="cursor:pointer;font-size:1.05rem;font-weight:800;color:#0f172a;">${esc(group.keyword)} <span style="font-size:0.8rem;font-weight:600;color:#94a3b8;">· ${group.articles.length} guides</span></summary>
          <p style="${SUB_STYLE}margin-top:12px;"><a href="${esc(group.featuredHref)}" style="color:#ea580c;font-weight:700;">${esc(
            group.articles.find((a) => a.href === group.featuredHref)?.title || group.keyword,
          )}</a></p>
          <ul style="margin:0;padding-left:1.15rem;">
            ${articles}
          </ul>
          ${hubs}
          <p style="margin:12px 0 0;"><a href="${esc(group.picksHref)}" style="color:#ea580c;font-weight:700;">More Picks</a></p>
        </details>`;
    })
    .join("\n");

  return `<section id="guide_category_index" style="padding:22px 0;border-top:1px solid #e2e8f0;" data-guide-index-schema="${INDEX.schema}">
  <h2 style="margin:0 0 6px;font-size:1.5rem;">Buying guides by category</h2>
  <p style="margin:0 0 14px;color:#475569;">Every published guide grouped by the product family it covers. Open a family to see its articles and category buying guides.</p>
${groups}
</section>`;
}

/** Every href this index emits — used by the parity guard and self-test. */
export function guideCategoryIndexHrefs(): string[] {
  return INDEX.groups.flatMap((g) => [
    g.picksHref,
    ...g.articles.map((a) => a.href),
    ...g.hubs.map((h) => h.href),
  ]);
}
