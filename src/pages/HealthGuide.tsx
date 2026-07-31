import { useState } from "react";
import { Link } from "react-router-dom";
import EmergencyCallButton from "../components/EmergencyCallButton";
import LanguageSwitcher from "../components/LanguageSwitcher";
import Seo from "../components/Seo";
import ThemeToggle from "../components/ThemeToggle";
import {
  ArrowRightIcon,
  CloseIcon,
  HeartPulseIcon,
  MenuIcon,
  ShieldIcon,
  SparkIcon,
} from "../components/PremiumIcons";
import { useI18n } from "../context/I18nContext";

const healthGuideCopy = {
  uz: {
    title: "MedElite Sog'liq Qo'llanmasi",
    description: "Simptomlar, tez yordam va sog'lom turmush tarzi bo'yicha maslahatlar.",
    chip: "Sog'liq qo'llanmasi",
    heroTitle: "Sog'liqni",
    heroAccent: "bilib oling",
    heroText: "Tez-tez beriladigan savollarga javoblar va AI yordamchisi orqali shaxsiy maslahat oling.",
    tips: [
      {
        title: "Isitma va shamollash",
        text: "Isitma 38.5°C dan yuqori bo'lsa, ko'p suyuqlik iching va terapevtga murojaat qiling. 3 kundan oshsa — shifokor ko'rigi shart.",
      },
      {
        title: "Yurak og'rig'i",
        text: "Ko'krak og'rig'i, nafas qisishi yoki chap qo'l u barmog'iga tarqalishi — darhol 103 ga qo'ng'iroq qiling.",
      },
      {
        title: "Bosh og'rig'i",
        text: "Kuchli va to'satdan boshlangan bosh og'rig'i, ko'rish buzilishi yoki qusish — tez yordam chaqiring.",
      },
      {
        title: "Bolalar salomatligi",
        text: "3 oylikgacha chaqaloqda isitma — darhol shifokorga. Katta bolalar uchun pediatr tavsiyalariga amal qiling.",
      },
      {
        title: "Dorilar xavfsizligi",
        text: "Bir nechta dori qabul qilsangiz, AI yordamchisidan o'zaro ta'sirni tekshirishni so'rang.",
      },
      {
        title: "Profilaktika",
        text: "Yiliga kamida bir marta to'liq tibbiy ko'rik, muntazam jismoniy faoliyat va to'g'ri ovqatlanish.",
      },
    ],
    emergencyTitle: "Tez yordam qachon kerak?",
    emergencyItems: [
      "Nafas olish qiyinlashganda",
      "Kuchli qon ketishda",
      "Hushdan ketishda",
      "Kuchli ko'krak yoki qorin og'rig'ida",
      "Kuyish yoki jiddiy jarohatda",
    ],
    aiCta: "AI bilan maslahat olish",
  },
  ru: {
    title: "MedElite Справочник здоровья",
    description: "Советы по симптомам, скорой помощи и здоровому образу жизни.",
    chip: "Справочник",
    heroTitle: "Узнайте о",
    heroAccent: "здоровье",
    heroText: "Ответы на частые вопросы и персональные советы через AI-помощника.",
    tips: [
      {
        title: "Температура и простуда",
        text: "При температуре выше 38.5°C пейте больше жидкости и обратитесь к терапевту. Более 3 дней — осмотр обязателен.",
      },
      {
        title: "Боль в сердце",
        text: "Боль в груди, одышка или боль в левой руке — немедленно звоните 103.",
      },
      {
        title: "Головная боль",
        text: "Сильная внезапная головная боль с нарушением зрения или рвотой — вызывайте скорую.",
      },
      {
        title: "Здоровье детей",
        text: "Температура у младенца до 3 месяцев — сразу к врачу. Для детей старше — следуйте советам педиатра.",
      },
      {
        title: "Безопасность лекарств",
        text: "При приёме нескольких препаратов спросите AI-помощника о взаимодействии.",
      },
      {
        title: "Профилактика",
        text: "Ежегодный медосмотр, регулярная физическая активность и правильное питание.",
      },
    ],
    emergencyTitle: "Когда нужна скорая?",
    emergencyItems: [
      "Затруднённое дыхание",
      "Сильное кровотечение",
      "Потеря сознания",
      "Сильная боль в груди или животе",
      "Ожог или серьёзная травма",
    ],
    aiCta: "Получить совет от AI",
  },
  en: {
    title: "MedElite Health Guide",
    description: "Advice on symptoms, emergency care, and healthy living.",
    chip: "Health guide",
    heroTitle: "Learn about",
    heroAccent: "your health",
    heroText: "Answers to common questions and personalized advice via the AI assistant.",
    tips: [
      {
        title: "Fever and cold",
        text: "Above 38.5°C, drink fluids and see a therapist. Lasting more than 3 days — doctor visit required.",
      },
      {
        title: "Chest pain",
        text: "Chest pain, shortness of breath, or pain radiating to the left arm — call 103 immediately.",
      },
      {
        title: "Headache",
        text: "Sudden severe headache with vision changes or vomiting — call emergency services.",
      },
      {
        title: "Children's health",
        text: "Fever in infants under 3 months — see a doctor immediately. For older children, follow pediatric advice.",
      },
      {
        title: "Medication safety",
        text: "Taking multiple medications? Ask the AI assistant about drug interactions.",
      },
      {
        title: "Prevention",
        text: "Annual check-ups, regular exercise, and balanced nutrition.",
      },
    ],
    emergencyTitle: "When to call emergency?",
    emergencyItems: [
      "Difficulty breathing",
      "Severe bleeding",
      "Loss of consciousness",
      "Severe chest or abdominal pain",
      "Burns or serious injuries",
    ],
    aiCta: "Get AI advice",
  },
} as const;

const HealthGuide = () => {
  const { language } = useI18n();
  const copy = healthGuideCopy[language];
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="page-shell">
      <Seo title={copy.title} description={copy.description} path="/health-guide" />
      <div className="site-orb site-orb-one" />
      <div className="site-orb site-orb-two" />

      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark"><HeartPulseIcon /></span>
            <span>Med<span className="brand-accent">Elite</span></span>
          </Link>
          <div className={`nav-cluster ${menuOpen ? "nav-cluster-open" : ""}`}>
            <nav className="nav-links">
              <Link to="/ai-assistant">AI</Link>
              <Link to="/health-guide">{copy.chip}</Link>
              <Link to="/services">
                {language === "ru" ? "Услуги" : language === "en" ? "Services" : "Xizmatlar"}
              </Link>
            </nav>
            <div className="nav-actions">
              <LanguageSwitcher compact />
              <ThemeToggle compact />
            </div>
          </div>
          <button type="button" className="mobile-menu-button" onClick={() => setMenuOpen((c) => !c)}>
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </header>

      <main>
        <section className="section-block">
          <div className="container">
            <div className="section-heading">
              <span className="section-chip">{copy.chip}</span>
              <h1>{copy.heroTitle} <span className="text-accent">{copy.heroAccent}</span></h1>
              <p>{copy.heroText}</p>
            </div>

            <div className="health-tips-grid">
              {copy.tips.map((tip) => (
                <article key={tip.title} className="faq-card glass-card">
                  <h3>{tip.title}</h3>
                  <p>{tip.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-block section-contrast">
          <div className="container">
            <article className="emergency-guide-card glass-card">
              <div className="icon-shell"><ShieldIcon /></div>
              <h2>{copy.emergencyTitle}</h2>
              <ul className="emergency-guide-list">
                {copy.emergencyItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <a href="tel:103" className="button button-primary">
                103
              </a>
            </article>
          </div>
        </section>

        <section className="cta-section">
          <div className="container">
            <div className="cta-card">
              <div>
                <span className="section-chip">AI</span>
                <h2>{copy.aiCta}</h2>
              </div>
              <Link to="/ai-assistant" className="button button-primary button-large">
                {copy.aiCta}
                <SparkIcon />
                <ArrowRightIcon />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <EmergencyCallButton />
    </div>
  );
};

export default HealthGuide;
