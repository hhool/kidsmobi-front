/**
 * A very small DOM plus a virtual clock, just enough to execute the shipped
 * first-paint boot script outside a browser.
 *
 * The static first-screen cover is the fix for the late LCP and the 0.290401
 * CLS, and both of its failure modes are runtime behaviour, not source shape:
 * revealing an empty #root after the ceiling paints a white screen, revealing
 * a Suspense skeleton paints a page that never finishes. A guard that only
 * greps the source cannot see either. So this module gives the guard a real
 * execution environment: it runs the actual boot script from
 * src/lib/firstPaint.ts against a fake DOM and lets the test drive the clock,
 * mount the SPA, and observe what the reader would have seen.
 *
 * Nothing here is a browser. It models only what the boot script touches:
 * element trees, attributes, a text projection, three selector forms, one
 * mutation observer, and timers. If the boot script starts using something
 * else, this harness throws instead of silently passing.
 *
 * ESM. Node >= 22.
 */
import vm from "node:vm";

/* ------------------------------------------------------------------ DOM -- */

function matchesSelector(node, selector) {
  const sel = String(selector).trim();
  if (!sel) return false;
  if (sel.startsWith("[")) {
    const m = /^\[([^\]=]+)(?:=["']?([^"'\]]*)["']?)?\]$/.exec(sel);
    if (!m) return false;
    const attr = m[1].trim();
    const want = m[2];
    const got = node.getAttribute(attr);
    if (got === null) return false;
    if (want === undefined) return true;
    return got === want;
  }
  const hash = sel.indexOf("#");
  const tag = (hash === -1 ? sel : sel.slice(0, hash)).trim().toLowerCase();
  const id = hash === -1 ? null : sel.slice(hash + 1).trim();
  if (tag && node.tagName !== tag) return false;
  if (id !== null && node.getAttribute("id") !== id) return false;
  return true;
}

function findAll(node, selector, out = []) {
  for (const child of node.childNodes) {
    if (!(child instanceof FakeElement)) continue;
    if (matchesSelector(child, selector)) out.push(child);
    findAll(child, selector, out);
  }
  return out;
}

class FakeClassList {
  constructor(el) {
    this.el = el;
  }

  get set() {
    return new Set((this.el.getAttribute("class") || "").split(/\s+/).filter(Boolean));
  }

  write(set) {
    this.el.setAttribute("class", Array.from(set).join(" "));
  }

  add(name) {
    const s = this.set;
    s.add(name);
    this.write(s);
  }

  remove(name) {
    const s = this.set;
    s.delete(name);
    this.write(s);
  }

  contains(name) {
    return this.set.has(name);
  }
}

export class FakeElement {
  constructor(tagName) {
    this.tagName = String(tagName || "").toLowerCase();
    this.childNodes = [];
    this.parentNode = null;
    this.attributes = Object.create(null);
    this.style = {};
    this.ownText = "";
  }

  get classList() {
    if (!this._classList) this._classList = new FakeClassList(this);
    return this._classList;
  }

  // The real DOM reflects the id property onto the attribute. The boot script
  // sets `cover.id = 'bbt-first-paint-cover'`, so without this the cover
  // would be invisible to every lookup.
  get id() {
    return this.getAttribute("id") || "";
  }

  set id(value) {
    this.setAttribute("id", value);
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
  }

  appendChild(node) {
    if (node.parentNode) node.parentNode.removeChild(node);
    node.parentNode = this;
    this.childNodes.push(node);
    return node;
  }

  removeChild(node) {
    const i = this.childNodes.indexOf(node);
    if (i !== -1) this.childNodes.splice(i, 1);
    node.parentNode = null;
    return node;
  }

  get textContent() {
    return this.ownText + this.childNodes.map((c) => c.textContent).join("");
  }

  set textContent(value) {
    this.ownText = String(value);
    this.childNodes = [];
  }

  querySelector(selector) {
    const all = findAll(this, selector);
    return all.length ? all[0] : null;
  }

  querySelectorAll(selector) {
    return findAll(this, selector);
  }
}

/* -------------------------------------------------------------- clock --- */

/**
 * Virtual timers. The boot script uses exactly two: a 16s hard ceiling and a
 * 100ms poll. Both are observable here, so a test can say "advance to the
 * ceiling" and mean it.
 */
class VirtualClock {
  constructor() {
    this.now = 0;
    this.nextId = 1;
    this.timers = new Map();
    this.frames = [];
  }

  schedule(fn, ms, repeat) {
    const id = this.nextId++;
    this.timers.set(id, { fn, at: this.now + (Number(ms) || 0), interval: repeat ? (Number(ms) || 0) : null });
    return id;
  }

  cancel(id) {
    this.timers.delete(id);
  }

  advance(ms) {
    const target = this.now + (Number(ms) || 0);
    let guard = 0;
    for (;;) {
      if (guard++ > 10000) throw new Error("virtual clock: timer loop did not settle");
      let pick = null;
      for (const [id, t] of this.timers) {
        if (t.at > target) continue;
        if (!pick || t.at < pick.t.at || (t.at === pick.t.at && id < pick.id)) pick = { id, t };
      }
      if (!pick) break;
      this.now = pick.t.at;
      if (pick.t.interval) pick.t.at = this.now + pick.t.interval;
      else this.timers.delete(pick.id);
      pick.t.fn();
    }
    this.now = target;
    this.flushFrames();
  }

  requestFrame(fn) {
    this.frames.push(fn);
  }

  flushFrames() {
    let guard = 0;
    while (this.frames.length) {
      if (guard++ > 1000) throw new Error("virtual clock: requestAnimationFrame loop did not settle");
      const fn = this.frames.shift();
      fn(this.now);
    }
  }
}

/* ------------------------------------------------------------- the env -- */

/**
 * Build an environment with one prerendered page: body > div#root > article.
 *
 * @param {object} options
 * @param {boolean} options.withMutationObserver  false exercises the poll path
 * @param {string}  options.rootHtmlText           text of the prerendered article
 */
export function createEnv(options = {}) {
  const withMutationObserver = options.withMutationObserver !== false;
  const clock = new VirtualClock();

  const documentElement = new FakeElement("html");
  const body = new FakeElement("body");
  const root = new FakeElement("div");
  root.setAttribute("id", "root");

  const article = new FakeElement("article");
  article.textContent = options.rootHtmlText ?? "prerendered article body";
  root.appendChild(article);
  body.appendChild(root);
  documentElement.appendChild(body);

  const document = {
    documentElement,
    body,
    getElementById(id) {
      let found = null;
      const walk = (node) => {
        for (const child of node.childNodes) {
          if (!(child instanceof FakeElement)) continue;
          if (child.getAttribute("id") === id) {
            found = child;
            return;
          }
          walk(child);
        }
      };
      walk(documentElement);
      return found;
    },
    createElement(tag) {
      return new FakeElement(tag);
    },
  };

  const marks = [];
  const performance = {
    now: () => clock.now,
    mark: (name) => {
      marks.push(name);
    },
  };

  const observers = [];
  class FakeMutationObserver {
    constructor(callback) {
      this.callback = callback;
      this.connected = false;
      observers.push(this);
    }

    observe() {
      this.connected = true;
    }

    disconnect() {
      this.connected = false;
    }
  }

  const window = {
    setTimeout: (fn, ms) => clock.schedule(fn, ms, false),
    clearTimeout: (id) => clock.cancel(id),
    setInterval: (fn, ms) => clock.schedule(fn, ms, true),
    clearInterval: (id) => clock.cancel(id),
    requestAnimationFrame: (fn) => clock.requestFrame(fn),
  };

  const sandbox = {
    document,
    window,
    performance,
    requestAnimationFrame: window.requestAnimationFrame,
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout,
    setInterval: window.setInterval,
    clearInterval: window.clearInterval,
    console,
    Math,
    Array,
  };
  if (withMutationObserver) sandbox.MutationObserver = FakeMutationObserver;

  const env = {
    clock,
    document,
    window,
    root,
    body,
    marks,
    observers,
    state: null,
    /** Build a node. Text is set before children, matching DOM semantics. */
    el(tag, opts = {}) {
      const node = new FakeElement(tag);
      if (opts.id) node.setAttribute("id", opts.id);
      if (opts.className) node.setAttribute("class", opts.className);
      for (const [k, v] of Object.entries(opts.attrs || {})) node.setAttribute(k, v);
      if (opts.text !== undefined) node.ownText = String(opts.text);
      for (const child of opts.children || []) node.appendChild(child);
      return node;
    },
    /** Execute the boot script in this environment. */
    run(script) {
      vm.runInNewContext(script, vm.createContext(sandbox), { timeout: 5000 });
      env.state = window.__BBT_FIRST_PAINT__ || null;
      clock.flushFrames();
      return env.state;
    },
    /** Fire the mutation callbacks the way React's commits would. */
    mutate() {
      for (const o of observers) if (o.connected) o.callback([], o);
      clock.flushFrames();
    },
    /**
     * Mount the SPA into #root. React replaces the tree, so this clears
     * whatever was there first - otherwise a stale Suspense fallback would
     * sit in front of the new content and the first matching selector would
     * keep finding it.
     */
    mountSpa(nodes, { mutate = true } = {}) {
      for (const child of root.childNodes.slice()) root.removeChild(child);
      for (const node of nodes) root.appendChild(node);
      if (mutate) env.mutate();
    },
    advance(ms) {
      clock.advance(ms);
    },
    /** The cover element, if the boot script created one. */
    cover() {
      return document.body.childNodes.find(
        (n) => n instanceof FakeElement && n.getAttribute("id") === "bbt-first-paint-cover",
      ) || null;
    },
    revealed() {
      return !!(env.state && env.state.revealed);
    },
    reason() {
      return env.state ? env.state.reason : null;
    },
  };

  return env;
}

/**
 * The DOM the SPA mounts for a ready page: the route's own content region,
 * its heading, its copy, and the site footer. Mirrors the ids the SPA really
 * renders (App.tsx: #decision_core, main#primary_tab_viewport,
 * footer#main_footer).
 */
export function spaReadyContent(env, { heading = "Real page heading", copy = "" } = {}) {
  const body = copy || "Real content ".repeat(40);
  return [
    env.el("div", { id: "decision_core", text: "decision core" }),
    env.el("main", {
      id: "primary_tab_viewport",
      children: [
        env.el("h1", { text: heading }),
        env.el("p", { text: body }),
      ],
    }),
    env.el("footer", { id: "main_footer", text: "footer" }),
  ];
}

/**
 * The Suspense fallback for the product detail route (ProductDetailSkeleton):
 * aria-busy="true" plus its own loading label. The generic route fallback
 * says "Loading BalanceBikeToddler" instead.
 */
export function spaSkeletonContent(env, { generic = false } = {}) {
  const fallback = generic
    ? env.el("div", { text: "Loading BalanceBikeToddler" })
    : env.el("div", {
        attrs: { "aria-busy": "true" },
        children: [env.el("p", { text: "Loading review content" })],
      });
  return [
    env.el("div", { id: "decision_core", text: "decision core" }),
    env.el("main", { id: "primary_tab_viewport", children: [fallback] }),
    env.el("footer", { id: "main_footer", text: "footer" }),
  ];
}
