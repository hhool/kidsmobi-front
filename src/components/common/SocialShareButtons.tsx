import { openSocialShare, SOCIAL_BRAND_PATHS, type SocialPlatform } from "../../lib/socialShare";

const BUTTONS: { platform: SocialPlatform; labelEn: string; labelZh: string; hover: string }[] = [
  { platform: "x", labelEn: "Share on X", labelZh: "分享到 X", hover: "hover:text-slate-900 hover:border-slate-300" },
  { platform: "facebook", labelEn: "Share on Facebook", labelZh: "分享到 Facebook", hover: "hover:text-blue-600 hover:border-blue-200" },
];

export default function SocialShareButtons({
  title,
  lang = "en",
  iconSize = "w-5 h-5",
}: {
  title: string;
  lang?: "zh" | "en";
  iconSize?: string;
}) {
  return (
    <>
      {BUTTONS.map(({ platform, labelEn, labelZh, hover }) => (
        <button
          key={platform}
          onClick={(e) => openSocialShare(platform, title, e)}
          aria-label={lang === "zh" ? labelZh : labelEn}
          title={lang === "zh" ? labelZh : labelEn}
          className={`p-3 bg-white border border-slate-100 text-slate-400 rounded-2xl transition-all active:scale-95 ${hover}`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className={iconSize} aria-hidden="true">
            <path d={SOCIAL_BRAND_PATHS[platform]} />
          </svg>
        </button>
      ))}
    </>
  );
}
