import type { ImportBatchProductRow } from "./importBatchService";

export type ImportReviewDecision = "pass" | "pass-with-review" | "hold" | "reject";

export type ProductReviewSnapshot = {
  duplicateProduct: boolean;
  mediaIssue: boolean;
  editorialIncomplete: boolean;
  blocked: boolean;
  decision: ImportReviewDecision;
  flags: string[];
};

export type BatchReviewSnapshot = {
  duplicateProductCount: number;
  mediaIssueCount: number;
  editorialIncompleteCount: number;
  blockedProductCount: number;
  batchDecision: ImportReviewDecision;
};

const DUPLICATE_SUFFIX_RE = /-dup\d+$/i;

export function isDuplicateProductDir(productDirName: string): boolean {
  return DUPLICATE_SUFFIX_RE.test(String(productDirName || ""));
}

export function deriveProductReview(row: ImportBatchProductRow): ProductReviewSnapshot {
  const duplicateProduct = isDuplicateProductDir(row.productDirName);
  const coverCount = Number(row.media?.coverImages || 0);
  const invalidVideoCount = Number(row.media?.invalidVideoCount || 0);
  const roleMismatchCount = Number(row.media?.roleMismatchCount || 0);
  const editorialIncomplete = Boolean(row.review?.editorialIncomplete ?? true);

  const flags: string[] = [];
  if (duplicateProduct) flags.push("duplicate-product");
  if (coverCount !== 1) flags.push("missing-cover");
  if (roleMismatchCount > 0) flags.push("media-role-mismatch");
  if (invalidVideoCount > 0) flags.push("invalid-video-entry");
  if (editorialIncomplete) flags.push("editorial-empty");

  const mediaIssue = flags.includes("missing-cover") || flags.includes("media-role-mismatch") || flags.includes("invalid-video-entry");
  const blocked = duplicateProduct || flags.includes("missing-cover") || flags.includes("invalid-video-entry");
  const decision: ImportReviewDecision = blocked ? "hold" : (mediaIssue || editorialIncomplete ? "pass-with-review" : "pass");

  return { duplicateProduct, mediaIssue, editorialIncomplete, blocked, decision, flags };
}

export function summarizeBatchReview(rows: ImportBatchProductRow[]): BatchReviewSnapshot {
  let duplicateProductCount = 0;
  let mediaIssueCount = 0;
  let editorialIncompleteCount = 0;
  let blockedProductCount = 0;

  for (const row of rows) {
    const review = deriveProductReview(row);
    if (review.duplicateProduct) duplicateProductCount += 1;
    if (review.mediaIssue) mediaIssueCount += 1;
    if (review.editorialIncomplete) editorialIncompleteCount += 1;
    if (review.blocked) blockedProductCount += 1;
  }

  const batchDecision: ImportReviewDecision = blockedProductCount > 0
    ? "hold"
    : (duplicateProductCount > 0 || mediaIssueCount > 0 || editorialIncompleteCount > 0)
      ? "pass-with-review"
      : "pass";

  return { duplicateProductCount, mediaIssueCount, editorialIncompleteCount, blockedProductCount, batchDecision };
}

export function formatReviewDecision(lang: "zh" | "en", decision: ImportReviewDecision): string {
  if (lang === "zh") {
    switch (decision) {
      case "pass": return "通过";
      case "pass-with-review": return "通过但需复核";
      case "hold": return "暂缓";
      case "reject": return "拒绝";
    }
  }

  switch (decision) {
    case "pass": return "Pass";
    case "pass-with-review": return "Pass with Review";
    case "hold": return "Hold";
    case "reject": return "Reject";
  }
}
