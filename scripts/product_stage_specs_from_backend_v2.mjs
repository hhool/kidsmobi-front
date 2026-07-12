#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const SOURCE_BASE_DEFAULT = "https://kidsmobi-api-v1.seaman-player.workers.dev";

function parseArg(name, fallback = "") {
  const key = `--${name}=`;
  const matched = process.argv.find((arg) => arg.startsWith(key));
  return matched ? matched.slice(key.length) : fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function printHelp() {
  console.log(`Usage: node scripts/product_stage_specs_from_backend_v2.mjs [options]\n\nOptions:\n  --sourceBase=<url>      Backend source base URL (default: worker URL)\n  --outputRoot=<path>     Local output root (default: ./resource/assets/backend-import)\n  --batchId=<id>          Fixed batch id (default: import-<timestamp>)\n  --perCategory=<n>       Max products per category (default: 12)\n  --categories=<list>     Comma-separated category ids filter (optional)\n  --dryRun                Plan only; do not write files\n  --help                  Show this help\n`);
}

function safeSlug(text, fallback = "unknown") {
  const normalized = String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function dedupe(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const value = String(item || "").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function isInvalidId(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return !normalized || normalized === "n/a" || normalized === "na" || normalized === "none" || normalized === "null";
}

function normalizedProductId(value) {
  const candidate = String(value || "").trim();
  return isInvalidId(candidate) ? "" : candidate;
}

function normalizeMediaUrl(value, sourceBase) {
  if (!value || typeof value !== "string") return "";
  const text = String(value).trim();
  if (!text) return "";

  try {
    const u = new URL(text);
    if (u.protocol === "http:" || u.protocol === "https:") return text;
    return "";
  } catch {
    const cleanedBase = String(sourceBase || "").replace(/\/+$/, "");
    if (!cleanedBase) return "";

    if (text.startsWith("/scrape_store/")) {
      return `${cleanedBase}${text}`;
    }
    if (text.startsWith("scrape_store/")) {
      return `${cleanedBase}/${text}`;
    }
    if (text.startsWith("../scrape_store/")) {
      return `${cleanedBase}/${text.slice(3)}`;
    }
    return "";
  }
}

function mapCategoryCode(categoryId) {
  switch (categoryId) {
    case "balance_bike":
      return "balance";
    case "scooters":
      return "scooter";
    case "electric_vehicles":
      return "electric_car";
    case "kids_bikes":
      return "bicycle";
    case "kids_tricycles":
    case "kids_push_ride_ons":
    case "kids_pull_along_wagons":
      return "tricycle";
    case "car_seat":
      return "safety_seat";
    case "high_chair":
    case "playard":
    case "baby_carrier":
    case "stroller":
    default:
      return "stroller";
  }
}

function mediaFileNameFromUrl(url, fallback = "asset.jpg") {
  try {
    const parsed = new URL(url);
    const base = path.basename(parsed.pathname || "").trim();
    return safeSlug(base || fallback, fallback);
  } catch {
    return fallback;
  }
}

function buildKeepPath(item) {
  const resourceId = safeSlug(item.resourceId || "", "");
  const productId = safeSlug(item.productId || "", "unknown-product");
  const kind = safeSlug(item.kind || "gallery", "gallery");
  const fileName = mediaFileNameFromUrl(item.sourceUrl, `${kind}.jpg`);
  if (resourceId) {
    return `resources/${resourceId}/${fileName}`;
  }
  return `products/${productId}/${kind}/${fileName}`;
}

function buildCpkPath(item) {
  const category = safeSlug(item.categoryId || "", "unknown-category");
  const productId = safeSlug(item.productId || "", "unknown-product");
  const kind = safeSlug(item.kind || "gallery", "gallery");
  const fileName = mediaFileNameFromUrl(item.sourceUrl, `${kind}.jpg`);
  return `categories/${category}/products/${productId}/${kind}/${fileName}`;
}

function isManufacturerMediaUrl(url) {
  return /\/manufacturer_images\//i.test(String(url || ""));
}

function isLikelyVideoUrl(url) {
  const normalized = String(url || "").trim();
  if (!normalized) return false;
  try {
    const parsed = new URL(normalized);
    return /\.(mp4|m3u8)$/i.test(parsed.pathname || "");
  } catch {
    return /\.(mp4|m3u8)$/i.test(normalized);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, init = {}) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    ...init,
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!response.ok) {
    const details = (json && (json.error || json.message)) || text.slice(0, 240);
    throw new Error(`${response.status} ${url} ${details}`);
  }
  return json;
}

async function fetchJsonWithRetry(url, init = {}, retries = 3) {
  let attempt = 0;
  while (true) {
    try {
      return await fetchJson(url, init);
    } catch (error) {
      const message = String(error?.message || error || "");
      const transient =
        message.includes("fetch failed") ||
        message.includes("UND_ERR_SOCKET") ||
        message.includes("ECONNRESET") ||
        message.includes("ETIMEDOUT") ||
        message.includes("ENOTFOUND") ||
        message.includes("other side closed");
      if (!transient || attempt >= retries) throw error;
      attempt += 1;
      await sleep(350 * attempt);
    }
  }
}

function getPaginationTotal(payload) {
  const total = Number(payload?.pagination?.total);
  if (Number.isFinite(total) && total >= 0) return total;
  return null;
}

async function fetchAllByCategory(sourceBase, endpoint, categoryId, desiredPageSize) {
  const maxApiPageSize = 100;
  const pageSize = Math.max(1, Math.min(maxApiPageSize, Number(desiredPageSize) || 12));
  const out = [];
  let page = 1;
  let total = null;

  while (true) {
    const url = `${sourceBase}/api/v2/${endpoint}?categoryId=${encodeURIComponent(categoryId)}&page=${page}&pageSize=${pageSize}`;
    const resp = await fetchJsonWithRetry(url);
    const items = Array.isArray(resp?.data) ? resp.data : [];
    out.push(...items);

    if (total === null) total = getPaginationTotal(resp);
    if (items.length < pageSize) break;
    if (total !== null && out.length >= total) break;
    page += 1;
  }

  return out;
}

async function writeJsonFile(filePath, payload) {
  const fullPath = path.resolve(filePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
}

async function readJsonFileSafe(filePath, fallback) {
  try {
    const fullPath = path.resolve(filePath);
    const raw = await fs.readFile(fullPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function buildMediaManifest(product, resource, sourceBase) {
  const productId = String(product?.productId || "");
  const categoryId = String(product?.categoryId || "unknown");
  const resourceId = String(resource?.resourceId || "");

  const cover = normalizeMediaUrl(product?.images?.cover?.url, sourceBase) || normalizeMediaUrl(product?.coverImage, sourceBase) || "";

  const gallery = dedupe([
    ...(Array.isArray(product?.galleryUrls) ? product.galleryUrls : []),
    ...((product?.images?.gallery || []).map((item) => item?.url || "")),
    ...((product?.galleryImages || []).map((item) => item?.url || "")),
  ].map((item) => normalizeMediaUrl(item, sourceBase)).filter((item) => item && item !== cover && !isManufacturerMediaUrl(item)));

  const manufacturer = dedupe([
    ...((product?.manufacturerImages || []).map((item) => item?.url || "")),
    ...((product?.images?.manufacturer || []).map((item) => item?.url || "")),
  ].map((item) => normalizeMediaUrl(item, sourceBase)).filter((item) => item && item !== cover));

  const videoCandidates = dedupe([
    ...(Array.isArray(product?.videoUrls) ? product.videoUrls : []),
    ...(Array.isArray(resource?.videoUrls) ? resource.videoUrls : []),
    resource?.resourceUrl || "",
  ].map((item) => normalizeMediaUrl(item, sourceBase)));
  const videos = videoCandidates.filter(isLikelyVideoUrl);

  const images = [];
  if (cover) {
    images.push({
      productId,
      categoryId,
      resourceId,
      kind: "cover",
      sourceUrl: cover,
      targetPathKeep: buildKeepPath({ productId, categoryId, resourceId, kind: "cover", sourceUrl: cover }),
      targetPathCpk: buildCpkPath({ productId, categoryId, kind: "cover", sourceUrl: cover }),
    });
  }
  gallery.forEach((url) => {
    images.push({
      productId,
      categoryId,
      resourceId,
      kind: "gallery",
      sourceUrl: url,
      targetPathKeep: buildKeepPath({ productId, categoryId, resourceId, kind: "gallery", sourceUrl: url }),
      targetPathCpk: buildCpkPath({ productId, categoryId, kind: "gallery", sourceUrl: url }),
    });
  });

  manufacturer.forEach((url) => {
    images.push({
      productId,
      categoryId,
      resourceId,
      kind: "manufacturer",
      sourceUrl: url,
      targetPathKeep: buildKeepPath({ productId, categoryId, resourceId, kind: "manufacturer", sourceUrl: url }),
      targetPathCpk: buildCpkPath({ productId, categoryId, kind: "manufacturer", sourceUrl: url }),
    });
  });

  return { images, videos, invalidVideoCount: Math.max(0, videoCandidates.length - videos.length) };
}

function buildEditable(product) {
  return {
    schemaVersion: "v1",
    productId: String(product?.productId || ""),
    status: "draft",
    titleZh: String(product?.title || ""),
    titleEn: String(product?.title || ""),
    subtitleZh: "",
    subtitleEn: "",
    highlightsZh: [],
    highlightsEn: [],
    tags: [],
    scenarioIds: [],
    editorNote: "",
    publishPriority: 0,
    isVisible: false,
    opsScore: null,
    opsLabel: "",
    recommendationReasonZh: "",
    recommendationReasonEn: "",
    seo: {
      titleZh: "",
      titleEn: "",
      descZh: "",
      descEn: "",
      keywordsZh: [],
      keywordsEn: [],
    },
    updatedAt: new Date().toISOString(),
    updatedBy: "ops-staging",
  };
}

function buildPublish(product) {
  return {
    schemaVersion: "v1",
    productId: String(product?.productId || ""),
    publishStatus: "pending-approval",
    approvedAt: null,
    approvedBy: "",
    sourceSnapshotHash: "",
    generatedAt: new Date().toISOString(),
  };
}

async function main() {
  if (hasFlag("help")) {
    printHelp();
    return;
  }

  const sourceBase = (parseArg("sourceBase", process.env.SOURCE_BASE || SOURCE_BASE_DEFAULT) || SOURCE_BASE_DEFAULT).replace(/\/+$/, "");
  const outputRoot = parseArg("outputRoot", "./resource/assets/backend-import");
  const perCategory = Math.max(1, Number(parseArg("perCategory", "12")) || 12);
  const categoryFilter = parseArg("categories", "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const dryRun = hasFlag("dryRun");
  const importBatchId = parseArg("batchId", `import-${Date.now()}`);

  const rootAbs = path.resolve(outputRoot, importBatchId);
  console.log(`[spec-stage] sourceBase=${sourceBase}`);
  console.log(`[spec-stage] outputRoot=${rootAbs}`);
  console.log(`[spec-stage] perCategory=${perCategory}`);
  console.log(`[spec-stage] dryRun=${dryRun ? "true" : "false"}`);

  const categoriesResp = await fetchJsonWithRetry(`${sourceBase}/api/v2/catalog/categories?withStats=false`);
  const allCategories = Array.isArray(categoriesResp?.data) ? categoriesResp.data : [];
  const categories = categoryFilter.length
    ? allCategories.filter((c) => categoryFilter.includes(String(c?.categoryId || "")))
    : allCategories;

  if (categories.length === 0) {
    throw new Error("No categories found for staging");
  }

  const summary = {
    importBatchId,
    sourceBase,
    generatedAt: new Date().toISOString(),
    categories: categories.map((c) => String(c.categoryId || "")),
    totalProducts: 0,
    writtenProducts: 0,
    failedProducts: 0,
    outputRoot: rootAbs,
    byCategory: {},
    products: [],
    duplicateProductCount: 0,
    mediaIssueCount: 0,
    editorialIncompleteCount: 0,
    blockedProductCount: 0,
    batchDecision: "pass",
  };
  const dirSlugCounts = new Map();

  for (const category of categories) {
    const categoryId = String(category?.categoryId || "");
    const [products, resources] = await Promise.all([
      fetchAllByCategory(sourceBase, "products", categoryId, perCategory),
      fetchAllByCategory(sourceBase, "resources", categoryId, perCategory * 3),
    ]);
    const resourceMap = new Map();
    for (const item of resources) {
      if (!resourceMap.has(item?.productId)) resourceMap.set(item?.productId, item);
    }

    summary.byCategory[categoryId] = products.length;
    summary.totalProducts += products.length;

    for (const product of products) {
      const productId = normalizedProductId(product?.productId);
      if (!productId) {
        summary.failedProducts += 1;
        continue;
      }
      const baseSlug = `${safeSlug(productId, "unknown-product")}-${safeSlug(categoryId, "unknown-category")}`;
      const seenCount = (dirSlugCounts.get(baseSlug) || 0) + 1;
      dirSlugCounts.set(baseSlug, seenCount);
      const productSlug = seenCount === 1 ? baseSlug : `${baseSlug}-dup${seenCount}`;
      const productDir = path.join(rootAbs, "products", productSlug);
      const resource = resourceMap.get(productId) || null;

      let productDetail = product;
      try {
        const detailResp = await fetchJsonWithRetry(`${sourceBase}/api/v2/products/${encodeURIComponent(productId)}?categoryId=${encodeURIComponent(categoryId)}`);
        if (detailResp?.data && typeof detailResp.data === "object") {
          productDetail = { ...detailResp.data, productId };
        }
      } catch {
        productDetail = { ...product, productId };
      }

      const mediaManifest = buildMediaManifest(productDetail, resource, sourceBase);
      const editable = buildEditable(productDetail);
      const coverCount = mediaManifest.images.filter((item) => String(item?.kind || "") === "cover").length;
      const galleryCount = mediaManifest.images.filter((item) => String(item?.kind || "") === "gallery").length;
      const manufacturerCount = mediaManifest.images.filter((item) => String(item?.kind || "") === "manufacturer").length;
      const duplicateProduct = seenCount > 1;
      const invalidVideoCount = Number(mediaManifest.invalidVideoCount || 0);
      const editorialIncomplete = Boolean(
        !editable.titleZh ||
        !editable.titleEn ||
        (Array.isArray(editable.highlightsZh) && editable.highlightsZh.length === 0) ||
        (Array.isArray(editable.highlightsEn) && editable.highlightsEn.length === 0) ||
        !editable.seo?.titleZh ||
        !editable.seo?.titleEn ||
        !editable.seo?.descZh ||
        !editable.seo?.descEn ||
        (Array.isArray(editable.seo?.keywordsZh) && editable.seo.keywordsZh.length === 0) ||
        (Array.isArray(editable.seo?.keywordsEn) && editable.seo.keywordsEn.length === 0)
      );
      const mediaIssue = coverCount !== 1 || invalidVideoCount > 0;
      const blocked = duplicateProduct || coverCount !== 1 || invalidVideoCount > 0;

      const payloads = {
        productRaw: {
          schemaVersion: "v1",
          importBatchId,
          sourceBase,
          sourceCategoryId: categoryId,
          categoryCode: mapCategoryCode(categoryId),
          fetchedAt: new Date().toISOString(),
          data: productDetail,
        },
        resourceRaw: {
          schemaVersion: "v1",
          importBatchId,
          sourceBase,
          sourceCategoryId: categoryId,
          fetchedAt: new Date().toISOString(),
          data: resource,
        },
        editable,
        publish: buildPublish(productDetail),
        mediaManifest: {
          schemaVersion: "v1",
          importBatchId,
          productId,
          sourceCategoryId: categoryId,
          images: mediaManifest.images,
          videos: mediaManifest.videos,
        },
        meta: {
          schemaVersion: "v1",
          importBatchId,
          sourceBase,
          sourceCategoryId: categoryId,
          productId,
          productDirName: productSlug,
          outputDir: productDir,
          files: [
            "product.raw.json",
            "resource.raw.json",
            "product.editable.json",
            "product.publish.json",
            "media.manifest.json",
            "ingest.meta.json",
          ],
          generatedAt: new Date().toISOString(),
        },
      };

      summary.products.push({
        productId,
        sourceCategoryId: categoryId,
        productDirName: productSlug,
        media: {
          coverImages: coverCount,
          totalImages: mediaManifest.images.length,
          galleryImages: galleryCount,
          manufacturerImages: manufacturerCount,
          videos: mediaManifest.videos.length,
          invalidVideoCount,
          roleMismatchCount: 0,
        },
        review: {
          duplicateProduct,
          mediaIssue,
          editorialIncomplete,
          blocked,
          flags: [
            ...(duplicateProduct ? ["duplicate-product"] : []),
            ...(coverCount !== 1 ? ["missing-cover"] : []),
            ...(editorialIncomplete ? ["editorial-empty"] : []),
          ],
          decision: blocked ? "hold" : (mediaIssue || editorialIncomplete ? "pass-with-review" : "pass"),
        },
      });
      if (duplicateProduct) summary.duplicateProductCount += 1;
      if (mediaIssue) summary.mediaIssueCount += 1;
      if (editorialIncomplete) summary.editorialIncompleteCount += 1;
      if (blocked) summary.blockedProductCount += 1;

      if (dryRun) {
        summary.writtenProducts += 1;
        continue;
      }

      try {
        await Promise.all([
          writeJsonFile(path.join(productDir, "product.raw.json"), payloads.productRaw),
          writeJsonFile(path.join(productDir, "resource.raw.json"), payloads.resourceRaw),
          writeJsonFile(path.join(productDir, "product.editable.json"), payloads.editable),
          writeJsonFile(path.join(productDir, "product.publish.json"), payloads.publish),
          writeJsonFile(path.join(productDir, "media.manifest.json"), payloads.mediaManifest),
          writeJsonFile(path.join(productDir, "ingest.meta.json"), payloads.meta),
        ]);
        summary.writtenProducts += 1;
      } catch {
        summary.failedProducts += 1;
      }
    }
  }

  summary.batchDecision = summary.blockedProductCount > 0
    ? "hold"
    : (summary.duplicateProductCount > 0 || summary.mediaIssueCount > 0 || summary.editorialIncompleteCount > 0)
      ? "pass-with-review"
      : "pass";

  if (!dryRun) {
    await writeJsonFile(path.join(rootAbs, "batch.index.json"), summary);

    const batchesIndexPath = path.join(outputRoot, "batches.index.json");
    const batchesIndex = await readJsonFileSafe(batchesIndexPath, { batches: [] });
    const existing = Array.isArray(batchesIndex?.batches) ? batchesIndex.batches : [];
    const nextBatchEntry = {
      importBatchId,
      generatedAt: summary.generatedAt,
      sourceBase,
      totalProducts: summary.totalProducts,
      writtenProducts: summary.writtenProducts,
      failedProducts: summary.failedProducts,
      categories: summary.categories,
      duplicateProductCount: summary.duplicateProductCount,
      mediaIssueCount: summary.mediaIssueCount,
      editorialIncompleteCount: summary.editorialIncompleteCount,
      blockedProductCount: summary.blockedProductCount,
      batchDecision: summary.batchDecision,
      batchIndexPath: `./resource/assets/backend-import/${importBatchId}/batch.index.json`,
    };

    const deduped = [
      nextBatchEntry,
      ...existing.filter((item) => String(item?.importBatchId || "") !== importBatchId),
    ].slice(0, 120);

    await writeJsonFile(batchesIndexPath, { batches: deduped });
  }

  console.log("[spec-stage] completed");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error("[spec-stage] failed", error);
  process.exit(1);
});
