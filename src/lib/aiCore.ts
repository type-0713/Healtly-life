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

type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

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

const buildGroqMessages = (systemPrompt: string, history: HistoryMessage[], userMessage: string): GroqMessage[] => [
  { role: "system", content: systemPrompt },
  ...history.map((message): GroqMessage => {
    const role: GroqMessage["role"] = message.role === "user" ? "user" : "assistant";
    return {
      role,
      content: message.content,
    };
  }),
  { role: "user", content: userMessage },
];

export const callGroqApi = async (apiKey: string, systemPrompt: string, history: HistoryMessage[], userMessage: string, retries = 2): Promise<string> => {
  const messages = buildGroqMessages(systemPrompt, history, userMessage);

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages,
          temperature: 0.65,
          max_tokens: 900,
        }),
      });

      if (response.status === 429 && attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error [${response.status}]: ${errorText.slice(0, 120)}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) {
        throw new Error("Groq bo'sh javob qaytardi");
      }

      return text;
    } catch (err) {
      if (attempt === retries - 1) throw err;
    }
  }

  throw new Error("Groq API qayta ulanish chegarasi tugadi");
};

export type AiProvider = "groq" | "fallback";

const generateMedicalFallbackReply = (userMessage: string, doctors: DoctorContext[], language: string) => {
  const doc = doctors[0] || { name: "Dr. Alisher Karimov", specialty: "Terapevt" };
  if (language === "ru") {
    return `[MedElite AI Консультант]\nПо вашему запросу "${userMessage}":\nРекомендуется пройти первичный осмотр у специалиста (${doc.specialty} — ${doc.name}). При наличии острой боли или высокой температуры немедленно обратитесь в службу 103.`;
  }
  if (language === "en") {
    return `[MedElite AI Assistant]\nRegarding your query "${userMessage}":\nWe recommend a clinical evaluation with our specialist (${doc.specialty} — ${doc.name}). If you experience severe pain, shortness of breath, or emergency symptoms, please call 103 immediately.`;
  }
  return `[MedElite AI Tibbiy Maslahatchi]\n"${userMessage}" bo'yicha tibbiy tavsiya:\nKo'rsatilgan belgilar bo'yicha ${doc.specialty} (${doc.name}) ko'rigidan o'tishingiz tavsiya etiladi. Og'ir og'riq yoki shoshilinch holatlarda darhol 103 tibbiy xizmatiga murojaat qiling.`;
};

export const generateAiReply = async ({
  mode,
  history,
  userMessage,
  doctors,
  language,
  groqKey,
}: {
  mode: AiMode;
  history: HistoryMessage[];
  userMessage: string;
  doctors: DoctorContext[];
  language: string;
  groqKey?: string;
}): Promise<{ reply: string; provider: AiProvider }> => {
  const systemPrompt = buildSystemPrompt(mode, doctors, language);

  if (groqKey) {
    try {
      const reply = await callGroqApi(groqKey, systemPrompt, history, userMessage);
      return { reply, provider: "groq" };
    } catch {
      return {
        reply: generateMedicalFallbackReply(userMessage, doctors, language),
        provider: "fallback",
      };
    }
  }

  return {
    reply: generateMedicalFallbackReply(userMessage, doctors, language),
    provider: "fallback",
  };
};
