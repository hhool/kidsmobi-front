/**
 * The homepage hero's background images — one source for the SPA and for the
 * prerenderer.
 *
 * Why this is a module and not two literals:
 *
 * The first slide is the homepage's Largest Contentful Paint. It used to be
 * discoverable only when React mounted and painted the hero, because a CSS
 * `background-image` cannot be found by the HTML parser. Under the throttling
 * Lighthouse applies, that put the 141 KB download behind the whole entry
 * bundle: the image request did not start until about 2,100 ms, and the paint
 * landed around 3,500 ms. The prerenderer has to name the same URL to emit
 * `<link rel="preload" as="image">` for it, and a second copy of the URL in
 * the prerenderer would drift the first time either file was edited.
 *
 * So the SPA renders `HERO_BG_IMAGES`, and the prerenderer reads
 * `HERO_BG_IMAGES[0]` to preload it.
 */

/** The stroller scenario image. First in the list, so it is the LCP image. */
export const HERO_BG_STROLLER =
  "https://plus.unsplash.com/premium_photo-1681881804080-ab1e78652c98?fm=jpg&q=60&w=960&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHJhbXxlbnwwfHwwfHx8MA%3D%3D";

/** The balance-bike / kids-active-riding scenario image. */
export const HERO_BG_BALANCE_BIKE =
  "https://plus.unsplash.com/premium_photo-1661715303160-9fecfaba31a9?fm=jpg&q=60&w=960&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGtpZCUyMGJpa2V8ZW58MHx8MHx8fDA%3D";

/**
 * The hero background images, in carousel order. The first one is the one the
 * prerenderer preloads: it is the slide that is visible at first paint, so it
 * is the one that becomes the LCP candidate.
 */
export const HERO_BG_IMAGES: readonly string[] = [HERO_BG_STROLLER, HERO_BG_BALANCE_BIKE];

/** The origin that serves the hero images, for a `<link rel="preconnect">`. */
export const HERO_IMAGE_ORIGIN = "https://plus.unsplash.com";
