#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const CMS_BASE_DEFAULT = "https://kidsmobi-api-v1.seaman-player.workers.dev";
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
  console.log(`Usage: node scripts/cms_import_full_from_backend_v2.mjs [options]\n\nOptions:\n  --cmsBase=<url>        CMS API base URL (default from CMS_BASE or built-in)\n  --sourceBase=<url>     Backend source base URL (default from SOURCE_BASE or built-in)\n  --perCategory=<n>      Max products per category to import (default: 12)\n  --manifestPath=<path>  Output path for image transfer manifest\n  --dryRun               Fetch and build data only; skip all /save writes\n  --help                 Show this help\n`);
}

function asHttpUrl(value) {
  if (!value || typeof value !== "string") return "";
  try {
    const u = new URL(value);
    if (u.protocol === "http:" || u.protocol === "https:") return value;
    return "";
  } catch {
    return "";
  }
}

function dedupe(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const v = String(item || "").trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function normalizedUrl(value) {
  const raw = asHttpUrl(value);
  if (!raw) return "";
  try {
    const u = new URL(raw);
    u.hash = "";
    return u.toString();
  } catch {
    return "";
  }
}

function safeSlug(text, fallback = "unknown") {
  const normalized = String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function fileNameFromUrl(url, fallbackPrefix) {
  try {
    const u = new URL(url);
    const base = path.basename(u.pathname || "") || "";
    if (base) {
      return base;
    }
  } catch {
    // ignore
  }
  return `${fallbackPrefix}.bin`;
}

function buildManifestTargetPath(entry) {
  const kind = entry.kind || "gallery";
  const productId = safeSlug(entry.productId, "unknown-product");
  const resourceId = safeSlug(entry.resourceId || "", "");
  const sourceUrl = String(entry.sourceUrl || "");
  const fileName = safeSlug(fileNameFromUrl(sourceUrl, `${kind}-${entry.index || 0}`), `${kind}-${entry.index || 0}`);
  if (resourceId) {
    return `resources/${resourceId}/${fileName}`;
  }
  return `products/${productId}/${kind}/${fileName}`;
}

async function writeManifestFile(filePath, payload) {
  const fullPath = path.resolve(filePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
}

async function fetchJson(url, init) {
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
    const errText = (json && (json.error || json.message)) || text.slice(0, 240);
    throw new Error(`${response.status} ${url} ${errText}`);
  }
  return json;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(url, init = {}, options = {}) {
  const retries = Math.max(0, Number(options.retries ?? 3));
  const backoffMs = Math.max(100, Number(options.backoffMs ?? 400));
  let attempt = 0;
  while (true) {
    try {
      return await fetchJson(url, init);
    } catch (error) {
      const message = String(error?.message || error || "");
      const isNetworkLike =
        message.includes("fetch failed") ||
        message.includes("UND_ERR_SOCKET") ||
        message.includes("ECONNRESET") ||
        message.includes("ETIMEDOUT") ||
        message.includes("ENOTFOUND") ||
        message.includes("other side closed");
      if (attempt >= retries || !isNetworkLike) {
        throw error;
      }
      attempt += 1;
      const waitMs = backoffMs * attempt;
      console.warn(`[import] transient fetch error, retry ${attempt}/${retries} after ${waitMs}ms: ${message.slice(0, 180)}`);
      await sleep(waitMs);
    }
  }
}

function isDuplicateError(err) {
  const text = String(err?.message || err || "");
  return text.includes(" 409 ") || /duplicate/i.test(text);
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

function mapAgeRange(categoryId) {
  switch (categoryId) {
    case "balance_bike":
      return "18 months-5 years";
    case "scooters":
      return "2-8 years";
    case "electric_vehicles":
      return "3-8 years";
    case "kids_bikes":
      return "3-10 years";
    case "kids_tricycles":
    case "kids_push_ride_ons":
    case "kids_pull_along_wagons":
      return "1-5 years";
    case "car_seat":
      return "0-2 years";
    default:
      return "0-4 years";
  }
}

function mapHeightRange(categoryId) {
  switch (categoryId) {
    case "balance_bike":
      return [70, 115];
    case "scooters":
      return [80, 140];
    case "electric_vehicles":
      return [90, 145];
    case "kids_bikes":
      return [90, 155];
    case "kids_tricycles":
    case "kids_push_ride_ons":
    case "kids_pull_along_wagons":
      return [65, 120];
    case "car_seat":
      return [45, 90];
    default:
      return [0, 120];
  }
}

function scoreFromProduct(product) {
  const rating = Number(product?.rating?.value || 4.0);
  const weight = Number(product?.weight?.lbs || 0);
  const safety = Math.max(6.8, Math.min(9.8, rating * 1.8));
  const weightScore = weight > 0 ? Math.max(6.5, Math.min(9.8, 10 - (weight - 8) * 0.15)) : 8.6;
  const geometry = 8.8;
  const overall = Number(((safety * 0.45 + weightScore * 0.3 + geometry * 0.25)).toFixed(2));
  return { safety, weightScore, geometry, overall };
}

function buildProduct(product, resource) {
  const score = scoreFromProduct(product);
  const cover = asHttpUrl(product?.images?.cover?.url) || asHttpUrl(product?.coverImage) || "";
  const gallery = dedupe([
    ...(Array.isArray(product?.galleryUrls) ? product.galleryUrls : []),
    ...((product?.images?.gallery || []).map((g) => g?.url || "")),
  ].map(asHttpUrl));
  const videos = dedupe([
    ...(Array.isArray(product?.videoUrls) ? product.videoUrls : []),
    ...(Array.isArray(resource?.videoUrls) ? resource.videoUrls : []),
    resource?.resourceUrl || "",
  ].map(asHttpUrl));
  const summary = resource?.summary || product?.title || "";

  return {
    id: product.productId,
    name: product.title || product.productId,
    brand: product.brand || "Unknown",
    category: mapCategoryCode(product.categoryId),
    wheelSize: product?.classification?.Wheel_Configuration
      ? `${product.classification.Wheel_Configuration}-wheel`
      : "N/A",
    weight: Number(product?.weight?.lbs || 0),
    material: product?.classification?.Weight_Class || product?.classification?.Stroller_Type || "Unknown",
    brakeType: product?.classification?.Harness_Type || "Unknown",
    tireType: product?.classification?.Wheel_Configuration
      ? `${product.classification.Wheel_Configuration}-wheel`
      : "Unknown",
    price: Number(product?.price?.value || 0),
    ageRange: mapAgeRange(product.categoryId),
    heightRange: mapHeightRange(product.categoryId),
    imageUrl: cover,
    galleryUrls: gallery,
    videoUrl: videos[0] || "",
    videos: videos.map((url, idx) => ({
      url,
      title: `backend-video-${idx + 1}`,
      source: "scraped",
      order: idx,
    })),
    features: ["backend-imported", "ops-bootstrap"],
    scenarios: [`scene-${product.categoryId}`],
    relatedProductIds: [],
    status: "published",
    overallScore: score.overall,
    safetyScore: Number(score.safety.toFixed(2)),
    weightScore: Number(score.weightScore.toFixed(2)),
    geometryScore: Number(score.geometry.toFixed(2)),
    pros: [
      `Live rating ${Number(product?.rating?.value || 0).toFixed(1)}/5`,
      `Backend category ${product.categoryId}`,
    ],
    cons: ["Needs editorial enrichment after bootstrap"],
    safetyCertification: product?.availability ? [String(product.availability)] : [],
    editorVerdict: `${product.brand || "Unknown"} ${product.title || "product"} imported from backend feed for CMS bootstrap.`,
    zh: {
      name: product.title || product.productId,
      description: summary || "由 backend 数据自动导入。",
      brandText: product.brand || "Unknown",
      specsText: `Category: ${product.categoryId}`,
      pros: ["来自 backend 实时数据", "导入后可直接在 CMS 编辑"],
      cons: ["建议补充中文评测细节"],
      editorVerdict: "已完成运维初始化导入，建议人工复核后发布。",
    },
    en: {
      name: product.title || product.productId,
      description: summary || "Imported automatically from backend source.",
      brandText: product.brand || "Unknown",
      specsText: `Category: ${product.categoryId}`,
      pros: ["backend live source", "editable in CMS after import"],
      cons: ["recommend manual editorial enrichment"],
      editorVerdict: "Ops bootstrap import completed; review before final publish.",
    },
  };
}

async function cmsSave(cmsBase, collection, payload) {
  return fetchJson(`${cmsBase}/api/cms/${collection}/save`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function cmsListCount(cmsBase, collection) {
  const json = await fetchJson(`${cmsBase}/api/cms/${collection}`);
  return Array.isArray(json?.data) ? json.data.length : 0;
}

async function main() {
  if (hasFlag("help")) {
    printHelp();
    return;
  }

  const dryRun = hasFlag("dryRun");
  const cmsBase = (parseArg("cmsBase", process.env.CMS_BASE || CMS_BASE_DEFAULT) || CMS_BASE_DEFAULT).replace(/\/+$/, "");
  const sourceBase = (parseArg("sourceBase", process.env.SOURCE_BASE || SOURCE_BASE_DEFAULT) || SOURCE_BASE_DEFAULT).replace(/\/+$/, "");
  const perCategory = Math.max(5, Number(parseArg("perCategory", "12")) || 12);
  const manifestPath = parseArg("manifestPath", process.env.IMAGE_MANIFEST_PATH || "./tmp/front_image_transfer_manifest.json");
  const importBatchId = `import-${Date.now()}`;
  const importStats = {
    categories: { created: 0, updated: 0, failed: 0 },
    products: { created: 0, updated: 0, failed: 0 },
    scenarios: { created: 0, updated: 0, failed: 0 },
    evaluations: { created: 0, updated: 0, failed: 0 },
    guides: { created: 0, updated: 0, failed: 0 },
    news: { created: 0, updated: 0, failed: 0 },
    settings: { created: 0, updated: 0, failed: 0 },
  };

  console.log(`[import] cmsBase=${cmsBase}`);
  console.log(`[import] sourceBase=${sourceBase}`);
  console.log(`[import] manifestPath=${manifestPath}`);
  console.log(`[import] dryRun=${dryRun ? "true" : "false"}`);

  const health = await fetchJsonWithRetry(`${cmsBase}/api/cms/d1/health`);
  if (!health?.data?.healthy) {
    throw new Error("CMS D1 health check failed before import");
  }

  const categoriesResp = await fetchJsonWithRetry(`${sourceBase}/api/v2/catalog/categories?withStats=false`);
  const sourceCategories = Array.isArray(categoriesResp?.data) ? categoriesResp.data : [];
  if (sourceCategories.length === 0) {
    throw new Error("No source categories returned from backend");
  }

  const existingCategories = await fetchJsonWithRetry(`${cmsBase}/api/cms/categories`);
  const existingCategoryIds = new Set(
    Array.isArray(existingCategories?.data)
      ? existingCategories.data.map((item) => String(item?.id || "")).filter(Boolean)
      : []
  );

  const categoryRows = sourceCategories.map((item, idx) => ({
    id: `cat_${item.categoryId}`,
    code: mapCategoryCode(item.categoryId),
    status: "published",
    sortOrder: idx + 1,
    icon: "",
    zh: { name: item.name || item.categoryId, description: `backend:${item.categoryId}` },
    en: { name: item.name || item.categoryId, description: `backend:${item.categoryId}` },
  }));

  for (const row of categoryRows) {
    if (dryRun) {
      if (existingCategoryIds.has(row.id)) {
        importStats.categories.updated += 1;
      } else {
        importStats.categories.created += 1;
      }
      continue;
    }
    try {
      await cmsSave(cmsBase, "categories", row);
      if (existingCategoryIds.has(row.id)) {
        importStats.categories.updated += 1;
      } else {
        importStats.categories.created += 1;
      }
    } catch (err) {
      if (isDuplicateError(err)) {
        importStats.categories.updated += 1;
        continue;
      }
      importStats.categories.failed += 1;
      console.warn(`[import] category save failed id=${row.id}: ${String(err?.message || err)}`);
    }
  }

  const allProducts = [];
  const allResources = [];
  for (const cat of sourceCategories) {
    const [productsResp, resourcesResp] = await Promise.all([
      fetchJsonWithRetry(`${sourceBase}/api/v2/products?categoryId=${encodeURIComponent(cat.categoryId)}&page=1&pageSize=${perCategory}`),
      fetchJsonWithRetry(`${sourceBase}/api/v2/resources?categoryId=${encodeURIComponent(cat.categoryId)}&page=1&pageSize=${perCategory * 3}`),
    ]);

    const products = Array.isArray(productsResp?.data) ? productsResp.data : [];
    const resources = Array.isArray(resourcesResp?.data) ? resourcesResp.data : [];

    allProducts.push(...products);
    allResources.push(...resources);
  }

  const resourceMap = new Map();
  for (const r of allResources) {
    if (!resourceMap.has(r.productId)) resourceMap.set(r.productId, r);
  }
  const sourceCategoryByProductId = new Map();
  for (const product of allProducts) {
    sourceCategoryByProductId.set(String(product.productId), String(product.categoryId || "unknown"));
  }

  const cmsProducts = allProducts.map((p) => buildProduct(p, resourceMap.get(p.productId)));
  const existingProducts = await fetchJsonWithRetry(`${cmsBase}/api/cms/products`);
  const existingProductIds = new Set(
    Array.isArray(existingProducts?.data)
      ? existingProducts.data.map((item) => String(item?.id || "")).filter(Boolean)
      : []
  );
  for (const row of cmsProducts) {
    if (dryRun) {
      if (existingProductIds.has(row.id)) {
        importStats.products.updated += 1;
      } else {
        importStats.products.created += 1;
      }
      continue;
    }
    try {
      await cmsSave(cmsBase, "products", row);
      if (existingProductIds.has(row.id)) {
        importStats.products.updated += 1;
      } else {
        importStats.products.created += 1;
      }
    } catch (err) {
      importStats.products.failed += 1;
      console.warn(`[import] product save failed id=${row.id}: ${String(err?.message || err)}`);
    }
  }

  const imageManifest = [];
  const manifestSeen = new Set();
  for (const product of cmsProducts) {
    const sourceCategoryId = sourceCategoryByProductId.get(String(product.id)) || "unknown";
    const imageCandidates = [
      ...(product.imageUrl ? [{ url: product.imageUrl, kind: "cover", resourceId: "" }] : []),
      ...((product.galleryUrls || []).map((url) => ({ url, kind: "gallery", resourceId: "" }))),
    ];
    let index = 0;
    for (const item of imageCandidates) {
      const normalized = normalizedUrl(item.url);
      if (!normalized) continue;
      const dedupeKey = `${product.id}::${item.kind}::${normalized}`;
      if (manifestSeen.has(dedupeKey)) continue;
      manifestSeen.add(dedupeKey);
      const resource = resourceMap.get(product.id);
      const entry = {
        importBatchId,
        productId: product.id,
        sourceCategoryId,
        resourceId: String(resource?.resourceId || item.resourceId || ""),
        kind: item.kind,
        sourceUrl: normalized,
        targetPath: "",
        index,
      };
      entry.targetPath = buildManifestTargetPath(entry);
      imageManifest.push(entry);
      index += 1;
    }
  }

  const scenarios = sourceCategories.map((cat, idx) => {
    const ids = cmsProducts.filter((p) => p.scenarios?.includes(`scene-${cat.categoryId}`)).slice(0, 6).map((p) => p.id);
    return {
      id: `scene-${cat.categoryId}`,
      status: "published",
      sortOrder: idx + 1,
      productIds: ids,
      zh: {
        title: `${cat.name} 场景`,
        description: `由 backend ${cat.categoryId} 自动生成的场景分组。`,
      },
      en: {
        title: `${cat.name} Scenario`,
        description: `Auto-generated scenario grouping from backend ${cat.categoryId}.`,
      },
    };
  });
  const existingScenarios = await fetchJsonWithRetry(`${cmsBase}/api/cms/scenarios`);
  const existingScenarioIds = new Set(
    Array.isArray(existingScenarios?.data)
      ? existingScenarios.data.map((item) => String(item?.id || "")).filter(Boolean)
      : []
  );
  for (const row of scenarios) {
    if (dryRun) {
      if (existingScenarioIds.has(row.id)) {
        importStats.scenarios.updated += 1;
      } else {
        importStats.scenarios.created += 1;
      }
      continue;
    }
    try {
      await cmsSave(cmsBase, "scenarios", row);
      if (existingScenarioIds.has(row.id)) {
        importStats.scenarios.updated += 1;
      } else {
        importStats.scenarios.created += 1;
      }
    } catch (err) {
      importStats.scenarios.failed += 1;
      console.warn(`[import] scenario save failed id=${row.id}: ${String(err?.message || err)}`);
    }
  }

  const evaluations = sourceCategories
    .map((cat) => {
      const products = cmsProducts.filter((p) => p.scenarios?.includes(`scene-${cat.categoryId}`)).slice(0, 2);
      if (products.length === 0) return null;
      const lead = products[0];
      const rival = products[1] || products[0];
      return {
        id: `eval-${cat.categoryId}-${lead.id}`,
        type: products.length > 1 ? "compare" : "single",
        productId: lead.id,
        productIds: products.map((p) => p.id),
        status: "published",
        version: "V1.0",
        scores: {
          safety: Number(lead.safetyScore || 8.5),
          comfort: Number(Math.min(10, Number(lead.geometryScore || 8.5) + 0.2).toFixed(2)),
          portability: Number(Math.min(10, Number(lead.weightScore || 8.5) + 0.1).toFixed(2)),
          features: Number(Math.min(10, Number(lead.overallScore || 8.5) + 0.2).toFixed(2)),
          valueForMoney: 8.5,
        },
        imageUrl: lead.imageUrl || rival.imageUrl || "",
        zh: {
          title: `${cat.name}：${lead.name}${products.length > 1 ? ` vs ${rival.name}` : " 评测"}`,
          verdict: "基于 backend 数据自动生成，建议人工补充细节。",
          pros: lead.pros || [],
          cons: lead.cons || [],
          changelog: "ops-bootstrap import",
        },
        en: {
          title: `${cat.name}: ${lead.name}${products.length > 1 ? ` vs ${rival.name}` : " review"}`,
          verdict: "Auto-generated from backend data; manual refinement recommended.",
          pros: lead.pros || [],
          cons: lead.cons || [],
          changelog: "ops-bootstrap import",
        },
      };
    })
    .filter(Boolean);

  const existingEvaluations = await fetchJsonWithRetry(`${cmsBase}/api/cms/evaluations`);
  const existingEvaluationIds = new Set(
    Array.isArray(existingEvaluations?.data)
      ? existingEvaluations.data.map((item) => String(item?.id || "")).filter(Boolean)
      : []
  );
  for (const row of evaluations) {
    if (dryRun) {
      if (existingEvaluationIds.has(row.id)) {
        importStats.evaluations.updated += 1;
      } else {
        importStats.evaluations.created += 1;
      }
      continue;
    }
    try {
      await cmsSave(cmsBase, "evaluations", row);
      if (existingEvaluationIds.has(row.id)) {
        importStats.evaluations.updated += 1;
      } else {
        importStats.evaluations.created += 1;
      }
    } catch (err) {
      importStats.evaluations.failed += 1;
      console.warn(`[import] evaluation save failed id=${row.id}: ${String(err?.message || err)}`);
    }
  }

  const guideCandidates = allResources.filter((r) => {
    const type = String(r.resourceType || "").toLowerCase();
    return !type.includes("video");
  });

  const guides = (guideCandidates.length > 0 ? guideCandidates : allResources)
    .slice(0, 20)
    .map((r) => ({
      id: `guide-${r.resourceId}`,
      category: r.categoryId,
      status: "published",
      imageUrl: "",
      riskCards: [],
      seo: {
        zh: { title: r.title, description: r.summary, keywords: [r.categoryId, "选购"] },
        en: { title: r.title, description: r.summary, keywords: [r.categoryId, "guide"] },
      },
      zh: { title: r.title, content: r.summary || "导入自 backend 资源。" },
      en: { title: r.title, content: r.summary || "Imported from backend resource feed." },
    }));

  const existingGuides = await fetchJsonWithRetry(`${cmsBase}/api/cms/guides`);
  const existingGuideIds = new Set(
    Array.isArray(existingGuides?.data)
      ? existingGuides.data.map((item) => String(item?.id || "")).filter(Boolean)
      : []
  );
  for (const row of guides) {
    if (dryRun) {
      if (existingGuideIds.has(row.id)) {
        importStats.guides.updated += 1;
      } else {
        importStats.guides.created += 1;
      }
      continue;
    }
    try {
      await cmsSave(cmsBase, "guides", row);
      if (existingGuideIds.has(row.id)) {
        importStats.guides.updated += 1;
      } else {
        importStats.guides.created += 1;
      }
    } catch (err) {
      importStats.guides.failed += 1;
      console.warn(`[import] guide save failed id=${row.id}: ${String(err?.message || err)}`);
    }
  }

  const news = allResources
    .slice(0, 20)
    .map((r) => ({
      id: `news-${r.resourceId}`,
      category: r.categoryId,
      status: "published",
      imageUrl: "",
      seo: {
        zh: { title: r.title, description: r.summary, keywords: [r.categoryId, "资讯"] },
        en: { title: r.title, description: r.summary, keywords: [r.categoryId, "news"] },
      },
      zh: { title: r.title, content: r.summary || "导入自 backend 资源。" },
      en: { title: r.title, content: r.summary || "Imported from backend resource feed." },
    }));

  const existingNews = await fetchJsonWithRetry(`${cmsBase}/api/cms/news`);
  const existingNewsIds = new Set(
    Array.isArray(existingNews?.data)
      ? existingNews.data.map((item) => String(item?.id || "")).filter(Boolean)
      : []
  );
  for (const row of news) {
    if (dryRun) {
      if (existingNewsIds.has(row.id)) {
        importStats.news.updated += 1;
      } else {
        importStats.news.created += 1;
      }
      continue;
    }
    try {
      await cmsSave(cmsBase, "news", row);
      if (existingNewsIds.has(row.id)) {
        importStats.news.updated += 1;
      } else {
        importStats.news.created += 1;
      }
    } catch (err) {
      importStats.news.failed += 1;
      console.warn(`[import] news save failed id=${row.id}: ${String(err?.message || err)}`);
    }
  }

  const settings = {
    id: "global",
    hero: {
      zh: {
        title: "KIDSMOBI 运维导入版",
        subtitle: `已接入 backend 数据源，导入 ${sourceCategories.length} 个品类。`,
      },
      en: {
        title: "KIDSMOBI Ops Bootstrap",
        subtitle: `Connected to backend source and imported ${sourceCategories.length} categories.`,
      },
    },
    homeSlots: [
      ...cmsProducts.slice(0, 4).map((p, idx) => ({
        id: `slot-product-${idx + 1}`,
        type: "product",
        targetId: p.id,
      })),
      ...(evaluations[0]
        ? [
            {
              id: "slot-review-1",
              type: "review",
              targetId: evaluations[0].id,
            },
          ]
        : []),
    ],
    scoringStandards: [
      {
        id: "ops-bootstrap-standard",
        labelZh: "运维导入基线",
        labelEn: "Ops bootstrap baseline",
        descriptionZh: "基于 backend api/v2 数据自动生成。",
        descriptionEn: "Auto-generated from backend api/v2 data.",
        icon: "Globe",
      },
    ],
  };

  if (dryRun) {
    importStats.settings.updated += 1;
  } else {
    try {
      await cmsSave(cmsBase, "settings", settings);
      importStats.settings.updated += 1;
    } catch (err) {
      importStats.settings.failed += 1;
      console.warn(`[import] settings save failed: ${String(err?.message || err)}`);
    }
  }

  await writeManifestFile(manifestPath, {
    importBatchId,
    generatedAt: new Date().toISOString(),
    sourceBase,
    cmsBase,
    totalImages: imageManifest.length,
    entries: imageManifest,
  });

  const counts = dryRun
    ? {
        categories: categoryRows.length,
        products: cmsProducts.length,
        scenarios: scenarios.length,
        evaluations: evaluations.length,
        guides: guides.length,
        news: news.length,
        settings: 1,
      }
    : (() => {
        return {
          categories: 0,
          products: 0,
          scenarios: 0,
          evaluations: 0,
          guides: 0,
          news: 0,
          settings: 0,
        };
      })();

  if (!dryRun) {
    const settingsResp = await fetchJsonWithRetry(`${cmsBase}/api/cms/settings`);
    counts.categories = await cmsListCount(cmsBase, "categories");
    counts.products = await cmsListCount(cmsBase, "products");
    counts.scenarios = await cmsListCount(cmsBase, "scenarios");
    counts.evaluations = await cmsListCount(cmsBase, "evaluations");
    counts.guides = await cmsListCount(cmsBase, "guides");
    counts.news = await cmsListCount(cmsBase, "news");
    counts.settings = Array.isArray(settingsResp?.data) ? settingsResp.data.length : settingsResp?.data ? 1 : 0;
  }

  console.log("[import] completed");
  console.log(JSON.stringify({ cmsBase, sourceBase, counts, importStats, manifestPath, importBatchId }, null, 2));
}

main().catch((error) => {
  console.error("[import] failed", error);
  process.exit(1);
});
