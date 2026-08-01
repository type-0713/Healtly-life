import { useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../context/I18nContext";
import Seo from "../components/Seo";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSwitcher from "../components/LanguageSwitcher";
import {
  AlertCircleIcon,
  AmbulanceIcon,
  CheckCircleIcon,
  HeartPulseIcon,
  LocationIcon,
  PhoneIcon,
  ShieldIcon,
  SparkIcon,
} from "../components/PremiumIcons";

type EmergencyGuide = {
  id: string;
  title: string;
  symptoms: string;
  steps: string[];
};

const guides: EmergencyGuide[] = [
  {
    id: "g1",
    title: "Yurak Xuruji (Ko'krak Og'rig'i)",
    symptoms: "Ko'krak qafasida qisilish, chap qo'l yoki jag'ga beruvchi og'riq, sovuq ter va nafas qisishi.",
    steps: [
      "Darhol 103 raqamiga qo'ng'iroq qiling.",
      "Bemorga yarim o'tirgan holat bering (boshi va yelkasi baland).",
      "Kiyim tugmalarini bo'shating, xonani shamollating.",
      "Shifokor taqiqlamagan bo'lsa, 1 tabletka Aspirin berish mumkin.",
    ],
  },
  {
    id: "g2",
    title: "Kuchli Qon Ketish",
    symptoms: "Jarohat joyidan ketma-ket yoki sachrab qon chiqishi.",
    steps: [
      "Jarohat ustiga darhol toza mato yoki bint bosing.",
      "Jarohatlangan a'zoni (qo'l/oyoq) yurak sathidan yuqori ko'taring.",
      "Qon to'xtamasa, jarohatdan yuqoriroq joyga turniket bog'lang va vaqtini yozib qo'ying.",
      "103 brigadasini kuting.",
    ],
  },
  {
    id: "g3",
    title: "Hushdan Ketish va Havo Yetishmasligi",
    symptoms: "Rangsizlik, ko'z qorong'ulashishi, harakat va javob yo'qligi.",
    steps: [
      "Bemorni tekis yuzaga yotqizib, oyoqlarini 30 sm balandga ko'taring.",
      "Nafas yo'llari ochiqligini tekshiring (boshini orqaga engashtiring).",
      "Yuziga sovuq suv purkang yoki novshadil spirti hidlatiring.",
      "Nafas to'xtagan bo'lsa, sun'iy nafas berishni boshlang.",
    ],
  },
];

const EmergencyPage = () => {
  const { language } = useI18n();
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const handleRequestAmbulance = () => {
    setDispatchStatus("Tez yordam brigadasiga geolokatsiyangiz yuborildi. Ekipaj yo'lga chiqdi (taxminan 7-10 daqiqa).");
  };

  const copy = {
    uz: {
      title: "Tez Tibbiy Yordam (103 Emergency Center)",
      subtitle: "Shoshilinch tibbiy holatlarda tezkor brigada chaqirish va birinchi yordam yo'riqnomalari",
      call103: "103 ga Qo'ng'iroq Qilish",
      dispatchAmbulance: "Tez Yordam Chaqirish (GPS)",
      firstAidTitle: "Shoshilinch Birinchi Yordam Yo'riqnomalari",
      hospitalsTitle: "Toshkent shahridagi Navbatchi Shoshilinch Shifoxonalar",
      backHome: "Bosh sahifaga qaytish",
    },
    ru: {
      title: "Скорая Медицинская Помощь (103 Emergency)",
      subtitle: "Экстренный вызов бригады и инструкции по первой помощи",
      call103: "Позвонить 103",
      dispatchAmbulance: "Вызвать Скорую (GPS)",
      firstAidTitle: "Инструкции по первой помощи",
      hospitalsTitle: "Дежурные больницы Ташкента",
      backHome: "На главную",
    },
    en: {
      title: "Emergency Medical Center (103 Help)",
      subtitle: "Urgent ambulance dispatch & step-by-step first aid guides",
      call103: "Call 103 Now",
      dispatchAmbulance: "Dispatch Ambulance (GPS)",
      firstAidTitle: "Step-by-Step First Aid Protocols",
      hospitalsTitle: "Duty Emergency Hospitals",
      backHome: "Back to Home",
    },
  }[language];

  return (
    <div className="page-shell">
      <Seo title={`MedElite | ${copy.title}`} description={copy.subtitle} path="/emergency" />
      <div className="site-orb site-orb-one" />
      <div className="site-orb site-orb-two" />

      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark red-accent">
              <AmbulanceIcon />
            </span>
            <span>
              Med<span className="brand-accent red-accent-text">Elite</span> 103
            </span>
          </Link>

          <div className="nav-actions">
            <LanguageSwitcher compact />
            <ThemeToggle compact />
            <Link to="/" className="button button-ghost">
              {copy.backHome}
            </Link>
          </div>
        </div>
      </header>

      <main className="container section-block">
        {/* Emergency Hotline Header Card */}
        <div className="emergency-hero-card glass-card">
          <div className="emergency-hero-content">
            <span className="badge badge-red">
              <AlertCircleIcon />
              SHOSHILINCH ALOQA 24/7
            </span>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>

            <div className="emergency-actions">
              <a href="tel:103" className="button button-danger button-large">
                <PhoneIcon />
                {copy.call103}
              </a>
              <button
                type="button"
                onClick={handleRequestAmbulance}
                className="button button-secondary button-large"
              >
                <LocationIcon />
                {copy.dispatchAmbulance}
              </button>
            </div>

            {dispatchStatus && (
              <div className="dispatch-alert-box">
                <CheckCircleIcon />
                <p>{dispatchStatus}</p>
              </div>
            )}
          </div>
        </div>

        {/* First Aid Instructions */}
        <section className="emergency-section">
          <div className="section-heading">
            <span className="section-chip">
              <HeartPulseIcon />
              {copy.firstAidTitle}
            </span>
            <h2>Birinchi Tibbiy Yordam</h2>
          </div>

          <div className="emergency-guides-grid">
            {guides.map((guide) => (
              <article key={guide.id} className="guide-card glass-card">
                <h3>{guide.title}</h3>
                <p className="guide-symptoms">
                  <strong>Belgilari:</strong> {guide.symptoms}
                </p>
                <ol className="guide-steps">
                  {guide.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>

        {/* Duty Emergency Hospitals */}
        <section className="emergency-section">
          <div className="section-heading">
            <span className="section-chip">
              <ShieldIcon />
              {copy.hospitalsTitle}
            </span>
            <h2>Navbatchi Klinikalar</h2>
          </div>

          <div className="hospitals-grid">
            <article className="hospital-card glass-card">
              <h3>Respublika Shoshilinch Tibbiy Yordam Ilmiy Markazi (16-gorbolnitsa)</h3>
              <p><LocationIcon /> Toshkent sh., Chilonzor t., Farxod ko'chasi 2</p>
              <p><PhoneIcon /> +998 71 277 26 00</p>
              <span className="badge badge-gold"><SparkIcon /> 24/7 Navbatchilikda</span>
            </article>

            <article className="hospital-card glass-card">
              <h3>Toshkent Shahar Tez Tibbiy Yordam Shifoxonasi</h3>
              <p><LocationIcon /> Toshkent sh., Yashnobod t., Parkent ko'chasi 51</p>
              <p><PhoneIcon /> +998 71 268 03 03</p>
              <span className="badge badge-gold"><SparkIcon /> 24/7 Navbatchilikda</span>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
};

export default EmergencyPage;
