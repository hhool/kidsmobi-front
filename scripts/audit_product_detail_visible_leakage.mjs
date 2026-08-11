#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : "true";
    args[key] = value;
    if (value !== "true") i += 1;
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeText(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function toInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function sanitizePath(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

const PRIMARY_PRODUCT_CATEGORY_IDS = new Set([
  "stroller",
  "balance_bike",
  "kids_bikes",
  "kids_scooters",
  "electric_vehicles",
  "car_seat",
]);

const PRODUCT_CATEGORY_ID_ALIASES = {
  stroller: "stroller",
  strollers: "stroller",
  balance: "balance_bike",
  balance_bike: "balance_bike",
  "balance-bike": "balance_bike",
  balancebike: "balance_bike",
  kids_bikes: "kids_bikes",
  "kids-bikes": "kids_bikes",
  bicycle: "kids_bikes",
  bicycles: "kids_bikes",
  bike: "kids_bikes",
  bikes: "kids_bikes",
  kids_scooters: "kids_scooters",
  "kids-scooters": "kids_scooters",
  scooter: "kids_scooters",
  scooters: "kids_scooters",
  electric_car: "electric_vehicles",
  "electric-car": "electric_vehicles",
  electric_vehicles: "electric_vehicles",
  electric_vehicless: "electric_vehicles",
  ev: "electric_vehicles",
  safety_seat: "car_seat",
  "safety-seat": "car_seat",
  car_seat: "car_seat",
  "car-seat": "car_seat",
};

function inferMisclassifiedCategoryId(product, normalizedCategoryId) {
  const text = [
    product.name,
    product.brand,
    product.category,
    product.categoryId,
    product.description,
    product?.zh?.description,
    product?.en?.description,
  ]
    .map((item) => String(item || "").toLowerCase())
    .join(" ");

  const hasStrollerSignal = /(stroller|pram|pushchair|buggy|jogger|jogging|travel\s+system|umbrella\s+stroller|double\s+stroller|twin\s+stroller|推车|婴儿车|慢跑推车|双人推车)/i.test(text);
  const hasCarSeatSignal = /(\bcar\s*seat\b|\bbooster\s*seat\b|\bconvertible\s*car\s*seat\b|\binfant\s*car\s*seat\b|安全座椅|提篮座椅)/i.test(text);

  if (hasCarSeatSignal && !hasStrollerSignal) return "car_seat";
  return normalizedCategoryId;
}

function resolveProductCategoryId(product) {
  const raw = String(product?.categoryId || product?.category || "").trim().toLowerCase();
  const normalized = PRODUCT_CATEGORY_ID_ALIASES[raw] || raw;
  const inferred = inferMisclassifiedCategoryId(product, normalized);
  return PRIMARY_PRODUCT_CATEGORY_IDS.has(inferred) ? inferred : "other";
}

function generateMarkdown(report) {
  const lines = [];
  lines.push("# 213 商品页面可见层英文残留巡检清单");
  lines.push("");
  lines.push(`- 基准链接: ${report.baseUrl}`);
  lines.push(`- 生成时间: ${report.generatedAt}`);
  lines.push(`- 覆盖商品: ${report.totalProducts}`);
  lines.push(`- 可访问商品: ${report.accessibleProducts}`);
  lines.push(`- admin-only 隐藏商品: ${report.adminHiddenProducts.length}`);
  lines.push(`- 有命中商品: ${report.productsWithHits}`);
  lines.push(`- 无命中商品: ${report.productsWithoutHits}`);
  lines.push(`- 总命中数: ${report.totalHits}`);
  lines.push(`- 访问失败（非 admin-only）: ${report.failedProducts.length}`);
  lines.push("");

  lines.push("## 高频残留词 Top 40");
  lines.push("");
  lines.push("| token | count | modules | ");
  lines.push("| --- | ---: | --- |");
  for (const row of report.topTokens.slice(0, 40)) {
    lines.push(`| ${row.token.replace(/\|/g, "\\|")} | ${row.count} | ${row.modules.slice(0, 4).join(", ").replace(/\|/g, "\\|")} |`);
  }
  lines.push("");

  lines.push("## 逐商品清单（按命中数降序）");
  lines.push("");
  for (const item of report.products) {
    lines.push(`### ${item.id} | ${item.name}`);
    lines.push(`- category: ${item.category}`);
    lines.push(`- routeCategory: ${item.routeCategory}`);
    lines.push(`- url: ${item.url}`);
    lines.push(`- actualPath: ${item.actualPath || ""}`);
    lines.push(`- auditStatus: ${item.auditStatus || (item.ok ? "ok" : "failed")}`);
    if (!item.ok && item.error) {
      lines.push(`- auditError: ${String(item.error).replace(/\s+/g, " ").trim()}`);
    }
    lines.push(`- hitCount: ${item.hitCount}`);
    if (!item.hits.length) {
      lines.push("- hits: 无");
      lines.push("");
      continue;
    }

    for (const hit of item.hits) {
      lines.push(`- token: ${hit.token}`);
      lines.push(`  module: ${hit.module}`);
      lines.push(`  snippet: ${hit.snippet}`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv);
  const workspaceRoot = path.resolve(process.cwd(), "..");

  const inputPath = path.resolve(
    process.cwd(),
    args.input || "../env/cms-export-1786372059851.json",
  );
  const outputJsonPath = path.resolve(
    process.cwd(),
    args.output || "../env/process/detail-visible-audit-213.json",
  );
  const outputMarkdownPath = path.resolve(
    process.cwd(),
    args.markdown || "../env/process/detail-visible-audit-213.md",
  );

  const baseUrl = String(args.base || "https://fc755798.kidsmobi.pages.dev").replace(/\/+$/, "");
  const concurrency = Math.max(1, Math.min(8, toInt(args.concurrency, 4)));
  const timeoutMs = Math.max(5000, toInt(args.timeoutMs, 25000));
  const maxHitsPerProduct = Math.max(5, toInt(args.maxHitsPerProduct, 20));
  const headless = String(args.headless || "true") !== "false";
  const browserChannel = String(args.channel || "chrome").trim();

  const source = readJson(inputPath);
  const products = ((((source || {}).data || {}).collections || {}).products || []).map((p) => ({
    ...p,
    id: String(p?.id || "").trim(),
    name: String(p?.name || "").trim(),
    category: String(p?.category || "").trim(),
  }));

  const targetsInputPath = args.targets
    ? path.resolve(process.cwd(), String(args.targets))
    : path.resolve(process.cwd(), "../env/process/visible-audit-targets-213.json");
  let precomputedTargetsById = new Map();
  if (fs.existsSync(targetsInputPath)) {
    const targetSource = readJson(targetsInputPath);
    const rows = Array.isArray(targetSource?.rows) ? targetSource.rows : [];
    precomputedTargetsById = new Map(
      rows
        .map((row) => ({
          id: String(row?.id || "").trim(),
          routeCategory: String(row?.routeCategory || "").trim(),
          url: sanitizePath(row?.url),
        }))
        .filter((row) => row.id && row.url),
    );
  }

  const targets = products.map((product) => {
    const fromPrecomputed = precomputedTargetsById.get(product.id);
    if (fromPrecomputed) {
      return {
        id: product.id,
        name: product.name,
        category: product.category,
        routeCategory: fromPrecomputed.routeCategory || resolveProductCategoryId(product),
        urlPath: fromPrecomputed.url,
        fullUrl: `${baseUrl}${fromPrecomputed.url}`,
      };
    }

    const routeCategory = resolveProductCategoryId(product);
    const urlPath = `/products/${routeCategory}/${encodeURIComponent(product.id)}`;
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      routeCategory,
      urlPath,
      fullUrl: `${baseUrl}${urlPath}`,
    };
  });

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (error) {
    console.error("Failed to load playwright. Install it first: npm i -D playwright");
    throw error;
  }

  const browser = await chromium.launch({
    headless,
    channel: browserChannel || undefined,
  });
  let cursor = 0;
  const results = [];

  const worker = async (workerId) => {
    const context = await browser.newContext({
      locale: "zh-CN",
      timezoneId: "Asia/Shanghai",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    while (cursor < targets.length) {
      const currentIndex = cursor;
      cursor += 1;
      const target = targets[currentIndex];

      const record = {
        id: target.id,
        name: target.name,
        category: target.category,
        routeCategory: target.routeCategory,
        url: target.urlPath,
        fullUrl: target.fullUrl,
        actualPath: "",
        hitCount: 0,
        hits: [],
        ok: false,
        auditStatus: "failed",
        error: "",
      };

      try {
        await page.goto(target.fullUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
        await page.waitForSelector("main", { timeout: timeoutMs });

        try {
          const cookieBtn = page.getByRole("button", { name: /同意|accept|agree/i });
          if ((await cookieBtn.count()) > 0) {
            await cookieBtn.first().click({ timeout: 1200 });
          }
        } catch {
          // no-op
        }

        const payload = await page.evaluate(
          ({ maxHits }) => {
            const KNOWN_PATTERNS = [
              /easy\s+to\s+assemble/gi,
              /install\s+the\s+rear/gi,
              /adjustable\s+handlebar\s+height/gi,
              /handlebar\s+type/gi,
              /kid'?s\s+recreational\s+riding/gi,
              /focus\s+on\s+seat\s+support/gi,
              /glow\s+wheel/gi,
              /\bassembly\s+instructions?\b/gi,
              /\bproduct\s+description\b/gi,
              /\bcategory\s+attributes?\b/gi,
              /\bmeasurements?\b/gi,
              /\bframe\s+weight\b/gi,
              /\bsafety\b/gi,
              /\brating\b/gi,
              /\ball[-\s]?terrain\b/gi,
              /\bwagon\b/gi,
              /\b3[-\s]?in[-\s]?1\b/gi,
              /\btrio\b/gi,
            ];

            const ALLOW_PHRASES = new Set([
              "bbt",
              "balancebiketoddler",
              "cpsc",
              "iso",
              "astm",
              "en",
              "gb",
              "ce",
              "uk",
              "us",
              "eu",
              "cm",
              "mm",
              "kg",
              "lb",
              "lbs",
              "mph",
              "km/h",
              "sku",
              "asin",
              "model",
              "usb",
              "led",
              "eva",
              "pu",
              "pvc",
              "abc",
              "3d",
              "2d",
            ]);

            const BRAND_ALLOW = [
              "graco",
              "baby trend",
              "babytrend",
              "costzon",
              "radio flyer",
              "jeep",
              "joovy",
              "chicco",
              "evenflo",
              "maxi-cosi",
              "maxi cosi",
              "doona",
              "uppababy",
              "cybex",
              "bugaboo",
              "thule",
              "bob",
              "mompush",
              "little tikes",
              "huffy",
              "schwinn",
              "razor",
              "globber",
              "micro",
              "xjd",
              "gotrax",
            ];

            function normalizeBrandToken(token) {
              return String(token || "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, " ")
                .trim();
            }

            function clean(text) {
              return String(text || "").replace(/\s+/g, " ").trim();
            }

            function isAllowedToken(token) {
              const lower = token.toLowerCase();
              if (!/[a-z]/i.test(lower)) return true;
              if (/^b0[a-z0-9]{8}$/i.test(token)) return true;
              if (/^[a-z0-9-]{1,3}$/i.test(token)) return true;
              if (/^[\d\s.,/()'%:+-]+$/.test(token)) return true;
              if (/^\d+(?:\.\d+)?\s*(kg|g|lb|lbs|cm|mm|m|in|inch|inches|km\/h|mph)$/i.test(lower)) return true;
              if (ALLOW_PHRASES.has(lower)) return true;
              const normalizedToken = normalizeBrandToken(token);
              if (BRAND_ALLOW.some((brand) => normalizeBrandToken(brand) === normalizedToken)) return true;
              return false;
            }

            function collectModules(mainEl) {
              const modules = [];
              const seen = new Set();

              const headings = Array.from(mainEl.querySelectorAll("h1,h2,h3,h4"));
              for (const heading of headings) {
                const title = clean(heading.textContent);
                if (!title) continue;
                const container = heading.closest("section,article,div") || heading.parentElement;
                const text = clean(container?.textContent || "");
                if (!text || text.length < 40) continue;
                const key = `${title}::${text.slice(0, 80)}`;
                if (seen.has(key)) continue;
                seen.add(key);
                modules.push({ module: title.slice(0, 120), text });
              }

              const semanticBlocks = Array.from(mainEl.querySelectorAll("section,article"));
              for (const block of semanticBlocks) {
                const text = clean(block.textContent);
                if (!text || text.length < 80) continue;
                const title = clean(
                  block.querySelector("h1,h2,h3,h4")?.textContent ||
                    block.getAttribute("aria-label") ||
                    "main-section",
                );
                const key = `${title}::${text.slice(0, 80)}`;
                if (seen.has(key)) continue;
                seen.add(key);
                modules.push({ module: title.slice(0, 120), text });
              }

              if (!modules.length) {
                modules.push({ module: "main", text: clean(mainEl.textContent || "") });
              }
              return modules;
            }

            function snippetFrom(text, token, radius = 36) {
              const t = clean(text);
              const k = clean(token);
              if (!t || !k) return "";
              const i = t.toLowerCase().indexOf(k.toLowerCase());
              if (i < 0) return t.slice(0, Math.min(120, t.length));
              const s = Math.max(0, i - radius);
              const e = Math.min(t.length, i + k.length + radius);
              return `${s > 0 ? "..." : ""}${t.slice(s, e)}${e < t.length ? "..." : ""}`;
            }

            const mainEl = document.querySelector("main");
            if (!mainEl) {
              return { ok: false, error: "main not found", hits: [] };
            }

            const pageText = clean(mainEl.textContent || "");
            const modules = collectModules(mainEl);
            const candidates = [];

            const phraseRegex = /[A-Za-z][A-Za-z0-9'&/+.-]*(?:\s+[A-Za-z][A-Za-z0-9'&/+.-]*){0,5}/g;
            let m;
            while ((m = phraseRegex.exec(pageText)) !== null) {
              const token = clean(m[0]);
              if (!token) continue;
              if (token.length < 3) continue;
              if (isAllowedToken(token)) continue;
              candidates.push(token);
            }

            for (const pattern of KNOWN_PATTERNS) {
              for (const hit of pageText.match(pattern) || []) {
                const token = clean(hit);
                if (!token) continue;
                if (isAllowedToken(token)) continue;
                candidates.push(token);
              }
            }

            const normalized = [];
            const seenToken = new Set();
            for (const token of candidates) {
              const t = token.replace(/[\s\u00a0]+/g, " ").trim();
              const lower = t.toLowerCase();
              if (!t || seenToken.has(lower)) continue;
              seenToken.add(lower);
              normalized.push(t);
            }

            const hits = [];
            for (const token of normalized) {
              let moduleName = "main";
              let moduleText = pageText;

              for (const mod of modules) {
                const idx = mod.text.toLowerCase().indexOf(token.toLowerCase());
                if (idx >= 0) {
                  moduleName = clean(mod.module || "main") || "main";
                  moduleText = mod.text;
                  break;
                }
              }

              hits.push({
                token,
                module: moduleName,
                snippet: snippetFrom(moduleText, token),
              });

              if (hits.length >= maxHits) break;
            }

            return {
              ok: true,
              title: document.title,
              pathname: location.pathname,
              textLength: pageText.length,
              moduleCount: modules.length,
              hits,
            };
          },
          { maxHits: maxHitsPerProduct },
        );

        record.ok = Boolean(payload?.ok);
        record.actualPath = String(payload?.pathname || "");

        const expectedId = String(target.id || "").toLowerCase();
        const expectedIdEncoded = encodeURIComponent(String(target.id || "")).toLowerCase();
        const actualPathLower = record.actualPath.toLowerCase();
        const routeMatched =
          Boolean(expectedId) &&
          (actualPathLower.includes(expectedId) || actualPathLower.includes(expectedIdEncoded));

        if (!routeMatched) {
          const adminOnlyHidden = record.actualPath === "/products";
          record.ok = adminOnlyHidden;
          record.auditStatus = adminOnlyHidden ? "admin_hidden" : "failed";
          record.error = adminOnlyHidden
            ? "admin_only_hidden"
            : `route_mismatch:${record.actualPath || "unknown"}`;
          record.hits = [];
          record.hitCount = 0;
          results[currentIndex] = record;
          const progress = `${currentIndex + 1}/${targets.length}`;
          console.log(
            `[worker-${workerId}] ${progress} ${target.id} ${adminOnlyHidden ? "admin_hidden" : `route_mismatch=${record.actualPath || "unknown"}`}`,
          );
          continue;
        }

        record.auditStatus = "ok";

        record.hits = Array.isArray(payload?.hits)
          ? payload.hits.map((hit) => ({
              token: String(hit?.token || "").trim(),
              module: String(hit?.module || "main").trim() || "main",
              snippet: String(hit?.snippet || "").trim(),
            }))
          : [];
        record.hits = record.hits
          .filter((h) => h.token)
          .filter((h, idx, arr) => arr.findIndex((x) => `${x.token}::${x.module}` === `${h.token}::${h.module}`) === idx)
          .slice(0, maxHitsPerProduct);
        record.hitCount = record.hits.length;
      } catch (error) {
        record.ok = false;
        record.auditStatus = "failed";
        record.error = String(error?.message || error || "unknown error");
      }

      results[currentIndex] = record;
      const progress = `${currentIndex + 1}/${targets.length}`;
      const status = record.ok ? `hits=${record.hitCount}` : `error=${record.error}`;
      console.log(`[worker-${workerId}] ${progress} ${target.id} ${status}`);
    }

    await context.close();
  };

  const jobs = Array.from({ length: concurrency }, (_, i) => worker(i + 1));
  await Promise.all(jobs);
  await browser.close();

  const safeResults = results.filter(Boolean);
  const accessibleRows = safeResults.filter((r) => r.auditStatus !== "admin_hidden");
  const productsWithHits = accessibleRows.filter((r) => r.hitCount > 0);
  const productsWithoutHits = accessibleRows.length - productsWithHits.length;
  const totalHits = accessibleRows.reduce((sum, row) => sum + row.hitCount, 0);

  const tokenMap = new Map();
  for (const row of accessibleRows) {
    for (const hit of row.hits) {
      const key = hit.token.toLowerCase();
      const item = tokenMap.get(key) || {
        token: hit.token,
        count: 0,
        modules: new Set(),
      };
      item.count += 1;
      item.modules.add(hit.module);
      tokenMap.set(key, item);
    }
  }

  const topTokens = [...tokenMap.values()]
    .map((item) => ({
      token: item.token,
      count: item.count,
      modules: [...item.modules],
    }))
    .sort((a, b) => b.count - a.count || a.token.localeCompare(b.token));

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    sourceInput: path.relative(workspaceRoot, inputPath),
    totalProducts: safeResults.length,
    accessibleProducts: accessibleRows.length,
    productsWithHits: productsWithHits.length,
    productsWithoutHits,
    totalHits,
    adminHiddenProducts: safeResults.filter((r) => r.auditStatus === "admin_hidden").map((r) => ({
      id: r.id,
      url: r.url,
      actualPath: r.actualPath,
      error: r.error,
    })),
    failedProducts: safeResults.filter((r) => r.auditStatus === "failed").map((r) => ({
      id: r.id,
      url: r.url,
      actualPath: r.actualPath,
      error: r.error,
    })),
    topTokens,
    products: [...safeResults].sort((a, b) => b.hitCount - a.hitCount || a.id.localeCompare(b.id)),
  };

  writeJson(outputJsonPath, report);
  writeText(outputMarkdownPath, generateMarkdown(report));

  console.log(
    JSON.stringify(
      {
        input: path.relative(workspaceRoot, inputPath),
        outputJson: path.relative(workspaceRoot, outputJsonPath),
        outputMarkdown: path.relative(workspaceRoot, outputMarkdownPath),
        totalProducts: report.totalProducts,
        accessibleProducts: report.accessibleProducts,
        adminHiddenProducts: report.adminHiddenProducts.length,
        productsWithHits: report.productsWithHits,
        productsWithoutHits: report.productsWithoutHits,
        totalHits: report.totalHits,
        failedProducts: report.failedProducts.length,
        topTokens: report.topTokens.slice(0, 10),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
