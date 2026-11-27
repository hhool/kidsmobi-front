#!/bin/bash
# Build with a custom site origin + display brand (rebrand / domain migration).
# Usage: ./scripts/build-with-domain.sh <origin> [brand]
#   ./scripts/build-with-domain.sh https://kidstravellab.com KidsTravelLab
#   ./scripts/build-with-domain.sh https://balancebiketoddler.com BalanceBikeToddler   # canonical/default

set -e

SITE_ORIGIN="${1:-https://balancebiketoddler.com}"
SITE_BRAND="${2:-BalanceBikeToddler}"

echo "🔨 Building with SITE_ORIGIN=$SITE_ORIGIN  SITE_BRAND=$SITE_BRAND"

# Export once so every sub-process (vite define, esbuild bundle, tsx prerender,
# home assembly, llms) reads the same identity. Explicit per-command env below
# is kept for clarity/defence-in-depth.
export SITE_ORIGIN="$SITE_ORIGIN"
export SITE_BRAND="$SITE_BRAND"

npm run build:fonts:subset
./node_modules/.bin/vite build
mkdir -p .runs/home-ssr .runs/server
cp dist/index.html .runs/home-ssr/spa-shell.html
./node_modules/.bin/esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=.runs/server/server.cjs
SITE_ORIGIN="$SITE_ORIGIN" SITE_BRAND="$SITE_BRAND" npx tsx scripts/prerender-pages.ts
SITE_ORIGIN="$SITE_ORIGIN" SITE_BRAND="$SITE_BRAND" npm run build:home
SITE_ORIGIN="$SITE_ORIGIN" SITE_BRAND="$SITE_BRAND" node scripts/gen-llms.mjs
SITE_ORIGIN="$SITE_ORIGIN" SITE_BRAND="$SITE_BRAND" node scripts/stamp-llms.mjs

echo "✅ Build complete!"
echo "   SITE_ORIGIN: $SITE_ORIGIN"
echo "   SITE_BRAND:  $SITE_BRAND"
echo "   Output: dist/"
