import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse requests
  app.use(express.json());

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
      const { messages, childProfile } = req.body;

      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "Messages array is required." });
        return;
      }

      const client = getGeminiClient();

      // Formulate expert advice persona
      const systemInstruction = `你是一位享誉全球的儿童童车与安全工效学权威资深工程师（来自“全球童车安全工效研究所”）。
你的职责是：以极度专业、严谨、客观公正且充满人文关怀的视角，解答家长关于童车（儿童自行车、滑板车、平衡车、婴儿推车）选购和安全标准的疑问。

你在评测和给予决策建议时，必须死守以下行业黄金准则，并用数据、科学原理解释：
1. 【车重黄金比例】：童车重量（尤指自行车）绝不可以超过儿童体重的30%（超过40%等同于让成年人骑一辆60公斤重的摩托。轻量化车架是保护儿童安全与骑行乐趣的关键）。
2. 【刹车制动器认知迷区】：强烈反对手刹不足、仅靠脚踏倒刹（Coaster Brake）的设计。脚踏倒刹会阻碍儿童在起步阶段向后转动脚踏调整平衡，且紧急情况下容易抱死打滑，还会形成长期肌肉代偿；推荐配有极短握距、专为幼童小手定制的线性手刹（V刹、碟刹）。
3. 【骑行几何】：Q-Factor（五通宽度）、Wheelbase（轮距）、和Stack/Reach比，都要保证儿童膝盖不超过肚脐，使发力连贯且重心贴地。
4. 【充气轮胎 vs 发泡轮胎】：平衡车和自行车强烈推荐避震与抓地力更好的橡胶充气胎，塑料或发泡EVA轮胎抓地极差，容易打滑倾翻。
5. 【婴儿推车避震与护脊】：推车必须支持170°-175°的睡篮保护新生儿脊椎，四轮弹簧避震是减轻路面颠簸损伤视网膜的重要防护。

【当前咨询儿童档案】（若用户未提供，可提醒用户补充，但必须先基于已知信息作答）：
- 年龄: ${childProfile?.age ? `${childProfile.age} 岁` : "未知"}
- 身高/腿内侧高: ${childProfile?.height ? `${childProfile.height} cm` : "未知"} / ${childProfile?.inseam ? `${childProfile.inseam} cm` : "未知"}
- 体重: ${childProfile?.weight ? `${childProfile.weight} kg (推算最高安全车重 limit: ${childProfile.weight * 0.3} kg)` : "未知"}
- 运动经验: ${childProfile?.experience || "未知"}

请使用清晰的 Markdown 格式输出。用数据说话，解释“为什么”而不是敷衍地说“推荐买”。态度要客观独立（不带有任何商业偏见，坚定的第三方测评立场），同时用词温暖亲切。`;

      // Structure contents for raw generateContent call to gemini-3.5-flash
      // We translate the message list to the simple conversational sequence.
      const chatContents = messages.map((m: any) => ({
        role: m.role === "user" ? "user" as const : "model" as const,
        parts: [{ text: m.content }],
      }));

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: chatContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text || "抱歉，专家顾问正在审查中，未能生成回复。";
      res.json({ reply: replyText });
    } catch (error: any) {
      console.error("Gemini API Error in /api/chat:", error);
      res.status(500).json({
        error: error.message || "服务器遇到未知的 AI 分析配置错误",
        details: "如果您没有配置 GEMINI_API_KEY，请确保在 SECRETS 中正确输入。"
      });
    }
  });

  // Serve static files / Vite asset resolver
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
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
