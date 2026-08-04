import {
  generateAiReply,
  type AiMode,
  type DoctorContext,
  type HistoryMessage,
} from "../src/lib/aiCore";

type ChatRequestBody = {
  history?: HistoryMessage[];
  userMessage?: string;
  doctors?: DoctorContext[];
  language?: string;
  mode?: AiMode;
};

type VercelRequest = {
  method?: string;
  body?: ChatRequestBody;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (data: unknown) => void;
  setHeader: (name: string, value: string) => VercelResponse;
  end: () => void;
};

// Vercel Node.js serverless function
// Environment variable GROQ_API_KEY must be set in:
// Vercel Dashboard → Project → Settings → Environment Variables
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // process.env is available in Vercel Node.js serverless functions
  const groqKey = (process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY)?.trim();

  if (!groqKey) {
    res.status(503).json({
      error:
        "GROQ_API_KEY topilmadi. Vercel Dashboard → Project Settings → Environment Variables bo'limida GROQ_API_KEY ni qo'shing. Groq kalitini https://console.groq.com/keys dan oling.",
    });
    return;
  }

  const {
    history = [],
    userMessage = "",
    doctors = [],
    language = "uz",
    mode = "symptoms",
  } = req.body ?? {};

  if (!userMessage.trim()) {
    res.status(400).json({ error: "userMessage bo'sh bo'lmasligi kerak" });
    return;
  }

  try {
    const { reply, provider } = await generateAiReply({
      mode,
      history,
      userMessage,
      doctors,
      language,
      groqKey,
    });
    res.status(200).json({ reply, provider });
  } catch (error) {
    res.status(502).json({
      error: "Groq AI xatolik yuz berdi",
      details: error instanceof Error ? error.message : "Noma'lum xatolik",
    });
  }
}
