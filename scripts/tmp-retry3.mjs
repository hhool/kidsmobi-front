import { chromium } from "playwright";
const paths = ["/news", "/balance-bike-stability/", "/guides/beginner/balance-bike-size-chart"];
const browser = await chromium.launch({ channel: "chrome", executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
for (const p of paths) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const page = await browser.newPage();
    try {
      await page.goto("https://balancebiketoddler.com" + p, { waitUntil: "load", timeout: 45000 });
      await page.waitForSelector("[data-seo-jsonld]", { timeout: 20000 });
      const h1 = await page.$eval("h1", (el) => el.textContent.trim()).catch(() => "(none)");
      const h1Count = await page.$$eval("h1", (els) => els.length);
      const md = await page.evaluate(() => document.body.innerText.includes("## "));
      console.log(`[pass] ${p} (attempt ${attempt}) - h1x${h1Count}: ${h1.slice(0, 60)} | mdLeak=${md}`);
      await page.close();
      break;
    } catch (e) {
      console.log(`[retry] ${p} attempt ${attempt}: ${String(e).split("\n")[0].slice(0, 80)}`);
      await page.close();
      if (attempt === 3) console.log(`[FAIL] ${p} after 3 attempts`);
    }
  }
}
await browser.close();
