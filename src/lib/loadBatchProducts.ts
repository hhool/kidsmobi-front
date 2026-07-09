import { Product, ProductCategory, ProductScoringStandard, ScrapedEvidenceItem } from "../types";

/**
 * Maps category folder names to ProductCategory types
 */
const CATEGORY_FOLDER_TO_TYPE: Record<string, ProductCategory> = {
  balance_bike: "balance",
  kids_bikes: "bicycle",
  scooters: "scooter",
  stroller: "stroller",
  strollers: "stroller",
  double_stroller: "stroller",
  double_strollers: "stroller",
  jogger_stroller: "stroller",
  jogger_strollers: "stroller",
  electric_vehicles: "electric_car",
  kids_tricycles: "tricycle",
  car_seat: "safety_seat",
  baby_carrier: "stroller",
  high_chair: "stroller",
  playard: "stroller",
};

/**
 * Maps report file names to category folder names
 */
const REPORT_FILE_TO_CATEGORY: Record<string, string> = {
  "balance_bike_report.json": "balance_bike",
  "kids_bikes_report.json": "kids_bikes",
  "scooters_report.json": "scooters",
  "strollers_report.json": "stroller",
  "electric_vehicles_report.json": "electric_vehicles",
  "kids_tricycles_report.json": "kids_tricycles",
  "car_seat_report.json": "car_seat",
  "baby_carrier_report.json": "baby_carrier",
  "high_chair_report.json": "high_chair",
  "playard_report.json": "playard",
};

const REPORT_DATA_VERSION = "20260709-customer-say-all-categories";
const STORE_MEDIA_ORIGIN = "https://store.poki2.online";
const AGE_RANGE_NEEDS_SOURCE_CONFIRMATION = "Confirm from source";

interface RawProduct {
  Rank?: string;
  Brand?: string;
  Title?: string;
  Price?: string;
  Rating?: string;
  Reviews?: string;
  customers_say?: string;
  customersSay?: string;
  Customers_Say?: string;
  Customer_Summary?: string;
  Review_Summary?: string;
  Local_Image_Path?: string;
  Local_Image_Paths?: string[];
  Local_Video_Paths?: string[];
  Product_Videos?: any[];
  Product_Videos_Detail?: any[];
  Product_Videos_MP4?: any;
  Product_Videos_M3U8?: any;
  Product_Description?: string;
  Category_Attributes?: Record<string, string>;
  Product_Specifications?: Record<string, any>;
  Product_Display_Fields?: Record<string, { value?: unknown; source?: unknown }>;
  Scoring_Standards_Logic?: Record<string, any>;
  Parent_Tips?: Record<string, string>;
  Expert_Review_Inputs?: {
    evidenceHighlights?: Array<{ source?: unknown; text?: unknown }>;
    title?: string;
    brand?: string;
  };
  ASIN?: string;
  [key: string]: any;
}

function normalizeReportMediaUrl(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const text = raw.trim().replace(/\\/g, "/");
  if (!text) return "";
  const lower = text.toLowerCase();
  if (lower.startsWith("about:blank") || lower.includes("external-url-removed")) return "";
  if (/^https?:\/\//i.test(text) || text.startsWith("data:")) return text;

  const marker = "scrape_store/";
  const markerIndex = text.indexOf(marker);
  const mediaPath = markerIndex >= 0 ? text.slice(markerIndex + marker.length) : text.replace(/^\.\.\/+/, "").replace(/^\/+/, "");
  return `${STORE_MEDIA_ORIGIN}/${mediaPath.split("/").map((part) => encodeURIComponent(part)).join("/")}`;
}

function extractStringList(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap((item) => extractStringList(item));
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return [
      record.url,
      record.Url,
      record.URL,
      record.Video_URL,
      record.video_url,
      record.videoUrl,
      record.Local_Video_Path,
      record.Local_Video_Paths,
    ].flatMap((item) => extractStringList(item));
  }
  return [];
}

function dedupeMediaUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    const normalized = normalizeReportMediaUrl(url);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

/**
 * Parse weight from string format like "25.6 Pounds" or "11.6 kg"
 */
function parseWeight(weightStr: string | undefined): number {
  if (!weightStr) return 0;
  const match = weightStr.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

/**
 * Extract primary image URL
 */
function extractImageUrl(product: RawProduct): string {
  // Try Local_Image_Path first
  if (product.Local_Image_Path) {
    return normalizeReportMediaUrl(product.Local_Image_Path);
  }
  // Try first item in Local_Image_Paths array
  if (Array.isArray(product.Local_Image_Paths) && product.Local_Image_Paths.length > 0) {
    return normalizeReportMediaUrl(product.Local_Image_Paths[0]);
  }
  // Try Listing_Image_URL from scrape data
  if (product.Listing_Image_URL) {
    return normalizeReportMediaUrl(product.Listing_Image_URL);
  }
  return "";
}

/**
 * Extract image gallery URLs
 */
function extractGalleryUrls(product: RawProduct): string[] {
  if (Array.isArray(product.Local_Image_Paths)) {
    return dedupeMediaUrls(product.Local_Image_Paths).slice(0, 10); // Limit to 10 images
  }
  if (product.Local_Image_Path) {
    return dedupeMediaUrls([product.Local_Image_Path]);
  }
  return [];
}

function extractProductVideos(product: RawProduct): { url: string; title?: string; source: "scraped"; order: number }[] {
  const urls = dedupeMediaUrls([
    ...extractStringList(product.Local_Video_Paths),
    ...extractStringList(product.Product_Videos),
    ...extractStringList(product.Product_Videos_Detail),
    ...extractStringList(product.Product_Videos_MP4),
  ]).filter((url) => !/\.m3u8(\?|#|$)/i.test(url));

  return urls.map((url, index) => ({
    url,
    title: `product-video-${index + 1}`,
    source: "scraped" as const,
    order: index,
  }));
}

/**
 * Extract age range from category attributes
 */
function normalizeAgeCandidate(value: unknown): string {
  if (typeof value !== "string") return "";
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (/^(all\s*ages?|all)$/i.test(text)) return "";
  if (/^(n\/?a|na|unknown|not specified|unspecified|null|none)$/i.test(text)) return "";
  return text;
}

function extractAgeRange(product: RawProduct, attrs: Record<string, string> | undefined): string {
  const candidates = [
    attrs?.["Age Range Description"],
    attrs?.["Age Range"],
    attrs?.["Manufacturer recommended age"],
    attrs?.["Manufacturer Recommended Age"],
    attrs?.["Target Age Range"],
    attrs?.["Recommended Uses For Product"],
    product.Age_Range,
    product.AgeRange,
    product.age_range,
    product.ageRange,
    product.Recommended_Age,
    product.recommended_age,
    product.Manufacturer_Recommended_Age,
    product.Target_Age,
  ];
  const confirmed = candidates.map(normalizeAgeCandidate).find(Boolean);
  return confirmed || AGE_RANGE_NEEDS_SOURCE_CONFIRMATION;
}

/**
 * Extract weight from specifications in various formats
 */
function extractWeight(specs: Record<string, any> | undefined): number {
  if (!specs) return 0;
  
  // Try to find weight in Measurements
  const measurements = specs["Measurements"];
  if (measurements && typeof measurements === "object") {
    const itemWeight = measurements["Item Weight"];
    if (itemWeight) return parseWeight(itemWeight);
  }
  
  return 0;
}

/**
 * Extract material from category attributes or specifications
 */
function extractMaterial(attrs: Record<string, string> | undefined, specs: Record<string, any> | undefined): string {
  if (attrs?.["Frame Material"]) return attrs["Frame Material"];
  if (attrs?.["Material"]) return attrs["Material"];
  if (specs?.["Materials_Care"]?.["Material"]) return specs["Materials_Care"]["Material"];
  if (specs?.["Materials_Care"]?.["Frame Material"]) return specs["Materials_Care"]["Frame Material"];
  return "N/A";
}

/**
 * Extract tire type
 */
function extractTireType(attrs: Record<string, string> | undefined, specs: Record<string, any> | undefined): string {
  if (attrs?.["Tire Type"]) return attrs["Tire Type"];
  if (specs?.["Measurements"]?.["Tire Type"]) return specs["Measurements"]["Tire Type"];
  return "N/A";
}

/**
 * Extract brake type
 */
function extractBrakeType(attrs: Record<string, string> | undefined, specs: Record<string, any> | undefined): string {
  if (attrs?.["Brake Type"]) return attrs["Brake Type"];
  if (specs?.["Item_Details"]?.["Brake"]) return specs["Item_Details"]["Brake"];
  return "N/A";
}

/**
 * Extract wheel size
 */
function extractWheelSize(attrs: Record<string, string> | undefined): string {
  if (attrs?.["Wheel Size"]) return attrs["Wheel Size"];
  if (attrs?.["Number of Wheels"]) return attrs["Number of Wheels"];
  return "N/A";
}

/**
 * Parse price string like "$273.59" to number
 */
function parsePrice(priceStr: string | undefined): number {
  if (!priceStr) return 0;
  const match = priceStr.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

function parseRating(ratingStr: string | undefined): number | undefined {
  if (!ratingStr) return undefined;
  const match = ratingStr.match(/\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const rating = parseFloat(match[0]);
  return Number.isFinite(rating) ? rating : undefined;
}

function parseReviewCount(reviewStr: string | undefined): number | undefined {
  if (!reviewStr) return undefined;
  const matches = reviewStr.match(/\(?([\d,]{2,})\)?/g) || reviewStr.match(/\d+/g);
  const last = matches?.at(-1)?.replace(/[(),]/g, "");
  const count = last ? parseInt(last, 10) : NaN;
  return Number.isFinite(count) ? count : undefined;
}

function extractCustomerReviewText(specs: Record<string, any> | undefined): string {
  const itemDetails = specs?.["Item_Details"];
  if (itemDetails && typeof itemDetails === "object") {
    return String(itemDetails["Customer Reviews"] || itemDetails["Customer_Reviews"] || "").trim();
  }
  return "";
}

function buildCustomersSay(rating: number | undefined, reviewCount: number | undefined): string {
  if (rating !== undefined && reviewCount) {
    return `Rated ${rating.toFixed(1)} out of 5 from ${reviewCount.toLocaleString()} customer reviews.`;
  }
  if (rating !== undefined) {
    return `Rated ${rating.toFixed(1)} out of 5 by customers.`;
  }
  if (reviewCount) {
    return `Backed by ${reviewCount.toLocaleString()} customer reviews.`;
  }
  return "";
}

function pickExplicitCustomersSay(rawProduct: RawProduct): string {
  return String(
    rawProduct.customers_say ||
    rawProduct.customersSay ||
    rawProduct.Customers_Say ||
    rawProduct.Customer_Summary ||
    rawProduct.Review_Summary ||
    ""
  ).trim();
}

function cleanEvidenceText(value: unknown): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/^Parent's Tip:\s*/i, "")
    .trim();
}

function truncateEvidence(value: unknown, max = 180): string {
  const text = cleanEvidenceText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}...`;
}

function pushEvidence(out: ScrapedEvidenceItem[], source: unknown, text: unknown) {
  const sourceText = String(source || "Scraped content").trim();
  const evidenceText = truncateEvidence(text);
  if (!evidenceText) return;
  const key = `${sourceText}:${evidenceText}`.toLowerCase();
  if (out.some((item) => `${item.source}:${item.text}`.toLowerCase() === key)) return;
  out.push({ source: sourceText, text: evidenceText });
}

function extractFeatureEvidence(rawProduct: RawProduct): ScrapedEvidenceItem[] {
  const features = String(rawProduct.Features || "").split("|").map((item) => item.trim()).filter(Boolean);
  return features.map((text) => ({ source: "", text: truncateEvidence(text) }));
}

function collectScrapedEvidence(rawProduct: RawProduct): ScrapedEvidenceItem[] {
  const out: ScrapedEvidenceItem[] = [];
  for (const item of rawProduct.Expert_Review_Inputs?.evidenceHighlights || []) {
    pushEvidence(out, item.source, item.text);
  }
  for (const item of extractFeatureEvidence(rawProduct)) {
    pushEvidence(out, item.source, item.text);
  }
  if (rawProduct.Product_Description) {
    pushEvidence(out, "Product_Description", rawProduct.Product_Description);
  }
  for (const standard of Object.values(rawProduct.Scoring_Standards_Logic || {})) {
    for (const item of standard?.evidence || []) {
      pushEvidence(out, item.source, item.text);
    }
  }
  for (const [key, field] of Object.entries(rawProduct.Product_Display_Fields || {})) {
    if (!field?.value) continue;
    pushEvidence(out, field.source || `Product_Display_Fields.${key}`, `${key}: ${field.value}`);
  }
  return out;
}

function formatEvidenceLine(item: ScrapedEvidenceItem): string {
  return `${item.text} (${item.source})`;
}

function buildPros(rawProduct: RawProduct, evidence: ScrapedEvidenceItem[]): string[] {
  const preferred = evidence.filter((item) => /feature|description|comfort|safety|harness|fold|storage|battery|seat|wheel|suspension|brake/i.test(`${item.source} ${item.text}`));
  const pool = [...preferred, ...evidence];
  return pool.slice(0, 4).map(formatEvidenceLine);
}

function buildCons(rawProduct: RawProduct, evidence: ScrapedEvidenceItem[]): string[] {
  const cautionSignals = evidence.filter((item) => /\bno\b|not|without|weight|heavy|capacity|warranty|folded|battery|assembly|brake|harness|height|limit/i.test(`${item.source} ${item.text}`));
  const displayChecks = Object.entries(rawProduct.Product_Display_Fields || {}).map(([key, field]) => ({
    source: String(field?.source || `Product_Display_Fields.${key}`),
    text: truncateEvidence(`${key}: ${field?.value || "Confirm from source"}`),
  }));
  const pool = [...cautionSignals, ...displayChecks, ...evidence];
  const out: string[] = [];
  for (const item of pool) {
    const line = formatEvidenceLine(item);
    if (!out.includes(line)) out.push(line);
    if (out.length >= 4) break;
  }
  return out;
}

function filterEvidenceForScoring(key: string, evidence: ScrapedEvidenceItem[]): ScrapedEvidenceItem[] {
  const keywordMap: Record<string, RegExp> = {
    safetyFirst: /safe|safety|secure|harness|brake|lock|cert|protect|limit|capacity|weight recommendation|weight capacity|seat belt|isofix/i,
    ridingComfort: /comfort|padded|seat|cushion|suspension|shock|smooth|adjustable|recline|ergonomic|wheel|tire/i,
    lightAndEasy: /light|weight|fold|portable|carry|storage|compact|assembly|easy|install|height|adjustable/i,
  };
  const matcher = keywordMap[key];
  if (!matcher) return evidence.slice(0, 4);
  const matched = evidence.filter((item) => matcher.test(`${item.source} ${item.text}`));
  return [...matched, ...evidence].filter((item, index, pool) => {
    const itemKey = `${item.source}:${item.text}`;
    return pool.findIndex((candidate) => `${candidate.source}:${candidate.text}` === itemKey) === index;
  }).slice(0, 4);
}

function mapScoringStandards(rawProduct: RawProduct, evidence: ScrapedEvidenceItem[]): ProductScoringStandard[] {
  const rawLogic = rawProduct.Scoring_Standards_Logic || {};
  const entries: Array<[string, string, string]> = [
    ["safetyFirst", "safety", "Safety First"],
    ["ridingComfort", "comfort", "Riding Comfort"],
    ["lightAndEasy", "portability", "Light & Easy"],
  ];

  return entries.map(([rawKey, key, fallbackLabel]) => {
    const item = rawLogic[rawKey] || {};
    const itemEvidence: ScrapedEvidenceItem[] = [];
    for (const evidenceItem of item.evidence || []) {
      pushEvidence(itemEvidence, evidenceItem.source, evidenceItem.text);
    }
    if (itemEvidence.length === 0) {
      itemEvidence.push(...filterEvidenceForScoring(rawKey, evidence));
    }
    return {
      key,
      label: String(item.label || fallbackLabel),
      parentTip: truncateEvidence(item.parentTip || rawProduct.Parent_Tips?.[rawKey] || itemEvidence[0]?.text || "Derived from scraped product metadata."),
      evidence: itemEvidence.slice(0, 4),
    };
  });
}

function buildEditorVerdict(rawProduct: RawProduct, evidence: ScrapedEvidenceItem[]): string {
  const highlights = evidence.slice(0, 3).map((item) => item.text).filter(Boolean);
  if (highlights.length > 0) {
    return `${highlights.join(" ")}`;
  }
  return truncateEvidence(rawProduct.Product_Description || rawProduct.Features || "");
}

/**
 * Determine stroller subcategory based on product title and description
 */
function getStrollerSubcategory(title: string, description: string = ""): string {
  const text = `${title} ${description}`.toLowerCase();
  
  // Check for double/twin/side-by-side indicators
  if (text.includes("double") || text.includes("twin") || text.includes("side by side") || text.includes("双人")) {
    return "double_stroller";
  }
  
  // Check for jogging/jogger indicators
  if (text.includes("jogging") || text.includes("jogger") || text.includes("慢跑")) {
    return "jogger_stroller";
  }
  
  // Default to regular stroller
  return "stroller";
}

/**
 * Transform raw report product to frontend Product type
 */
export function transformReportProduct(
  rawProduct: RawProduct,
  categoryId: string,
  index: number
): Product | null {
  let productCategory = CATEGORY_FOLDER_TO_TYPE[categoryId] || "stroller";
  let finalCategoryId = categoryId;
  
  // For stroller category, subdivide into stroller/double_stroller/jogger_stroller
  if (categoryId === "stroller" || categoryId === "strollers") {
    const strollerType = getStrollerSubcategory(
      rawProduct.Title || "",
      rawProduct.Product_Description || ""
    );
    finalCategoryId = strollerType;
  }
  
  const brand = rawProduct.Brand || "Unknown";
  const title = rawProduct.Title || `Product ${index}`;
  
  // Generate unique ID combining category and ASIN or index
  const id = `${finalCategoryId}-${(rawProduct.ASIN || `product${index}`).toLowerCase()}`;
  
  const imageUrl = extractImageUrl(rawProduct);
  if (!imageUrl) {
    console.warn(`Skipping product without image: ${title}`);
    return null;
  }

  const attrs = rawProduct.Category_Attributes || {};
  const specs = rawProduct.Product_Specifications || {};
  const customerReviewText = extractCustomerReviewText(specs);
  const ratingDisplay = rawProduct.Rating || customerReviewText;
  const reviewsDisplay = rawProduct.Reviews || customerReviewText;
  const userRating = parseRating(ratingDisplay);
  const reviewCount = parseReviewCount(reviewsDisplay);
  const customersSay = pickExplicitCustomersSay(rawProduct) || buildCustomersSay(userRating, reviewCount);
  const videos = extractProductVideos(rawProduct);
  const scrapedEvidence = collectScrapedEvidence(rawProduct);
  const pros = buildPros(rawProduct, scrapedEvidence);
  const cons = buildCons(rawProduct, scrapedEvidence);
  const scoringStandards = mapScoringStandards(rawProduct, scrapedEvidence);

  const product: Product = {
    id,
    name: title,
    brand,
    category: productCategory,
    categoryId: finalCategoryId,
    wheelSize: extractWheelSize(attrs),
    weight: extractWeight(specs),
    material: extractMaterial(attrs, specs),
    brakeType: extractBrakeType(attrs, specs),
    tireType: extractTireType(attrs, specs),
    price: parsePrice(rawProduct.Price),
    ageRange: extractAgeRange(rawProduct, attrs),
    heightRange: [45, 95], // Default range, can be enhanced
    compliance: [],
    imageUrl,
    galleryUrls: extractGalleryUrls(rawProduct),
    videoUrl: videos[0]?.url,
    videos,
    description: rawProduct.Product_Description || rawProduct.Features || "",
    pros,
    cons,
    rating: { display: ratingDisplay || "N/A", value: userRating },
    reviews: { display: reviewsDisplay || "N/A", count: reviewCount },
    userRating,
    reviewCount,
    customers_say: customersSay,
    customersSay,
    editorVerdict: buildEditorVerdict(rawProduct, scrapedEvidence),
    scrapedEvidence,
    scoringStandards,
  };

  return product;
}

/**
 * Load all batch products from report JSON files
 */
export async function loadBatchProducts(): Promise<Product[]> {
  const products: Product[] = [];

  try {
    // Load each category report
    for (const [reportFile, categoryId] of Object.entries(REPORT_FILE_TO_CATEGORY)) {
      try {
        const response = await fetch(`/data/reports/${reportFile}?v=${REPORT_DATA_VERSION}`);
        if (!response.ok) {
          console.warn(`Failed to load ${reportFile}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        
        // Handle both array and object formats
        let items: RawProduct[] = [];
        if (Array.isArray(data)) {
          items = data;
        } else if (data && typeof data === "object") {
          // Could be a single product object or have an items array
          items = data.items ? data.items : [data];
        }

        // Transform each product
        let productCount = 0;
        for (let i = 0; i < items.length; i++) {
          const transformed = transformReportProduct(items[i], categoryId, i);
          if (transformed) {
            products.push(transformed);
            productCount++;
          }
        }

        console.log(`Loaded ${productCount} products from ${reportFile}`);
      } catch (err) {
        console.error(`Error loading ${reportFile}:`, err);
      }
    }

    console.log(`Total batch products loaded: ${products.length}`);
    return products;
  } catch (err) {
    console.error("Error loading batch products:", err);
    return [];
  }
}
