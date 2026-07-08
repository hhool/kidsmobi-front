#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_BASE = "https://kidsmobi-api-v1.seaman-player.workers.dev";
const DEFAULT_CATEGORY = "stroller";
const DEFAULT_LIMIT = 20;
const DEFAULT_OUTPUT = "doc/products-import-sample.json";

function parseArg(name, fallback) {
  const key = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(key));
  if (!found) return fallback;
  return found.slice(key.length);
}

function toHttpUrl(value) {
  if (!value || typeof value !== "string") return "";
  try {
    const u = new URL(value);
    if (u.protocol === "http:" || u.protocol === "https:") return value;
    return "";
  } catch {
    return "";
  }
}

function slugifyScenario(categoryId) {
  return categoryId === "stroller" ? "city-commute" : `${categoryId}-scene`;
}

function buildImportRow(product, relatedProductId, videoUrls = []) {
  const title = product.title || product.productId || "Unnamed Product";
  const cover = toHttpUrl(product?.images?.cover?.url) || toHttpUrl(product.coverImage);
  const gallery = [
    ...(Array.isArray(product?.galleryUrls) ? product.galleryUrls.map((item) => toHttpUrl(item)) : []),
    ...(product?.images?.gallery || []).map((item) => toHttpUrl(item?.url)),
  ].filter(Boolean).filter((item, idx, arr) => arr.indexOf(item) === idx);

  const price = Number(product?.price?.value || 0);
  const weightLbs = Number(product?.weight?.lbs || 0);
  const customersSay = String(product?.customers_say || product?.customersSay || "").trim();
  const editorVerdict = customersSay;

  return {
    id: product.productId,
    name: title,
    brand: product.brand || "Unknown",
    category: product.categoryId || DEFAULT_CATEGORY,
    wheelSize: "N/A",
    weight: Number.isFinite(weightLbs) ? weightLbs : 0,
    material: "N/A",
    brakeType: "N/A",
    tireType: "N/A",
    price: Number.isFinite(price) ? price : 0,
    ageRange: "0-4y",
    heightRange: [65, 120],
    compliance: ["EN1888"],
    imageUrl: cover,
    galleryUrls: gallery,
    videoUrl: videoUrls[0] || "",
    features: ["backend-imported", "cms-bulk-ready"],
    customers_say: customersSay,
    scenarios: [slugifyScenario(product.categoryId || DEFAULT_CATEGORY)],
    relatedProductIds: relatedProductId ? [relatedProductId] : [],
    videos: videoUrls.map((url, idx) => ({
      url,
      title: `backend-video-${idx + 1}`,
      source: "scraped",
      order: idx,
    })),
    status: "draft",
    zh: {
      name: title,
      description: "由 backend 接口自动生成的批量导入记录。",
      customersSay,
      brandText: product.brand || "Unknown",
      specsText: `price: ${product?.price?.display || "N/A"}; weight: ${product?.weight?.display || "N/A"}`,
      pros: ["来自 backend 产品接口", "图片资源来自 backend"],
      cons: ["请按业务补充人工编辑字段"],
      editorVerdict,
    },
    en: {
      name: title,
      description: "Auto-generated import payload from backend APIs.",
      customersSay,
      brandText: product.brand || "Unknown",
      specsText: `price: ${product?.price?.display || "N/A"}; weight: ${product?.weight?.display || "N/A"}`,
      pros: ["backend sourced", "backend image URLs"],
      cons: ["manual curation still recommended"],
      editorVerdict,
    },
    editorVerdict,
    updatedAt: null,
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Request failed ${response.status}: ${url}${text ? `\n${text.slice(0, 200)}` : ""}`);
  }

  return response.json();
}

async function main() {
  const base = parseArg("base", process.env.BACKEND_BASE || DEFAULT_BASE).replace(/\/+$/, "");
  const category = parseArg("category", DEFAULT_CATEGORY);
  const limit = Math.max(1, Number(parseArg("limit", `${DEFAULT_LIMIT}`)) || DEFAULT_LIMIT);
  const output = parseArg("output", DEFAULT_OUTPUT);

  const productsJson = await fetchJson(
    `${base}/api/v1/products?categoryId=${encodeURIComponent(category)}&page=1&pageSize=${encodeURIComponent(String(limit))}`
  );
  const resourcesJson = await fetchJson(
    `${base}/api/v1/resources?categoryId=${encodeURIComponent(category)}&page=1&pageSize=${encodeURIComponent(String(limit * 3))}`
  );

  const products = Array.isArray(productsJson?.data) ? productsJson.data : [];
  const resources = Array.isArray(resourcesJson?.data) ? resourcesJson.data : [];

  const videoMap = new Map();
  for (const item of resources) {
    const type = (item?.resourceType || "").toLowerCase();
    const urls = [
      ...(Array.isArray(item?.videoUrls) ? item.videoUrls.map((url) => toHttpUrl(url)) : []),
      toHttpUrl(item?.resourceUrl || ""),
      toHttpUrl(item?.source || ""),
    ].filter(Boolean).filter((value, idx, arr) => arr.indexOf(value) === idx);
    if (!type.includes("video") && urls.length === 0) continue;
    const current = videoMap.get(item.productId) || [];
    videoMap.set(item.productId, [...current, ...urls].filter((value, idx, arr) => arr.indexOf(value) === idx));
  }

  const rows = products.map((product, idx) => {
    const related = products[(idx + 1) % products.length]?.productId;
    const productVideos = Array.isArray(product?.videoUrls)
      ? product.videoUrls.map((url) => toHttpUrl(url)).filter(Boolean)
      : [];
    const resourceVideos = videoMap.get(product.productId) || [];
    const mergedVideos = [...productVideos, ...resourceVideos].filter((value, index, arr) => arr.indexOf(value) === index);
    return buildImportRow(product, related, mergedVideos);
  });

  const absoluteOutput = path.resolve(process.cwd(), output);
  await fs.mkdir(path.dirname(absoluteOutput), { recursive: true });
  await fs.writeFile(absoluteOutput, `${JSON.stringify(rows, null, 2)}\n`, "utf8");

  console.log(`Generated ${rows.length} rows -> ${output}`);
  console.log(`Source base: ${base}`);
  console.log(`Category: ${category}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
