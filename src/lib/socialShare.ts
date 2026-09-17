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
