/**
 * Guard: the zh guide-text sanitizer must never damage markdown syntax.
 *
 * sanitizeGuideTextForZh() runs term localizing and a long English-fragment
 * stripper over raw markdown. Before markdown targets were parked, both passes
 * chewed through URLs: "/guides/budget/balance-bike-price-tiers" (37 ASCII
 * chars) was eaten as "marketing English", leaking literal "[text](/" into
 * every hydrated zh guide body, and "stroller"/"maintenance"/"scooter" inside
 * URL paths was rewritten into Chinese, 404ing the link. 99 of 112 guide
 * editions were affected; the prerendered HTML looked fine because only the
 * SPA hydrates through the sanitizer.
 *
 * This guard replays the real sanitizer over every guide edition in the CMS
 * snapshot and asserts every markdown link/image/video target survives
 * byte-identical whenever the sanitizer keeps the text (fallback text has no
 * links by design).
 *
 * Run: npx tsx scripts/check-guide-sanitize-links.ts
 */

import { readFileSync } from "node:fs";
import { sanitizeGuideTextForZh } from "../src/lib/guideTextSanitize";

const MARKDOWN_TARGET_PATTERN = /(!?\[[^\]\n]*\]\([^)\s]+\)|@\[video[^\]\n]*\]\([^)\s]+\))/g;

interface GuideRecord {
  slug?: string;
  zh?: { title?: string; content?: string; summary?: string };
  en?: { title?: string; content?: string; summary?: string };
  seo?: { zh?: { description?: string } };
}

function targetsOf(text: string): string[] {
  return text.match(MARKDOWN_TARGET_PATTERN) || [];
}

function main(): void {
  const raw = readFileSync("scripts/cms-snapshots/guides.json", "utf8");
  const parsed = JSON.parse(raw) as { data?: GuideRecord[] } | GuideRecord[];
  const guides: GuideRecord[] = Array.isArray(parsed) ? parsed : parsed.data || [];

  const failures: string[] = [];
  let checkedFields = 0;
  let checkedTargets = 0;

  for (const guide of guides) {
    const slug = String(guide.slug || guide.zh?.title || "(unknown)");
    const zh = guide.zh || {};
    const fields: Array<[string, string]> = [
      ["zh.title", String(zh.title || "")],
      ["zh.summary", String(zh.summary || guide.seo?.zh?.description || "")],
      ["zh.content", String(zh.content || "")],
    ];
    for (const [field, value] of fields) {
      const before = targetsOf(value);
      if (before.length === 0) continue;
      checkedFields += 1;
      checkedTargets += before.length;

      const FALLBACK = "__guard_fallback__";
      const result = sanitizeGuideTextForZh(value, FALLBACK);
      if (result === FALLBACK) {
        // Untranslated record: the sanitizer substitutes placeholder text by
        // design, and placeholders carry no links. Not a syntax corruption.
        continue;
      }
      const after = targetsOf(result);
      const missing = before.filter((token) => !after.includes(token));
      if (missing.length > 0) {
        failures.push(
          `${slug} ${field}: sanitizer destroyed ${missing.length}/${before.length} markdown target(s): ` +
            missing.slice(0, 3).join(" | "),
        );
      }
    }
  }

  if (failures.length > 0) {
    console.error(`guide sanitize link guard: FAIL (${failures.length} field(s))`);
    for (const line of failures.slice(0, 20)) console.error(`  - ${line}`);
    process.exit(1);
  }
  console.log(
    `guide sanitize link guard: OK (${guides.length} guides, ${checkedFields} field(s), ${checkedTargets} markdown target(s) intact)`,
  );
}

main();
