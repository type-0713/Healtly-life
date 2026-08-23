import type { Doctor } from "../context/AppContext";
import {
  generateAiReply,
  type AiMode,
  type AiProvider,
  type HistoryMessage,
} from "./aiCore";
import { inferSpecialtiesFromText, type RankedDoctor } from "./specialtyMatch";
import { formatDistance } from "./geo";

export type { AiMode, AiProvider };

export type ChatMessage = HistoryMessage & {
  id: string;
  doctors?: RankedDoctor[];
  timestamp: string;
  provider?: AiProvider;
};

const createMessageId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const toDoctorContext = (doctors: Doctor[]) =>
  doctors.map((doctor) => ({
    name: doctor.name,
    specialty: doctor.specialty,
    region: doctor.region,
    clinic: doctor.clinic,
    address: doctor.address,
    rating: doctor.rating,
  }));

// Serverless API orqali chaqirish (production)
const callAiViaApi = async (
  history: HistoryMessage[],
  userMessage: string,
  doctors: Doctor[],
  language: string,
  mode: AiMode,
) => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      history,
      userMessage,
      doctors: toDoctorContext(doctors),
      language,
      mode,
    }),
  });

  let data: {
    reply?: string;
    provider?: AiProvider;
    error?: string;
  } = {};

  try {
    data = (await response.json()) as typeof data;
  } catch {
    // A proxy or deployment error can return non-JSON. The fallback below handles it.
  }

  if (!response.ok) {
    throw new Error(data.error ?? `API xatolik: ${response.status}`);
  }

  if (!data.reply) {
    throw new Error("API javob qaytarmadi");
  }

  const provider: AiProvider = data.provider === "fallback" ? "fallback" : "groq";
  return { reply: data.reply, provider };
};

const buildFallbackReply = (
  userMessage: string,
  rankedDoctors: RankedDoctor[],
  language: string,
  mode: AiMode,
) => {
  const specialties = inferSpecialtiesFromText(userMessage);
  const topDoctor = rankedDoctors[0]?.doctor;
  const distance = rankedDoctors[0]?.distanceKm;

  if (mode === "drugs") {
    if (language === "ru") {
      return "Опишите все принимаемые препараты (название и дозу). Я дам общую информацию о возможных взаимодействиях. Это не заменяет консультацию врача или фармацевта.";
    }
    if (language === "en") {
      return "List all medications you take (name and dose). I can share general interaction guidance. This does not replace advice from a doctor or pharmacist.";
    }
    return "Qaysi dorilarni qabul qilayotganingizni (nomi va dozasi bilan) yozing. Men umumiy o'zaro ta'sir haqida maslahat beraman. Bu shifokor yoki dorixona maslahatini almashtirmaydi.";
  }

  if (mode === "risk") {
    if (language === "ru") {
      return "Опишите симптомы, возраст и хронические заболевания. Я оценю предварительный уровень риска. При сильных симптомах — звоните 103.";
    }
    if (language === "en") {
      return "Describe your symptoms, age, and chronic conditions. I'll give a preliminary risk level. For severe symptoms, call emergency services.";
    }
    return "Simptomlar, yosh va xronik kasalliklaringizni yozing. Men dastlabki xavf darajasini baholayman. Og'ir holatda 103 ga qo'ng'iroq qiling.";
  }

  if (mode === "imaging") {
    if (language === "ru") {
      return "Опишите текст заключения снимка (МРТ, рентген, КТ). Я объясню простым языком. Окончательное решение — только у врача.";
    }
    if (language === "en") {
      return "Describe the imaging report text (MRI, X-ray, CT). I'll explain in plain language. Final decisions belong to your doctor.";
    }
    return "Rentgen/MRT/KT xulosasini matn ko'rinishida yozing. Men sodda tilda tushuntiraman. Yakuniy qaror shifokorga tegishli.";
  }

  if (language === "ru") {
    return [
      `По описанным симптомам рекомендуем обратиться к ${specialties.join(", ")}.`,
      topDoctor
        ? `Ближайший подходящий врач: ${topDoctor.name} (${topDoctor.specialty}, ${topDoctor.clinic})${distance !== null && distance !== undefined ? ` — ~${formatDistance(distance)}` : ""}.`
        : "Откройте раздел «Запись», чтобы выбрать врача.",
      "Это предварительная рекомендация, не заменяет очный осмотр. При сильной боли или ухудшении — звоните 103.",
    ].join("\n\n");
  }

  if (language === "en") {
    return [
      `Based on your symptoms, we recommend seeing: ${specialties.join(", ")}.`,
      topDoctor
        ? `Nearest matching doctor: ${topDoctor.name} (${topDoctor.specialty}, ${topDoctor.clinic})${distance !== null && distance !== undefined ? ` — ~${formatDistance(distance)}` : ""}.`
        : "Open the booking section to choose a doctor.",
      "This is preliminary guidance, not a diagnosis. For severe symptoms, call emergency services (103).",
    ].join("\n\n");
  }

  return [
    `Simptomlaringizga qarab ${specialties.join(", ")} mutaxassisligiga murojaat qilishingiz tavsiya etiladi.`,
    topDoctor
      ? `Eng mos shifokor: ${topDoctor.name} (${topDoctor.specialty}, ${topDoctor.clinic})${distance !== null && distance !== undefined ? ` — taxminan ${formatDistance(distance)}` : ""}.`
      : "Shifokor tanlash uchun «Band qilish» bo'limiga o'ting.",
    "Bu dastlabki maslahat, aniq tashxis emas. Og'ir holatda 103 raqamiga qo'ng'iroq qiling.",
  ].join("\n\n");
};

export type AiReplyResult = {
  reply: string;
  provider: AiProvider;
};

export const sendAiMessage = async ({
  history,
  userMessage,
  doctors,
  rankedDoctors,
  language,
  mode = "symptoms",
}: {
  history: ChatMessage[];
  userMessage: string;
  doctors: Doctor[];
  rankedDoctors: RankedDoctor[];
  language: string;
  mode?: AiMode;
}): Promise<AiReplyResult> => {
  const historyPayload = history.map(({ role, content }) => ({ role, content }));

  // Groq API kaliti (VITE_ prefiksi bilan — Vite build vaqtida kiritadi)
  try {
    return await callAiViaApi(historyPayload, userMessage, doctors, language, mode);
  } catch (error) {
    console.warn("[AI] Server API unavailable, using local fallback:", error);
    const localFallback = await generateAiReply({
      mode,
      history: historyPayload,
      userMessage,
      doctors: toDoctorContext(doctors),
      language,
    });

    return {
      reply: localFallback.reply || buildFallbackReply(userMessage, rankedDoctors, language, mode),
      provider: "fallback",
    };
  }
};

export const createChatMessage = (
  role: ChatMessage["role"],
  content: string,
  doctors?: RankedDoctor[],
  provider?: AiProvider,
): ChatMessage => ({
  id: createMessageId(),
  role,
  content,
  doctors,
  timestamp: new Date().toISOString(),
  provider,
});

export const getModePrompts = (mode: AiMode, language: string): string[] => {
  const prompts: Record<AiMode, Record<string, string[]>> = {
    symptoms: {
      uz: [
        "Boshim og'riyapti va ko'zim qorong'ulashyapti",
        "Yurak sohasida og'riq va nafas qisishi",
        "Bolamda isitma va yo'tal bor",
      ],
      ru: [
        "Головная боль и темнеет в глазах",
        "Боль в области сердца и одышка",
        "У ребёнка температура и кашель",
      ],
      en: [
        "Headache and vision going dark",
        "Chest pain and shortness of breath",
        "My child has fever and cough",
      ],
    },
    doctor: {
      uz: [
        "Qandli diabet uchun qanday profilaktika kerak?",
        "Qon bosimi qanday o'lchanadi?",
        "Yiliga qaysi tahlillar kerak?",
      ],
      ru: [
        "Какая профилактика нужна при диабете?",
        "Как правильно измерять давление?",
        "Какие анализы сдавать ежегодно?",
      ],
      en: [
        "What prevention helps with diabetes?",
        "How should I measure blood pressure?",
        "Which annual checkups do I need?",
      ],
    },
    drugs: {
      uz: [
        "Paratsetamol va ibuprofen bir vaqtda ichsa bo'ladimi?",
        "Antibiotik va probiotik qanday qabul qilinadi?",
        "Qon bosimi dori va vitamin D o'zaro ta'siri",
      ],
      ru: [
        "Можно ли принимать парацетамол и ибупрофен вместе?",
        "Как сочетать антибиотик и пробиотик?",
        "Взаимодействие от давления и витамина D",
      ],
      en: [
        "Can I take paracetamol and ibuprofen together?",
        "How to combine antibiotic and probiotic?",
        "Blood pressure meds and vitamin D interaction",
      ],
    },
    risk: {
      uz: [
        "45 yosh, qandli diabet, ko'krak og'rig'i — xavf darajasi?",
        "3 kun isitma, 38.5°C, nafas qisilmaydi",
        "Oilada yurak kasalligi, sport qilganda charchoq",
      ],
      ru: [
        "45 лет, диабет, боль в груди — уровень риска?",
        "3 дня температура 38.5, без одышки",
        "Семейная история сердца, усталость при спорте",
      ],
      en: [
        "Age 45, diabetes, chest pain — risk level?",
        "3 days fever at 38.5°C, no breathing issues",
        "Family heart history, fatigue during exercise",
      ],
    },
    imaging: {
      uz: [
        "Rentgende o'pkada soyalanish bor deb yozilgan",
        "MRT: bel disk prolapsi L4-L5",
        "UTT: o't pufagi toshlari ko'rsatilgan",
      ],
      ru: [
        "На рентгене затемнение в лёгких",
        "МРТ: протрузия диска L4-L5",
        "УЗИ: камни в желчном пузыре",
      ],
      en: [
        "X-ray shows lung shadowing",
        "MRI: L4-L5 disc protrusion",
        "Ultrasound: gallbladder stones noted",
      ],
    },
  };

  return prompts[mode][language] ?? prompts[mode].uz;
};
