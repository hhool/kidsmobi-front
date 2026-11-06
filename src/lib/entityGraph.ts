/**
 * One entity graph for the whole site.
 *
 * R-928 asks for Organization JSON-LD that is *identical across pages*, with a
 * single `@id` an engine can merge on. The site had neither: the Organization
 * node was hand-written in 31 places in scripts/prerender-pages.ts and 35 more
 * under src/, so by 2026-11-06 the delivered tree carried 220 nodes with an
 * `@id` count of zero, and 223 of the 443 pages carried no Organization at all.
 * The SPA's copy also shipped a one-item `sameAs` (x.com/bbtreviews) while the
 * prerender shipped two, so the hydrated page disagreed with the HTML that
 * carried it.
 *
 * Editing those 66 sites would have fixed today and drifted tomorrow. Instead
 * every JSON-LD payload passes through `normalizeEntityGraph()` and every
 * prerendered document through `applyEntityGraphToHtml()`: the entity is
 * described once, by reference everywhere else, and a new template cannot
 * introduce a name-shaped Organization by accident.
 *
 * Which nodes are ours is decided by name or by url, never by position:
 *   - "BalanceBikeToddler"                        -> the site entity
 *   - "BalanceBikeToddler Editorial Team"         -> the editorial desk
 *   - any other Organization (CPSC, a cited body) -> left exactly as written
 */
import { OFFICIAL_X_URL } from "./socialShare";

export const SITE_ORIGIN = "https://balancebiketoddler.com";
export const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;
export const EDITORIAL_DESK_ID = `${SITE_ORIGIN}/#editorial-desk`;
export const ORGANIZATION_NAME = "BalanceBikeToddler";
export const ORGANIZATION_LOGO = `${SITE_ORIGIN}/favicon-512x512.png`;
export const EDITORIAL_DESK_NAME = "BalanceBikeToddler Editorial Team";
/** The page that says who checks these guides — the desk's resolvable address. */
export const EDITORIAL_DESK_URL = `${SITE_ORIGIN}/transparency/editorial-team/`;

/**
 * Profiles the site claims. Only URLs that resolve to a profile: a platform
 * root is worse than no sameAs at all, and check-jsonld.mjs fails on one.
 * The X handle is read from socialShare.ts so the footer, the share intent and
 * the entity cannot disagree about it.
 */
export const SITE_SAME_AS: string[] = ["https://www.youtube.com/@kidsmobi", OFFICIAL_X_URL];

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: ORGANIZATION_NAME,
  url: `${SITE_ORIGIN}/`,
  logo: ORGANIZATION_LOGO,
  sameAs: SITE_SAME_AS,
};

/**
 * The desk is a child entity, not a second brand: it carries the site as
 * `parentOrganization`, so "who wrote this" resolves upward to one operator
 * instead of inventing a peer organization. It is an Organization and not a
 * Person on purpose — nobody has been named as the author, and a Person node
 * with an invented name is the one thing this site's own transparency page
 * promises not to do.
 *
 * No `@context`: this node is always emitted nested (as `author`), where the
 * enclosing block already sets one. Repeating it there would make the same
 * entity byte-different between a page that nests it twice and one that nests
 * it once.
 */
const editorialDeskSchema = {
  "@type": "Organization",
  "@id": EDITORIAL_DESK_ID,
  name: EDITORIAL_DESK_NAME,
  url: EDITORIAL_DESK_URL,
  parentOrganization: { "@id": ORGANIZATION_ID },
};

export const ORGANIZATION_SCHEMA = organizationSchema;
export const EDITORIAL_DESK_SCHEMA = editorialDeskSchema;

function typesOf(node: Record<string, unknown>): string[] {
  const type = node["@type"];
  if (typeof type === "string") return [type];
  if (Array.isArray(type)) return type.filter((item): item is string => typeof item === "string");
  return [];
}

function resolvesToSite(node: Record<string, unknown>): boolean {
  const url = node.url;
  if (typeof url !== "string") return false;
  return url === SITE_ORIGIN || url === `${SITE_ORIGIN}/`;
}

/** The editorial desk: matched by name or by its own `@id`. */
export function isEditorialDesk(node: Record<string, unknown>): boolean {
  if (node["@id"] === EDITORIAL_DESK_ID) return true;
  return node.name === EDITORIAL_DESK_NAME;
}

/** The site entity: matched by name, by its `@id`, or by pointing at the origin. */
export function isSiteOrganization(node: Record<string, unknown>): boolean {
  if (!typesOf(node).includes("Organization")) return false;
  if (isEditorialDesk(node)) return false;
  if (node["@id"] === ORGANIZATION_ID) return true;
  if (node.name === ORGANIZATION_NAME) return true;
  return resolvesToSite(node);
}

export interface NormalizeOptions {
  /**
   * Replace a site Organization with `{"@id": ...}` instead of a full node.
   * Used by the document pass, where the canonical node is emitted once at the
   * top of the head: a page that describes the same entity three times is the
   * inconsistency R-928 is about, even when the three copies agree.
   */
  demoteSiteNodes?: boolean;
}

/**
 * Rewrite every node of ours into its canonical shape. Other Organizations,
 * Persons and everything else are returned untouched — a cited body such as
 * CPSC keeps its own identity.
 */
export function normalizeEntityGraph<T>(value: T, options: NormalizeOptions = {}): T {
  const demote = options.demoteSiteNodes === true;

  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);
    if (!node || typeof node !== "object") return node;

    const source = node as Record<string, unknown>;
    const copy: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(source)) copy[key] = walk(item);

    if (isEditorialDesk(copy)) return { ...editorialDeskSchema };
    if (isSiteOrganization(copy)) {
      if (demote) return { "@id": ORGANIZATION_ID };
      // A multi-typed node (["Organization", "Brand"]) keeps its type list: the
      // extra type is a claim the data made, not drift.
      const type = copy["@type"];
      return Array.isArray(type)
        ? { ...organizationSchema, "@type": type }
        : { ...organizationSchema };
    }
    return copy;
  };

  return walk(value) as T;
}

const LD_BLOCK = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
const CANONICAL_BLOCK = `<script type="application/ld+json">${JSON.stringify(organizationSchema)}</script>`;

interface Block {
  start: number;
  end: number;
  body: string;
}

function findBlocks(html: string): Block[] {
  const out: Block[] = [];
  for (const match of html.matchAll(LD_BLOCK)) {
    const start = match.index ?? 0;
    out.push({ start, end: start + match[0].length, body: match[1] });
  }
  return out;
}

function firstEntryIsCanonical(body: string): boolean {
  try {
    const parsed = JSON.parse(body);
    const first = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!first || typeof first !== "object") return false;
    return JSON.stringify(first) === JSON.stringify(organizationSchema);
  } catch {
    return false;
  }
}

/**
 * Give every prerendered document the same entity graph.
 *
 * 1. the canonical Organization block goes first, because R-928's detector
 *    reads the first Organization on the page and a citation that happens to
 *    precede ours must not become the entity the site is filed under;
 * 2. every other node of ours becomes a reference to it, so the description
 *    exists exactly once and cannot disagree with itself;
 * 3. a page with no Organization at all (223 of 443) gets one.
 *
 * Idempotent: running it over its own output returns the same bytes.
 */
export function applyEntityGraphToHtml(html: string): string {
  const blocks = findBlocks(html);
  if (blocks.length === 0) {
    return html.includes("</head>")
      ? html.replace("</head>", `${CANONICAL_BLOCK}</head>`)
      : `${CANONICAL_BLOCK}${html}`;
  }

  const pieces: Array<{ start: number; end: number; text: string }> = [];
  let out = html;
  // Rewrite from the back so earlier offsets stay valid.
  for (const block of [...blocks].reverse()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(block.body);
    } catch {
      continue; // a malformed block is check-jsonld's problem, not a reason to drop it
    }
    // A top-level node of ours is *replaced* by the canonical block, not
    // demoted: keeping `{"@id": ...}` at the head of the page would leave a
    // dangling reference where a description used to be.
    let next: unknown;
    if (Array.isArray(parsed)) {
      const kept = parsed.filter(
        (entry) => !(entry && typeof entry === "object" && isSiteOrganization(entry as Record<string, unknown>)),
      );
      next = kept.length ? normalizeEntityGraph(kept, { demoteSiteNodes: true }) : null;
    } else if (parsed && typeof parsed === "object" && isSiteOrganization(parsed as Record<string, unknown>)) {
      next = null;
    } else {
      next = normalizeEntityGraph(parsed, { demoteSiteNodes: true });
    }
    const text =
      next === null
        ? ""
        : `<script type="application/ld+json">${JSON.stringify(next)}</script>`;
    pieces.push({ start: block.start, end: block.end, text });
  }
  for (const piece of pieces.sort((a, b) => b.start - a.start)) {
    out = out.slice(0, piece.start) + piece.text + out.slice(piece.end);
  }

  const first = findBlocks(out)[0];
  if (first && firstEntryIsCanonical(first.body)) return out;
  const at = first ? first.start : out.lastIndexOf("</head>");
  if (at < 0) return `${CANONICAL_BLOCK}${out}`;
  return out.slice(0, at) + CANONICAL_BLOCK + out.slice(at);
}
