/**
 * Self-test for src/lib/entityGraph.ts — the transform that gives every page the
 * same Organization.
 *
 * The transform only earns its place if it can be shown to fail: a check that
 * cannot fail is decoration. So each case is paired with the state that must
 * still be rejected — a bare `{"@type":"Organization"}` with no `@id`, a cited
 * body that must keep its own identity, and a Person node that must not appear
 * until a person is actually named.
 *
 * Run: npm run check:entitygraph   (no build needed; pure function over fixtures)
 */
import {
  applyEntityGraphToHtml,
  EDITORIAL_DESK_ID,
  EDITORIAL_DESK_NAME,
  ORGANIZATION_ID,
  ORGANIZATION_NAME,
  ORGANIZATION_SCHEMA,
  SITE_ORIGIN,
  SITE_SAME_AS,
} from "../src/lib/entityGraph";

const problems: string[] = [];
const cases: string[] = [];

function check(name: string, ok: boolean, detail: string) {
  cases.push(name);
  if (!ok) problems.push(`${name} — ${detail}`);
}

function blocks(html: string): unknown[] {
  const out: unknown[] = [];
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    out.push(JSON.parse(match[1]));
  }
  return out;
}

/** Every object in every block, flattened — order preserved. */
function flatten(value: unknown, out: object[] = []): object[] {
  if (Array.isArray(value)) {
    for (const item of value) flatten(item, out);
  } else if (value && typeof value === "object") {
    out.push(value as object);
    for (const item of Object.values(value as Record<string, unknown>)) flatten(item, out);
  }
  return out;
}

const page = (jsonld: string) =>
  `<!doctype html><html><head><meta charset="utf-8"><title>t</title>${jsonld}</head><body><p>x</p></body></html>`;

// --- 1. A page whose Organization is a bare name (223 of 443 shipped this way)
{
  const html = page(
    `<script type="application/ld+json">[{"@type":"Organization","name":"BalanceBikeToddler","logo":"${SITE_ORIGIN}/favicon-512x512.png"},{"@type":"WebSite","url":"${SITE_ORIGIN}/","name":"BalanceBikeToddler"}]</script>`,
  );
  const out = applyEntityGraphToHtml(html);
  const parsed = blocks(out);
  const first = Array.isArray(parsed[0]) ? parsed[0][0] : parsed[0];
  check(
    "a bare Organization is replaced by the canonical one, with @id",
    JSON.stringify(first) === JSON.stringify(ORGANIZATION_SCHEMA),
    `first node was ${JSON.stringify(first)}`,
  );
  check(
    "the canonical node leads, so a citation cannot become the entity",
    out.indexOf(`"@id":"${ORGANIZATION_ID}"`) < out.indexOf(`"@type":"WebSite"`),
    "the canonical block is not the first JSON-LD on the page",
  );
  check(
    "the rest of the page survives the rewrite",
    out.includes(`"@type":"WebSite"`),
    "the WebSite node was dropped",
  );
}

// --- 2. The same entity written three ways on one page, plus a desk author
{
  const html = page(
    `<script type="application/ld+json">[{"@type":"Organization","name":"BalanceBikeToddler","sameAs":["https://x.com/bbtreviews"]},{"@type":"Article","headline":"h","author":{"@type":"Organization","name":"${EDITORIAL_DESK_NAME}"},"publisher":{"@type":"Organization","name":"BalanceBikeToddler","url":"${SITE_ORIGIN}/"}}]</script>`,
  );
  const out = applyEntityGraphToHtml(html);
  const all = blocks(out).flatMap((block) => flatten(block)) as Array<Record<string, unknown>>;

  const siteNodes = all.filter(
    (node) => node["@type"] === "Organization" && node["@id"] === ORGANIZATION_ID,
  );
  check(
    "the entity is described exactly once, whatever the template did",
    siteNodes.length === 1,
    `${siteNodes.length} full descriptions of the site entity survived`,
  );

  const publisher = all.find((node) => node["@type"] === "Article")?.["publisher"] as
    | Record<string, unknown>
    | undefined;
  check(
    "a second mention becomes a reference to the first",
    publisher !== undefined && publisher["@id"] === ORGANIZATION_ID && Object.keys(publisher).length === 1,
    `publisher was ${JSON.stringify(publisher)}`,
  );

  const author = all.find((node) => node["@type"] === "Article")?.["author"] as
    | Record<string, unknown>
    | undefined;
  check(
    "the editorial desk becomes a resolvable entity, not a name",
    author?.["@id"] === EDITORIAL_DESK_ID &&
      author?.["parentOrganization"] !== undefined &&
      typeof author?.["url"] === "string",
    `author was ${JSON.stringify(author)}`,
  );
  check(
    "the desk resolves upward to one operator",
    JSON.stringify(author?.["parentOrganization"]) === JSON.stringify({ "@id": ORGANIZATION_ID }),
    `parentOrganization was ${JSON.stringify(author?.["parentOrganization"])}`,
  );
  check(
    "no Person is invented for a team",
    JSON.stringify(out).includes(`"@type":"Person"`) === false,
    "a Person node appeared although nobody is named",
  );
  check(
    "the sameAs set is the full one, not whatever the template shipped",
    JSON.stringify(siteNodes[0]?.["sameAs"]) === JSON.stringify(SITE_SAME_AS),
    `sameAs was ${JSON.stringify(siteNodes[0]?.["sameAs"])}`,
  );
}

// --- 3. A page with no Organization at all (223 of the 443 shipped this way)
{
  const out = applyEntityGraphToHtml(
    page(`<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[]}</script>`),
  );
  const first = blocks(out)[0];
  check(
    "a page with no Organization gets one",
    JSON.stringify(first) === JSON.stringify(ORGANIZATION_SCHEMA),
    `first block was ${JSON.stringify(first)}`,
  );
}

// --- 4. A cited body keeps its own identity
{
  const cpsc = `{"@type":"Organization","name":"U.S. Consumer Product Safety Commission","url":"https://www.cpsc.gov/"}`;
  const out = applyEntityGraphToHtml(
    page(`<script type="application/ld+json">{"@type":"Article","headline":"h","citation":${cpsc}}</script>`),
  );
  const all = blocks(out).flatMap((block) => flatten(block)) as Array<Record<string, unknown>>;
  const cited = all.find((node) => node["name"] === "U.S. Consumer Product Safety Commission");
  check(
    "a third-party organization is left exactly as written",
    cited !== undefined && cited["@id"] === undefined && cited["url"] === "https://www.cpsc.gov/",
    `the cited body came out as ${JSON.stringify(cited)}`,
  );
}

// --- 5. Idempotency: a build that runs the step twice must not differ
{
  const html = page(
    `<script type="application/ld+json">[{"@type":"Organization","name":"BalanceBikeToddler"},{"@type":"Article","author":{"@type":"Organization","name":"${EDITORIAL_DESK_NAME}"}}]</script>`,
  );
  const once = applyEntityGraphToHtml(html);
  const twice = applyEntityGraphToHtml(once);
  check("running the step twice changes nothing", once === twice, "the output is not stable under re-runs");
}

// --- 6. A document with no JSON-LD at all still gets the entity
{
  const out = applyEntityGraphToHtml("<!doctype html><html><head><title>t</title></head><body></body></html>");
  check(
    "a document with no JSON-LD block gets one, inside <head>",
    out.includes(`"@id":"${ORGANIZATION_ID}"`) && out.indexOf(ORGANIZATION_ID) < out.indexOf("</head>"),
    "the node was not inserted into the head",
  );
}

// --- 7. Reverse: the detector this feeds must still be able to fail
{
  // The audit reads the first Organization on the page and its first @id. If a
  // page were allowed to describe the site with a different name, that reader
  // would file the site under the wrong entity.
  const out = applyEntityGraphToHtml(
    page(`<script type="application/ld+json">{"@type":"Organization","name":"${ORGANIZATION_NAME}","url":"${SITE_ORIGIN}/","@id":"https://example.com/#org"}</script>`),
  );
  check(
    "a wrong @id is rewritten, not preserved",
    out.includes("example.com/#org") === false,
    "the stale @id survived the pass",
  );
}

const ok = problems.length === 0;
console.log(JSON.stringify({ ok, cases: cases.length, problems }, null, 2));
process.exit(ok ? 0 : 1);
