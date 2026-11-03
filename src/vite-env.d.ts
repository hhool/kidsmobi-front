/// <reference types="vite/client" />

interface Window {
  /**
   * The Google tag queue.
   *
   * The element type is `unknown` on purpose: Google only reads a command
   * that arrives as an `arguments` object, so the queue may hold those as
   * well as ordinary dataLayer pushes.
   */
  dataLayer: unknown[];
  gtag?: (...args: unknown[]) => void;
}