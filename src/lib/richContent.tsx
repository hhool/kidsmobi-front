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
 * Blocks are separated by one blank line ("\n\n").
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

export function renderRichContent(
  content: string,
  themeOverride?: Partial<RichContentTheme>,
): React.ReactNode {
  const theme = { ...defaultTheme, ...(themeOverride || {}) };
  const source = String(content || "");
  if (!source.trim()) return null;

  const blocks = source.split("\n\n");
  const nodes: React.ReactNode[] = [];

  blocks.forEach((rawBlock, ip) => {
    const block = rawBlock.replace(/\s+$/, "");
    if (!block.trim()) return;

    if (block.startsWith("### ")) {
      nodes.push(
        <h3 key={ip} className={theme.h3}>
          {renderInlineMarkdown(block.slice(4), `h3-${ip}`)}
        </h3>,
      );
      return;
    }
    if (block.startsWith("#### ")) {
      nodes.push(
        <h4 key={ip} className={theme.h4}>
          {renderInlineMarkdown(block.slice(5), `h4-${ip}`)}
        </h4>,
      );
      return;
    }

    const lines = block.split("\n").filter((line) => line.trim().length > 0);
    const isBullet = lines.length > 0 && lines.every((line) => /^(\* |- )/.test(line.trim()));
    const isOrdered = lines.length > 0 && lines.every((line) => /^\d+[.、)] /.test(line.trim()));
    if (isBullet && lines.length > 0) {
      nodes.push(
        <ul key={ip} className={theme.ul}>
          {lines.map((line, il) => (
            <li key={il} className={theme.li}>
              {renderInlineMarkdown(line.trim().replace(/^(\* |- )/, ""), `ul-${ip}-${il}`)}
            </li>
          ))}
        </ul>,
      );
      return;
    }
    if (isOrdered && lines.length > 0) {
      nodes.push(
        <ol key={ip} className={theme.ol}>
          {lines.map((line, il) => (
            <li key={il} className={theme.li}>
              {renderInlineMarkdown(line.trim().replace(/^\d+[.、)] /, ""), `ol-${ip}-${il}`)}
            </li>
          ))}
        </ol>,
      );
      return;
    }

    const media = isMediaOnlyParagraph(block);
    if (media) {
      if (media.kind === "image") {
        nodes.push(
          <figure key={ip} className={theme.figure}>
            <img src={media.url} alt={media.alt} loading="lazy" className={theme.img} />
            {media.alt ? <figcaption className={theme.figcaption}>{media.alt}</figcaption> : null}
          </figure>,
        );
      } else {
        nodes.push(
          <figure key={ip} className={theme.figure}>
            <video src={media.url} controls preload="metadata" className={theme.video} />
          </figure>,
        );
      }
      return;
    }

    // Plain paragraph: split remaining single newlines into separate paragraphs
    // so CMS-authored line breaks render as real paragraphs (editor-consistent).
    const paraLines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (paraLines.length <= 1) {
      nodes.push(
        <p key={ip} className={theme.p}>
          {renderInlineMarkdown(paraLines[0] || "", `p-${ip}`)}
        </p>,
      );
      return;
    }
    paraLines.forEach((line, li) => {
      nodes.push(
        <p key={`${ip}-${li}`} className={theme.p}>
          {renderInlineMarkdown(line, `p-${ip}-${li}`)}
        </p>,
      );
    });
  });

  return <>{nodes}</>;
}

/** Extract first media URL from content — useful for auto cover selection. */
export function extractFirstMediaUrl(content: string): string | null {
  const match = String(content || "").match(/(!\[[^\]]*\]\(([^)\s]+)\))|(@\[video[^\]]*\]\(([^)\s]+)\))/);
  if (!match) return null;
  return match[2] || match[4] || null;
}
