import type { Language } from "../context/I18nContext";
import type { AiMode } from "../lib/aiCore";

type ModeCopy = {
  label: string;
  title: string;
  description: string;
  placeholder: string;
  emptyState: string;
};

export const aiAssistantCopy: Record<
  Language,
  {
    title: string;
    description: string;
    chip: string;
    heroTitle: string;
    heroAccent: string;
    heroText: string;
    send: string;
    thinking: string;
    location: string;
    locationActive: string;
    locationError: string;
    emergency: string;
    disclaimer: string;
    suggested: string;
    recommendedDoctors: string;
    bookDoctor: string;
    viewMap: string;
    distance: string;
    backHome: string;
    emptyState: string;
    aiPowered: string;
    offlineMode: string;
    modes: Record<AiMode, ModeCopy>;
    features: string[];
  }
> = {
  uz: {
    title: "MedElite AI Yordamchi",
    description: "Simptomlaringizni tahlil qiling va mos shifokorni toping.",
    chip: "AI tibbiy yordamchi",
    heroTitle: "Sog'liqni saqlash uchun",
    heroAccent: "AI yordamchi",
    heroText:
      "Simptom tahlili, shifokor maslahati, dorilar tekshiruvi, xavf baholash va tasvir tahlili — barchasi bir joyda.",
    send: "Yuborish",
    thinking: "AI o'ylamoqda...",
    location: "Joylashuv",
    locationActive: "Joylashuv faol",
    locationError: "Joylashuv aniqlanmadi",
    emergency: "Og'ir holatda 103 raqamiga qo'ng'iroq qiling!",
    disclaimer: "Bu dastlabki maslahat, aniq tashxis emas. Shifokor ko'rigiga boring.",
    suggested: "Tez savollar",
    recommendedDoctors: "Tavsiya etilgan shifokorlar",
    bookDoctor: "Band qilish",
    viewMap: "Xaritada",
    distance: "Masofa",
    backHome: "Bosh sahifa",
    emptyState: "Savolingizni yozing yoki tez savollardan birini tanlang.",
    aiPowered: "Gemini / GPT AI",
    offlineMode: "Offline rejim (API kalit kerak)",
    modes: {
      symptoms: {
        label: "Simptom",
        title: "AI Simptom Tahlili",
        description: "Simptomlaringizni yozing — AI mutaxassislik va keyingi qadamni tavsiya qiladi.",
        placeholder: "Simptomlaringizni yozing... masalan: bosh og'rig'i, isitma",
        emptyState: "Simptomlaringizni yozing yoki tez savollardan birini tanlang.",
      },
      doctor: {
        label: "Shifokor",
        title: "AI Shifokor Yordamchisi",
        description: "Profilaktika, tahlillar va sog'liqni saqlash bo'yicha savollaringizga javob oling.",
        placeholder: "Sog'liq bo'yicha savolingizni yozing...",
        emptyState: "Shifokor yordamchisiga savol bering.",
      },
      drugs: {
        label: "Dorilar",
        title: "Dorilar O'zaro Ta'siri",
        description: "Qabul qilayotgan dorilaringiz ro'yxatini yozing — AI o'zaro ta'sir haqida maslahat beradi.",
        placeholder: "Dorilar ro'yxatini yozing... masalan: paratsetamol, amoksitsillin",
        emptyState: "Dorilar nomi va dozasini yozing.",
      },
      risk: {
        label: "Xavf",
        title: "Kasallik Xavfi Baholash",
        description: "Simptomlar, yosh va xronik kasalliklaringiz asosida dastlabki xavf darajasini baholang.",
        placeholder: "Yosh, simptomlar va kasallik tarixini yozing...",
        emptyState: "Xavf baholash uchun ma'lumotlaringizni kiriting.",
      },
      imaging: {
        label: "Tasvir",
        title: "Rentgen / MRT Tahlili",
        description: "Rentgen, MRT yoki UTT xulosasini matn ko'rinishida yozing — AI sodda tilda tushuntiradi.",
        placeholder: "Tasvir xulosasini yozing... masalan: o'pkada soyalanish",
        emptyState: "Tibbiy tasvir xulosasini matn ko'rinishida kiriting.",
      },
    },
    features: [
      "AI simptom tahlili",
      "Shifokor yordamchisi",
      "Dorilar o'zaro ta'siri",
      "Xavf baholash",
      "Rentgen/MRT tushuntirish",
    ],
  },
  ru: {
    title: "MedElite AI Помощник",
    description: "Проанализируйте симптомы и найдите подходящего врача.",
    chip: "AI медицинский помощник",
    heroTitle: "AI для",
    heroAccent: "здоровья",
    heroText:
      "Анализ симптомов, помощь врача, проверка лекарств, оценка риска и расшифровка снимков — всё в одном месте.",
    send: "Отправить",
    thinking: "AI думает...",
    location: "Геолокация",
    locationActive: "Геолокация активна",
    locationError: "Геолокация недоступна",
    emergency: "При тяжёлом состоянии звоните 103!",
    disclaimer: "Это предварительная рекомендация, не диагноз. Обратитесь к врачу.",
    suggested: "Быстрые вопросы",
    recommendedDoctors: "Рекомендуемые врачи",
    bookDoctor: "Записаться",
    viewMap: "На карте",
    distance: "Расстояние",
    backHome: "Главная",
    emptyState: "Задайте вопрос или выберите быстрый вариант.",
    aiPowered: "Gemini / GPT AI",
    offlineMode: "Офлайн режим (нужен API ключ)",
    modes: {
      symptoms: {
        label: "Симптомы",
        title: "AI Анализ симптомов",
        description: "Опишите симптомы — AI порекомендует специалиста и следующие шаги.",
        placeholder: "Опишите симптомы... например: головная боль, температура",
        emptyState: "Опишите симптомы или выберите быстрый вопрос.",
      },
      doctor: {
        label: "Врач",
        title: "AI Помощник врача",
        description: "Задавайте вопросы о профилактике, анализах и здоровом образе жизни.",
        placeholder: "Задайте вопрос о здоровье...",
        emptyState: "Задайте вопрос AI-помощнику.",
      },
      drugs: {
        label: "Лекарства",
        title: "Взаимодействие лекарств",
        description: "Перечислите принимаемые препараты — AI подскажет о возможных взаимодействиях.",
        placeholder: "Список лекарств... например: парацетамол, амоксициллин",
        emptyState: "Укажите названия и дозы лекарств.",
      },
      risk: {
        label: "Риск",
        title: "Оценка риска заболевания",
        description: "На основе симптомов, возраста и хронических болезней оцените предварительный риск.",
        placeholder: "Возраст, симптомы и история болезней...",
        emptyState: "Введите данные для оценки риска.",
      },
      imaging: {
        label: "Снимки",
        title: "Рентген / МРТ анализ",
        description: "Вставьте текст заключения снимка — AI объяснит простым языком.",
        placeholder: "Текст заключения... например: затемнение в лёгких",
        emptyState: "Введите текст заключения снимка.",
      },
    },
    features: [
      "AI анализ симптомов",
      "Помощник врача",
      "Взаимодействие лекарств",
      "Оценка риска",
      "Расшифровка снимков",
    ],
  },
  en: {
    title: "MedElite AI Assistant",
    description: "Analyze your symptoms and find the right doctor.",
    chip: "AI medical assistant",
    heroTitle: "Healthcare",
    heroAccent: "AI assistant",
    heroText:
      "Symptom analysis, doctor assistant, drug interactions, risk assessment, and imaging interpretation — all in one place.",
    send: "Send",
    thinking: "AI is thinking...",
    location: "Location",
    locationActive: "Location active",
    locationError: "Location unavailable",
    emergency: "For severe symptoms, call emergency services (103)!",
    disclaimer: "This is preliminary guidance, not a diagnosis. See a doctor.",
    suggested: "Quick questions",
    recommendedDoctors: "Recommended doctors",
    bookDoctor: "Book appointment",
    viewMap: "View map",
    distance: "Distance",
    backHome: "Home",
    emptyState: "Ask a question or pick a quick prompt.",
    aiPowered: "Gemini / GPT AI",
    offlineMode: "Offline mode (API key required)",
    modes: {
      symptoms: {
        label: "Symptoms",
        title: "AI Symptom Analysis",
        description: "Describe your symptoms — AI recommends a specialty and next steps.",
        placeholder: "Describe your symptoms... e.g. headache, fever",
        emptyState: "Describe symptoms or pick a quick question.",
      },
      doctor: {
        label: "Doctor",
        title: "AI Doctor Assistant",
        description: "Ask about prevention, checkups, and healthy lifestyle guidance.",
        placeholder: "Ask a health question...",
        emptyState: "Ask the doctor assistant a question.",
      },
      drugs: {
        label: "Drugs",
        title: "Drug Interaction Check",
        description: "List your medications — AI shares general interaction guidance.",
        placeholder: "List medications... e.g. paracetamol, amoxicillin",
        emptyState: "Enter drug names and doses.",
      },
      risk: {
        label: "Risk",
        title: "Disease Risk Assessment",
        description: "Based on symptoms, age, and chronic conditions, get a preliminary risk level.",
        placeholder: "Age, symptoms, and medical history...",
        emptyState: "Enter details for risk assessment.",
      },
      imaging: {
        label: "Imaging",
        title: "X-ray / MRI Analysis",
        description: "Paste imaging report text — AI explains it in plain language.",
        placeholder: "Imaging report text... e.g. lung shadowing",
        emptyState: "Enter the imaging report text.",
      },
    },
    features: [
      "AI symptom analysis",
      "Doctor assistant",
      "Drug interactions",
      "Risk assessment",
      "Imaging interpretation",
    ],
  },
};
