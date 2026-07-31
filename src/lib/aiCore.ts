export type AiMode = "symptoms" | "doctor" | "drugs" | "risk" | "imaging";

export type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type DoctorContext = {
  name: string;
  specialty: string;
  region: string;
  clinic: string;
  address: string;
  rating: number;
};

type GeminiPart = { text: string };
type GeminiContent = { role: string; parts: GeminiPart[] };

const languageHint = (language: string) => {
  if (language === "ru") {
    return "Javoblarni rus tilida bering.";
  }
  if (language === "en") {
    return "Respond in English.";
  }
  return "Javoblarni o'zbek tilida bering.";
};

const modeInstructions: Record<AiMode, string> = {
  symptoms: `Simptomlarni tahlil qiling, ehtimoliy sabablarni qisqacha ayting, qaysi mutaxassislikka murojaat qilish kerakligini tavsiya qiling.
Og'ir belgilar (nafas qisishi, ko'krak og'rig'i, hushdan ketish) bo'lsa darhol 103 chaqirishni ta'kidlang.`,
  doctor: `Sog'liqni saqlash, profilaktika, qabulga tayyorgarlik va umumiy tibbiy savollarga shifokor yordamchisi sifatida javob bering.
Aniq tashxis qo'ymang, kerak bo'lsa shifokor ko'rigiga yo'naltiring.`,
  drugs: `Foydalanuvchi qaysi dorilarni qabul qilayotganini so'rang yoki ular bergan ro'yxat bo'yicha o'zaro ta'sir, dozalar va ehtiyot choralari haqida umumiy maslahat bering.
Hech qachon dori dozasini o'zgartirishni tavsiya qilmang — shifokor yoki dorixona mutaxassisiga murojaat qilishni ayting.`,
  risk: `Simptomlar, yosh, xronik kasalliklar va oilaviy anamnez asosida kasallik xavfi darajasini (past/o'rta/yuqori) baholang.
Har bir baho uchun nima qilish kerakligini amaliy qadamlar bilan yozing. Yuqori xavfda 103 ni ta'kidlang.`,
  imaging: `Rentgen, MRT, KT yoki UTT natijalarining matniy tavsifini sodda tilda tushuntiring.
Aniq tashxis qo'ymang. Nima uchun shifokor ko'rigi muhimligini va keyingi qadamlarni ayting.`,
};

export const buildSystemPrompt = (
  mode: AiMode,
  doctors: DoctorContext[],
  language: string,
) => {
  const doctorList = doctors
    .slice(0, 12)
    .map(
      (doctor) =>
        `- ${doctor.name} | ${doctor.specialty} | ${doctor.region} | ${doctor.clinic} | ${doctor.address} | reyting ${doctor.rating.toFixed(1)}`,
    )
    .join("\n");

  return `Siz MedElite tibbiy platformasining AI yordamchisisiz. ${languageHint(language)}

Vazifa: ${modeInstructions[mode]}

Qoidalar:
- Hech qachon aniq tashxis qo'ymang — faqat ehtimoliy yo'nalish va maslahat.
- Javob qisqa, tushunarli va amaliy bo'lsin (3-8 jumla).
- Tibbiy favqulodda holatlarda 103 raqamini eslatib o'ting.
- Platformadagi mavjud shifokorlar ro'yxatidan mos mutaxassislikni tavsiya qiling.

Mavjud shifokorlar:
${doctorList || "- Hozircha shifokorlar ro'yxati yuklanmagan"}`;
};

export const buildGeminiContents = (
  systemPrompt: string,
  history: HistoryMessage[],
  userMessage: string,
): GeminiContent[] => [
  { role: "user", parts: [{ text: systemPrompt }] },
  {
    role: "model",
    parts: [{ text: "Tushundim. MedElite AI yordamchisi sifatida xavfsiz va foydali maslahat beraman." }],
  },
  ...history.map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: [{ text: message.content }],
  })),
  { role: "user", parts: [{ text: userMessage }] },
];

export const callGeminiApi = async (apiKey: string, contents: GeminiContent[]) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.65, maxOutputTokens: 900 },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API xatolik: ${response.status} ${errorText.slice(0, 120)}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error("Gemini bo'sh javob qaytardi");
  }

  return text;
};

export const callOpenAiApi = async (
  apiKey: string,
  systemPrompt: string,
  history: HistoryMessage[],
  userMessage: string,
) => {
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.map((message) => ({
      role: message.role === "user" ? ("user" as const) : ("assistant" as const),
      content: message.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.65,
      max_tokens: 900,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API xatolik: ${response.status} ${errorText.slice(0, 120)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("OpenAI bo'sh javob qaytardi");
  }

  return text;
};

export type AiProvider = "gemini" | "openai" | "fallback";

export const generateAiReply = async ({
  mode,
  history,
  userMessage,
  doctors,
  language,
  geminiKey,
  openAiKey,
}: {
  mode: AiMode;
  history: HistoryMessage[];
  userMessage: string;
  doctors: DoctorContext[];
  language: string;
  geminiKey?: string;
  openAiKey?: string;
}): Promise<{ reply: string; provider: AiProvider }> => {
  const systemPrompt = buildSystemPrompt(mode, doctors, language);
  const contents = buildGeminiContents(systemPrompt, history, userMessage);

  if (geminiKey) {
    try {
      const reply = await callGeminiApi(geminiKey, contents);
      return { reply, provider: "gemini" };
    } catch (geminiError) {
      if (openAiKey) {
        const reply = await callOpenAiApi(openAiKey, systemPrompt, history, userMessage);
        return { reply, provider: "openai" };
      }
      throw geminiError;
    }
  }

  if (openAiKey) {
    const reply = await callOpenAiApi(openAiKey, systemPrompt, history, userMessage);
    return { reply, provider: "openai" };
  }

  throw new Error("AI kalitlari sozlanmagan");
};
