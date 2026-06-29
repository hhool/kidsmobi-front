#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const targets = [
  "src/App.tsx",
  "src/components/ProductsSection.tsx",
  "src/components/MatchingWizard.tsx",
  "src/components/ComparisonDashboard.tsx",
  "src/components/EvaluationsSection.tsx",
  "src/components/AuthSection.tsx",
  "src/components/MultiCompareView.tsx",
  "src/components/admin/ProductManager.tsx",
];

function checkFile(filePath) {
  const abs = path.join(ROOT, filePath);
  const content = fs.readFileSync(abs, "utf8");

  const blocks = content.match(/<SmartImage[\s\S]*?\/>/g) || [];
  const missing = [];

  blocks.forEach((block, index) => {
    const hasWidth = /\bwidth=\{?\d+\}?/.test(block);
    const hasHeight = /\bheight=\{?\d+\}?/.test(block);
    if (!hasWidth || !hasHeight) {
      missing.push({ index: index + 1, hasWidth, hasHeight });
    }
  });

  return {
    filePath,
    total: blocks.length,
    missing,
  };
}

const results = targets.map(checkFile);
const failures = results.filter((r) => r.missing.length > 0);

console.log(JSON.stringify({
  ok: failures.length === 0,
  checkedFiles: results.length,
  results,
}, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
