// Vercel Node.js Serverless Function
// Set GROQ_API_KEY in: Vercel Dashboard -> Project Settings -> Environment Variables

type GroqRole = "system" | "user" | "assistant";
type GroqMessage = { role: GroqRole; content: string };
type AiMode = "symptoms" | "doctor" | "drugs" | "risk" | "imaging";

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

interface DoctorContext {
  name: string;
  specialty: string;
  region: string;
  clinic: string;
  address: string;
  rating: number;
}

interface ChatRequestBody {
  history?: HistoryMessage[];
  userMessage?: string;
  doctors?: DoctorContext[];
  language?: string;
  mode?: AiMode;
}

const VALID_MODES: AiMode[] = ["symptoms", "doctor", "drugs", "risk", "imaging"];

const modeInstructions: Record<AiMode, string> = {
  symptoms: `Simptomlarni tahlil qiling, ehtimoliy sabablarni qisqacha ayting, qaysi mutaxassislikka murojaat qilish kerakligini tavsiya qiling. Og'ir belgilar bo'lsa darhol 103 chaqirishni ta'kidlang.`,
  doctor: `Sog'liqni saqlash, profilaktika va umumiy tibbiy savollarga shifokor yordamchisi sifatida javob bering. Aniq tashxis qo'ymang.`,
  drugs: `Dorilar o'zaro ta'siri, dozalar va ehtiyot choralari haqida umumiy maslahat bering. Hech qachon dori dozasini o'zgartirishni tavsiya qilmang.`,
  risk: `Simptomlar, yosh va xronik kasalliklar asosida kasallik xavfi darajasini baholang. Yuqori xavfda 103 ni ta'kidlang.`,
  imaging: `Rentgen, MRT, KT yoki UTT natijalarini sodda tilda tushuntiring. Aniq tashxis qo'ymang.`,
};

function buildSystemPrompt(mode: AiMode, doctors: DoctorContext[], language: string): string {
  const langHint =
    language === "ru"
      ? "Javoblarni rus tilida bering."
      : language === "en"
        ? "Respond in English."
        : "Javoblarni o'zbek tilida bering.";

  const doctorList = doctors
    .slice(0, 8)
    .map((d) => `- ${d.name} | ${d.specialty} | ${d.clinic}`)
    .join("\n");

  return `Siz MedElite tibbiy platformasining AI yordamchisisiz. ${langHint}

Vazifa: ${modeInstructions[mode]}

Qoidalar:
- Hech qachon aniq tashxis qo'ymang.
- Javob qisqa va amaliy bo'lsin (3-6 jumla).
- Tibbiy favqulodda holatlarda 103 raqamini eslatib o'ting.

${doctorList ? `Mavjud shifokorlar:\n${doctorList}` : ""}`;
}

function buildMessages(
  systemPrompt: string,
  history: HistoryMessage[],
  userMessage: string,
): GroqMessage[] {
  const safeHistory: GroqMessage[] = history.slice(-6).map((m) => ({
    role: (m.role === "user" ? "user" : "assistant") as GroqRole,
    content: String(m.content).slice(0, 800),
  }));

  return [
    { role: "system" as GroqRole, content: systemPrompt },
    ...safeHistory,
    { role: "user" as GroqRole, content: String(userMessage).slice(0, 1000) },
  ];
}

async function callGroq(apiKey: string, messages: GroqMessage[]): Promise<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.6,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Groq returned empty response");
  return content;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  // CORS
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

  // API key — set in Vercel Environment Variables dashboard
  const groqKey = (
    (process.env.GROQ_API_KEY || "") ||
    (process.env.VITE_GROQ_API_KEY || "")
  ).trim();

  if (!groqKey) {
    res.status(503).json({
      error: "GROQ_API_KEY not configured. Add it in Vercel Dashboard → Project Settings → Environment Variables.",
    });
    return;
  }

  // Parse body safely
  let body: ChatRequestBody = {};
  try {
    if (typeof req.body === "string") {
      body = JSON.parse(req.body) as ChatRequestBody;
    } else if (req.body && typeof req.body === "object") {
      body = req.body as ChatRequestBody;
    }
  } catch {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  const {
    history = [],
    userMessage = "",
    doctors = [],
    language = "uz",
    mode = "symptoms",
  } = body;

  const safeMode: AiMode = VALID_MODES.includes(mode as AiMode) ? (mode as AiMode) : "symptoms";

  if (!String(userMessage).trim()) {
    res.status(400).json({ error: "userMessage is required" });
    return;
  }

  try {
    const systemPrompt = buildSystemPrompt(safeMode, Array.isArray(doctors) ? doctors : [], String(language));
    const messages = buildMessages(systemPrompt, Array.isArray(history) ? history : [], String(userMessage));
    const reply = await callGroq(groqKey, messages);
    res.status(200).json({ reply, provider: "groq" });
  } catch (error) {
    console.error("[api/chat] error:", error);
    res.status(502).json({
      error: "AI service error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
