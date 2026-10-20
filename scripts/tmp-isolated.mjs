import { chromium } from "playwright";
const base = "https://balancebiketoddler.com";
const ROUTES = ["/news", "/balance-bike-stability/", "/guides/beginner/balance-bike-size-chart"];
const browser = await chromium.launch({ channel: "chrome", executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
for (const route of ROUTES) {
  let probe = null, res = null, pageErrors = [], navError = null;
  for (let attempt = 1; attempt <= 2 && probe === null; attempt++) {
    const page = await browser.newPage();
    pageErrors = [];
    page.on("pageerror", (err) => pageErrors.push(String(err.message || err).slice(0, 200)));
    const t0 = Date.now();
    try {
      res = await page.goto(base + route, { waitUntil: "load", timeout: 45000 });
      const gotoMs = Date.now() - t0;
      await page.waitForTimeout(3000);
      probe = await page.evaluate(() => {
        const body = document.body?.innerText || "";
        return {
          recovery: body.includes("Page Recovery Mode"),
          h1: document.querySelector("h1")?.textContent?.slice(0, 60) || "(none)",
          mdLeak: (body.match(/^#{2,4}\s+\S/gm) || []).slice(0, 3),
        };
      });
      probe.gotoMs = gotoMs;
    } catch (e) {
      navError = e;
    } finally {
      await page.close();
    }
  }
  const why = navError ? `nav: ${String(navError.message || navError).slice(0, 80)}`
    : probe.recovery ? "recovery-mode"
    : probe.mdLeak?.length ? `markdown leak: ${probe.mdLeak.join(", ")}`
    : pageErrors.length ? pageErrors[0]
    : !res || res.status() >= 400 ? `HTTP ${res?.status()}` : null;
  console.log(`${why ? "[FAIL]" : "[pass]"} ${route}${probe ? ` (goto ${probe.gotoMs}ms)` : ""}${why ? " — " + why : ` — h1: ${probe.h1}`}`);
}
await browser.close();
