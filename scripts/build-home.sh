#!/usr/bin/env bash
#
# Build the static homepage and put it in dist/index.html.
#
# Why a separate step
# -------------------
# The homepage ships as a static document. It is the only delivery shape that
# clears audit items 23 (LCP < 2000 ms) and 24 (TBT < 200 ms): a React mount
# of the homepage costs about 2,900 ms of main-thread time against a 200 ms
# budget, and the hero image cannot paint until the main thread is free.
#
# The document is NOT a different page. It is the REAL React homepage,
# rendered at build time by src/ssr/home-entry.tsx, so the reader sees the
# same design the SPA paints - only without the 300 KB of JavaScript that
# cannot be afforded on the critical path.
#
# The order matters and each step depends on the previous one:
#
#   1. the SSR bundle        - vite has to define import.meta.env the way the
#                              browser build does, so the app's own modules
#                              load unchanged.
#   2. the render            - emits ONE settled document (no Suspense
#                              fallback, no hidden boundary).
#   3. the critical CSS      - extracted from the BUILT stylesheet against
#                              the classes the rendered markup actually uses.
#   4. the assembly          - takes the prerender's head (the TDK, the
#                              canonical, the JSON-LD, the hero preload) and
#                              the SSR body, and drops the SPA's bundle.
#
# The prerender has to have run first: its head is the source of truth for
# everything the document says about itself.
set -euo pipefail

cd "$(dirname "$0")/.."

RUN_DIR=".runs/home-ssr"
CSS_BUNDLE="$(ls -t dist/assets/index-*.css 2>/dev/null | head -1)"

if [ -z "$CSS_BUNDLE" ]; then
  echo "FATAL: no built stylesheet in dist/assets - run the vite build first" >&2
  exit 1
fi
if [ ! -f dist/index.html ]; then
  echo "FATAL: dist/index.html does not exist - run the prerender first" >&2
  exit 1
fi

mkdir -p "$RUN_DIR"

echo "[home] 1/4 building the SSR bundle"
npx vite build --ssr src/ssr/home-entry.tsx --outDir "$RUN_DIR-build" --logLevel warn

echo "[home] 2/4 rendering the homepage"
node "$RUN_DIR-build/home-entry.js" > "$RUN_DIR/home.html"

echo "[home] 3/4 extracting the critical CSS from $CSS_BUNDLE"
node scripts/extract-critical-css.mjs \
  --html "$RUN_DIR/home.html" \
  --css "$CSS_BUNDLE" \
  --out "$RUN_DIR/critical.css"

# The prerendered homepage is kept before the assembly overwrites it.
#
# It is the PRODUCTION object: the document a reader gets today, with the
# boot cover, the takeover script, the body's class list and the inline
# critical CSS - and then React takes over and paints the homepage. The
# visual parity check compares the static document against THIS, because
# comparing against the bare Vite shell would measure a page nobody
# receives (no inline CSS, no body classes, a different backdrop).
cp dist/index.html "$RUN_DIR/prerendered-home.html"

echo "[home] 4/4 assembling the document"
node scripts/build-static-home.mjs \
  --shell dist/index.html \
  --ssr "$RUN_DIR/home.html" \
  --critical "$RUN_DIR/critical.css" \
  --out dist/index.html

echo "[home] done"
