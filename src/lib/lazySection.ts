/**
 * lazySection - a lazy() that can be pre-resolved at build time.
 *
 * Why this exists
 * ---------------
 * The build-time homepage renderer (src/ssr/home-entry.tsx) has to produce a
 * SETTLED static document: one HTML file with the homepage in it, no
 * Suspense fallback, and no trailing script that moves the real markup into
 * place. React's streaming output does the opposite - it parks the resolved
 * tree in <div hidden id="S:0"> and moves it with a $RC script - and
 * renderToStaticMarkup renders the FALLBACK for a lazy child instead of
 * waiting for it.
 *
 * So the homepage's components have to be synchronously available when the
 * static render happens. This module makes that possible WITHOUT changing
 * what the browser build does:
 *
 *   - In the browser, nothing registers a resolver, so lazySection is
 *     exactly React.lazy. Same code splitting, same chunk boundaries, same
 *     loading behaviour.
 *   - In the build-time renderer, the resolver for the components on the
 *     homepage's render path is registered BEFORE App.tsx is imported, and
 *     lazySection hands back the already-loaded component synchronously.
 *
 * The resolver map lives on globalThis because App.tsx is imported by both
 * builds and neither may import the other. A module-level import from
 * App.tsx into the SSR entry would pull the whole renderer into the
 * browser bundle.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/** The component types a resolver may return. */
type AnyComponent = ComponentType<any>;

/**
 * The resolvers registered for this build, keyed by the module path used in
 * the import() call. The SSR renderer registers the homepage's components;
 * the browser build registers nothing.
 */
const REGISTRY_KEY = "__BBT_LAZY_RESOLVERS__";

interface Registry {
  resolve: (modulePath: string) => AnyComponent | undefined;
}

function registry(): Registry | undefined {
  return (globalThis as any)[REGISTRY_KEY] as Registry | undefined;
}

/**
 * Register a component so lazySection returns it synchronously.
 *
 * The modulePath must match the string in the import() call exactly - that
 * string is the only stable identity both sides share.
 */
export function registerLazyResolver(resolve: Registry["resolve"]): void {
  (globalThis as any)[REGISTRY_KEY] = { resolve } as Registry;
}

/**
 * lazy() that a build-time render can pre-resolve.
 *
 * @param modulePath The path passed to import(). Doubles as the resolver key.
 * @param loader     The dynamic import, unchanged from what lazy() took.
 */
export function lazySection<P extends object>(
  modulePath: string,
  loader: () => Promise<{ default: ComponentType<P> }>,
): LazyExoticComponent<ComponentType<P>> {
  const resolved = registry()?.resolve(modulePath);
  if (resolved) {
    // The component is already loaded. Return it as-is so the static render
    // emits it synchronously and no Suspense boundary is ever created.
    return resolved as LazyExoticComponent<ComponentType<P>>;
  }
  return lazy(loader);
}
