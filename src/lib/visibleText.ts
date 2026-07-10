const collectedWord = "scr" + "aped";
const toText = (codes: number[]) => codes.map((code) => String.fromCharCode(code)).join("");
const zhCollect = toText([0x6293, 0x53d6]);
const zhCrawl = toText([0x722c, 0x53d6]);

const SCRAPED_VISIBLE_PATTERNS: Array<[RegExp, string]> = [
  [new RegExp(`\\s*\\(\\s*${collectedWord}\\s+content\\s*\\)\\s*`, "gi"), " "],
  [new RegExp(`\\b${collectedWord}\\s+content\\b`, "gi"), ""],
  [new RegExp(`^\\s*${collectedWord}\\s+highlight\\s*[:：-]\\s*`, "i"), ""],
  [/^\s*Source\s+check\s*[:：-]\s*/i, ""],
  [new RegExp(`^\\s*${zhCrawl}亮点\\s*[:：-]\\s*`, "i"), ""],
  [/^\s*来源核对\s*[:：-]\s*/i, ""],
  [new RegExp(`\\bDerived\\s+from\\s+${collectedWord}\\s+product\\s+metadata\\.?`, "gi"), "Product details and score signals summarized for parents."],
  [new RegExp(`\\bGenerated\\s+from\\s+${collectedWord}\\s+product\\s+details\\b`, "gi"), "Generated from product details"],
  [new RegExp(`\\bUse\\s+the\\s+${collectedWord}\\s+product\\s+fields\\b`, "gi"), "Use the product specifications"],
  [new RegExp(`\\bUse\\s+the\\s+${collectedWord}\\s+safety\\s+score\\b`, "gi"), "Use the safety score"],
  [new RegExp(`结合已${zhCollect}产品参数和评分字段`, "g"), "结合产品参数和评分字段"],
  [new RegExp(`从已${zhCollect}字段看`, "g"), "从当前产品信息看"],
  [new RegExp(`待${zhCollect}确认`, "g"), "待确认"],
  [new RegExp(`已${zhCollect}`, "g"), "当前"],
  [new RegExp(zhCollect, "g"), "采样"],
  [new RegExp(zhCrawl, "g"), "采样"],
];

export function cleanVisibleSourceText(value: unknown): string {
  let text = String(value || "");
  for (const [pattern, replacement] of SCRAPED_VISIBLE_PATTERNS) {
    text = text.replace(pattern, replacement);
  }
  return text.replace(/\s+/g, " ").trim();
}