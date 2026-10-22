# The three hubs orphaned their topic indexes — after hydration

Date: 2026-10-22
Scope: `/guides`, `/news`, `/reviews` and their 12 topic index children
Finding: links that exist in the prerender do not survive hydration. The fix is
in the hydrated DOM, not in the prerender.

---

## 1. How this started

After the derived duplication scan, the same question applied to links: the scan
excluded product pages, so did the link layer have a matching blind spot? A
link-equity census split links into two layers:

- `chrome` — inside `<nav>/<header>/<footer>` (on every page, passes little context)
- `content` — inside body prose (what actually signals that a page matters)

Five pages came back with `content = 0`: `/guides/budget`, `/guides/risk`,
`/guides/scenario`, `/guides/maintenance`, `/guides/special`.

## 2. A first pass that was wrong

The first census reported 21 zero-link URLs, including all seven category hubs
and all seven asset pages. That was noise: sitemap URLs keep their trailing
slash (`/products/balance-bikes/`) while I normalised links to the slashless
form, so the two sides never matched.

After normalising both sides with one function and stripping nav/header/footer,
the 21 collapsed to 11 — and the ones remaining were genuinely orphaned.

**Rule:** in a link census, the link side and the inventory side must share one
normalisation function, or the whole table is noise.

## 3. The real finding

The prerendered `/guides` does contain:

```
... in the library. Browse by topic: <a href="/guides/beginner">Beginner guides</a>.
```

One of six. `/news` carries the same line with all four channels, so this looked
like a simple omission.

But that block sits inside `<div id="root">`. The app mounts with
`createRoot().render()`, not `hydrateRoot`, so **React replaces the entire
contents of `#root`** — anything the prerender emits that the SPA does not mirror
is gone on mount.

Headless Chrome, hydrated DOM:

| page | topic-index links in prerender | after hydration |
|---|---|---|
| `/guides` | 1/6 (beginner only) | **0/6** |
| `/news` | 4/4 | **0/4** |
| `/reviews` | 2/2 | **0/2** |

So in the DOM Google actually renders, none of the three hubs links any of its
twelve topic indexes. Those pages were reachable only through the breadcrumbs on
their own children.

`/news` and `/reviews` failed differently from `/guides`: their prerender was
complete. They broke because **the channel/type switcher is a `<button>`**, not a
link at all.

## 4. What changed

Not "add a line of links" — make the links exist in the **hydrated** DOM, and
derive them so a hand-written list cannot drift:

| location | change |
|---|---|
| `GuidesSection.tsx` | topic index row in the hub block, derived from `GUIDES_TOPIC_PAGE_IDS` |
| `prerender-pages.ts:1682` | `Browse by topic` likewise derived, matching the `/news` pattern |
| `NewsSection.tsx` | channel tabs `<button>` → `<a href="/news/<channel>">`, keeping `preventDefault` and in-place filtering |
| `EvaluationsSection.tsx` | single/compare `<button>` → `<a href="/reviews/single|compare">`, same approach |

For the last two, converting the existing control beat adding a duplicate row:
the UI already exists, and `href` + `preventDefault` is invisible to the user
while handing a crawler a real link.

## 5. The guard checks the hydrated DOM

New assertion in `hydration-probe.mjs`, which CI already runs (browser infra
already in place):

```js
const HUB_TOPIC_CHILDREN = {
  '/guides': [...6], '/news': [...4], '/reviews': [...2],
};
```

Every `a[href^="/"]` is collected in `page.evaluate` and compared; any missing
child fails.

**Why not assert against the prerender:** this project has been burned three
times by guards that assert what seems right rather than what the platform shows.
Here the gap is the entire bug — the prerender passes while the live DOM is
broken. The assertion has to run against the DOM after React has mounted.

## 6. Reverse verification

- **Natural positive:** the first run after adding the guard failed two routes —
  `/news` missing four, `/reviews` missing two. That is the guard firing on real
  breakage, not on injected damage.
- **Injected, for `/guides`:** `/guides` was fixed before the guard existed, so
  it had never been seen failing. Adding a nonexistent `/guides/REVERSE-VERIFY-BOGUS`
  to its expected children made the guard report
  `hub does not link its topic index(es) after hydration: /guides/REVERSE-VERIFY-BOGUS`
  with exit 1 — confirming that path is not vacuously passing.

## 7. Results

- hydration probe **38/38**
- measured after hydration: `/guides` 6/6, `/news` 4/4, `/reviews` 2/2
- 14 static guards green, `tsc --noEmit` clean
- sitemap still **270**, legacy redirects still **46 exact + 10 prefix**

## 8. Two rules worth reusing

1. **A link in the prerender is not a link on the site.** `#root` is replaced
   wholesale on mount; to know whether page A links page B, read the DOM after
   hydration. `curl` and `dist/*.html` both give the wrong answer here.
2. **A filter built from `<button>` deletes your internal links.** Any
   channel/category/type switcher should be an `href` with `preventDefault` and
   in-place handling: unchanged for users, visible to crawlers.
