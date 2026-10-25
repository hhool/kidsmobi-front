/**
 * Rich-content parity guard: the prerender's HTML renderer and the app's React
 * renderer must emit the same block structure for the same markdown.
 *
 * The two renderers are separate because one produces HTML strings for the
 * static build and the other produces React nodes for the hydrated app, and the
 * site's entry point is createRoot (not hydrateRoot) — so whatever the React
 * side emits is what a reader actually sees. When they drifted, every published
 * guide hydrated into literal "## " paragraphs with zero <h2> headings while
 * the static HTML looked perfect: the build passed, every dist guard passed,
 * and tsc passed. Only a browser saw it.
 *
 * This guard renders a fixture through both sides and compares the tag
 * sequence, so the next drift fails the build instead of the browser.
 *
 * Usage: npx tsx scripts/check-rich-parity.tsx
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderRichContent } from "../src/lib/richContent";
import { renderRichContentHtml } from "../src/lib/richContentHtml";

/** Covers every syntax level both renderers claim to support. */
const FIXTURE = [
  "## H2 heading",
  "",
  "A paragraph with **bold**, *italic* and a [link](https://example.com/page).",
  "",
  "A paragraph with a [relative link](/guides/beginner/balance-bike-size-chart) too.",
  "",
  "### H3 heading",
  "",
  "1. Multi-Wheel Support & High Stability",
  "",
  "- A bullet",
  "- Another bullet",
  "",
  "1. First ordered step",
  "2. Second ordered step",
  "",
  "#### H4 heading",
  "",
  "I. Roman Section Label",
  "",
  "Final paragraph.",
].join("\n");

const BLOCK_TAGS = new Set(["h2", "h3", "h4", "p", "ul", "ol", "li", "figure"]);

/** Ordered tag sequence of the block structure, ignoring inline markup. */
function tagSequence(html: string): string[] {
  const tags: string[] = [];
  const pattern = /<\/?([a-z0-9]+)\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    if (!BLOCK_TAGS.has(tag)) continue;
    if (match[0].startsWith("</")) continue;
    tags.push(tag);
  }
  return tags;
}

const problems: string[] = [];

const htmlSide = tagSequence(renderRichContentHtml(FIXTURE));
const reactSide = tagSequence(renderToStaticMarkup(React.createElement(React.Fragment, null, renderRichContent(FIXTURE))));

if (htmlSide.join(">") !== reactSide.join(">")) {
  problems.push(
    `block structure diverged\n    prerender: ${htmlSide.join(" ")}\n    hydrated : ${reactSide.join(" ")}`,
  );
}

// The specific regression this guard exists for: a markdown heading that
// survives as literal text in the hydrated DOM.
const reactText = renderToStaticMarkup(React.createElement(React.Fragment, null, renderRichContent(FIXTURE)));
for (const line of FIXTURE.split("\n")) {
  if (!/^#{2,4}\s/.test(line)) continue;
  if (reactText.includes(`>${line}<`)) {
    problems.push(`hydrated DOM leaks the literal markdown marker: "${line}"`);
  }
}

// The second regression class: a markdown LINK that survives as literal
// "[text](/path)" text. The prerender's inline renderer once only converted
// absolute URLs, so every relative link in every article body reached the
// static page — 320 of them across 59 pages — as literal markdown.
const htmlText = renderRichContentHtml(FIXTURE);
const REL = "/guides/beginner/balance-bike-size-chart";
const anchorRe = new RegExp(`<a href="${REL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>relative link</a>`);
for (const [side, text] of [["prerender", htmlText], ["hydrated", reactText]] as const) {
  if (!anchorRe.test(text)) {
    problems.push(`${side} did not render the relative markdown link as an anchor (literal "[text](/path)" leak)`);
  }
  if (text.includes(`](${REL})`)) {
    problems.push(`${side} leaks the literal markdown link syntax "](${REL})"`);
  }
}

if (problems.length > 0) {
  console.error(`check:richparity FAILED (${problems.length})`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`check:richparity OK — ${htmlSide.length} blocks, identical on both sides (${new Set(htmlSide).size} distinct tags)`);
