#!/usr/bin/env node
/**
 * How much of a channel listing is already on its parent hub?
 *
 * /guides, /news and /reviews are hubs; /guides/<topic>, /news/<channel> and
 * /reviews/<type> are subsets of them. Both sides render their cards from the
 * same CMS field (see prerender-pages.ts: the hub's card and the channel's
 * card call `pickText(...summary...)` / `verdict.slice(0, 140)` on the same
 * record), so a channel page can be — and /reviews/single largely is — a second
 * copy of its hub with fewer cards.
 *
 * Definition, stated so the number can be argued with:
 *
 *   - text = the delivered HTML with <script>, <style>, <noscript> and <svg>
 *     removed, tags stripped, entities decoded, whitespace collapsed.
 *   - a gram is 6 consecutive words (lowercased, [a-z0-9'] only).
 *   - overlap is |A ∩ B| / |B| where B is the channel page: the share of the
 *     channel's own 6-grams that also occur somewhere on its hub.
 *   - the baseline pair is a hub and a channel from different families, which
 *     share nothing but the site chrome. Read every other row against it: the
 *     chrome alone is worth a few points, so "12% overlap" is not 12% of
 *     duplicated content.
 *
 * Usage:
 *   node scripts/seo/listing-overlap.mjs --tree dist
 *   node scripts/seo/listing-overlap.mjs --tree dist --fail-over 0.25
 *   node scripts/seo/listing-overlap.mjs --selftest
 *
 * Reporting only by default. `--fail-over` turns it into a gate; nothing wires
 * it into the build yet, because every pair is currently above any honest
 * threshold and a permanently red gate teaches people to ignore it.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const GRAM = 6;

function textOf(html) {
  return html
    .replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function gramsOf(text, n = GRAM) {
  const words = text.toLowerCase().match(/[a-z0-9']+/g) || [];
  const set = new Set();
  for (let i = 0; i + n <= words.length; i += 1) set.add(words.slice(i, i + n).join(" "));
  return set;
}

function share(a, b) {
  const inter = [...b].filter((g) => a.has(g)).length;
  return { shared: inter, ofB: b.size ? inter / b.size : 0, ofA: a.size ? inter / a.size : 0 };
}

function listingFamilies(tree) {
  const families = [];
  const maybe = (hub, prefix) => {
    if (!existsSync(join(tree, hub))) return;
    const dir = join(tree, prefix);
    const children = existsSync(dir)
      ? readdirSync(dir)
          .filter((f) => f.endsWith(".html"))
          .sort()
          .map((f) => join(prefix, f))
      : [];
    if (children.length) families.push({ hub, children });
  };
  maybe("reviews.html", "reviews");
  maybe("guides.html", "guides");
  maybe("news.html", "news");
  maybe("products.html", "products");
  return families;
}

function selftest() {
  const a = "the quick brown fox jumps over the lazy dog every single morning";
  const b = "the quick brown fox jumps over the lazy dog every single evening";
  const c = "nothing here matches the other sentence at all in any way shape";
  const same = share(gramsOf(a), gramsOf(a));
  const near = share(gramsOf(a), gramsOf(b));
  const none = share(gramsOf(a), gramsOf(c));
  const checks = [
    ["identical text is 100%", same.ofB === 1 && same.shared > 0],
    ["a one-word edit keeps most grams", near.ofB > 0.5 && near.ofB < 1],
    ["unrelated text shares nothing", none.shared === 0],
    ["the denominator is the channel page", share(gramsOf(c), gramsOf(a)).ofB === 0],
  ];
  let bad = 0;
  for (const [name, ok] of checks) {
    if (!ok) bad += 1;
    console.log(`${ok ? "ok  " : "FAIL"}  ${name}`);
  }
  if (bad) {
    console.error(`\n${bad} self-test(s) failed — the measurement, not the site, is wrong.`);
    process.exit(1);
  }
  console.log("\n4/4 self-tests passed.");
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--selftest")) {
    selftest();
    return;
  }
  const arg = (name, fallback) => {
    const i = argv.indexOf(name);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
  };
  const tree = arg("--tree", "dist");
  const failOver = Number(arg("--fail-over", "1"));
  if (!existsSync(tree)) {
    console.error(`no such tree: ${tree}`);
    process.exit(2);
  }
  const families = listingFamilies(tree);
  if (!families.length) {
    console.error(`no hub/channel pairs found under ${tree}`);
    process.exit(2);
  }
  const cache = new Map();
  const grams = (rel) => {
    if (!cache.has(rel)) cache.set(rel, gramsOf(textOf(readFileSync(join(tree, rel), "utf8"))));
    return cache.get(rel);
  };

  // Baseline: a hub and a channel from *different* families — they share no
  // cards at all, so what they have in common is chrome. Read every other row
  // against it: 60% with the floor at 10% means half the page is duplicated,
  // not 60% of it. (A same-family pair is useless as a floor — it is the thing
  // being measured.)
  const cross = families.length > 1 ? { hub: families[0].hub, child: families[1].children[0] } : null;
  let baselinePct = 0;
  if (cross) {
    const b = share(grams(cross.hub), grams(cross.child));
    baselinePct = b.ofB;
    console.log(
      `baseline (cross-family floor): ${cross.hub} vs ${cross.child} — ${b.shared} grams, ${(b.ofB * 100).toFixed(1)}% of the channel page\n`,
    );
  }

  const rows = [];
  for (const { hub, children } of families) {
    for (const child of children) {
      const r = share(grams(hub), grams(child));
      rows.push({ hub, child, ...r });
    }
  }
  rows.sort((x, y) => y.ofB - x.ofB);

  const width = Math.max(...rows.map((r) => r.child.length), 12);
  console.log(`${"channel".padEnd(width)}  hub                grams  of channel  of hub  over floor`);
  for (const r of rows) {
    const over = r.ofB - baselinePct;
    console.log(
      `${r.child.padEnd(width)}  ${r.hub.padEnd(18)}  ${String(r.shared).padStart(5)}  ${(r.ofB * 100)
        .toFixed(1)
        .padStart(9)}%  ${(r.ofA * 100).toFixed(1).padStart(5)}%  ${(over * 100).toFixed(1).padStart(9)} pt`,
    );
  }

  const worst = rows[0];
  console.log(
    `\nworst pair: ${worst.child} shares ${(worst.ofB * 100).toFixed(1)}% of its 6-grams with ${worst.hub}` +
      (baselinePct ? ` (${((worst.ofB - baselinePct) * 100).toFixed(1)} pt above the chrome floor)` : ""),
  );
  console.log("a hub card and its channel card print the same CMS field, so identical cards are the expected cause.");

  const over = rows.filter((r) => r.ofB > failOver);
  if (over.length) {
    console.error(`\n${over.length} pair(s) above the ${(failOver * 100).toFixed(0)}% ceiling:`);
    for (const r of over) console.error(`  ${r.child} — ${(r.ofB * 100).toFixed(1)}%`);
    process.exit(1);
  }
}

main();
