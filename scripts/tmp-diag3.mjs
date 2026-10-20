import { chromium } from "playwright";
const paths = ["/news", "/balance-bike-stability/", "/guides/beginner/balance-bike-size-chart", "/guides/beginner/balance-bike-weight"];
const browser = await chromium.launch({ channel: "chrome", executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
for (const p of paths) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + String(e).slice(0, 150)));
  page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE: " + m.text().slice(0, 150)); });
  const t0 = Date.now();
  let gotoMs = 0, markerMs = -1;
  try {
    await page.goto("https://balancebiketoddler.com" + p, { waitUntil: "load", timeout: 60000 });
    gotoMs = Date.now() - t0;
    try {
      await page.waitForSelector("[data-seo-jsonld]", { timeout: 60000 });
      markerMs = Date.now() - t0;
    } catch {}
  } catch (e) {
    gotoMs = -1;
    errors.push("GOTO: " + String(e).split("\n")[0].slice(0, 100));
  }
  const h1 = await page.$eval("h1", (el) => el.textContent.trim()).catch(() => "(none)");
  console.log(`${p}\n  goto=${gotoMs}ms  marker=${markerMs}ms  h1="${h1.slice(0, 50)}"  errors=${errors.length}`);
  errors.slice(0, 4).forEach((e) => console.log("    " + e));
  await page.close();
}
await browser.close();
