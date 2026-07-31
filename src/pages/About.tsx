import { useState } from "react";
import { Link } from "react-router-dom";
import EmergencyCallButton from "../components/EmergencyCallButton";
import LanguageSwitcher from "../components/LanguageSwitcher";
import Seo from "../components/Seo";
import ThemeToggle from "../components/ThemeToggle";
import {
  CheckIcon,
  CloseIcon,
  HeartPulseIcon,
  MenuIcon,
  ShieldIcon,
  SparkIcon,
  UserGroupIcon,
} from "../components/PremiumIcons";
import { useAppContext } from "../context/AppContext";
import { useI18n } from "../context/I18nContext";

const aboutCopy = {
  uz: {
    title: "MedElite — Biz haqimizda",
    description: "O'zbekiston uchun zamonaviy tibbiy platforma.",
    chip: "Biz haqimizda",
    heroTitle: "Sog'liqni saqlashni",
    heroAccent: "raqamlashtiramiz",
    heroText:
      "MedElite bemorlar, shifokorlar va klinikalarni bir platformada birlashtiradi. AI yordamchi, onlayn bron va real vaqtda yangilanadigan ma'lumotlar.",
    mission: "Missiyamiz",
    missionText: "Har bir odam uchun qulay, tez va ishonchli tibbiy xizmatga kirish imkonini yaratish.",
    values: ["Shaffoflik", "Tezlik", "Xavfsizlik", "Innovatsiya"],
    stats: ["Faol shifokor", "Yozilgan qabul", "Hamkor klinika", "AI tahlil"],
  },
  ru: {
    title: "MedElite — О нас",
    description: "Современная медицинская платформа для Узбекистана.",
    chip: "О нас",
    heroTitle: "Оцифровываем",
    heroAccent: "здравоохранение",
    heroText:
      "MedElite объединяет пациентов, врачей и клиники на одной платформе. AI-помощник, онлайн-запись и данные в реальном времени.",
    mission: "Наша миссия",
    missionText: "Обеспечить каждому удобный, быстрый и надёжный доступ к медицинским услугам.",
    values: ["Прозрачность", "Скорость", "Безопасность", "Инновации"],
    stats: ["Активных врачей", "Записей", "Клиник", "AI-анализ"],
  },
  en: {
    title: "MedElite — About Us",
    description: "Modern healthcare platform for Uzbekistan.",
    chip: "About",
    heroTitle: "Digitizing",
    heroAccent: "healthcare",
    heroText:
      "MedElite connects patients, doctors, and clinics on one platform. AI assistant, online booking, and real-time data.",
    mission: "Our mission",
    missionText: "Make convenient, fast, and reliable healthcare access available to everyone.",
    values: ["Transparency", "Speed", "Security", "Innovation"],
    stats: ["Active doctors", "Bookings", "Partner clinics", "AI analysis"],
  },
} as const;

const About = () => {
  const { language } = useI18n();
  const copy = aboutCopy[language];
  const { appointments, doctors } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);

  const stats = [
    { value: `${doctors.length}+`, label: copy.stats[0] },
    { value: `${appointments.length}+`, label: copy.stats[1] },
    {
      value: `${new Set(doctors.map((d) => d.clinic)).size}+`,
      label: copy.stats[2],
    },
    { value: "24/7", label: copy.stats[3] },
  ];

  return (
    <div className="page-shell">
      <Seo title={copy.title} description={copy.description} path="/about" />
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
              <Link to="/services">
                {language === "ru" ? "Услуги" : language === "en" ? "Services" : "Xizmatlar"}
              </Link>
              <Link to="/about">{copy.chip}</Link>
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
          <div className="container about-hero glass-card">
            <span className="section-chip">{copy.chip}</span>
            <h1>{copy.heroTitle} <span className="text-accent">{copy.heroAccent}</span></h1>
            <p>{copy.heroText}</p>
          </div>
        </section>

        <section className="stats-section">
          <div className="container stat-grid">
            {stats.map((stat) => (
              <article key={stat.label} className="stat-card">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="container about-mission-grid">
            <article className="glass-card">
              <div className="icon-shell"><ShieldIcon /></div>
              <h2>{copy.mission}</h2>
              <p>{copy.missionText}</p>
            </article>
            <article className="glass-card">
              <div className="icon-shell"><UserGroupIcon /></div>
              <h2>
                {language === "ru" ? "Ценности" : language === "en" ? "Values" : "Qadriyatlar"}
              </h2>
              <div className="about-values">
                {copy.values.map((value) => (
                  <div key={value} className="signature-pillar">
                    <CheckIcon />
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="cta-section">
          <div className="container">
            <div className="cta-card">
              <div>
                <span className="section-chip">MedElite</span>
                <h2>
                  {language === "ru"
                    ? "Присоединяйтесь к платформе"
                    : language === "en"
                      ? "Join the platform"
                      : "Platformaga qo'shiling"}
                </h2>
              </div>
              <div className="cta-actions">
                <Link to="/login?mode=user" className="button button-primary button-large">
                  {language === "ru" ? "Регистрация" : language === "en" ? "Register" : "Ro'yxatdan o'tish"}
                </Link>
                <Link to="/ai-assistant" className="button button-secondary button-large">
                  AI
                  <SparkIcon />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <EmergencyCallButton />
    </div>
  );
};

export default About;
