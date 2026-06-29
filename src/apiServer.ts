import express from "express";
import { GoogleGenAI } from "@google/genai";
import { guideArticles } from "./data/guidesData.js";
import { newsArticles } from "./data/newsData.js";
import type { CMSProduct, CMSSettings, Evaluation, HomeSlot, ProductCategory } from "./types.js";
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
  credibilityScore: number;
  credibilityLevel: string;
  scoringBreakdown?: { docs?: number; videos?: number; hasFeatures?: boolean };
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
            source: product.images?.cover?.source || "scraped",
            order: 0,
          }
        : undefined,
      gallery: galleryUrls.map((url, index) => ({
        url,
        source: product.images?.gallery?.find((item) => (item.url || "").trim() === url)?.source || "scraped",
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

// Lazy initialize Gemini clients
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 环境变量未配置。请在右侧‘Secrets/Settings’面板中配置您的 API Key。");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// AI Chat endpoint for expert children's ride-on consultation
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, childProfile, lang } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Messages array is required." });
      return;
    }

    const client = getGeminiClient();
    const isEn = lang === "en";

    // Formulate expert advice persona in target language
    let systemInstruction = "";
    if (isEn) {
      systemInstruction = `You are a world-renowned Senior Engineer & Safety Consultant in pediatric rider biomechanics (from the "KIDSMOBI Global Safety Lab").
Your duty is to answer parental inquiries regarding children's ride-on equipment (pedal bikes, balance bikes, push scooters, baby strollers) with extreme rigor, scientific data, objective fairness, and compassionate empathy.

You MUST prioritize the following golden principles of physics, biomechanics, and safety using scientific reasoning:
1. 【Child-to-Bike Weight Ratio】: A kid bicycle's dead weight MUST NOT exceed 30% of the child's body weight (exceeding 40% is equivalent to an adult riding a 60kg motorcycle: it compromises balance, destroys fun, and increases injury risk upon falling). Lightweight frames are vital for safe riding.
2. 【The Coaster Brake Fallacy】: Decidedly caution parents against pedal-back coaster brakes. Coaster brakes freeze the cranks, preventing kids from backpedaling to correct balance at start-off, and lead to asymmetric muscular habits. Recommend narrow, ultra-short reach linear hand brakes (V-brakes/Disc-brakes) customized for tiny toddler hands.
3. 【Riding Geometry】: Q-Factor (bbt bracket width), wheelbase, and stack/reach ratio should position the knee such that it doesn't rise above the navel level, maintaining a low, stable center of gravity.
4. 【Pneumatic vs Solid EVA Tires】: Strongly advocate for pneumatic rubber tires over solid EVA plastic foam because EVA tires have extremely poor friction dampening, causing violent slip-outs and heavy shocks.
5. 【St stroller Spine and Vestibular Protection】: Strollers must support a robust 170°-175° liesflat basket to protect a newborn's delicate spinal posture. Active suspension is critical for dampening retina-shattering road vibrations.

【Target Rider Profile】:
- Age: ${childProfile?.age ? `${childProfile.age} yrs old` : "Unknown"}
- Height / Inseam: ${childProfile?.height ? `${childProfile.height} cm` : "Unknown"} / ${childProfile?.inseam ? `${childProfile.inseam} cm` : "Unknown"}
- Weight: ${childProfile?.weight ? `${childProfile.weight} kg (Max recomm. safe bike weight limit: ${(childProfile.weight * 0.3).toFixed(1)} kg)` : "Unknown"}
- Skill Stage: ${childProfile?.experience || "Unknown"}

Please reply strictly in clear English. Deliver answers formatted in structured, highly scannable Markdown. Use objective scientific data and explain "why", demonstrating absolute integrity, unbiased testing stance, and professional warmth.`;
    } else {
      systemInstruction = `你是一位享誉全球的儿童童车与安全工效学权威资深工程师（来自“KIDSMOBI 全球安全实验室”）。
你的职责是：以极度专业、严谨、客观公正且充满人文关怀的视角，解答家长关于童车（儿童自行车、滑板车、平衡车、婴儿推车）选购和安全标准的疑问。

你在评测和给予决策建议时，必须死守以下行业黄金准则，并用数据、科学原理解释：
1. 【车重黄金比例】：童车重量（尤指自行车）绝不可以超过儿童体重的30%（超过40%等同于让成年人骑一辆60公斤重的摩托。轻量化车架是保护儿童安全与骑行乐趣的关键）。
2. 【刹车制动器认知迷区】：强烈反对手刹不足、仅靠脚踏倒刹（Coaster Brake）的设计。脚踏倒刹会阻碍儿童在起步阶段向后转动脚踏调整平衡，且紧急情况下容易抱死打滑，还会形成长期肌肉代偿；推荐配有极短握距、专为幼童小手定制的线性手刹（V刹、碟刹）。
3. 【骑行几何】：Q-Factor（五通宽度）、Wheelbase（轮距）、和Stack/Reach比，都要保证儿童膝盖不超过肚脐，使发力连贯且重心贴地。
4. 【充气轮胎 vs 发泡轮胎】：平衡车 and 自行车强烈推荐避震与抓地力更好的橡胶充气胎，塑料或发泡EVA轮胎抓地极差，容易打滑倾翻。
5. 【婴儿推车避震与护脊】：推车必须支持170°-175°的睡篮保护新生儿脊椎，四轮弹簧避震是减轻路面颠簸损伤视网膜的重要防护。

【当前咨询儿童档案】（若用户未提供，可提醒用户补充，但必须先基于已知信息作答）：
- 年龄: ${childProfile?.age ? `${childProfile.age} 岁` : "未知"}
- 身高/腿内侧高: ${childProfile?.height ? `${childProfile.height} cm` : "未知"} / ${childProfile?.inseam ? `${childProfile.inseam} cm` : "未知"}
- 体重: ${childProfile?.weight ? `${childProfile.weight} kg (推算最高安全车重 limit: ${(childProfile.weight * 0.3).toFixed(1)} kg)` : "未知"}
- 运动经验: ${childProfile?.experience || "未知"}

请使用清晰的 Markdown 格式输出（简体中文）。用数据说话，解释“为什么”而不是敷衍地说“推荐买”。态度要客观独立（不带有任何商业偏见，坚定的第三方测评立场），同时用词温暖亲切。`;
    }

    // Structure contents for raw generateContent call to gemini-3.5-flash
    const chatContents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" as const : "model" as const,
      parts: [{ text: m.content }],
    }));

    // Helper function to query Gemini with retry and fallback model capability
    const generateWithRetryAndFallback = async (
      ai: GoogleGenAI,
      primaryModel: string,
      contents: any,
      config: any,
      maxRetries = 2
    ) => {
      let lastError: any = null;
      const modelsToTry = [primaryModel, "gemini-3.1-flash-lite"];

      for (const modelName of modelsToTry) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            console.log(`[AI Chat] Contacting model ${modelName} on attempt ${attempt + 1}/${maxRetries + 1}...`);
            const res = await ai.models.generateContent({
              model: modelName,
              contents,
              config,
            });
            if (res) {
              console.log(`[AI Chat] Successfully received response from ${modelName}`);
              return res;
            }
          } catch (err: any) {
            lastError = err;
            console.warn(`[AI Chat Warning] Attempt ${attempt + 1} of ${modelName} failed:`, err?.message || err);
            
            if (attempt < maxRetries) {
              const delay = Math.pow(2, attempt) * 1000;
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
        }
        console.warn(`[AI Chat Warning] All attempts failed for ${modelName}. Trying next model in fallback list if available...`);
      }
      throw lastError;
    };

    const response = await generateWithRetryAndFallback(
      client,
      "gemini-3.5-flash",
      chatContents,
      {
        systemInstruction,
        temperature: 0.7,
      }
    );

    const replyText = response.text || (isEn ? "Apologies, the safety advisors are currently reviewing. Failed to generate context." : "抱歉，专家顾问正在审查中，未能生成回复。");
    res.json({ reply: replyText });
  } catch (error: any) {
    console.error("Gemini API Error in /api/chat:", error);
    res.status(500).json({
      error: error.message || "服务器遇到未知的 AI 分析配置错误",
      details: "如果您没有配置 GEMINI_API_KEY，请确保在 SECRETS 中正确输入。"
    });
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
