/**
 * Fix hard-coded miscategorized product links in generated HTML.
 * 
 * These links exist in CMS content but point to products with wrong categoryId:
 * - electric_vehicles-b07cjv1975 (categoryId: kids_bikes, should be electric_vehicles)
 * - balance_bike-b0d2ngj164 (categoryId: kids_tricycles, should be balance_bike)
 * 
 * This script removes those links from the built HTML as a temporary fix
 * until the CMS content can be manually cleaned up.
 * 
 * Usage: node scripts/fix-cms-product-links.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(process.cwd(), "dist");
const BAD_PRODUCT_IDS = [
  "electric_vehicles-b07cjv1975",
  "balance_bike-b0d2ngj164"
];

function listFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) listFiles(full, out);
    else out.push(full);
  }
  return out;
}

const allFiles = listFiles(ROOT);
const htmlFiles = allFiles.filter((file) => file.endsWith(".html"));

let totalFixed = 0;
const fixedFiles = [];

for (const file of htmlFiles) {
  const raw = readFileSync(file, "utf8");
  let modified = raw;
  
  for (const badId of BAD_PRODUCT_IDS) {
    // Remove list items containing bad product links
    const liPattern = new RegExp(`<li[^>]*>.*?/products/[^"]*${badId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"]*.*?</li>`, 'gs');
    modified = modified.replace(liPattern, '');
    
    // Also remove standalone anchor tags
    const aPattern = new RegExp(`<a[^>]*href="/products/[^"]*${badId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"]*"[^>]*>[^<]*</a>`, 'g');
    modified = modified.replace(aPattern, '');
  }
  
  if (modified !== raw) {
    writeFileSync(file, modified, "utf8");
    totalFixed++;
    fixedFiles.push(relative(ROOT, file));
  }
}

console.log(`Fixed ${totalFixed} HTML file(s):`);
if (fixedFiles.length > 0) {
  fixedFiles.slice(0, 20).forEach((f) => console.log(`  - ${f}`));
  if (fixedFiles.length > 20) {
    console.log(`  ... and ${fixedFiles.length - 20} more`);
  }
} else {
  console.log("  No files needed fixing");
}

process.exit(0);
