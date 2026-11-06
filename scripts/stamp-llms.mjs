#!/usr/bin/env node
/**
 * R-927 wants llms.txt to say when it was last updated. It did not.
 *
 * The file shipped 28 entries and a correct H1 with no date line at all, so an
 * answer engine reading it could not tell a page last revisited this morning
 * from one abandoned in August — and the audit was right to fail it.
 *
 * The date is NOT the build time. A build date would stamp every deploy as a
 * content change, which is the same lie in the other direction: re-run the
 * build in December without touching a word and llms.txt would claim December.
 * The value comes from the newest `<lastmod>` in the sitemap this build just
 * wrote — the site's own declaration of when its content last moved — so the
 * two files cannot disagree.
 *
 * Idempotent: the same inputs produce the same bytes, so `--check` after a
 * build is a real assertion and not a coin flip.
 *
 * Usage:
 *   node scripts/stamp-llms.mjs            # stamp dist/llms.txt
 *   node scripts/stamp-llms.mjs --check    # fail if the stamp is stale
 *   node scripts/stamp-llms.mjs --self-test
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const MARKER = /^Last updated:.*$/m;

/** The newest <lastmod> in a sitemap, as YYYY-MM-DD, or null. */
export function newestLastmod(sitemapXml) {
  let best = null;
  for (const match of sitemapXml.matchAll(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/g)) {
    const raw = match[1];
    if (!/^\d{4}-\d{2}-\d{2}/.test(raw)) continue;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) continue;
    if (!best || parsed > best) best = parsed;
  }
  if (!best) return null;
  return best.toISOString().slice(0, 10);
}

/**
 * Put the date on line 2, under the H1, where `llmstxt.org` puts the summary.
 * A file that already carries the marker keeps its structure; only the value
 * moves, so a hand-written note further down is never disturbed.
 */
export function stampLlms(text, date) {
  const line = `Last updated: ${date}`;
  if (MARKER.test(text)) return text.replace(MARKER, line);
  const lines = text.split("\n");
  const heading = lines.findIndex((entry) => entry.startsWith("# "));
  if (heading === -1) {
    // No H1: lead with the marker rather than guessing where the body starts.
    return `${line}\n\n${text}`;
  }
  lines.splice(heading + 1, 0, "", line);
  return lines.join("\n");
}

/** The date llms.txt currently claims, or null. */
export function claimedDate(text) {
  const match = text.match(MARKER);
  if (!match) return null;
  const found = match[0].match(/\d{4}-\d{2}-\d{2}/);
  return found ? found[0] : null;
}

function selfTest() {
  const problems = [];
  const check = (name, ok, detail) => {
    if (!ok) problems.push(`${name} — ${detail}`);
  };

  const sitemap = `<urlset><url><loc>https://x/</loc><lastmod>2026-10-25T10:49:54.048Z</lastmod></url>
<url><loc>https://x/a</loc><lastmod>2026-11-02T18:42:38.510Z</lastmod></url></urlset>`;
  check("newest lastmod wins, not the first", newestLastmod(sitemap) === "2026-11-02", newestLastmod(sitemap));
  check("no lastmod means no date, not today", newestLastmod("<urlset></urlset>") === null, "invented a date");

  const bare = "# Site\n\n## Pages\n- [A](https://x/a)\n";
  const stamped = stampLlms(bare, "2026-11-02");
  check("the marker lands under the H1", stamped.split("\n")[2] === "Last updated: 2026-11-02", stamped);
  check("the body survives", stamped.includes("- [A](https://x/a)"), "an entry was lost");
  check("stamping twice is a no-op", stampLlms(stamped, "2026-11-02") === stamped, "not idempotent");
  check(
    "a new date replaces the old one instead of adding a second",
    (stampLlms(stamped, "2026-12-01").match(/Last updated:/g) || []).length === 1,
    "duplicated the marker",
  );
  check(
    "the value actually changes",
    claimedDate(stampLlms(stamped, "2026-12-01")) === "2026-12-01",
    "the stamp did not move",
  );
  check("a file with no H1 still gets a date", /^Last updated: 2026-11-02/.test(stampLlms("## x\n", "2026-11-02")), "no marker");
  check("no marker reads as no date", claimedDate("# Site\n") === null, "found a date in a bare file");

  const ok = problems.length === 0;
  console.log(JSON.stringify({ ok, selfTest: true, problems }, null, 2));
  process.exit(ok ? 0 : 1);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--self-test")) return selfTest();

  const root = resolve(process.env.STAMP_LLMS_ROOT || "dist");
  const sitemapFile = resolve(root, "sitemap.xml");
  const llmsFile = resolve(root, "llms.txt");
  if (!existsSync(llmsFile)) {
    console.error(JSON.stringify({ ok: false, problems: [`${llmsFile} does not exist`] }, null, 2));
    process.exit(1);
  }
  if (!existsSync(sitemapFile)) {
    console.error(JSON.stringify({ ok: false, problems: [`${sitemapFile} does not exist — run the prerender first`] }, null, 2));
    process.exit(1);
  }

  const date = newestLastmod(readFileSync(sitemapFile, "utf8"));
  if (!date) {
    // Refusing beats inventing: a site with no lastmod anywhere has no honest
    // answer to "when did this change", and today's date is not one.
    console.error(JSON.stringify({ ok: false, problems: ["sitemap.xml carries no usable <lastmod>"] }, null, 2));
    process.exit(1);
  }

  const before = readFileSync(llmsFile, "utf8");
  const after = stampLlms(before, date);

  if (args.includes("--check")) {
    const claimed = claimedDate(before);
    const ok = claimed === date;
    console.log(JSON.stringify({ ok, claimed, expected: date, file: llmsFile }, null, 2));
    process.exit(ok ? 0 : 1);
  }

  if (after !== before) writeFileSync(llmsFile, after, "utf8");
  console.log(JSON.stringify({ ok: true, date, changed: after !== before, file: llmsFile }, null, 2));
}

main();
