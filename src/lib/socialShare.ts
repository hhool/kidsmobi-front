export type SocialPlatform = "x" | "facebook";

/**
 * Builds the share-intent URL for a social platform.
 * - X (twitter): post intent with url + text
 * - Facebook: sharer with url only (FB reads og:title from the page)
 */
export function buildSocialShareUrl(platform: SocialPlatform, pageUrl: string, title: string): string {
  const url = encodeURIComponent(pageUrl);
  const text = encodeURIComponent(title);
  if (platform === "x") {
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
