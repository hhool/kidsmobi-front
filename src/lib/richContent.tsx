import React from "react";

/**
 * Shared lightweight rich-content renderer.
 *
 * Storage format (produced by RichTextEditor) is the site's legacy markdown
 * subset plus inline media extensions, so old articles keep rendering:
 *   ###  H3 heading          ####  H4 heading
 *   * / -  bullet list       1.  ordered list
 *   **bold**   *italic*   [text](url)
 *   ![alt](url)              @[video](url)
 * Blocks are separated by one blank line ("\n\n"), but a single newline inside a
 * block is honoured too: consecutive "* "/"- " lines become one <ul>, consecutive
 * "1. " lines become one <ol>, and every other line becomes its own paragraph.
 */

export type RichContentTheme = {
  h3: string;
  h4: string;
  ul: string;
  ol: string;
  li: string;
  p: string;
  figure: string;
  img: string;
  video: string;
  figcaption: string;
};

const defaultTheme: RichContentTheme = {
  h3: "text-xl font-black text-slate-900 mt-10 mb-4",
  h4: "text-lg font-bold text-orange-500 mt-8 mb-4",
  ul: "list-disc list-inside space-y-2 text-slate-500 pl-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100",
  ol: "list-decimal list-inside space-y-2 text-slate-500 pl-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100",
  li: "font-medium",
  p: "leading-relaxed text-justify font-medium",
  figure: "my-6",
  img: "w-full rounded-2xl border border-slate-100 shadow-sm",
  video: "w-full rounded-2xl border border-slate-100 shadow-sm bg-slate-900",
  figcaption: "text-[11px] text-slate-400 mt-2 text-center font-bold uppercase tracking-widest",
};

type InlineToken =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "link"; text: string; url: string }
  | { type: "image"; alt: string; url: string }
  | { type: "video"; url: string };

const INLINE_PATTERN =
  /(\*\*([^*]+?)\*\*)|(\*([^*]+?)\*)|(!\[([^\]]*)\]\(([^)\s]+)\))|(@\[video(?:\s+[^\]]*)?\]\(([^)\s]+)\))|(\[([^\]]+)\]\(([^)\s]+)\))/g;

export function parseInlineMarkdown(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let lastIndex = 0;
  const pattern = new RegExp(INLINE_PATTERN);
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    if (match[1]) {
      tokens.push({ type: "bold", value: match[2] });
    } else if (match[3]) {
      tokens.push({ type: "italic", value: match[4] });
    } else if (match[5]) {
      tokens.push({ type: "image", alt: match[6] || "", url: match[7] });
    } else if (match[8]) {
      tokens.push({ type: "video", url: match[8] });
    } else if (match[9]) {
      tokens.push({ type: "link", text: match[10], url: match[11] });
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }
  return tokens;
}

export function renderInlineMarkdown(text: string, keyPrefix: string): React.ReactNode[] {
  return parseInlineMarkdown(text).map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    switch (token.type) {
      case "bold":
        return <strong key={key} className="font-black text-slate-900">{token.value}</strong>;
      case "italic":
        return <em key={key}>{token.value}</em>;
      case "link":
        return (
          <a key={key} href={token.url} target="_blank" rel="nofollow noopener noreferrer" className="text-blue-600 font-bold underline decoration-blue-200 hover:decoration-blue-500 break-all">
            {token.text}
          </a>
        );
      case "image":
        return (
          <img key={key} src={token.url} alt={token.alt} loading="lazy" className="inline-block max-w-full rounded-xl align-middle border border-slate-100 shadow-sm" />
        );
      case "video":
        return (
          <video key={key} src={token.url} controls preload="metadata" className="inline-block w-full rounded-xl align-middle" />
        );
      default:
        return <React.Fragment key={key}>{token.value}</React.Fragment>;
    }
  });
}

function isMediaOnlyParagraph(text: string): { kind: "image" | "video"; alt: string; url: string } | null {
  const trimmed = text.trim();
  const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
  if (imageMatch) return { kind: "image", alt: imageMatch[1] || "", url: imageMatch[2] };
  const videoMatch = trimmed.match(/^@\[video(?:\s+[^\]]*)?\]\(([^)\s]+)\)$/);
  if (videoMatch) return { kind: "video", alt: "", url: videoMatch[1] };
  return null;
}

const BULLET_PATTERN = /^([*•] |- |– )/;
const ORDERED_PATTERN = /^\d+[.、)] /;

export function renderRichContent(
  content: string,
  themeOverride?: Partial<RichContentTheme>,
): React.ReactNode {
  const theme = { ...defaultTheme, ...(themeOverride || {}) };
  const source = String(content || "");
  if (!source.trim()) return null;

  const blocks = source.split("\n\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;

  blocks.forEach((rawBlock) => {
    const block = rawBlock.replace(/\s+$/, "");
    if (!block.trim()) return;

    // Lists are accumulated across consecutive lines so that a block mixing a
    // numbered heading with bullet sub-lines still renders as a real <ul>/<ol>
    // instead of leaking literal "*" / "1." markers into the paragraph text.
    let listKind: "ul" | "ol" | null = null;
    let listItems: string[] = [];

    const flushList = () => {
      if (!listKind || listItems.length === 0) {
        listKind = null;
        listItems = [];
        return;
      }
      const className = listKind === "ul" ? theme.ul : theme.ol;
      const items = listItems;
      const kind = listKind;
      listKind = null;
      listItems = [];
      const currentKey = key++;
      nodes.push(
        kind === "ul" ? (
          <ul key={currentKey} className={className}>
            {items.map((item, index) => (
              <li key={index} className={theme.li}>
                {renderInlineMarkdown(item, `li-${currentKey}-${index}`)}
              </li>
            ))}
          </ul>
        ) : (
          <ol key={currentKey} className={className}>
            {items.map((item, index) => (
              <li key={index} className={theme.li}>
                {renderInlineMarkdown(item, `li-${currentKey}-${index}`)}
              </li>
            ))}
          </ol>
        ),
      );
    };

    block.split("\n").forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) return;

      if (line.startsWith("### ")) {
        flushList();
        const currentKey = key++;
        nodes.push(
          <h3 key={currentKey} className={theme.h3}>
            {renderInlineMarkdown(line.slice(4), `h3-${currentKey}`)}
          </h3>,
        );
        return;
      }
      if (line.startsWith("#### ")) {
        flushList();
        const currentKey = key++;
        nodes.push(
          <h4 key={currentKey} className={theme.h4}>
            {renderInlineMarkdown(line.slice(5), `h4-${currentKey}`)}
          </h4>,
        );
        return;
      }

      if (BULLET_PATTERN.test(line)) {
        if (listKind !== "ul") {
          flushList();
          listKind = "ul";
        }
        listItems.push(line.replace(BULLET_PATTERN, ""));
        return;
      }
      if (ORDERED_PATTERN.test(line)) {
        if (listKind !== "ol") {
          flushList();
          listKind = "ol";
        }
        listItems.push(line.replace(ORDERED_PATTERN, ""));
        return;
      }

      flushList();

      const media = isMediaOnlyParagraph(line);
      const currentKey = key++;
      if (media) {
        if (media.kind === "image") {
          nodes.push(
            <figure key={currentKey} className={theme.figure}>
              <img src={media.url} alt={media.alt} loading="lazy" className={theme.img} />
              {media.alt ? <figcaption className={theme.figcaption}>{media.alt}</figcaption> : null}
            </figure>,
          );
        } else {
          nodes.push(
            <figure key={currentKey} className={theme.figure}>
              <video src={media.url} controls preload="metadata" className={theme.video} />
            </figure>,
          );
        }
        return;
      }

      nodes.push(
        <p key={currentKey} className={theme.p}>
          {renderInlineMarkdown(line, `p-${currentKey}`)}
        </p>,
      );
    });

    flushList();
  });

  return <>{nodes}</>;
}

/** Extract first media URL from content — useful for auto cover selection. */
export function extractFirstMediaUrl(content: string): string | null {
  const match = String(content || "").match(/(!\[[^\]]*\]\(([^)\s]+)\))|(@\[video[^\]]*\]\(([^)\s]+)\))/);
  if (!match) return null;
  return match[2] || match[4] || null;
}
