const JSON_LD_ATTR = "data-seo-jsonld-key";

type CollectionPageInput = {
  name: string;
  url: string;
  items: Array<{
    name: string;
    url: string;
  }>;
  description?: string;
  inLanguage?: string;
  author?: {
    "@type": "Organization" | "Person";
    name: string;
  };
  datePublished?: string;
  dateModified?: string;
};

// Three independent JSON-LD emitters share the DOM, and each page must end up
// with exactly one node per @type:
//
//   prerender  - baked into the static HTML, unmarked (no attributes)
//   app        - the main SEO effect, marked with data-seo-jsonld
//   keyed      - the section components, keyed with data-seo-jsonld-key
//
// The prerendered block is authoritative for the page it describes: it is what
// crawlers that never run JavaScript see, so it is kept. But it belongs to
// whichever URL was served, so after client-side navigation it is stale and
// must go, otherwise the app/keyed emitters stack a second node on top of it
// (or, worse, defer to it and never emit the current page's node at all).
const PRERENDER_SELECTOR =
  "script[type='application/ld+json']:not([data-seo-jsonld]):not([data-seo-jsonld-key])";

// Site-wide nodes: their url is the site root, so they never match a page path.
// They are valid on every page and must survive navigation pruning.
const SITE_WIDE_TYPES = new Set(["Organization", "WebSite"]);

// Google models these as one node per page, so emitting two is a duplicate
// even though the @type strings differ.
const EQUIVALENT_TYPES: Record<string, string[]> = {
  Article: ["Article", "NewsArticle", "BlogPosting"],
  NewsArticle: ["Article", "NewsArticle", "BlogPosting"],
  BlogPosting: ["Article", "NewsArticle", "BlogPosting"],
};

type LdEntry = Record<string, any>;

const normalizePath = (value: unknown): string | null => {
  if (typeof value !== "string" || !value) return null;
  try {
    // Resolve against the current origin so absolute and relative urls compare
    // equal, then compare on path alone: canonical paths differ only there.
    const path = new URL(value, window.location.origin).pathname;
    if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
    return path;
  } catch {
    return null;
  }
};

// The page a node describes. BreadcrumbList is special-cased: its trail lists
// every ancestor, so only the final item identifies the page. Nested urls
// (ItemList members, mainEntity) are ignored — they describe other pages.
const entryPageUrl = (entry: LdEntry): string | null => {
  if (entry["@type"] === "BreadcrumbList" && Array.isArray(entry.itemListElement)) {
    const last = entry.itemListElement[entry.itemListElement.length - 1];
    if (last && typeof last === "object") return normalizePath(last.item);
    return null;
  }
  return normalizePath(entry.url);
};

const readEntries = (script: Element): LdEntry[] => {
  let data: unknown;
  try {
    data = JSON.parse(script.textContent || "");
  } catch {
    return [];
  }
  const list = Array.isArray(data) ? data : [data];
  return list.filter((entry): entry is LdEntry => Boolean(entry) && typeof entry === "object");
};

// Removes prerendered blocks that describe a different page than the one
// currently routed to. A block is judged as a unit: it was generated for one
// URL, so if any of its page-scoped nodes point elsewhere the whole block is
// stale — including its nodes that carry no url of their own (a FAQPage, say).
export function pruneStalePrerendered(): void {
  const current = normalizePath(window.location.pathname);
  if (!current) return;
  for (const script of [...document.querySelectorAll(PRERENDER_SELECTOR)]) {
    const stale = readEntries(script).some((entry) => {
      if (SITE_WIDE_TYPES.has(entry["@type"])) return false;
      const url = entryPageUrl(entry);
      return url !== null && url !== current;
    });
    if (stale) script.remove();
  }
}

// Drops nodes the prerendered HTML already provides for the current page, so
// the DOM keeps exactly one node per @type whatever the render order.
export function dropPrerenderedDuplicates(
  schemas: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  pruneStalePrerendered();
  const present = new Set<string>();
  for (const script of document.querySelectorAll(PRERENDER_SELECTOR)) {
    for (const entry of readEntries(script)) present.add(entry["@type"]);
  }
  return schemas.filter((schema) => {
    const type = schema["@type"];
    if (typeof type !== "string") return true;
    for (const variant of EQUIVALENT_TYPES[type] || [type]) {
      if (present.has(variant)) return false;
    }
    return true;
  });
}

export function clearJsonLd(key: string) {
  document.querySelectorAll(`script[${JSON_LD_ATTR}='${key}']`).forEach((node) => node.remove());
}

export function setJsonLd(key: string, schemas: Record<string, unknown> | Array<Record<string, unknown>>) {
  // Clear our own key first: a skip must still retire the previous page's node.
  clearJsonLd(key);
  const items = Array.isArray(schemas) ? schemas : [schemas];
  for (const schema of dropPrerenderedDuplicates(items)) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute(JSON_LD_ATTR, key);
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
  }
}

export function setCollectionPageJsonLd(key: string, input: CollectionPageInput) {
  setJsonLd(key, {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    url: input.url,
    description: input.description,
    inLanguage: input.inLanguage,
    author: input.author,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.items.length,
      itemListElement: input.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: item.url,
      })),
    },
  });
}