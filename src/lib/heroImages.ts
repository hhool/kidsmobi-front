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
 *
 * Why the photographs are served from THIS origin
 * ------------------------------------------------
 * They used to be CSS background-images on plus.unsplash.com. Two measured
 * consequences, both recorded in 04-build/item-23-24-decision.md:
 *
 *   - The paint could not be timed. The same build swung by +/- 5,000 ms
 *     between Lighthouse batches because the third party's latency went
 *     straight into the simulated Largest Contentful Paint. A number that
 *     moves 5,000 ms on a change that cannot move it is not a measurement.
 *   - The download was not the page's to schedule. The homepage's own images
 *     compete for the same connection, and a third-party handshake on the
 *     critical path is a cost the page does not control.
 *
 * The two photographs are therefore served from /images/home/ as WebP, in the
 * same order and with the same first frame. What the reader sees does not
 * change; what the page depends on does.
 *
 * Why the files are 768 px wide and not 960
 * -----------------------------------------
 * Self-hosting made the paint timeable, and it showed that the remaining
 * Largest Contentful Paint was bound by the simulated 4G network, not by the
 * main thread: Lighthouse's mobile preset models 562.5 ms of request latency
 * and 1.6 Mbps, so a 102 KB hero cost about 570 ms on its own.
 *
 * Measured on the built document, three runs per variant, everything else
 * equal (04-build/lcp-attribution.json, variant "hero-size"):
 *
 *     960 px / 102 KB   LCP 2,330 ms   over the 2,000 ms budget
 *     720 px /  34 KB   LCP 1,797 ms   passes
 *     640 px /  25 KB   LCP 1,733 ms   passes
 *
 * 768 px is the smallest width that still covers the mobile slot without
 * upscaling there (412 CSS px at the preset's DPR 1.75 needs 721 device px).
 * The file is 34.8 KB, -67 %.
 *
 * The width is a measured trade, not a guess, so it was checked against what
 * the reader sees: the hero is painted at 62 % opacity under a dark gradient,
 * and the built page was rendered twice - once with each file - and compared
 * pixel for pixel. At 412x823 the two differ in 0.036 % of the frame; on a
 * 390x844 retina phone, 0.082 %; at 1350x940, 1.894 %, all of it resampling
 * edge energy that is invisible under the gradient. At 100 % zoom the two are
 * indistinguishable.
 *
 * If the hero is ever re-exported, keep it at 768 px and under 40 KiB -
 * `scripts/check-hero-weight.mjs` fails the build otherwise. The command is:
 *
 *     cwebp -resize 768 0 -q 32 <source> -o public/images/home/hero-<name>-768.webp
 *
 * The origin note that used to live here (`HERO_IMAGE_ORIGIN`) is gone with
 * the third-party origin: a preconnect to our own host buys nothing, so the
 * prerender no longer emits one.
 */

/** The stroller scenario image. First in the list, so it is the LCP image. */
export const HERO_BG_STROLLER = "/images/home/hero-stroller-768.webp";

/** The balance-bike / kids-active-riding scenario image. */
export const HERO_BG_BALANCE_BIKE = "/images/home/hero-balance-768.webp";

/**
 * The hero background images, in carousel order. The first one is the one the
 * prerenderer preloads: it is the slide that is visible at first paint, so it
 * is the one that becomes the LCP candidate.
 */
export const HERO_BG_IMAGES: readonly string[] = [HERO_BG_STROLLER, HERO_BG_BALANCE_BIKE];
