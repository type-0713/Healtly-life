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

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();

  if (!geminiKey && !openAiKey) {
    res.status(503).json({ error: "GEMINI_API_KEY yoki OPENAI_API_KEY sozlanmagan" });
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
      geminiKey,
      openAiKey,
    });
    res.status(200).json({ reply, provider });
  } catch (error) {
    res.status(502).json({
      error: "AI xatolik",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
