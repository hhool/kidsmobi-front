import express from "express";
import { guideArticles } from "./data/guidesData.js";
import { newsArticles } from "./data/newsData.js";
import type { CMSCategory, CMSProduct, CMSScenario, CMSSettings, Evaluation, Guide, HomeSlot, News, ProductCategory } from "./types.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

// Middleware to parse requests
app.use(express.json());

// GET endpoint to retrieve guides data from the server
app.get("/api/guides", (req, res) => {
  res.json(guideArticles);
});

// GET endpoint to retrieve news data from the server
app.get("/api/news", (req, res) => {
  res.json(newsArticles);
});

const DEFAULT_SCRAPE_API_BASE_URL = "https://kidsmobi-api-v1.seaman-player.workers.dev";

interface WorkerCategory {
  categoryId: string;
  name: string;
  slug: string;
  entryUrl: string;
  defaultLimit: number;
  productCount?: number;
  resourceCount?: number;
}

interface WorkerProduct {
  productId: string;
  categoryId: string;
  rank: number;
  title: string;
  brand: string;
  price?: { display?: string; value?: number; currency?: string };
  rating?: { display?: string; value?: number };
  weight?: { display?: string; lbs?: number };
  classification?: Record<string, string>;
  availability?: string;
  coverImage?: string;
  galleryUrls?: string[];
  videoUrls?: string[];
  images?: {
    cover?: { url?: string; source?: string; order?: number };
    gallery?: Array<{ url?: string; source?: string; order?: number }>;
  };
  resourceStats?: { videos?: number; similarItems?: number };
}

interface WorkerResource {
  resourceId: string;
  categoryId: string;
  productId: string;
  resourceType: string;
  title: string;
  summary: string;
  publishTime: string | null;
  source: string;
  resourceUrl?: string;
  videoUrls?: string[];
  credibilityScore: number;
  credibilityLevel: string;
  scoringBreakdown?: { docs?: number; videos?: number; hasFeatures?: boolean };
}

interface AdminResourceProduct {
  id: string;
  categoryId: string;
  title: string;
  brand: string;
  coverImage?: string;
  galleryImages: string[];
  videoUrls: string[];
}

interface WorkerDiscoveryHome {
  data?: {
    featuredCategories?: Array<{ categoryId: string; name: string }>;
    hotProducts?: WorkerProduct[];
    latestResources?: WorkerResource[];
    trendingComparisons?: Array<{ templateId: string; title: string }>;
  };
}

function getScrapeApiBaseUrl() {
  return (process.env.SCRAPE_KIDSMOBILE_API_BASE_URL?.trim() || DEFAULT_SCRAPE_API_BASE_URL).replace(/\/+$/, "");
}

function buildWorkerUrl(pathname: string) {
  return `${getScrapeApiBaseUrl()}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

function isHttpUrl(value?: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchWorkerJson<T>(pathname: string): Promise<T> {
  const response = await fetch(buildWorkerUrl(pathname), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Worker request failed (${response.status} ${response.statusText})${details ? `: ${details}` : ""}`);
  }

  return (await response.json()) as T;
}

type D1QueryResponse = {
  success?: boolean;
  errors?: Array<{ message?: string }>;
  result?: Array<{
    success?: boolean;
    error?: string;
    results?: any[];
  }>;
};

type D1Collection = "products" | "categories" | "scenarios" | "evaluations" | "guides" | "news" | "settings";

function getD1Config() {
  const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
  const databaseId = (process.env.CLOUDFLARE_D1_DATABASE_ID || "").trim();
  const apiToken = (process.env.CLOUDFLARE_API_TOKEN || "").trim();
  return { accountId, databaseId, apiToken };
}

function hasD1Config() {
  const config = getD1Config();
  return Boolean(config.accountId && config.databaseId && config.apiToken);
}

async function d1Query(sql: string, params: any[] = []): Promise<any[]> {
  const { accountId, databaseId, apiToken } = getD1Config();
  if (!accountId || !databaseId || !apiToken) {
    throw new Error("Cloudflare D1 config missing. Please set CLOUDFLARE_ACCOUNT_ID/CLOUDFLARE_D1_DATABASE_ID/CLOUDFLARE_API_TOKEN.");
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({ sql, params }),
  });

  const payload = (await response.json().catch(() => ({}))) as D1QueryResponse;
  if (!response.ok || payload.success === false) {
    const apiError = payload.errors?.map((item) => item?.message).filter(Boolean).join(";") || response.statusText;
    throw new Error(`D1 query failed: ${apiError}`);
  }

  const first = payload.result?.[0];
  if (!first || first.success === false) {
    throw new Error(`D1 query execution failed: ${first?.error || "unknown error"}`);
  }
  return first.results || [];
}

async function ensureD1Schema() {
  await d1Query(
    `CREATE TABLE IF NOT EXISTS cms_records (
      collection TEXT NOT NULL,
      id TEXT NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (collection, id)
    )`
  );
}

async function upsertD1CMSRecord(collectionName: D1Collection, id: string, payload: any) {
  await d1Query(
    `INSERT INTO cms_records (collection, id, payload, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(collection, id)
     DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
    [collectionName, id, JSON.stringify(payload), new Date().toISOString()]
  );
}

async function deleteD1CMSRecord(collectionName: D1Collection, id: string) {
  await d1Query(`DELETE FROM cms_records WHERE collection = ? AND id = ?`, [collectionName, id]);
}

async function listD1CMSRecords<T>(collectionName: D1Collection): Promise<T[]> {
  const rows = await d1Query(
    `SELECT payload FROM cms_records WHERE collection = ? ORDER BY updated_at DESC`,
    [collectionName]
  );
  return rows
    .map((item: any) => {
      try {
        return JSON.parse(String(item?.payload || "{}")) as T;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as T[];
}

function buildCMSCategoryFromWorker(item: WorkerCategory, index: number): CMSCategory {
  const code = mapWorkerCategoryToProductCategory(item.categoryId);
  return {
    id: `cat_${code}`,
    code,
    status: "published",
    sortOrder: index + 1,
    icon: "",
    zh: {
      name: item.name || code,
      description: `backend:${item.categoryId}`,
    },
    en: {
      name: item.name || code,
      description: `backend:${item.categoryId}`,
    },
    updatedAt: new Date().toISOString(),
  };
}

function buildCMSProductFromResourceRow(row: AdminResourceProduct): CMSProduct {
  return {
    id: row.id,
    name: row.title,
    brand: row.brand || "Unknown",
    category: mapWorkerCategoryToProductCategory(row.categoryId),
    wheelSize: "N/A",
    weight: 0,
    material: "N/A",
    brakeType: "N/A",
    tireType: "N/A",
    price: 0,
    ageRange: mapCategoryToAgeRange(row.categoryId),
    heightRange: mapCategoryToHeightRange(row.categoryId),
    compliance: ["EN1888"],
    imageUrl: row.coverImage || "",
    galleryUrls: row.galleryImages || [],
    videoUrl: row.videoUrls?.[0] || "",
    videos: (row.videoUrls || []).map((url, idx) => ({
      url,
      title: `init-video-${idx + 1}`,
      source: "scraped",
      order: idx,
    })),
    features: ["backend-imported", "d1-init"],
    scenarios: ["city-commute"],
    relatedProductIds: [],
    status: "draft",
    zh: {
      name: row.title,
      description: "由 backend 原始数据初始化到 D1。",
      brandText: row.brand || "Unknown",
      specsText: "Initialized from backend resources.",
      pros: ["backend source"],
      cons: ["needs editorial enrichment"],
      editorVerdict: "建议补充评测文案后发布。",
    },
    en: {
      name: row.title,
      description: "Initialized into D1 from backend source data.",
      brandText: row.brand || "Unknown",
      specsText: "Initialized from backend resources.",
      pros: ["backend source"],
      cons: ["needs editorial enrichment"],
      editorVerdict: "Please enrich editorial content before publishing.",
    },
    updatedAt: new Date().toISOString(),
  };
}

function mapWorkerCategoryToProductCategory(categoryId: string): ProductCategory {
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

function mapCategoryToAgeRange(categoryId: string): string {
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

function mapCategoryToHeightRange(categoryId: string): [number, number] {
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

function computeWeightScore(weightLbs?: number) {
  if (!weightLbs) return 8;
  if (weightLbs <= 10) return 10;
  if (weightLbs <= 13) return 9.5;
  if (weightLbs <= 18) return 9;
  if (weightLbs <= 25) return 8.2;
  if (weightLbs <= 35) return 7.4;
  return 6.8;
}

function computeSafetyScore(product: WorkerProduct, resource?: WorkerResource) {
  const rating = product.rating?.value ?? 4.0;
  const credibility = resource?.credibilityScore ?? 0.75;
  return Math.min(10, Math.max(6.5, rating * 1.35 + credibility * 1.6));
}

function computeGeometryScore(categoryId: string, product: WorkerProduct) {
  const baseScore =
    categoryId === "balance_bike" || categoryId === "kids_bikes" || categoryId === "scooters"
      ? 9.2
      : categoryId === "car_seat"
        ? 8.7
        : 8.4;

  const wheelBonus = product.classification?.Wheel_Configuration === "4" ? 0.2 : 0;
  return Math.min(10, baseScore + wheelBonus);
}

function computeOverallScore(safetyScore: number, weightScore: number, geometryScore: number, ratingValue?: number) {
  const ratingBonus = ratingValue ? ratingValue * 0.15 : 0;
  return Math.min(10, Math.max(6.5, safetyScore * 0.4 + weightScore * 0.25 + geometryScore * 0.25 + ratingBonus));
}

function summarizePros(product: WorkerProduct, resource?: WorkerResource): string[] {
  const pros: string[] = [];

  if (resource?.credibilityLevel) {
    pros.push(`Worker evidence level: ${resource.credibilityLevel}`);
  }
  if (product.weight?.lbs) {
    pros.push(`Lightweight at ${product.weight.lbs} lbs for category ${product.categoryId}`);
  }
  if (product.rating?.value) {
    pros.push(`Strong live rating: ${product.rating.value.toFixed(1)}/5`);
  }
  if (product.resourceStats?.videos) {
    pros.push(`Backed by ${product.resourceStats.videos} linked videos`);
  }
  if (resource?.summary) {
    pros.push(resource.summary.slice(0, 140));
  }

  return pros.slice(0, 4);
}

function summarizeCons(product: WorkerProduct): string[] {
  const cons: string[] = [];

  if ((product.weight?.lbs ?? 0) > 20) {
    cons.push("Heavier than the lightweight comfort tier.");
  }
  if ((product.price?.value ?? 0) > 200) {
    cons.push("Higher price tier than entry-level alternatives.");
  }
  if ((product.resourceStats?.similarItems ?? 0) === 0) {
    cons.push("Limited similar-item coverage in the worker feed.");
  }

  if (cons.length === 0) {
    cons.push("Synthetic bundle generated from API evidence; treat as a curated preview rather than a formal lab report.");
  }

  return cons.slice(0, 3);
}

function buildVerdict(product: WorkerProduct, resource?: WorkerResource) {
  const summary = resource?.summary || product.title;
  const prefix = `${product.brand} ${product.title}`;
  return `${prefix} is surfaced by the worker with ${product.rating?.value?.toFixed(1) ?? "n/a"}/5 live rating and ${resource?.credibilityLevel ?? "unknown"} evidence confidence. ${summary.slice(0, 180)}`;
}

function buildLocalizedText(product: WorkerProduct, resource?: WorkerResource) {
  const summary = resource?.summary || product.title;
  return {
    zh: {
      name: product.title,
      description: summary,
      brandText: product.brand,
      specsText: `Category: ${product.categoryId}`,
      pros: summarizePros(product, resource),
      cons: summarizeCons(product),
      editorVerdict: buildVerdict(product, resource),
    },
    en: {
      name: product.title,
      description: summary,
      brandText: product.brand,
      specsText: `Category: ${product.categoryId}`,
      pros: summarizePros(product, resource),
      cons: summarizeCons(product),
      editorVerdict: buildVerdict(product, resource),
    },
  };
}

function dedupeUrls(urls: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    const normalized = (url || "").trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function normalizeImageSource(source?: string): "cms" | "scraped" | "unknown" {
  if (source === "cms" || source === "scraped" || source === "unknown") {
    return source;
  }
  return "scraped";
}

function normalizeWorkerImages(product: WorkerProduct) {
  const coverCandidates = [
    product.images?.cover?.url || "",
    product.coverImage || "",
  ].map((item) => item.trim()).filter(Boolean);

  const galleryCandidates = dedupeUrls([
    ...(product.images?.gallery || []).map((item) => (item.url || "").trim()),
    product.coverImage || "",
  ]);

  const coverUrl = coverCandidates[0] || galleryCandidates[0] || "";
  const galleryUrls = dedupeUrls(galleryCandidates.filter((url) => url !== coverUrl));

  return {
    coverUrl,
    galleryUrls,
    images: {
      cover: coverUrl
        ? {
            url: coverUrl,
            source: normalizeImageSource(product.images?.cover?.source),
            order: 0,
          }
        : undefined,
      gallery: galleryUrls.map((url, index) => ({
        url,
        source: normalizeImageSource(product.images?.gallery?.find((item) => (item.url || "").trim() === url)?.source),
        order: index + 1,
      })),
    },
  };
}

function convertWorkerProduct(product: WorkerProduct, resource?: WorkerResource): CMSProduct {
  const localized = buildLocalizedText(product, resource);
  const weight = product.weight?.lbs ?? 0;
  const normalizedImages = normalizeWorkerImages(product);

  return {
    id: product.productId,
    name: product.title,
    brand: product.brand,
    category: mapWorkerCategoryToProductCategory(product.categoryId),
    wheelSize: product.classification?.Wheel_Configuration ? `${product.classification.Wheel_Configuration}-wheel` : "N/A",
    weight,
    material: product.classification?.Weight_Class || product.classification?.Stroller_Type || "Unknown",
    brakeType: product.classification?.Harness_Type || "Unknown",
    tireType: product.classification?.Wheel_Configuration ? `${product.classification.Wheel_Configuration}-wheel` : "Unknown",
    price: product.price?.value ?? 0,
    ageRange: mapCategoryToAgeRange(product.categoryId),
    heightRange: mapCategoryToHeightRange(product.categoryId),
    images: normalizedImages.images,
    imageUrl: normalizedImages.coverUrl,
    galleryUrls: normalizedImages.galleryUrls,
    status: "published",
    overallScore: computeOverallScore(
      computeSafetyScore(product, resource),
      computeWeightScore(weight),
      computeGeometryScore(product.categoryId, product),
      product.rating?.value
    ),
    safetyScore: computeSafetyScore(product, resource),
    weightScore: computeWeightScore(weight),
    geometryScore: computeGeometryScore(product.categoryId, product),
    pros: localized.en.pros,
    cons: localized.en.cons,
    safetyCertification: product.availability ? [product.availability] : [],
    editorVerdict: localized.en.editorVerdict,
    zh: localized.zh,
    en: localized.en,
    updatedAt: new Date().toISOString(),
  };
}

function buildHomeSlots(products: CMSProduct[], evaluationIds: string[]): HomeSlot[] {
  const slots: HomeSlot[] = [];
  const productSlots = products.slice(0, 4).map((product, index) => ({
    id: `worker-product-${index + 1}`,
    type: "product" as const,
    targetId: product.id,
  }));
  slots.push(...productSlots);

  if (evaluationIds.length > 0) {
    slots.push({
      id: "worker-review-1",
      type: "review",
      targetId: evaluationIds[0],
    });
  }

  return slots;
}

function buildEvaluationFromProducts(categoryId: string, label: string, products: CMSProduct[], resource?: WorkerResource): Evaluation | null {
  if (products.length === 0) {
    return null;
  }

  const lead = products[0];
  const challenger = products[1] || products[0];
  const safety = lead.safetyScore ?? 8.5;
  const comfort = Math.min(10, (lead.geometryScore ?? 8.5) + 0.2);
  const portability = Math.min(10, (lead.weightScore ?? 8.5) + 0.1);
  const features = Math.min(10, ((lead.overallScore ?? 8.5) + (resource?.credibilityScore ?? 0.8) * 2) / 1.2);
  const valueForMoney = Math.min(10, 10 - Math.max(0, (lead.price - 120) / 40));

  return {
    id: `worker-${categoryId}-${lead.id}`,
    type: products.length > 1 ? "compare" : "single",
    productIds: products.slice(0, 2).map((item) => item.id),
    productId: lead.id,
    status: "published",
    version: "V1.0",
    scores: {
      safety,
      comfort,
      portability,
      features,
      valueForMoney,
    },
    imageUrl: lead.imageUrl || challenger.imageUrl || "",
    zh: {
      title: `${label}：${lead.name} ${products.length > 1 ? `vs ${challenger.name}` : "精选评估"}`,
      verdict: resource?.summary || lead.editorVerdict || `${lead.brand} ${lead.name} 的 worker 预览评估。`,
      pros: lead.pros?.slice(0, 3) || [],
      cons: lead.cons?.slice(0, 3) || [],
      changelog: `Generated from worker feed ${categoryId}.`,
    },
    en: {
      title: `${label}: ${lead.name} ${products.length > 1 ? `vs ${challenger.name}` : "Preview Review"}`,
      verdict: resource?.summary || lead.editorVerdict || `${lead.brand} ${lead.name} worker preview evaluation.`,
      pros: lead.pros?.slice(0, 3) || [],
      cons: lead.cons?.slice(0, 3) || [],
      changelog: `Generated from worker feed ${categoryId}.`,
    },
    updatedAt: new Date().toISOString(),
  };
}

app.get("/api/content/bundle", async (req, res) => {
  try {
    const categoriesResponse = await fetchWorkerJson<{ data: WorkerCategory[] }>("/api/v1/catalog/categories");
    const categories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [];

    if (categories.length === 0) {
      throw new Error("Worker categories response was empty.");
    }

    const discoveryCategory = categories.find((category) => category.categoryId === "stroller")?.categoryId || categories[0].categoryId;
    const discoveryHome = await fetchWorkerJson<WorkerDiscoveryHome>(`/api/v1/discovery/home?categoryId=${encodeURIComponent(discoveryCategory)}`);

    const categoryPayloads = await Promise.all(
      categories.map(async (category) => {
        const [productsResponse, resourcesResponse] = await Promise.all([
          fetchWorkerJson<{ data: WorkerProduct[]; meta?: unknown }>(
            `/api/v1/products?categoryId=${encodeURIComponent(category.categoryId)}&page=1&pageSize=${category.defaultLimit}`
          ),
          fetchWorkerJson<{ data: WorkerResource[]; meta?: unknown }>(
            `/api/v1/resources?categoryId=${encodeURIComponent(category.categoryId)}&page=1&pageSize=${category.defaultLimit}`
          ),
        ]);

        return {
          category,
          products: Array.isArray(productsResponse.data) ? productsResponse.data : [],
          resources: Array.isArray(resourcesResponse.data) ? resourcesResponse.data : [],
        };
      })
    );

    const productsByCategory = new Map<string, CMSProduct[]>();
    const evaluationsByCategory: Evaluation[] = [];
    const allProducts: CMSProduct[] = [];

    for (const payload of categoryPayloads) {
      const resourcesByProductId = new Map(payload.resources.map((resource) => [resource.productId, resource]));
      const convertedProducts = payload.products.map((product) => convertWorkerProduct(product, resourcesByProductId.get(product.productId)));
      productsByCategory.set(payload.category.categoryId, convertedProducts);
      allProducts.push(...convertedProducts);

      const primaryResource = payload.resources[0];
      const evaluation = buildEvaluationFromProducts(payload.category.categoryId, payload.category.name, convertedProducts, primaryResource);
      if (evaluation) {
        evaluationsByCategory.push(evaluation);
      }
    }

    const homeProducts = (discoveryHome.data?.hotProducts || [])
      .map((product) => {
        const matchingCategory = categoryPayloads.find((payload) => payload.category.categoryId === product.categoryId);
        const resource = matchingCategory?.resources.find((item) => item.productId === product.productId);
        return convertWorkerProduct(product, resource);
      })
      .filter((product, index, array) => array.findIndex((item) => item.id === product.id) === index);

    const evaluationIds = evaluationsByCategory.map((evaluation) => evaluation.id);
    const settings: CMSSettings = {
      id: "global",
      hero: {
        zh: {
          title: "KIDSMOBI Live API Explorer",
          subtitle: `Connected to ${categories.length} live categories from the kidsmobi worker API.`,
        },
        en: {
          title: "KIDSMOBI Live API Explorer",
          subtitle: `Connected to ${categories.length} live categories from the kidsmobi worker API.`,
        },
      },
      homeSlots: buildHomeSlots(homeProducts.length > 0 ? homeProducts : allProducts, evaluationIds),
      scoringStandards: [
        {
          id: "worker-live",
          labelZh: "Worker 实时数据",
          labelEn: "Worker live data",
          descriptionZh: "从 Cloudflare Worker 的 products、resources 和 discovery 接口聚合而来。",
          descriptionEn: "Aggregated from the Cloudflare Worker products, resources, and discovery endpoints.",
          icon: "Globe",
        },
      ],
    };

    res.json({
      settings,
      products: homeProducts.length > 0 ? homeProducts : allProducts,
      evaluations: evaluationsByCategory,
    });
  } catch (error: any) {
    console.error("Failed to load upstream content bundle:", error);
    res.status(502).json({
      error: error.message || "Failed to load upstream content bundle",
    });
  }
});

async function buildAdminResourcePayload(options?: { categoryId?: string; q?: string; includeAll?: boolean }) {
  const requestedCategory = (options?.categoryId || "").trim();
  const query = (options?.q || "").trim().toLowerCase();

  const categoriesResponse = await fetchWorkerJson<{ data: WorkerCategory[] }>("/api/v1/catalog/categories");
  const categories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [];
  if (categories.length === 0) {
    return { categories: [] as Array<{ categoryId: string; name: string }>, products: [] as AdminResourceProduct[] };
  }

  const selectedCategories = requestedCategory
    ? categories.filter((item) => item.categoryId === requestedCategory)
    : options?.includeAll
      ? categories
      : categories.slice(0, 5);

  const payloads = await Promise.all(
    selectedCategories.map(async (category) => {
      const [productsResponse, resourcesResponse] = await Promise.all([
        fetchWorkerJson<{ data: WorkerProduct[] }>(
          `/api/v1/products?categoryId=${encodeURIComponent(category.categoryId)}&page=1&pageSize=40`
        ),
        fetchWorkerJson<{ data: WorkerResource[] }>(
          `/api/v1/resources?categoryId=${encodeURIComponent(category.categoryId)}&page=1&pageSize=60`
        ),
      ]);
      return {
        category,
        products: Array.isArray(productsResponse.data) ? productsResponse.data : [],
        resources: Array.isArray(resourcesResponse.data) ? resourcesResponse.data : [],
      };
    })
  );

  const resultProducts: AdminResourceProduct[] = [];

  for (const payload of payloads) {
    const videoMap = new Map<string, string[]>();

    for (const resource of payload.resources) {
      const urls = dedupeUrls([
        ...((resource.videoUrls || []).filter((item) => isHttpUrl(item))),
        resource.resourceUrl || "",
        resource.source || "",
      ]);
      const isVideo = (resource.resourceType || "").toLowerCase().includes("video") || urls.length > 0;
      if (!isVideo) {
        continue;
      }
      const current = videoMap.get(resource.productId) || [];
      videoMap.set(resource.productId, dedupeUrls([...current, ...urls]));
    }

    for (const product of payload.products) {
      const coverImage = (product.images?.cover?.url || product.coverImage || "").trim();
      const galleryImages = dedupeUrls([
        ...(product.galleryUrls || []),
        ...(product.images?.gallery || []).map((item) => (item.url || "").trim()),
      ].filter((item) => isHttpUrl(item)));

      const videoUrls = dedupeUrls([
        ...((product.videoUrls || []).filter((item) => isHttpUrl(item))),
        ...(videoMap.get(product.productId) || []),
      ]);

      const row: AdminResourceProduct = {
        id: product.productId,
        categoryId: product.categoryId,
        title: product.title,
        brand: product.brand,
        coverImage: isHttpUrl(coverImage) ? coverImage : undefined,
        galleryImages,
        videoUrls,
      };

      if (query) {
        const text = `${row.title} ${row.brand} ${row.id}`.toLowerCase();
        if (!text.includes(query)) {
          continue;
        }
      }

      resultProducts.push(row);
    }
  }

  return {
    categories: selectedCategories.map((item) => ({
      categoryId: item.categoryId,
      name: item.name,
    })),
    products: resultProducts,
  };
}

app.get("/api/content/resources", async (req, res) => {
  try {
    const includeAllCategories = String(req.query.all || "").toLowerCase() === "1" || String(req.query.all || "").toLowerCase() === "true";
    const data = await buildAdminResourcePayload({
      categoryId: typeof req.query.categoryId === "string" ? req.query.categoryId : "",
      q: typeof req.query.q === "string" ? req.query.q : "",
      includeAll: includeAllCategories,
    });

    res.json({ data });
  } catch (error: any) {
    console.error("Failed to load admin resource picker payload:", error);
    res.status(502).json({
      error: error.message || "Failed to load resource picker payload",
    });
  }
});

app.get("/api/cms/categories", async (req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    await ensureD1Schema();
    const rows = await listD1CMSRecords<CMSCategory>("categories");
    const onlyPublished = String(req.query.onlyPublished || "").toLowerCase() === "1" || String(req.query.onlyPublished || "").toLowerCase() === "true";
    const filtered = onlyPublished ? rows.filter((item) => item?.status === "published") : rows;
    filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    res.json({ data: filtered });
  } catch (error: any) {
    console.error("Failed to list D1 categories:", error);
    res.status(500).json({ error: error.message || "Failed to list D1 categories" });
  }
});

app.get("/api/cms/d1/health", async (_req, res) => {
  const configured = hasD1Config();
  if (!configured) {
    res.status(503).json({
      data: {
        configured: false,
        healthy: false,
      },
    });
    return;
  }

  try {
    await ensureD1Schema();
    await d1Query("SELECT 1 as ok");
    res.json({
      data: {
        configured: true,
        healthy: true,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      data: {
        configured: true,
        healthy: false,
      },
      error: error?.message || "D1 health check failed",
    });
  }
});

app.get("/api/cms/products", async (req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    await ensureD1Schema();
    const rows = await listD1CMSRecords<CMSProduct>("products");
    const onlyPublished = String(req.query.onlyPublished || "").toLowerCase() === "1" || String(req.query.onlyPublished || "").toLowerCase() === "true";
    const filtered = onlyPublished ? rows.filter((item) => item?.status === "published") : rows;
    filtered.sort((a, b) => String((b as any)?.updatedAt || "").localeCompare(String((a as any)?.updatedAt || "")));
    res.json({ data: filtered });
  } catch (error: any) {
    console.error("Failed to list D1 products:", error);
    res.status(500).json({ error: error.message || "Failed to list D1 products" });
  }
});

app.get("/api/cms/scenarios", async (req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    await ensureD1Schema();
    const rows = await listD1CMSRecords<CMSScenario>("scenarios");
    const onlyPublished = String(req.query.onlyPublished || "").toLowerCase() === "1" || String(req.query.onlyPublished || "").toLowerCase() === "true";
    const filtered = onlyPublished ? rows.filter((item) => item?.status === "published") : rows;
    filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    res.json({ data: filtered });
  } catch (error: any) {
    console.error("Failed to list D1 scenarios:", error);
    res.status(500).json({ error: error.message || "Failed to list D1 scenarios" });
  }
});

app.get("/api/cms/evaluations", async (req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    await ensureD1Schema();
    const rows = await listD1CMSRecords<Evaluation>("evaluations");
    const onlyPublished = String(req.query.onlyPublished || "").toLowerCase() === "1" || String(req.query.onlyPublished || "").toLowerCase() === "true";
    const filtered = onlyPublished ? rows.filter((item) => item?.status === "published") : rows;
    filtered.sort((a, b) => String((b as any)?.updatedAt || "").localeCompare(String((a as any)?.updatedAt || "")));
    res.json({ data: filtered });
  } catch (error: any) {
    console.error("Failed to list D1 evaluations:", error);
    res.status(500).json({ error: error.message || "Failed to list D1 evaluations" });
  }
});

app.get("/api/cms/guides", async (req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    await ensureD1Schema();
    const rows = await listD1CMSRecords<Guide>("guides");
    const onlyPublished = String(req.query.onlyPublished || "").toLowerCase() === "1" || String(req.query.onlyPublished || "").toLowerCase() === "true";
    const filtered = onlyPublished ? rows.filter((item) => item?.status === "published") : rows;
    filtered.sort((a, b) => String((b as any)?.updatedAt || "").localeCompare(String((a as any)?.updatedAt || "")));
    res.json({ data: filtered });
  } catch (error: any) {
    console.error("Failed to list D1 guides:", error);
    res.status(500).json({ error: error.message || "Failed to list D1 guides" });
  }
});

app.get("/api/cms/news", async (req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    await ensureD1Schema();
    const rows = await listD1CMSRecords<News>("news");
    const onlyPublished = String(req.query.onlyPublished || "").toLowerCase() === "1" || String(req.query.onlyPublished || "").toLowerCase() === "true";
    const filtered = onlyPublished ? rows.filter((item) => item?.status === "published") : rows;
    filtered.sort((a, b) => String((b as any)?.updatedAt || "").localeCompare(String((a as any)?.updatedAt || "")));
    res.json({ data: filtered });
  } catch (error: any) {
    console.error("Failed to list D1 news:", error);
    res.status(500).json({ error: error.message || "Failed to list D1 news" });
  }
});

app.get("/api/cms/settings", async (_req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    await ensureD1Schema();
    const rows = await listD1CMSRecords<CMSSettings>("settings");
    const settings = rows.find((item) => item?.id === "global") || rows[0] || null;
    res.json({ data: settings });
  } catch (error: any) {
    console.error("Failed to read D1 settings:", error);
    res.status(500).json({ error: error.message || "Failed to read D1 settings" });
  }
});

app.post("/api/cms/init/categories", async (_req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    await ensureD1Schema();

    const categoriesResponse = await fetchWorkerJson<{ data: WorkerCategory[] }>("/api/v1/catalog/categories");
    const categories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [];

    const byCode = new Map<ProductCategory, CMSCategory>();
    for (const [index, item] of categories.entries()) {
      const mapped = buildCMSCategoryFromWorker(item, index);
      if (!byCode.has(mapped.code)) {
        byCode.set(mapped.code, mapped);
      }
    }

    const rows = Array.from(byCode.values());
    for (const row of rows) {
      await upsertD1CMSRecord("categories", row.id, row);
    }

    res.json({
      data: {
        total: rows.length,
      },
    });
  } catch (error: any) {
    console.error("Failed to initialize D1 categories:", error);
    res.status(500).json({ error: error.message || "Failed to initialize D1 categories" });
  }
});

app.post("/api/cms/categories/save", async (req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    const payload = (req.body || {}) as CMSCategory;
    if (!payload?.id) {
      res.status(400).json({ error: "Category payload with id is required." });
      return;
    }

    await ensureD1Schema();
    await upsertD1CMSRecord("categories", payload.id, {
      ...payload,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      data: {
        id: payload.id,
        saved: true,
      },
    });
  } catch (error: any) {
    console.error("Failed to save D1 category:", error);
    res.status(500).json({ error: error.message || "Failed to save D1 category" });
  }
});

app.post("/api/cms/categories/delete", async (req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    const id = String(req.body?.id || "").trim();
    if (!id) {
      res.status(400).json({ error: "Category id is required." });
      return;
    }

    await ensureD1Schema();
    await deleteD1CMSRecord("categories", id);

    res.json({
      data: {
        id,
        deleted: true,
      },
    });
  } catch (error: any) {
    console.error("Failed to delete D1 category:", error);
    res.status(500).json({ error: error.message || "Failed to delete D1 category" });
  }
});

app.post("/api/cms/scenarios/save", async (req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    const payload = (req.body || {}) as CMSScenario;
    if (!payload?.id) {
      res.status(400).json({ error: "Scenario payload with id is required." });
      return;
    }

    await ensureD1Schema();
    await upsertD1CMSRecord("scenarios", payload.id, {
      ...payload,
      updatedAt: new Date().toISOString(),
    });

    res.json({ data: { id: payload.id, saved: true } });
  } catch (error: any) {
    console.error("Failed to save D1 scenario:", error);
    res.status(500).json({ error: error.message || "Failed to save D1 scenario" });
  }
});

app.post("/api/cms/scenarios/delete", async (req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    const id = String(req.body?.id || "").trim();
    if (!id) {
      res.status(400).json({ error: "Scenario id is required." });
      return;
    }

    await ensureD1Schema();
    await deleteD1CMSRecord("scenarios", id);
    res.json({ data: { id, deleted: true } });
  } catch (error: any) {
    console.error("Failed to delete D1 scenario:", error);
    res.status(500).json({ error: error.message || "Failed to delete D1 scenario" });
  }
});

app.post("/api/cms/init/products", async (_req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    await ensureD1Schema();

    const payload = await buildAdminResourcePayload({ includeAll: true });
    const sourceRows = payload.products || [];
    let success = 0;

    for (const row of sourceRows) {
      const mapped = buildCMSProductFromResourceRow(row);
      await upsertD1CMSRecord("products", mapped.id, mapped);
      success += 1;
    }

    res.json({
      data: {
        total: sourceRows.length,
        success,
      },
    });
  } catch (error: any) {
    console.error("Failed to initialize D1 products:", error);
    res.status(500).json({ error: error.message || "Failed to initialize D1 products" });
  }
});

app.post("/api/cms/products/save", async (req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    const payload = (req.body || {}) as CMSProduct;
    if (!payload?.id) {
      res.status(400).json({ error: "Product payload with id is required." });
      return;
    }

    await ensureD1Schema();
    await upsertD1CMSRecord("products", payload.id, {
      ...payload,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      data: {
        id: payload.id,
        saved: true,
      },
    });
  } catch (error: any) {
    console.error("Failed to save D1 product:", error);
    res.status(500).json({ error: error.message || "Failed to save D1 product" });
  }
});

app.post("/api/cms/products/delete", async (req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    const id = String(req.body?.id || "").trim();
    if (!id) {
      res.status(400).json({ error: "Product id is required." });
      return;
    }

    await ensureD1Schema();
    await deleteD1CMSRecord("products", id);

    res.json({
      data: {
        id,
        deleted: true,
      },
    });
  } catch (error: any) {
    console.error("Failed to delete D1 product:", error);
    res.status(500).json({ error: error.message || "Failed to delete D1 product" });
  }
});

app.post("/api/cms/evaluations/save", async (req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    const payload = (req.body || {}) as Evaluation;
    if (!payload?.id) {
      res.status(400).json({ error: "Evaluation payload with id is required." });
      return;
    }

    await ensureD1Schema();
    await upsertD1CMSRecord("evaluations", payload.id, {
      ...payload,
      updatedAt: new Date().toISOString(),
    });
    res.json({ data: { id: payload.id, saved: true } });
  } catch (error: any) {
    console.error("Failed to save D1 evaluation:", error);
    res.status(500).json({ error: error.message || "Failed to save D1 evaluation" });
  }
});

app.post("/api/cms/evaluations/delete", async (req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    const id = String(req.body?.id || "").trim();
    if (!id) {
      res.status(400).json({ error: "Evaluation id is required." });
      return;
    }

    await ensureD1Schema();
    await deleteD1CMSRecord("evaluations", id);
    res.json({ data: { id, deleted: true } });
  } catch (error: any) {
    console.error("Failed to delete D1 evaluation:", error);
    res.status(500).json({ error: error.message || "Failed to delete D1 evaluation" });
  }
});

app.post("/api/cms/guides/save", async (req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    const payload = (req.body || {}) as Guide;
    if (!payload?.id) {
      res.status(400).json({ error: "Guide payload with id is required." });
      return;
    }

    await ensureD1Schema();
    await upsertD1CMSRecord("guides", payload.id, {
      ...payload,
      updatedAt: new Date().toISOString(),
    });
    res.json({ data: { id: payload.id, saved: true } });
  } catch (error: any) {
    console.error("Failed to save D1 guide:", error);
    res.status(500).json({ error: error.message || "Failed to save D1 guide" });
  }
});

app.post("/api/cms/guides/delete", async (req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    const id = String(req.body?.id || "").trim();
    if (!id) {
      res.status(400).json({ error: "Guide id is required." });
      return;
    }

    await ensureD1Schema();
    await deleteD1CMSRecord("guides", id);
    res.json({ data: { id, deleted: true } });
  } catch (error: any) {
    console.error("Failed to delete D1 guide:", error);
    res.status(500).json({ error: error.message || "Failed to delete D1 guide" });
  }
});

app.post("/api/cms/news/save", async (req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    const payload = (req.body || {}) as News;
    if (!payload?.id) {
      res.status(400).json({ error: "News payload with id is required." });
      return;
    }

    await ensureD1Schema();
    await upsertD1CMSRecord("news", payload.id, {
      ...payload,
      updatedAt: new Date().toISOString(),
    });
    res.json({ data: { id: payload.id, saved: true } });
  } catch (error: any) {
    console.error("Failed to save D1 news:", error);
    res.status(500).json({ error: error.message || "Failed to save D1 news" });
  }
});

app.post("/api/cms/news/delete", async (req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    const id = String(req.body?.id || "").trim();
    if (!id) {
      res.status(400).json({ error: "News id is required." });
      return;
    }

    await ensureD1Schema();
    await deleteD1CMSRecord("news", id);
    res.json({ data: { id, deleted: true } });
  } catch (error: any) {
    console.error("Failed to delete D1 news:", error);
    res.status(500).json({ error: error.message || "Failed to delete D1 news" });
  }
});

app.post("/api/chat", async (req, res) => {
  res.status(501).json({
    error: "Google-based AI endpoint has been disabled.",
    details: "Only Google login is retained. Use Cloudflare-backed CMS/data APIs for content workflows.",
  });
});

app.post("/api/cms/settings/save", async (req, res) => {
  try {
    if (!hasD1Config()) {
      res.status(503).json({ error: "D1 is not configured." });
      return;
    }
    const payload = (req.body || {}) as CMSSettings;
    const id = String(payload?.id || "global").trim() || "global";

    await ensureD1Schema();
    await upsertD1CMSRecord("settings", id, {
      ...payload,
      id,
      updatedAt: new Date().toISOString(),
    });
    res.json({ data: { id, saved: true } });
  } catch (error: any) {
    console.error("Failed to save D1 settings:", error);
    res.status(500).json({ error: error.message || "Failed to save D1 settings" });
  }
});

import { storageAdapter } from "./lib/storage/index.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Local storage upload handling
const getDirname = () => {
  try {
    if (typeof __dirname !== 'undefined') return __dirname;
    // @ts-ignore
    return path.dirname(fileURLToPath(import.meta.url));
  } catch (e) {
    return process.cwd();
  }
};
const UPLOADS_DIR = path.join(getDirname(), "../../uploads");

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Create nested directories if they don't exist
      const key = req.query.key as string;
      if (!key) return cb(new Error("Key is required"), UPLOADS_DIR);
      
      const dir = path.dirname(path.join(UPLOADS_DIR, key));
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (e) {
        console.warn("Could not create nested directory:", e);
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const key = req.query.key as string;
      const fileName = path.basename(key);
      cb(null, fileName);
    }
  })
});

// Asset endpoints
app.post("/api/assets/presign", async (req, res) => {
  try {
    const { key, contentType } = req.body;
    if (!key) return res.status(400).json({ error: "Missing key" });
    const urls = await storageAdapter.getUploadUrl(key, contentType);
    res.json(urls);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/assets/upload-local", upload.single("file"), (req, res) => {
  res.json({ success: true });
});

app.delete("/api/assets", async (req, res) => {
  try {
    const { key } = req.query;
    if (!key || typeof key !== 'string') return res.status(400).json({ error: "Missing key" });
    
    await storageAdapter.deleteAsset(key);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { app };
