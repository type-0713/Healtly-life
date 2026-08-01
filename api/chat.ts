declare const process: {
  env: Record<string, string | undefined>;
};

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

export default async function handler(
  req: { method?: string; body?: ChatRequestBody },
  res: { status: (code: number) => { json: (data: unknown) => void } },
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const groqKey = (process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY)?.trim();
  if (!groqKey) {
    res.status(503).json({ error: "Groq API kaliti sozlanmagan. .env.local fayliga VITE_GROQ_API_KEY ni joylashtiring." });
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
    res.status(400).json({ error: "userMessage talab qilinadi" });
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
      error: "AI xatolik",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
