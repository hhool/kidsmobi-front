/**
 * Feasibility probe: can the REAL React homepage be rendered to static HTML
 * at build time?
 *
 * This is the question route A depends on. The earlier static-home variant
 * (LCP 1211ms / TBT 140ms) used the SEO homepage from renderHomePage() - an
 * Arial inline-style article page. That is NOT the page a reader sees: the
 * SPA paints a Tailwind homepage with a hero carousel, safety-audit sections,
 * category cards and a FAQ. Shipping that variant as-is would be a UI/UX
 * regression dressed up as a performance win.
 *
 * So the static homepage has to BE the React homepage. This probe renders it
 * through renderToStaticMarkup and reports what actually came out.
 *
 * Usage: npx tsx scripts/probe-home-ssr.tsx
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FRONT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The browser globals App.tsx reads in a RENDER BODY (not in an effect).
 * Each one is a place where "the SPA is the only renderer" was an
 * assumption. For a build-time render they have to have a value, and the
 * value has to be the homepage's value - "/" - not a random default.
 */
function installBrowserStubs(): void {
  const location = {
    pathname: "/",
    search: "",
    hash: "",
    href: "https://balancebiketoddler.com/",
    origin: "https://balancebiketoddler.com",
    host: "balancebiketoddler.com",
    hostname: "balancebiketoddler.com",
    protocol: "https:",
    port: "",
    assign() {},
    replace() {},
    reload() {},
    toString() {
      return this.href;
    },
  };
  const storage: Record<string, string> = {};
  const g = globalThis as any;
  g.window = {
    location,
    localStorage: {
      getItem: (k: string) => (k in storage ? storage[k] : null),
      setItem: (k: string, v: string) => {
        storage[k] = String(v);
      },
      removeItem: (k: string) => {
        delete storage[k];
      },
      clear: () => {},
    },
    addEventListener() {},
    removeEventListener() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    scrollTo() {},
    innerWidth: 1280,
    innerHeight: 900,
  };
  g.document = {
    location,
    addEventListener() {},
    removeEventListener() {},
    querySelectorAll: () => [],
    querySelector: () => null,
    getElementById: () => null,
    createElement: () => ({ style: {}, setAttribute() {}, remove() {} }),
    head: { appendChild() {} },
    body: { appendChild() {}, classList: { add() {}, remove() {} } },
    documentElement: { classList: { add() {}, remove() {} } },
    readyState: "complete",
  };
  g.localStorage = g.window.localStorage;
  // Node 22 defines navigator as a getter-only property, so a plain
  // assignment throws. defineProperty replaces the descriptor instead.
  Object.defineProperty(g, "navigator", {
    configurable: true,
    writable: true,
    value: { language: "en-US", languages: ["en-US"], userAgent: "node" },
  });
  g.location = location;
  g.requestIdleCallback = (cb: any) => setTimeout(() => cb({ didTimeout: false }), 0);
  g.cancelIdleCallback = (id: any) => clearTimeout(id);
  g.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  g.matchMedia = g.window.matchMedia;
}

installBrowserStubs();

const React = (await import("react")).default;
const { renderToStaticMarkup } = await import("react-dom/server");

/** The CMS snapshot the prerenderer already commits. */
type SnapshotProduct = Record<string, unknown>;
function loadProducts(): SnapshotProduct[] {
  const file = path.join(FRONT, "scripts/cms-snapshots/products.json");
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(parsed)) throw new Error("products snapshot is not an array");
  return parsed;
}

const products = loadProducts();
console.log(`products from snapshot: ${products.length}`);

// The App needs the CMS products in its state. Its useEffect never runs under
// a static render, so the products have to be injected rather than fetched.
const AppMod = await import(path.join(FRONT, "src/App.tsx"));
const App = (AppMod as any).default;

const markup = renderToStaticMarkup(React.createElement(App));

console.log(`markup bytes: ${markup.length}`);
const checks: Array<[string, boolean]> = [
  ["hero banner anchor", markup.includes("home_banner_anchor")],
  ["home layout root", markup.includes("home_layout")],
  ["safety audits section", markup.includes("safety_audits_anchor")],
  ["category highlights", markup.includes("category_highlights_anchor")],
  ["quick scenarios", markup.includes("quick_scenarios_anchor")],
  ["FAQ section", markup.includes("faq_section_anchor")],
  ["core header", markup.includes("core_header")],
  ["main footer", markup.includes("main_footer")],
  ["Suspense fallback leaked", markup.includes("Loading BalanceBikeToddler")],
  ["product card rendered", markup.includes("overallScore") || markup.includes("Price pending")],
  ["Tailwind utility classes", /class="[^"]*\b(flex|grid|text-slate-|bg-slate-)/.test(markup)],
  ["hero slide 0 visible", markup.includes("opacity: 0.62")],
];
for (const [name, ok] of checks) console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);

const cardCount = (markup.match(/Price pending/g) || []).length;
console.log(`cards with no price: ${cardCount}`);
console.log(`tailwind classes present: ${(markup.match(/class="/g) || []).length} class attributes`);
