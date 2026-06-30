#!/usr/bin/env node

const CMS_BASE_DEFAULT = "https://kidsmobi-api-v1.seaman-player.workers.dev";
const SOURCE_BASE_DEFAULT = "https://kidsmobi-api-v1.seaman-player.workers.dev";

function parseArg(name, fallback = "") {
  const key = `--${name}=`;
  const matched = process.argv.find((arg) => arg.startsWith(key));
  return matched ? matched.slice(key.length) : fallback;
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
  const cmsBase = (parseArg("cmsBase", process.env.CMS_BASE || CMS_BASE_DEFAULT) || CMS_BASE_DEFAULT).replace(/\/+$/, "");
  const sourceBase = (parseArg("sourceBase", process.env.SOURCE_BASE || SOURCE_BASE_DEFAULT) || SOURCE_BASE_DEFAULT).replace(/\/+$/, "");
  const perCategory = Math.max(5, Number(parseArg("perCategory", "12")) || 12);

  console.log(`[import] cmsBase=${cmsBase}`);
  console.log(`[import] sourceBase=${sourceBase}`);

  const health = await fetchJson(`${cmsBase}/api/cms/d1/health`);
  if (!health?.data?.healthy) {
    throw new Error("CMS D1 health check failed before import");
  }

  const categoriesResp = await fetchJson(`${sourceBase}/api/v1/catalog/categories`);
  const sourceCategories = Array.isArray(categoriesResp?.data) ? categoriesResp.data : [];
  if (sourceCategories.length === 0) {
    throw new Error("No source categories returned from backend");
  }

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
    await cmsSave(cmsBase, "categories", row);
  }

  const allProducts = [];
  const allResources = [];
  for (const cat of sourceCategories) {
    const [productsResp, resourcesResp] = await Promise.all([
      fetchJson(`${sourceBase}/api/v1/products?categoryId=${encodeURIComponent(cat.categoryId)}&page=1&pageSize=${perCategory}`),
      fetchJson(`${sourceBase}/api/v1/resources?categoryId=${encodeURIComponent(cat.categoryId)}&page=1&pageSize=${perCategory * 3}`),
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

  const cmsProducts = allProducts.map((p) => buildProduct(p, resourceMap.get(p.productId)));
  for (const row of cmsProducts) {
    await cmsSave(cmsBase, "products", row);
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
  for (const row of scenarios) {
    await cmsSave(cmsBase, "scenarios", row);
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

  for (const row of evaluations) {
    await cmsSave(cmsBase, "evaluations", row);
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

  for (const row of guides) {
    await cmsSave(cmsBase, "guides", row);
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

  for (const row of news) {
    await cmsSave(cmsBase, "news", row);
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
        descriptionZh: "基于 backend api/v1 数据自动生成。",
        descriptionEn: "Auto-generated from backend api/v1 data.",
        icon: "Globe",
      },
    ],
  };

  await cmsSave(cmsBase, "settings", settings);

  const settingsResp = await fetchJson(`${cmsBase}/api/cms/settings`);
  const counts = {
    categories: await cmsListCount(cmsBase, "categories"),
    products: await cmsListCount(cmsBase, "products"),
    scenarios: await cmsListCount(cmsBase, "scenarios"),
    evaluations: await cmsListCount(cmsBase, "evaluations"),
    guides: await cmsListCount(cmsBase, "guides"),
    news: await cmsListCount(cmsBase, "news"),
    settings: Array.isArray(settingsResp?.data) ? settingsResp.data.length : settingsResp?.data ? 1 : 0,
  };

  console.log("[import] completed");
  console.log(JSON.stringify({ cmsBase, sourceBase, counts }, null, 2));
}

main().catch((error) => {
  console.error("[import] failed", error);
  process.exit(1);
});
