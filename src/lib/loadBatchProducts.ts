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
  kids_push_ride_ons: "stroller",
  kids_pull_along_wagons: "stroller",
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
  "kids_push_ride_ons_report.json": "kids_push_ride_ons",
  "kids_pull_along_wagons_report.json": "kids_pull_along_wagons",
};

interface RawProduct {
  Rank?: string;
  Brand?: string;
  Title?: string;
  Price?: string;
  Rating?: string;
  Local_Image_Path?: string;
  Local_Image_Paths?: string[];
  Product_Videos?: any[];
  Product_Description?: string;
  Category_Attributes?: Record<string, string>;
  Product_Specifications?: Record<string, any>;
  ASIN?: string;
  [key: string]: any;
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
    return product.Local_Image_Path;
  }
  // Try first item in Local_Image_Paths array
  if (Array.isArray(product.Local_Image_Paths) && product.Local_Image_Paths.length > 0) {
    return product.Local_Image_Paths[0];
  }
  // Try Listing_Image_URL from scrape data
  if (product.Listing_Image_URL) {
    return product.Listing_Image_URL;
  }
  return "";
}

/**
 * Extract image gallery URLs
 */
function extractGalleryUrls(product: RawProduct): string[] {
  if (Array.isArray(product.Local_Image_Paths)) {
    return product.Local_Image_Paths.slice(0, 10); // Limit to 10 images
  }
  if (product.Local_Image_Path) {
    return [product.Local_Image_Path];
  }
  return [];
}

/**
 * Extract age range from category attributes
 */
function extractAgeRange(attrs: Record<string, string> | undefined): string {
  if (!attrs) return "All Ages";
  return attrs["Age Range Description"] || attrs["Age Range"] || "All Ages";
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
    ageRange: extractAgeRange(attrs),
    heightRange: [45, 95], // Default range, can be enhanced
    compliance: [],
    imageUrl,
    galleryUrls: extractGalleryUrls(rawProduct),
    videoUrl: rawProduct.Product_Videos?.[0]?.Video_URL,
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
        const response = await fetch(`/data/reports/${reportFile}`);
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
