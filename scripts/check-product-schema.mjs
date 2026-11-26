#!/usr/bin/env node
/**
 * Guard against fabricated Product structured data.
 *
 * On 2026-11-08 a full-site audit (balancebiketoddler.com-audit) found that all
 * 174 product detail pages emitted a Product JSON-LD node carrying a fabricated
 * `Offer` — a firm price plus `availability: InStock` — even though the site is
 * an editorial affiliate publisher with no cart, checkout, or first-party
 * inventory. Google's Product snippet policy treats a price + InStock claim as a
 * live offer; emitting one we cannot fulfil is the same category of problem as
 * the unsupported lab claims removed earlier: it reads as fabricated to both
 * readers and reviewers.
 *
 * The fix (scripts/prerender-pages.ts + src/App.tsx) removes the `offers` block
 * from Product nodes and keeps only what the page visibly supports: name, brand,
 * image, description, `aggregateRating` (already plausibility-gated by
 * src/lib/reviewSignal.ts), and an editorial `review` that always carries a
 * `reviewBody`. This guard keeps that fix fixed.
 *
 * Checks (over the built dist/):
 *   1. no Product node carries `offers`, `availability`, `priceCurrency`, or an
 *      InStock availability value;
 *   2. no Product node carries a `review` with a `reviewRating` but no
 *      `reviewBody` (a Rating with no body is a fabricated-looking claim);
 *   3. at least one Product node survives the scan (the guard is not silently
 *      passing an empty tree);
 *   4. every Product node's brand.name equals what src/lib/productBrand.ts
 *      resolves for that record. This is a PARITY check, not a "brand must be
 *      long" check: some records genuinely carry an unresolvable clipped brand
 *      ("Baby" for a product whose listed Brand attribute is a different
 *      company), and the resolver deliberately keeps those. What must never
 *      happen is a renderer reading `product.brand` directly and disagreeing
 *      with the resolver — that shipped "Radio" in review structured data while
 *      the product page said "Radio Flyer".
 *
 * Run: npm run check:product-schema   (after `npm run build`)
 * Self-test: npm run check:product-schema:selftest
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { resolveProductBrand } from "../src/lib/productBrand.ts";

const DIST = resolve(process.env.CHECK_PRODUCT_SCHEMA_ROOT || "dist");

// A Product node is "fabricated" if it claims a live offer we do not fulfil.
const OFFER_KEYS = new Set(["offers", "availability", "priceCurrency"]);
const INSTOCK_MARKERS = ["InStock", "https://schema.org/InStock", "https://schema.org/OutOfStock"];

const problems = [];
const fail = (where, msg) => problems.push(`${where} — ${msg}`);

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

/** Every JSON-LD object on the page, arrays unwrapped. */
function jsonLdObjects(html) {
  const out = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let parsed;
    try {
      parsed = JSON.parse(m[1]);
    } catch {
      continue; // malformed block is a different bug
    }
    for (const o of Array.isArray(parsed) ? parsed : [parsed]) {
      if (o && typeof o === "object") out.push(o);
    }
  }
  return out;
}

/** Walk the whole tree collecting nodes whose @type includes Product. */
function collectProducts(node, out = []) {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) {
    for (const item of node) collectProducts(item, out);
    return out;
  }
  const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
  if (types.includes("Product")) out.push(node);
  for (const value of Object.values(node)) {
    if (value && typeof value === "object") collectProducts(value, out);
  }
  return out;
}

function rel(file) {
  return file.slice(DIST.length + 1).split("\\").join("/");
}

/**
 * Brand parity: the published brand must equal the shared resolver's answer.
 *
 * The records that carry a clipped brand are a known, quantified data issue
 * (src/lib/productBrand.ts documents all 54 it can prove). A guard that simply
 * demands "no short brands" would stay red forever on the handful the resolver
 * cannot prove — and a permanently red guard gets ignored, which is worse than
 * no guard. What is both true and checkable is CONSISTENCY: whoever emits
 * Brand.name must use the resolver. Reading `product.brand` directly is the
 * failure mode that produced a review page saying "Radio" beside a product page
 * saying "Radio Flyer".
 */
let BRAND_SNAPSHOT = null;

/** Record id -> the brand the resolver produces, for the current snapshot. */
function resolvedBrandIndex() {
  if (BRAND_SNAPSHOT) return BRAND_SNAPSHOT;
  const snapshot = resolve(join(import.meta.dirname ?? ".", "cms-snapshots", "products.json"));
  const index = new Map();
  if (existsSync(snapshot)) {
    const raw = JSON.parse(readFileSync(snapshot, "utf8"));
    const records = Array.isArray(raw) ? raw : raw.records || raw.data || Object.values(raw);
    for (const record of records) {
      const id = String(record?.id || "").trim().toLowerCase();
      if (!id) continue;
      const stored = String(record.en?.brandText || record.brand || "").trim();
      index.set(id, resolveProductBrand(record, stored));
    }
  }
  BRAND_SNAPSHOT = index;
  return index;
}

/**
 * The record id a product page or a review's itemReviewed points at.
 * Both carry the id in their URL (the last path segment), which is how the
 * site addresses products, so it is stable across page types.
 */
function recordIdFromUrl(url) {
  const text = String(url || "");
  const last = text.split("/").filter(Boolean).pop() || "";
  return last.split("?")[0].split("#")[0].trim().toLowerCase();
}

function selfTest() {
  /** Scan a synthetic HTML fragment into a fresh problems list. */
  function scanFragment(html) {
    const local = [];
    for (const product of collectProducts(jsonLdObjects(html))) {
      for (const key of OFFER_KEYS) {
        if (key in product) local.push(`Product carries "${key}"`);
      }
      if (INSTOCK_MARKERS.some((marker) => JSON.stringify(product).includes(marker))) {
        local.push("Product carries an InStock/OutOfStock availability value");
      }
      const review = product.review;
      if (review && review.reviewRating && !review.reviewBody) {
        local.push("Product.review has a reviewRating but no reviewBody");
      }
      const brandName = product.brand && typeof product.brand === "object" ? product.brand.name : "";
      const expected = resolvedBrandIndex().get(recordIdFromUrl(product.url));
      if (expected !== undefined && brandName && brandName !== expected) {
        local.push("Product.brand.name disagrees with the shared resolver");
      }
    }
    return local;
  }

  const probes = [];
  const probe = (name, html, expectOk) => {
    const flagged = scanFragment(html).length > 0;
    const ok = flagged === !expectOk; // expectOk true  => must NOT flag
    probes.push({ name, expectOk, flagged, ok });
  };

  // A clean Product: no offer, aggregateRating gated, review with body.
  probe(
    "clean-product",
    `<script type="application/ld+json">[{"@context":"https://schema.org","@type":"Product","name":"X","brand":{"@type":"Brand","name":"B"},"aggregateRating":{"@type":"AggregateRating","ratingValue":4.7,"bestRating":5,"ratingCount":120},"review":{"@type":"Review","reviewBody":"good","reviewRating":{"@type":"Rating","ratingValue":8.4,"bestRating":10}}}]</script>`,
    true,
  );

  // Fabricated: a price + InStock Offer.
  probe(
    "fabricated-offer",
    `<script type="application/ld+json">[{"@context":"https://schema.org","@type":"Product","name":"X","offers":{"@type":"Offer","price":"19.99","priceCurrency":"USD","availability":"https://schema.org/InStock"}}]</script>`,
    false,
  );

  // Fabricated: a rating with no body.
  probe(
    "rating-no-body",
    `<script type="application/ld+json">[{"@context":"https://schema.org","@type":"Product","name":"X","review":{"@type":"Review","reviewRating":{"@type":"Rating","ratingValue":8.4,"bestRating":10}}}]</script>`,
    false,
  );

  // Brand parity, tested against the resolver contract rather than a page.
  // A record whose array order changed the answer would break the pages this
  // check protects, so the contract is asserted directly.
  const brandProbes = [
    // An advanced resolver fixes a clipped head word.
    {
      name: "brand-resolver-corrects-clipped-head",
      ok: resolveProductBrand(
        { name: "Radio Flyer Mini Classic Wagon", brand: "Radio", Product_Specifications: { Item_Details: { Brand: "Radio Flyer" } } },
        "Radio",
      ) === "Radio Flyer",
    },
    // A correction that the product NAME does not anchor is rejected.
    {
      name: "brand-resolver-rejects-unanchored",
      ok: resolveProductBrand(
        { name: "Baby Delight Bassinet", brand: "Baby", Product_Specifications: { Item_Details: { Brand: "Baby Trend" } } },
        "Baby",
      ) === "Baby",
    },
    // An ordinary one-word brand is never rewritten.
    {
      name: "brand-resolver-leaves-normal-brand",
      ok: resolveProductBrand(
        { name: "Graco Extend2Fit Car Seat", brand: "Graco", Product_Specifications: { Item_Details: { Brand: "Graco" } } },
        "Graco",
      ) === "Graco",
    },
  ];
  probes.push(
    ...brandProbes.map((p) => ({ name: p.name, expectOk: true, flagged: !p.ok, ok: p.ok })),
  );

  const failed = probes.filter((p) => !p.ok);
  const ok = failed.length === 0;
  console.log(JSON.stringify({ ok, selfTest: true, probes, failed }, null, 2));
  process.exit(ok ? 0 : 1);
}

function scanHtmlString(where, html) {
  for (const product of collectProducts(jsonLdObjects(html))) {
    for (const key of OFFER_KEYS) {
      if (key in product) fail(where, `Product carries "${key}" — fabricated offer / availability claim`);
    }
    if (INSTOCK_MARKERS.some((marker) => JSON.stringify(product).includes(marker))) {
      fail(where, "Product carries an InStock/OutOfStock availability value");
    }
    const review = product.review;
    if (review && review.reviewRating && !review.reviewBody) {
      fail(where, "Product.review has a reviewRating but no reviewBody — fabricated-looking rating");
    }
    const brandName = product.brand && typeof product.brand === "object" ? product.brand.name : "";
    const recordId = recordIdFromUrl(product.url);
    const expected = resolvedBrandIndex().get(recordId);
    if (expected !== undefined && brandName && brandName !== expected) {
      fail(
        where,
        `Product.brand.name "${brandName}" disagrees with the shared resolver's "${expected}" for ${recordId} — emit brand via src/lib/productBrand.ts`,
      );
    }
  }
}

function main() {
  if (!existsSync(DIST)) {
    console.error(JSON.stringify({ ok: false, failed: ["dist missing — run npm run build first"] }, null, 2));
    process.exit(1);
  }
  const files = walk(DIST);
  let productPages = 0;
  let productNodes = 0;
  for (const file of files) {
    const html = readFileSync(file, "utf8");
    const products = collectProducts(jsonLdObjects(html));
    if (products.length) productPages += 1;
    productNodes += products.length;
    scanHtmlString(rel(file), html);
  }
  if (productNodes === 0) {
    fail("dist", "no Product JSON-LD found anywhere — the guard is not actually checking anything");
  }
  const ok = problems.length === 0;
  console.log(
    JSON.stringify(
      { ok, productPages, productNodes, checked: files.length, problems },
      null,
      2,
    ),
  );
  process.exit(ok ? 0 : 1);
}

if (process.argv.includes("--self-test")) selfTest();
else main();
