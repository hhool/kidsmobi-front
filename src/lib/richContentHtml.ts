/**
 * HTML-string renderer for the site's markdown subset — the prerender half of
 * the shared rich-content pipeline.
 *
 * `src/lib/richContent.tsx` renders the same markdown into React nodes for the
 * hydrated app. The two used to be independent parsers and drifted: the HTML
 * one grew `##` → <h2> and a section-label promotion while the React one never
 * did, so every published guide hydrated into literal "## " paragraphs with
 * zero <h2> headings. Both now call `classifyRichLine()` from
 * src/lib/richContentBlocks.ts, and scripts/check-rich-parity.tsx fails the
 * build if the two ever emit a different tag sequence again.
 */

import { classifyRichLine } from "./richContentBlocks";

function escapeHtml(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInline(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, text: string, url: string) => {
      // In-site links (relative URLs) open in the same tab and carry no rel —
      // an internal link is exactly the kind of link a site wants crawled and
      // followed. Off-site links open in a new tab with noopener. Both
      // renderers emit the same markup; the relative case used to fall through
      // this replace entirely and reached the page as the literal string
      // "[text](/path)".
      if (/^https?:\/\//i.test(url)) {
        return `<a href="${url}" target="_blank" rel="nofollow noopener noreferrer">${text}</a>`;
      }
      return `<a href="${url}">${text}</a>`;
    });
}

/**
 * Render the markdown subset to HTML.
 *
 * A single newline is a paragraph break in the app's markdown subset, so each
 * remaining line becomes its own paragraph instead of being soft-wrapped.
 */
export function renderRichContentHtml(markdown: string): string {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let listKind: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`<p style="margin: 0 0 14px;">${renderInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!listKind || !listItems.length) {
      listKind = null;
      listItems = [];
      return;
    }
    const tag = listKind;
    const items = listItems;
    listKind = null;
    listItems = [];
    blocks.push(
      `<${tag} style="margin: 0 0 14px; padding-left: 1.2rem;">${items
        .map((item) => `<li style="margin-bottom: 6px;">${renderInline(item)}</li>`)
        .join("")}</${tag}>`,
    );
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushAll();
      continue;
    }

    const classified = classifyRichLine(line);
    if (classified && (classified.kind === "h2" || classified.kind === "h3" || classified.kind === "h4")) {
      flushAll();
      const level = classified.kind === "h2" ? 2 : classified.kind === "h3" ? 3 : 4;
      const size = level === 2 ? "1.5rem" : level === 3 ? "1.22rem" : "1.06rem";
      blocks.push(
        `<h${level} style="margin: 22px 0 10px; font-size: ${size};">${renderInline(classified.text)}</h${level}>`,
      );
      continue;
    }
    if (classified && classified.kind === "ul") {
      flushParagraph();
      if (listKind !== "ul") {
        flushList();
        listKind = "ul";
      }
      listItems.push(classified.text);
      continue;
    }
    if (classified && classified.kind === "ol") {
      flushParagraph();
      if (listKind !== "ol") {
        flushList();
        listKind = "ol";
      }
      listItems.push(classified.text);
      continue;
    }
    flushList();
    flushParagraph();
    paragraph.push(line);
  }
  flushAll();
  return blocks.join("\n        ");
}
