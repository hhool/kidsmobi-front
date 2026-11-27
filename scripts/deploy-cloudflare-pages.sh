#!/bin/bash
# Deploy front dist to Cloudflare Pages
# Usage: ./scripts/deploy-cloudflare-pages.sh [branch-name]

set -e

BRANCH_NAME="${1:-$(git rev-parse --abbrev-ref HEAD)}"
PROJECT_NAME="kidsmobi"

echo "🚀 Deploying to Cloudflare Pages..."
echo "   Branch: $BRANCH_NAME"
echo "   Project: $PROJECT_NAME"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ wrangler not found. Installing..."
    npm install -g wrangler
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Cloudflare Pages
echo "☁️  Uploading to Cloudflare Pages..."
wrangler pages deploy dist \
  --project-name="$PROJECT_NAME" \
  --branch="$BRANCH_NAME" \
  --commit-dirty=true

echo "✅ Deployment complete!"
echo "   Preview URL: https://$BRANCH_NAME.kidsmobi.pages.dev"
