import type { CMSProduct, CMSSettings, Evaluation, ProductScoringStandard, ScrapedEvidenceItem } from "../types";

export interface ContentBundle {
  settings: CMSSettings | null;
  products: CMSProduct[];
  evaluations: Evaluation[];
}

const DEFAULT_SCRAPE_API_BASE_URL = "https://kidsmobi-api-v1.seaman-player.workers.dev";
const CATEGORY_COMPLIANCE: Record<string, string[]> = {
  balance_bike: ["ASTM F963", "CPSC"],
  kids_bikes: ["CPSC"],
  kids_tricycles: ["ASTM F963"],
  scooters: ["ASTM F963", "CPSC"],
  electric_vehicles: ["ASTM F963", "CPSC"],
  car_seat: ["CPC", "CE"],
  stroller: ["EN1888"],
  double_stroller: ["EN1888"],
  jogger_stroller: ["EN1888"],
};

type WorkerCategory = {
  categoryId: string;
  name: string;
  defaultLimit?: number;
};

type WorkerProduct = {
  productId: string;
  categoryId: string;
  rank?: number;
  title?: string;
  brand?: string;
  price?: { value?: number };
  weight?: { lbs?: number };
  rating?: { display?: string; value?: number };
  reviews?: { display?: string; count?: number };
  userRating?: number;
  reviewCount?: number;
  customers_say?: string;
  customersSay?: string;
  Product_Specifications?: Record<string, any>;
  coverImage?: string;
  galleryUrls?: string[];
  classification?: Record<string, string>;
  featureCards?: Array<{ featureLabel?: string; featureValue?: string }>;
  categoryAttributes?: { features?: string[]; wheelSize?: string[] };
};

function getScrapeApiBaseUrl() {
  const configured = String(import.meta.env.VITE_SCRAPE_API_BASE_URL || "").trim();
  const fallback = DEFAULT_SCRAPE_API_BASE_URL;
  const candidate = (configured || fallback).replace(/\/+$/, "");

  // In deployed environments, never use localhost API bases.
  if (typeof window !== "undefined") {
    const pageHost = window.location.hostname.toLowerCase();
    const isOnlineHost = !["localhost", "127.0.0.1", "::1"].includes(pageHost);
    if (isOnlineHost) {
      try {
        const parsed = new URL(candidate);
        const apiHost = parsed.hostname.toLowerCase();
        if (["localhost", "127.0.0.1", "::1"].includes(apiHost)) {
          return fallback;
        }
      } catch {
        return fallback;
      }
    }
  }

  return candidate;
}

function buildWorkerUrl(pathname: string) {
  return `${getScrapeApiBaseUrl()}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

function normalizeProductCategory(categoryId: string): CMSProduct["category"] {
  switch (categoryId) {
    case "balance_bike":
      return "balance";
    case "kids_bikes":
      return "bicycle";
    case "kids_tricycles":
      return "tricycle";
    case "scooters":
      return "scooter";
    case "electric_vehicles":
      return "electric_car";
    case "car_seat":
      return "safety_seat";
    default:
      return "stroller";
  }
}

function mapHeightRange(categoryId: string): [number, number] {
  switch (categoryId) {
    case "balance_bike":
      return [70, 120];
    case "kids_bikes":
      return [90, 155];
    case "kids_tricycles":
      return [70, 130];
    case "scooters":
      return [80, 140];
    case "electric_vehicles":
      return [90, 150];
    case "car_seat":
      return [45, 135];
    default:
      return [50, 110];
  }
}

function parseWheelSize(title: string, classification: Record<string, string>, attrs?: { wheelSize?: string[] }): string {
  const explicit = [classification.Wheel_Size, classification.Wheel_Diameter, attrs?.wheelSize?.[0]]
    .map((item) => String(item || "").trim())
    .find((item) => item && item.toLowerCase() !== "unknown" && item.toLowerCase() !== "n/a");
  if (explicit) {
    return explicit;
  }

  const match = String(title || "").match(/(\d{1,2}(?:\.\d+)?)\s*(?:inch|inches|\")/i);
  if (match) {
    return `${match[1]} in`;
  }

  const wheelConfig = String(classification.Wheel_Configuration || "").trim();
  if (/^\d$/.test(wheelConfig)) {
    return `${wheelConfig}-wheel`;
  }
  return "N/A";
}

function inferMaterial(text: string): string {
  const source = text.toLowerCase();
  if (/carbon|碳/.test(source)) return "Carbon Fiber";
  if (/aluminum|aluminium|铝/.test(source)) return "Aluminum";
  if (/steel|stainless|碳钢|钢/.test(source)) return "Steel";
  if (/magnesium|镁/.test(source)) return "Magnesium Alloy";
  if (/plastic|树脂|abs|pp\b/.test(source)) return "Engineering Plastic";
  return "N/A";
}

function inferTireType(text: string): string {
  const source = text.toLowerCase();
  if (/pneumatic|air[- ]?filled|inflatable|充气/.test(source)) return "Pneumatic";
  if (/honeycomb/.test(source)) return "Honeycomb Solid";
  if (/eva/.test(source)) return "EVA Solid";
  if (/pu\b|polyurethane/.test(source)) return "PU";
  if (/rubber|橡胶/.test(source)) return "Rubber";
  if (/solid/.test(source)) return "Solid";
  return "N/A";
}

function inferBrakeType(text: string): string {
  const source = text.toLowerCase();
  if (/disc brake|碟刹/.test(source)) return "Disc Brake";
  if (/hand brake|手刹/.test(source)) return "Hand Brake";
  if (/coaster|倒刹/.test(source)) return "Coaster Brake";
  if (/foot brake|脚刹|rear fender brake/.test(source)) return "Foot Brake";
  if (/electronic brake|e-?brake/.test(source)) return "Electronic Brake";
  if (/5[- ]?point|5 point/.test(source)) return "5-Point Harness";
  if (/3[- ]?point|3 point/.test(source)) return "3-Point Harness";
  return "N/A";
}

function formatSpecsLabel(key: string): string {
  return String(key || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function buildWorkerSpecsText(item: WorkerProduct): string {
  const classification = item.classification || {};
  const attrs = item.categoryAttributes || {};
  const featureSignals = [
    classification.User_Age,
    classification.Wheel_Size,
    classification.Harness_Type,
    classification.Brake,
    classification.Seat_Material,
    classification.Frame_Material,
    classification.Canopy_Material,
    classification.Storage,
  ]
    .map((value) => String(value || "").trim())
    .filter((value) => value && value.toLowerCase() !== "unknown" && value.toLowerCase() !== "n/a");

  const featureCards = Array.isArray(item.featureCards)
    ? item.featureCards
        .map((feature) => String(feature?.featureLabel || feature?.featureValue || "").trim())
        .filter(Boolean)
        .slice(0, 4)
    : [];

  const attrSignals = [
    ...(attrs.features || []).slice(0, 4),
    ...(attrs.wheelSize || []).slice(0, 2),
  ].map((value) => String(value || "").trim()).filter(Boolean);

  const parts: string[] = [];
  if (featureSignals.length) {
    parts.push(`Specs: ${featureSignals.map((value, index) => `${formatSpecsLabel(["Age Range", "Wheel Size", "Harness Type", "Brake", "Seat Material", "Frame Material", "Canopy Material", "Storage"][index] || "Spec")} ${value}`).join("; ")}`);
  }
  if (attrSignals.length) {
    parts.push(`Signals: ${attrSignals.join("; ")}`);
  }
  if (featureCards.length) {
    parts.push(`Features: ${featureCards.join("; ")}`);
  }

  return parts.join(" | ").replace(/\s+/g, " ").trim() || `Category: ${item.categoryId}`;
}

function buildWorkerProductSpecifications(item: WorkerProduct): Record<string, any> {
  const classification = item.classification || {};
  const attrs = item.categoryAttributes || {};
  const featureCards = Array.isArray(item.featureCards)
    ? item.featureCards
        .map((feature) => String(feature?.featureLabel || feature?.featureValue || "").trim())
        .filter(Boolean)
        .slice(0, 6)
    : [];

  const safeText = (value: unknown) => String(value || "").trim() || "N/A";

  return {
    Measurements: {
      "Item Weight": item.weight?.lbs ? `${item.weight.lbs} Pounds` : "N/A",
      "Price": item.price?.value ? `$${Number(item.price.value).toFixed(2)}` : "N/A",
    },
    Features_Specs: {
      "Brand": safeText(item.brand || classification.Brand),
      "Category": safeText(item.categoryId),
      "Age Range": safeText(classification.User_Age),
      "Wheel Size": safeText(classification.Wheel_Size),
      "Harness Type": safeText(classification.Harness_Type),
      "Brake": safeText(classification.Brake),
      "Frame Material": safeText(classification.Frame_Material),
      "Seat Material": safeText(classification.Seat_Material),
    },
    Materials_Care: {
      "Material": safeText(classification.Material),
      "Canopy Material": safeText(classification.Canopy_Material),
      "Tire": safeText(classification.Tire),
    },
    Item_Details: {
      "Brand": safeText(item.brand || classification.Brand),
      "Title": safeText(item.title),
      "Product ID": safeText(item.productId),
      "Storage": safeText(classification.Storage),
      "Features": featureCards.length ? featureCards.join(" | ") : "N/A",
    },
    Category_Attributes: {
      ...attrs,
      features: attrs.features || [],
      wheelSize: attrs.wheelSize || [],
    },
    Product_Display_Fields: {
      ageRange: {
        value: safeText(classification.User_Age),
        source: "classification.User_Age",
      },
      wheelSize: {
        value: safeText(classification.Wheel_Size),
        source: "classification.Wheel_Size",
      },
      harnessType: {
        value: safeText(classification.Harness_Type),
        source: "classification.Harness_Type",
      },
      frameMaterial: {
        value: safeText(classification.Frame_Material),
        source: "classification.Frame_Material",
      },
      storage: {
        value: safeText(classification.Storage),
        source: "classification.Storage",
      },
    },
  };
}

function normalizeCompliance(categoryId: string, classification: Record<string, string>): string[] {
  const out: string[] = [];
  const raw = String(classification.Certifications || "").trim();
  if (raw) {
    for (const token of raw.split(/[+,/|;]/)) {
      const value = token.trim();
      if (value && value.toLowerCase() !== "unknown" && !out.includes(value)) {
        out.push(value);
      }
    }
  }

  for (const item of CATEGORY_COMPLIANCE[categoryId] || []) {
    if (!out.includes(item)) {
      out.push(item);
    }
  }
  return out.slice(0, 5);
}

function buildRuntimeFallbackScoringStandards(
  item: WorkerProduct,
  features: string[],
  compliance: string[]
): ProductScoringStandard[] {
  const classification = item.classification || {};
  const ratingValue = Number(item.rating?.value ?? item.userRating ?? 4.2);

  const safetyEvidence: ScrapedEvidenceItem[] = [
    {
      source: "Safety",
      text: `Compliance: ${(compliance.length ? compliance : ["Pending source verification"]).join(", ")}`,
    },
    {
      source: "Harness",
      text: `Harness type: ${String(classification.Harness_Type || "Not specified")}`,
    },
  ];

  const comfortEvidence: ScrapedEvidenceItem[] = [
    {
      source: "Wheel",
      text: `Wheel size: ${String(classification.Wheel_Size || "Not specified")}`,
    },
    {
      source: "Feature",
      text: `Comfort signals: ${(features.length ? features : ["Suspension and seat comfort need editorial enrichment"]).slice(0, 2).join("; ")}`,
    },
  ];

  const portabilityEvidence: ScrapedEvidenceItem[] = [
    {
      source: "Weight",
      text: item.weight?.lbs ? `Item weight: ${Number(item.weight.lbs).toFixed(1)} lbs` : "Weight data pending source confirmation",
    },
    {
      source: "Rating",
      text: `User rating baseline: ${Number.isFinite(ratingValue) ? ratingValue.toFixed(1) : "4.2"}/5`,
    },
  ];

  return [
    {
      key: "safety",
      label: "Safety First",
      parentTip: "Check compliance and restraint details first, then evaluate structural stability.",
      evidence: safetyEvidence,
    },
    {
      key: "comfort",
      label: "Riding Comfort",
      parentTip: "Focus on seat support, wheel setup, and whether the feature set matches daily usage.",
      evidence: comfortEvidence,
    },
    {
      key: "portability",
      label: "Light & Easy",
      parentTip: "Weight and fold convenience matter most for commuting and travel-heavy families.",
      evidence: portabilityEvidence,
    },
  ];
}

function toCMSProduct(item: WorkerProduct): CMSProduct {
  const classification = item.classification || {};
  const attrs = item.categoryAttributes;
  const name = String(item.title || item.productId || "Unnamed Product").trim();
  const brand = String(item.brand || classification.Brand || "Unknown").trim() || "Unknown";
  const signalText = [
    name,
    String(classification.Bike_Type || ""),
    String(classification.Scooter_Type || ""),
    String(classification.Braking_System || ""),
    String(classification.Harness_Type || ""),
    ...((attrs?.features || []).slice(0, 8)),
  ].join(" ");

  const compliance = normalizeCompliance(item.categoryId, classification);
  const features = Array.isArray(item.featureCards)
    ? item.featureCards
        .map((feature) => String(feature?.featureLabel || feature?.featureValue || "").trim())
        .filter(Boolean)
        .slice(0, 4)
    : (attrs?.features || []).slice(0, 4);
  const scoringStandards = buildRuntimeFallbackScoringStandards(item, features, compliance);
  const updatedAt = new Date().toISOString();
  const customersSay = String(item.customers_say || item.customersSay || "").trim();
  const ratingValue = item.rating?.value ?? item.userRating;
  const reviewCount = item.reviews?.count ?? item.reviewCount;
  const fallbackVerdict = `${brand} ${name} loaded from remote worker fallback for product category continuity.`;
  const zhFallbackVerdict = `${brand} ${name} 已通过远端回退链路加载。`;
  const enFallbackVerdict = `${brand} ${name} loaded through remote fallback path.`;
  const productSpecifications = item.Product_Specifications || buildWorkerProductSpecifications(item);

  return {
    id: item.productId,
    name,
    brand,
    category: normalizeProductCategory(item.categoryId),
    categoryId: item.categoryId,
    wheelSize: parseWheelSize(name, classification, attrs),
    weight: Number(item.weight?.lbs || 0),
    material: inferMaterial(signalText),
    brakeType: inferBrakeType(signalText),
    tireType: inferTireType(signalText),
    price: Number(item.price?.value || 0),
    ageRange: String(classification.User_Age || "0-8 years"),
    heightRange: mapHeightRange(item.categoryId),
    compliance: compliance as CMSProduct["compliance"],
    imageUrl: String(item.coverImage || "").trim(),
    galleryUrls: Array.isArray(item.galleryUrls) ? item.galleryUrls.filter(Boolean).slice(0, 6) : [],
    features,
    scenarios: [item.categoryId],
    relatedProductIds: [],
    status: "published",
    overallScore: Math.max(6.5, Math.min(10, Number(ratingValue || 4.2) * 1.9)),
    safetyScore: Math.max(6.5, Math.min(10, Number(ratingValue || 4.2) * 1.9)),
    weightScore: item.weight?.lbs ? Math.max(6.5, Math.min(10, 10 - Number(item.weight.lbs) / 8)) : 8.0,
    geometryScore: item.rank ? Math.max(7.0, Math.min(9.8, 9.6 - Number(item.rank) * 0.08)) : 8.6,
    scoringStandards,
    pros: features.slice(0, 3),
    cons: ["Auto-generated runtime fallback from worker API"],
    customers_say: customersSay,
    customersSay,
    specsText: buildWorkerSpecsText(item),
    Product_Specifications: productSpecifications,
    rating: item.rating,
    reviews: item.reviews,
    userRating: ratingValue,
    reviewCount,
    editorVerdict: customersSay || fallbackVerdict,
    zh: {
      name,
      description: `${brand} ${name} 由远端数据回退生成。`,
      customersSay,
      brandText: brand,
      specsText: buildWorkerSpecsText(item),
      Product_Specifications: productSpecifications,
      pros: features.slice(0, 3),
      cons: ["运行态回退数据，建议在 CMS 中继续补充"],
      editorVerdict: customersSay || zhFallbackVerdict,
    },
    en: {
      name,
      description: `${brand} ${name} generated from remote fallback.`,
      customersSay,
      brandText: brand,
      specsText: buildWorkerSpecsText(item),
      Product_Specifications: productSpecifications,
      pros: features.slice(0, 3),
      cons: ["Runtime fallback data, enrich in CMS if needed"],
      editorVerdict: customersSay || enFallbackVerdict,
    },
    updatedAt,
  };
}

function buildFallbackEvaluations(products: CMSProduct[]): Evaluation[] {
  const byCategory = new Map<string, CMSProduct[]>();
  for (const product of products) {
    const categoryId = String((product as any).categoryId || product.category || "unknown");
    if (!byCategory.has(categoryId)) {
      byCategory.set(categoryId, []);
    }
    byCategory.get(categoryId)!.push(product);
  }

  const evaluations: Evaluation[] = [];
  for (const [categoryId, list] of byCategory.entries()) {
    const lead = list[0];
    if (!lead) continue;
    evaluations.push({
      id: `remote-${categoryId}-${lead.id}`,
      type: "single",
      productId: lead.id,
      productIds: [lead.id],
      status: "published",
      version: "V1.0",
      scores: {
        safety: lead.safetyScore || 8.5,
        comfort: lead.geometryScore || 8.3,
        portability: lead.weightScore || 8.1,
        features: lead.overallScore || 8.2,
        valueForMoney: Math.max(6.5, Math.min(9.6, 9.4 - (lead.price || 0) / 140)),
      },
      imageUrl: lead.imageUrl || "",
      zh: {
        title: `${lead.name} 分类预览评测`,
        verdict: lead.editorVerdict || "远端回退链路生成的分类评测。",
        pros: lead.pros || [],
        cons: lead.cons || [],
        changelog: "Generated from remote fallback content source",
      },
      en: {
        title: `${lead.name} category preview review`,
        verdict: lead.editorVerdict || "Generated from remote fallback content source.",
        pros: lead.pros || [],
        cons: lead.cons || [],
        changelog: "Generated from remote fallback content source",
      },
      updatedAt: new Date().toISOString(),
    });
  }

  return evaluations;
}

async function fetchWorkerJson<T>(pathCandidates: string[]): Promise<T> {
  let lastError: Error | null = null;

  for (const candidate of pathCandidates) {
    try {
      const response = await fetch(buildWorkerUrl(candidate), {
        headers: {
          Accept: "application/json",
        },
      });
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Worker request failed (${response.status})${body ? `: ${body}` : ""}`);
      }
      return (await response.json()) as T;
    } catch (error: any) {
      lastError = error;
    }
  }

  throw lastError || new Error("Worker request failed for all candidates");
}

async function fetchRemoteFallbackBundle(): Promise<ContentBundle> {
  const categoriesPayload = await fetchWorkerJson<{ data?: WorkerCategory[] }>([
    "/api/v2/catalog/categories?withStats=true",
    "/api/v1/catalog/categories?withStats=true",
  ]);

  const categories = (categoriesPayload.data || []).slice(0, 12);
  if (categories.length === 0) {
    return { settings: null, products: [], evaluations: [] };
  }

  const workerProductsNested = await Promise.all(
    categories.map(async (category) => {
      const limit = Math.min(12, Math.max(1, Number(category.defaultLimit || 8)));
      const payload = await fetchWorkerJson<{ data?: WorkerProduct[] }>([
        `/api/v2/products?categoryId=${encodeURIComponent(category.categoryId)}&page=1&pageSize=${limit}`,
        `/api/v1/products?categoryId=${encodeURIComponent(category.categoryId)}&page=1&pageSize=${limit}`,
      ]);
      return Array.isArray(payload.data) ? payload.data : [];
    })
  );

  const products = workerProductsNested
    .flat()
    .map((item) => toCMSProduct(item))
    .filter((item, index, array) => array.findIndex((next) => next.id === item.id) === index);

  return {
    settings: null,
    products,
    evaluations: buildFallbackEvaluations(products),
  };
}

export function isScrapedContentSource(): boolean {
  return (import.meta.env.VITE_CONTENT_SOURCE ?? "cms").toLowerCase() === "scraped";
}

function shouldUseLocalBundleEndpoint(): boolean {
  const host = (typeof window !== "undefined" && window.location?.hostname) || "";
  // /api/content/bundle is provided by the local/front server aggregator.
  // In online static/worker-hosted environments this route commonly does not exist.
  return host === "localhost" || host === "127.0.0.1";
}

export async function fetchContentBundle(): Promise<ContentBundle> {
  if (!shouldUseLocalBundleEndpoint()) {
    return fetchRemoteFallbackBundle();
  }

  try {
    const response = await fetch("/api/content/bundle", {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      const suffix = details ? `: ${details}` : "";
      throw new Error(`Content bundle request failed (${response.status}${suffix})`);
    }

    const payload = (await response.json()) as Partial<ContentBundle>;
    return {
      settings: payload.settings ?? null,
      products: Array.isArray(payload.products) ? payload.products : [],
      evaluations: Array.isArray(payload.evaluations) ? payload.evaluations : [],
    };
  } catch (error) {
    console.warn("Primary /api/content/bundle fetch failed, trying remote worker fallback.", error);
    return fetchRemoteFallbackBundle();
  }
}