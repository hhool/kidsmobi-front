import express from "express";
import { app } from "./src/apiServer";
import path from "path";
import { createServer as createViteServer } from "vite";

function renderBotFallbackHtml(requestPath: string) {
  const cleanPath = requestPath && requestPath !== "/" ? requestPath : "/";
  const title = "BalanceBikeToddler | Kids bike, stroller, scooter & car seat safety reviews";
  const description = "Independent, lab-tested guidance for kids bikes, balance bikes, scooters, jogging strollers, and child safety seats.";
  const canonical = `https://balancebiketoddler.com${cleanPath}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    <link rel="canonical" href="${canonical}" />
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.7; max-width: 960px; margin: 0 auto; padding: 40px 20px; color: #0f172a;">
    <main>
      <h1 style="font-size: clamp(2rem, 4vw, 3rem); margin-bottom: 16px;">BalanceBikeToddler</h1>
      <p style="font-size: 1.1rem; margin-bottom: 14px;">
        Independent reviews and buying guidance for kids bikes, balance bikes, scooters, jogging strollers,
        and child safety seats.
      </p>
      <p style="margin-bottom: 16px;">
        We compare safety, fit, braking, stability, and everyday usability to help parents pick the right
        product with confidence.
      </p>
      <ul style="padding-left: 1.2rem; margin-bottom: 18px;">
        <li><a href="https://balancebiketoddler.com/">Home</a></li>
        <li><a href="https://balancebiketoddler.com/reviews">Reviews</a></li>
        <li><a href="https://balancebiketoddler.com/guides">Guides</a></li>
        <li><a href="https://balancebiketoddler.com/about">About</a></li>
        <li><a href="https://balancebiketoddler.com/transparency/privacy-policy">Privacy Policy</a></li>
      </ul>
      <p>
        Contact: <a href="mailto:hello@balancebiketoddler.com">hello@balancebiketoddler.com</a>
      </p>
    </main>
  </body>
</html>`;
}

async function startServer() {
  const PORT = 3000;

  app.use((req, res, next) => {
    const userAgent = String(req.headers["user-agent"] || "").toLowerCase();
    const isBotLike = /(gptbot|claudebot|perplexity|googlebot|bingbot|slurp|duckduckbot|facebookexternalhit|applebot|yandex|semrush|ahrefsbot|mj12bot)/i.test(userAgent);
    const acceptsHtml = req.accepts("html");
    const isApiRoute = req.path.startsWith("/api");

    if (req.method === "GET" && isBotLike && acceptsHtml && !isApiRoute) {
      res.status(200).type("html").send(renderBotFallbackHtml(req.path));
      return;
    }

    next();
  });

  // Serve static files / Vite asset resolver
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve from the dist folder relative to this file
    // Since this file is bundled into dist/server.cjs, dist is the current directory
    const distPath = path.join(process.cwd(), "dist");
    
    // Check if dist/index.html exists to avoid crashing
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Professional KidBikeEval Server booted securely on http://localhost:${PORT}`);
  });
}

startServer();
