import { Product, ProductCategory } from "../types";

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
    ...extractStringList(product.Product_Videos_M3U8),
  ]);

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
    rating: { display: ratingDisplay || "N/A", value: userRating },
    reviews: { display: reviewsDisplay || "N/A", count: reviewCount },
    userRating,
    reviewCount,
    customers_say: customersSay,
    customersSay,
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
