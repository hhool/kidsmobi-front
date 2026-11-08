export type SocialPlatform = "x" | "facebook";

/** Official X account handle (set by the user; others to be supplemented after registration). */
export const OFFICIAL_X_HANDLE = "bbtreviews";
/** Official X profile URL used by footer/brand links. */
export const OFFICIAL_X_URL = `https://x.com/${OFFICIAL_X_HANDLE}`;

/**
 * Builds the share-intent URL for a social platform.
 * - X (twitter): post intent with url + text; mentions the official account by default
 * - Facebook: sharer with url only (FB reads og:title from the page)
 */
export function buildSocialShareUrl(platform: SocialPlatform, pageUrl: string, title: string): string {
  const url = encodeURIComponent(pageUrl);
  if (platform === "x") {
    const text = encodeURIComponent(`${title} @${OFFICIAL_X_HANDLE}`);
    return `https://x.com/intent/post?url=${url}&text=${text}`;
  }
  return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
}

/** Opens the platform share window. Pass a React mouse event to stop card-level propagation. */
export function openSocialShare(
  platform: SocialPlatform,
  title: string,
  e?: { stopPropagation?: () => void },
): void {
  e?.stopPropagation?.();
  const shareUrl = buildSocialShareUrl(platform, window.location.href, title);
  window.open(shareUrl, "_blank", "noopener,noreferrer,width=640,height=560");
}

/**
 * Brand glyphs shared by the article-card share buttons and the footer's
 * Global Network column. One copy of each path, so adding the footer Facebook
 * icon cannot drift from the icon already shipped on every article card.
 */
export const SOCIAL_BRAND_PATHS: Record<SocialPlatform, string> = {
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  facebook:
    "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
};
