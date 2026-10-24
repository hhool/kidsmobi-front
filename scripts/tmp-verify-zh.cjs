// Temp: verify the live /zh edition — hydration, hreflang, language toggle.
const { chromium } = require("playwright");

const BASE = "https://balancebiketoddler.com";

(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 120)));

  // --- 1. Chinese hub ------------------------------------------------------
  await page.goto(`${BASE}/zh/guides`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(4000);
  const hub = await page.evaluate(() => ({
    h1: document.querySelector("h1")?.textContent?.trim().slice(0, 40) || "",
    title: document.title,
    canonical: document.querySelector("link[rel='canonical']")?.getAttribute("href") || "",
    hreflang: [...document.querySelectorAll("link[rel='alternate']")]
      .map((l) => `${l.getAttribute("hreflang")}=${l.getAttribute("href")}`)
      .filter((s) => /en=|zh=|x-default/.test(s)),
    lang: document.documentElement.lang,
  }));
  console.log("zh hub:", JSON.stringify(hub));

  // --- 2. Chinese detail page ---------------------------------------------
  await page.goto(`${BASE}/zh/guides/beginner/stroller-travel-airplane`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(4000);
  const detail = await page.evaluate(() => ({
    h1: document.querySelector("h1")?.textContent?.trim().slice(0, 40) || "",
    title: document.title,
    canonical: document.querySelector("link[rel='canonical']")?.getAttribute("href") || "",
    description: document.querySelector("meta[name='description']")?.getAttribute("content")?.slice(0, 40) || "",
    cjkBody: /[\u4e00-\u9fff]/.test(document.body.innerText.slice(0, 4000)),
  }));
  console.log("zh detail:", JSON.stringify(detail));

  // --- 3. Language toggle navigates to the English twin -------------------
  try {
    const btn = page.locator("button[aria-label*='English'], button[aria-label*='中文']").first();
    if (await btn.count()) {
      await btn.click({ timeout: 4000 });
      await page.waitForTimeout(2500);
      console.log("after toggle -> url:", page.url(), "| title:", await page.title());
    } else {
      console.log("after toggle -> button not found");
    }
  } catch (e) {
    console.log("toggle failed:", String(e.message).slice(0, 100));
  }

  // --- 4. English page keeps its hreflang pair ---------------------------
  await page.goto(`${BASE}/guides/beginner/stroller-travel-airplane`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(3000);
  const en = await page.evaluate(() => ({
    canonical: document.querySelector("link[rel='canonical']")?.getAttribute("href") || "",
    hreflang: [...document.querySelectorAll("link[rel='alternate']")]
      .map((l) => `${l.getAttribute("hreflang")}=${l.getAttribute("href")}`)
      .filter((s) => /en=|zh=|x-default/.test(s)),
  }));
  console.log("en detail:", JSON.stringify(en));
  console.log("pageerrors:", errors);
  await browser.close();
})().catch((e) => { console.error("FAIL", e.message); process.exit(1); });
