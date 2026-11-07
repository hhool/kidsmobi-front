import React from "react";
import type { HubRichMediaBlock } from "../lib/cmsD1Service";

function isYoutubeUrl(url: string): boolean {
  return /youtu\.be\/|youtube\.com\/(watch|embed|shorts)/i.test(url);
}

function youtubeEmbedUrl(url: string): string {
  const u = url.trim();
  const m =
    u.match(/[?&]v=([\w-]{6,})/) ||
    u.match(/youtu\.be\/([\w-]{6,})/) ||
    u.match(/youtube\.com\/embed\/([\w-]{6,})/) ||
    u.match(/youtube\.com\/shorts\/([\w-]{6,})/);
  const id = m?.[1] || "";
  return id ? `https://www.youtube.com/embed/${id}` : u;
}

const wrapStyle: React.CSSProperties = {
  maxWidth: "48rem",
  margin: "28px 0 0",
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

export default function HubRichMediaBlocks({ blocks }: { blocks: HubRichMediaBlock[] }) {
  if (!blocks || blocks.length === 0) return null;
  return (
    <section aria-label="Rich media" style={wrapStyle}>
      {blocks.map((b, i) => (
        <React.Fragment key={i}>
          <Block block={b} />
        </React.Fragment>
      ))}
    </section>
  );
}

function Block({ block }: { block: HubRichMediaBlock }) {
  switch (block.type) {
    case "heroImage":
      return (
        <figure style={{ margin: 0 }}>
          <img
            src={block.url}
            alt={block.alt || ""}
            loading="lazy"
            style={{ width: "100%", height: "auto", borderRadius: 18, display: "block" }}
          />
        </figure>
      );
    case "image":
      return (
        <figure style={{ margin: 0 }}>
          <img
            src={block.url}
            alt={block.alt || ""}
            loading="lazy"
            style={{ width: "100%", height: "auto", borderRadius: 14, display: "block" }}
          />
          {block.caption && (
            <figcaption style={{ marginTop: 8, fontSize: 13, color: "#64748b", textAlign: "center" }}>
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    case "heroVideo":
    case "video": {
      const caption = block.caption ? (
        <figcaption style={{ marginTop: 8, fontSize: 13, color: "#64748b", textAlign: "center" }}>
          {block.caption}
        </figcaption>
      ) : null;
      if (isYoutubeUrl(block.url)) {
        return (
          <figure style={{ margin: 0 }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                paddingTop: "56.25%",
                borderRadius: 14,
                overflow: "hidden",
                background: "#0f172a",
              }}
            >
              <iframe
                src={youtubeEmbedUrl(block.url)}
                title={block.alt || "Video"}
                loading="lazy"
                allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"
                allowFullScreen
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              />
            </div>
            {caption}
          </figure>
        );
      }
      return (
        <figure style={{ margin: 0 }}>
          <video
            controls
            preload="metadata"
            poster={block.poster}
            style={{ width: "100%", height: "auto", borderRadius: 14, display: "block", background: "#000" }}
          >
            <source src={block.url} />
          </video>
          {caption}
        </figure>
      );
    }
    case "gallery":
      return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
          {block.items.map((it, j) => (
            <div key={j} style={{ borderRadius: 12, overflow: "hidden", background: "#f1f5f9" }}>
              <img
                src={it.url}
                alt={it.alt || ""}
                loading="lazy"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          ))}
        </div>
      );
    case "heading":
      return (
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#020617", margin: "8px 0 0", lineHeight: 1.3 }}>
          {block.text}
        </h2>
      );
    case "paragraph":
      return (
        <p style={{ fontSize: 15, lineHeight: 1.8, color: "#334155", margin: 0 }}>{block.text}</p>
      );
    case "cta":
      return (
        <a
          href={block.href || "#"}
          style={{
            display: "inline-block",
            background: "#ea580c",
            color: "#fff",
            fontWeight: 800,
            padding: "12px 22px",
            borderRadius: 999,
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          {block.label}
        </a>
      );
    default:
      return null;
  }
}
