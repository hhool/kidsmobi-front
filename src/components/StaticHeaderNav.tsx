/**
 * StaticHeaderNav — the homepage header's navigation, for the document.
 *
 * Why this is a separate component
 * ---------------------------------
 * The SPA's header navigation is a row of buttons that switch the app's tab
 * and push a history entry. None of that survives into a document: there is
 * no app to switch, and the document must not depend on a script to move
 * the reader somewhere.
 *
 * So the static build renders the same row of pills as ordinary links. The
 * class names are copied from the SPA's buttons, character for character, so
 * the navigation looks the same in both - which is the whole point of the
 * static homepage: the reader cannot tell from the picture that they got a
 * different delivery mechanism.
 *
 * Two deliberate differences from the SPA's header:
 *
 *   - The Products pill has no dropdown. The SPA opens a mega-menu on
 *     click; a document cannot. The pill links to /products, which is the
 *     hub that menu leads to, so the reader lands on the same content.
 *     The mega-menu is hidden at rest, so the resting appearance of the
 *     header is unchanged.
 *   - There is no "Admin" pill. It only renders for an admin session, and
 *     a document has no session.
 */
import { translations } from "../lib/translate";

type Lang = "en" | "zh";

interface StaticHeaderNavProps {
  lang: Lang;
}

const PILL_BASE = "px-3 py-2 rounded-xl font-bold transition-all";
const PILL_ACTIVE = "bg-white text-orange-700 shadow-sm";
const PILL_IDLE = "text-slate-500 hover:text-slate-900";

export default function StaticHeaderNav({ lang }: StaticHeaderNavProps) {
  const t = (translations as any)[lang] ?? (translations as any).en;

  const items: Array<{ href: string; label: string; active?: boolean }> = [
    { href: "/", label: t.navHome, active: true },
    { href: "/products", label: t.navProducts },
    { href: "/reviews", label: t.navEvaluations },
    { href: "/guides", label: t.navGuides },
    { href: "/news/page/1", label: t.navNews },
    { href: "/about", label: t.navAbout },
  ];

  return (
    <>
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className={`${PILL_BASE} ${item.active ? PILL_ACTIVE : PILL_IDLE}`}
          aria-current={item.active ? "page" : undefined}
        >
          <span>{item.label}</span>
        </a>
      ))}
    </>
  );
}
