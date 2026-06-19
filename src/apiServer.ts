import express from "express";
import { GoogleGenAI } from "@google/genai";
import { guideArticles } from "./data/guidesData";
import { newsArticles } from "./data/newsData";
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
      fs.mkdirSync(dir, { recursive: true });
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
