/**
 * Shared "related products" block for the Plan-B asset pages.
 *
 * WHY THIS EXISTS
 * The 32 Plan-B asset pages under /kids-scooter-*, /kids-stroller-*,
 * /kids-tricycle-* and /kids-ride-on-* rendered aggregate statistics and zero
 * links to the products those statistics describe. Each was healthy on every
 * other axis — 200, in the sitemap, 870–1900 words, WebPage + Dataset schema,
 * six to seven <h2> sections — but exported no crawlable path to the detail
 * layer. With product detail pages excluded from the sitemap by an explicit
 * operator decision (2026-11-10), those asset pages are the only remaining
 * internal route into the catalogue for those four categories, so the missing
 * links were a dead end rather than a cosmetic gap.
 *
 * The balance-bike and kids-bike asset pages already link out: /kids-bike-by-age/
 * renders 19 product links, /kids-bike-size-chart/ 23, /kids-bike-stability/ 24.
 * Their tables carry a product-name column. This module reproduces that pattern
 * as a reusable block so the four other clusters can adopt it without each
 * renderer growing its own copy.
 *
 * DESIGN CONSTRAINTS
 * - Additive only. The block is appended after the page's own body, so no
 *   existing section, table or figure changes. Every guard that asserts on the
 *   body (check:topics, check:content, check:pairdrift) sees a superset.
 * - Data-derived. Rows come from the CMS product list, so a product that is
 *   unpublished or pruned simply stops appearing; nothing is hardcoded.
 * - No invented claims. The block states only what the record carries — the
 *   display title and, where present, the spec value passed in by the caller.
 * - Deterministic order, so the static HTML and the hydrated DOM agree.
 */
import { resolveProductDetailCategorySlug } from "../src/lib/productCategoryPaths";

/** The minimum a caller must know about a product to build this block. */
export interface AssetPageProduct {
  id?: string;
  name?: string;
  title?: string;
  category?: string;
  categoryId?: string;
  description?: string;
  price?: number | string | null;
  overallScore?: number;
  imageUrl?: string;
  en?: { name?: string; cardTitle?: string; title?: string };
}

export interface AssetPageRelatedProduct {
  /** Absolute or root-relative detail URL, e.g. /products/strollers/stroller-b0… */
  path: string;
  label: string;
  /** Optional spec value shown next to the label, when the caller has one. */
  meta?: string;
}

/** Props for the shared block. */
export interface RelatedProductsBlockInput {
  /** Category hub slug this asset page belongs to, e.g. "kids-scooters". */
  detailSlug: string;
  /** Full product list to draw from. */
  products: AssetPageProduct[];
  /** Optional per-product spec value used as the row's meta text. */
  metaFor?: (product: AssetPageProduct) => string;
  /** How many rows to render. Clamped to a sane range. */
  limit?: number;
  /** Heading copy. Defaults are category-neutral. */
  heading?: string;
  /** One-line lead under the heading. */
  lead?: string;
}

const MAX_ROWS = 24;
const MIN_ROWS = 1;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

const escapeHtml = (value: unknown): string =>
  clean(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Short display name, preferring the curated English name. */
const displayName = (product: AssetPageProduct): string =>
  clean(product.en?.name || product.en?.cardTitle || product.en?.title || product.name || product.title || product.id);

/**
 * Picks up to `limit` products that belong to `detailSlug`.
 *
 * Filtering is by the same resolver the detail pages themselves use, so a
 * product re-homed by id prefix lands under the directory its own URL uses —
 * the link can never point at a path the prerenderer did not emit.
 *
 * Ordering is by editorial score (descending) then id, which is stable across
 * builds and puts the strongest pages first without implying a ranking the
 * site does not publish.
 */
export function pickRelatedProducts(
  detailSlug: string,
  products: AssetPageProduct[],
  limit = 12,
): AssetPageRelatedProduct[] {
  const take = Math.min(Math.max(Number(limit) || 12, MIN_ROWS), MAX_ROWS);
  const matches = products
    .filter((product) => clean(product.id))
    .filter((product) => resolveProductDetailCategorySlug(product as never) === detailSlug)
    .sort((a, b) => {
      const scoreDelta = Number(b.overallScore || 0) - Number(a.overallScore || 0);
      if (scoreDelta !== 0) return scoreDelta;
      return clean(a.id).localeCompare(clean(b.id));
    })
    .slice(0, take);

  return matches.map((product) => {
    const id = clean(product.id);
    return {
      path: `/products/${detailSlug}/${encodeURIComponent(id)}`,
      label: displayName(product) || id,
    };
  });
}

/**
 * Renders the related-products section.
 *
 * Returns "" when nothing matched, so a cluster with no products in the
 * filtered set degrades to the page's original body instead of an empty
 * heading — an empty <h2> is worse than no section at all.
 */
export function relatedProductsBlockHtml(input: RelatedProductsBlockInput): string {
  const rows = pickRelatedProducts(input.detailSlug, input.products, input.limit);
  if (!rows.length) return "";

  const heading = input.heading || "Products covered on this page";
  const lead =
    input.lead ||
    "Every figure on this page is read from these listings. Open one for the full spec sheet, scores and safety notes.";

  const items = rows
    .map((row) => {
      const meta = input.metaFor ? "" : "";
      const product = input.products.find((p) => clean(p.id) && row.path.endsWith(encodeURIComponent(clean(p.id))));
      const metaText = product && input.metaFor ? input.metaFor(product) : meta;
      return `
        <li style="margin:0;">
          <a href="${escapeHtml(row.path)}" style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:10px 14px;border:1px solid #e2e8f0;border-radius:12px;text-decoration:none;color:inherit;background:#ffffff;">
            <span style="font-size:13px;font-weight:700;color:#0f172a;">${escapeHtml(row.label)}</span>
            ${metaText ? `<span style="font-size:11px;color:#64748b;white-space:nowrap;">${escapeHtml(metaText)}</span>` : ""}
          </a>
        </li>`;
    })
    .join("");

  return `
  <section style="margin-top:36px;padding-top:28px;border-top:1px solid #e2e8f0;">
    <h2 style="font-size:20px;font-weight:900;color:#0f172a;margin:0 0 8px;">${escapeHtml(heading)}</h2>
    <p style="font-size:13px;line-height:1.75;color:#475569;margin:0 0 16px;max-width:48rem;">${escapeHtml(lead)}</p>
    <ul style="list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">${items}</ul>
  </section>`;
}