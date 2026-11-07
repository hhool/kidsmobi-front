/**
 * String renderer for hub rich-media blocks — the prerender (build-time) twin of
 * src/components/HubRichMediaBlocks.tsx. Keep the markup/CSS in lockstep with the
 * React component so the crawled HTML and the SPA render identically (dual-renderer
 * parity rule). Block shape mirrors the Worker's validated HubMediaBlock.
 */
import type { HubRichMediaBlock } from "../src/lib/cmsD1Service";

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function isYoutubeUrl(url: string): boolean {
  return /youtu\.be\/|youtube\.com\/(watch|embed|shorts)/i.test(url);
}

export function youtubeEmbedUrl(url: string): string {
  const u = url.trim();
  const m =
    u.match(/[?&]v=([\w-]{6,})/) ||
    u.match(/youtu\.be\/([\w-]{6,})/) ||
    u.match(/youtube\.com\/embed\/([\w-]{6,})/) ||
    u.match(/youtube\.com\/shorts\/([\w-]{6,})/);
  const id = m?.[1] || "";
  return id ? `https://www.youtube.com/embed/${id}` : u;
}

const WRAP_STYLE =
  "max-width:48rem;margin:28px 0 0;display:flex;flex-direction:column;gap:20px;";

function renderBlock(b: HubRichMediaBlock): string {
  switch (b.type) {
    case "heroImage":
      return `<figure style="margin:0;"><img src="${esc(b.url)}" alt="${esc(b.alt || "")}" loading="lazy" style="width:100%;height:auto;border-radius:18px;display:block;" /></figure>`;
    case "image":
      return `<figure style="margin:0;"><img src="${esc(b.url)}" alt="${esc(b.alt || "")}" loading="lazy" style="width:100%;height:auto;border-radius:14px;display:block;" />${
        b.caption ? `<figcaption style="margin-top:8px;font-size:13px;color:#64748b;text-align:center;">${esc(b.caption)}</figcaption>` : ""
      }</figure>`;
    case "heroVideo":
    case "video": {
      const caption = b.caption
        ? `<figcaption style="margin-top:8px;font-size:13px;color:#64748b;text-align:center;">${esc(b.caption)}</figcaption>`
        : "";
      if (isYoutubeUrl(b.url)) {
        return `<figure style="margin:0;"><div style="position:relative;width:100%;padding-top:56.25%;border-radius:14px;overflow:hidden;background:#0f172a;"><iframe src="${esc(
          youtubeEmbedUrl(b.url),
        )}" title="${esc(b.alt || "Video")}" loading="lazy" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0;"></iframe></div>${caption}</figure>`;
      }
      return `<figure style="margin:0;"><video controls preload="metadata"${
        b.poster ? ` poster="${esc(b.poster)}"` : ""
      } style="width:100%;height:auto;border-radius:14px;display:block;background:#000;"><source src="${esc(b.url)}" /></video>${caption}</figure>`;
    }
    case "gallery": {
      const cells = (b.items || [])
        .map(
          (it) =>
            `<div style="border-radius:12px;overflow:hidden;background:#f1f5f9;"><img src="${esc(
              it.url,
            )}" alt="${esc(it.alt || "")}" loading="lazy" style="width:100%;height:auto;display:block;" /></div>`,
        )
        .join("");
      return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;">${cells}</div>`;
    }
    case "heading":
      return `<h2 style="font-size:22px;font-weight:900;color:#020617;margin:8px 0 0;line-height:1.3;">${esc(b.text)}</h2>`;
    case "paragraph":
      return `<p style="font-size:15px;line-height:1.8;color:#334155;margin:0;">${esc(b.text)}</p>`;
    case "cta":
      return `<a href="${esc(b.href || "#")}" style="display:inline-block;background:#ea580c;color:#fff;font-weight:800;padding:12px 22px;border-radius:999px;text-decoration:none;font-size:14px;">${esc(
        b.label,
      )}</a>`;
    default:
      return "";
  }
}

export function renderHubRichMediaBlocksHtml(blocks: HubRichMediaBlock[] | null | undefined): string {
  if (!blocks || blocks.length === 0) return "";
  return `<section aria-label="Rich media" style="${WRAP_STYLE}">${blocks.map(renderBlock).join("")}</section>`;
}
