import { useState } from "react";
import { Link } from "react-router-dom";
import EmergencyCallButton from "../components/EmergencyCallButton";
import LanguageSwitcher from "../components/LanguageSwitcher";
import Seo from "../components/Seo";
import ThemeToggle from "../components/ThemeToggle";
import {
  ArrowRightIcon,
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  CloseIcon,
  HeartPulseIcon,
  MenuIcon,
  ShieldIcon,
  SparkIcon,
  StethoscopeIcon,
} from "../components/PremiumIcons";
import { useI18n } from "../context/I18nContext";

const servicesCopy = {
  uz: {
    title: "MedElite Xizmatlar",
    description: "Tibbiy xizmatlar, AI tahlil va onlayn bronlash — barchasi bir joyda.",
    chip: "Xizmatlar",
    heroTitle: "To'liq tibbiy",
    heroAccent: "xizmat ekotizimi",
    heroText: "MedElite simptom tahlilidan tortib shifokor qabuligacha bo'lgan butun jarayonni raqamlashtiradi.",
    items: [
      {
        icon: "spark",
        title: "AI Simptom Tahlili",
        text: "Groq AI yordamida simptomlaringizni tahlil qiling va mos mutaxassislikni toping.",
        link: "/ai-assistant",
        cta: "AI bilan boshlash",
      },
      {
        icon: "calendar",
        title: "Onlayn Band Qilish",
        text: "Bo'sh vaqtlarni ko'ring, shifokor tanlang va bir necha bosqichda qabulga yoziling.",
        link: "/user",
        cta: "Band qilish",
      },
      {
        icon: "stethoscope",
        title: "Shifokor Qidiruv",
        text: "Mutaxassislik, hudud, reyting va tajriba bo'yicha mos shifokorni toping.",
        link: "/#specialists",
        cta: "Shifokorlar",
      },
      {
        icon: "shield",
        title: "Xavfsiz Profil",
        text: "Tarix, baholar va shaxsiy ma'lumotlar Firestore'da xavfsiz saqlanadi.",
        link: "/login?mode=user",
        cta: "Kabinetga kirish",
      },
      {
        icon: "chart",
        title: "Dorilar Ta'siri",
        text: "AI yordamchisi dorilar o'zaro ta'sirini tekshirish bo'yicha maslahat beradi.",
        link: "/ai-assistant?mode=drugs",
        cta: "AI dan so'rash",
      },
      {
        icon: "check",
        title: "Kasallik Xavfi Baholash",
        text: "Simptomlaringiz asosida xavf darajasini dastlabki baholash va tez yordam tavsiyasi.",
        link: "/ai-assistant?mode=risk",
        cta: "Xavfni baholash",
      },
      {
        icon: "spark",
        title: "Rentgen / MRT Tahlili",
        text: "Tibbiy tasvir xulosasini AI yordamida sodda tilda tushunish.",
        link: "/ai-assistant?mode=imaging",
        cta: "Tahlil qilish",
      },
    ],
  },
  ru: {
    title: "MedElite Услуги",
    description: "Медицинские услуги, AI-анализ и онлайн-запись — всё в одном месте.",
    chip: "Услуги",
    heroTitle: "Полная медицинская",
    heroAccent: "экосистема",
    heroText: "MedElite оцифровывает весь путь от анализа симптомов до приёма у врача.",
    items: [
      {
        icon: "spark",
        title: "AI Анализ симптомов",
        text: "Проанализируйте симптомы с Groq AI и найдите нужного специалиста.",
        link: "/ai-assistant",
        cta: "Начать с AI",
      },
      {
        icon: "calendar",
        title: "Онлайн запись",
        text: "Смотрите свободные слоты, выбирайте врача и записывайтесь за несколько шагов.",
        link: "/user",
        cta: "Записаться",
      },
      {
        icon: "stethoscope",
        title: "Поиск врача",
        text: "Найдите врача по специальности, региону, рейтингу и опыту.",
        link: "/#specialists",
        cta: "Врачи",
      },
      {
        icon: "shield",
        title: "Безопасный профиль",
        text: "История, оценки и личные данные надёжно хранятся в Firestore.",
        link: "/login?mode=user",
        cta: "Войти",
      },
      {
        icon: "chart",
        title: "Взаимодействие лекарств",
        text: "AI-помощник консультирует по совместимости лекарственных препаратов.",
        link: "/ai-assistant?mode=drugs",
        cta: "Спросить AI",
      },
      {
        icon: "check",
        title: "Оценка риска",
        text: "Предварительная оценка риска по симптомам и рекомендация скорой помощи.",
        link: "/ai-assistant?mode=risk",
        cta: "Оценить риск",
      },
      {
        icon: "spark",
        title: "Рентген / МРТ",
        text: "Объяснение заключения снимка простым языком с помощью AI.",
        link: "/ai-assistant?mode=imaging",
        cta: "Анализ снимка",
      },
    ],
  },
  en: {
    title: "MedElite Services",
    description: "Medical services, AI analysis, and online booking — all in one place.",
    chip: "Services",
    heroTitle: "Complete medical",
    heroAccent: "service ecosystem",
    heroText: "MedElite digitizes the entire journey from symptom analysis to doctor visits.",
    items: [
      {
        icon: "spark",
        title: "AI Symptom Analysis",
        text: "Analyze symptoms with Groq AI and find the right specialty.",
        link: "/ai-assistant",
        cta: "Start with AI",
      },
      {
        icon: "calendar",
        title: "Online Booking",
        text: "View open slots, choose a doctor, and book in a few steps.",
        link: "/user",
        cta: "Book now",
      },
      {
        icon: "stethoscope",
        title: "Doctor Search",
        text: "Find doctors by specialty, region, rating, and experience.",
        link: "/#specialists",
        cta: "Doctors",
      },
      {
        icon: "shield",
        title: "Secure Profile",
        text: "History, ratings, and personal data stored securely in Firestore.",
        link: "/login?mode=user",
        cta: "Sign in",
      },
      {
        icon: "chart",
        title: "Drug Interactions",
        text: "AI assistant advises on medication compatibility checks.",
        link: "/ai-assistant?mode=drugs",
        cta: "Ask AI",
      },
      {
        icon: "check",
        title: "Risk Assessment",
        text: "Preliminary risk assessment based on symptoms and emergency guidance.",
        link: "/ai-assistant?mode=risk",
        cta: "Assess risk",
      },
      {
        icon: "spark",
        title: "X-ray / MRI Analysis",
        text: "Understand imaging reports in plain language with AI help.",
        link: "/ai-assistant?mode=imaging",
        cta: "Analyze scan",
      },
    ],
  },
} as const;

const iconMap = {
  spark: SparkIcon,
  calendar: CalendarIcon,
  stethoscope: StethoscopeIcon,
  shield: ShieldIcon,
  chart: ChartIcon,
  check: CheckIcon,
};

const Services = () => {
  const { language } = useI18n();
  const copy = servicesCopy[language];
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="page-shell">
      <Seo title={copy.title} description={copy.description} path="/services" />
      <div className="site-orb site-orb-one" />
      <div className="site-orb site-orb-two" />

      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand" onClick={closeMenu}>
            <span className="brand-mark"><HeartPulseIcon /></span>
            <span>Med<span className="brand-accent">Elite</span></span>
          </Link>
          {/* Mobile nav backdrop */}
          {menuOpen && (
            <div className="nav-cluster-backdrop nav-cluster-backdrop-open" onClick={closeMenu} aria-hidden="true" />
          )}
          <div className={`nav-cluster ${menuOpen ? "nav-cluster-open" : ""}`}>
            <nav className="nav-links">
              <Link to="/ai-assistant" onClick={closeMenu}>AI</Link>
              <Link to="/services" onClick={closeMenu}>{copy.chip}</Link>
              <Link to="/about" onClick={closeMenu}>
                {language === "ru" ? "О нас" : language === "en" ? "About" : "Biz haqimizda"}
              </Link>
              <Link to="/chat" onClick={closeMenu}>Chat</Link>
              <Link to="/medical-records" onClick={closeMenu}>EMR</Link>
            </nav>
            <div className="nav-actions">
              <LanguageSwitcher compact />
              <ThemeToggle compact />
              <Link to="/user" className="button button-primary" onClick={closeMenu}>
                {language === "ru" ? "Запись" : language === "en" ? "Book" : "Band qilish"}
              </Link>
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

            <div className="services-grid">
              {copy.items.map((item) => {
                const Icon = iconMap[item.icon];
                return (
                  <article key={item.title} className="service-card glass-card">
                    <div className="icon-shell"><Icon /></div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                    <Link to={item.link} className="suite-link">
                      {item.cta}
                      <ArrowRightIcon />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container">
            <div className="cta-card">
              <div>
                <span className="section-chip">AI</span>
                <h2>
                  {language === "ru"
                    ? "Попробуйте AI-помощника прямо сейчас"
                    : language === "en"
                      ? "Try the AI assistant now"
                      : "AI yordamchisini hozir sinab ko'ring"}
                </h2>
              </div>
              <Link to="/ai-assistant" className="button button-primary button-large">
                {language === "ru" ? "Открыть AI" : language === "en" ? "Open AI" : "AI ni ochish"}
                <SparkIcon />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <EmergencyCallButton />
    </div>
  );
};

export default Services;
