import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useI18n } from "../context/I18nContext";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
import {
  ArrowRightIcon,
  LocationIcon,
  ShieldIcon,
  SparkIcon,
  StarIcon,
  StethoscopeIcon,
} from "../components/PremiumIcons";
import { findNearestAvailableDoctorSlot } from "../lib/schedule";

type BodyPart = {
  id: string;
  name: { uz: string; ru: string; en: string };
  icon: string;
  symptoms: string[];
  specialty: string;
};

const bodyParts: BodyPart[] = [
  {
    id: "head",
    name: { uz: "Bosh va Yuz", ru: "Голова и лицо", en: "Head & Face" },
    icon: "🧠",
    symptoms: ["Bosh og'rig'i / Migren", "Ko'z qorong'ulashishi", "Uyqusizlik", "Asabiylashish"],
    specialty: "Nevrolog",
  },
  {
    id: "chest",
    name: { uz: "Ko'krak va Yurak", ru: "Грудь и сердце", en: "Chest & Heart" },
    icon: "🫀",
    symptoms: ["Ko'krak sohasida og'riq", "Yurak tez urishi", "Nafas qisishi", "Qon bosimi ko'tarilishi"],
    specialty: "Kardiolog",
  },
  {
    id: "abdomen",
    name: { uz: "Oshqozon va Qorin", ru: "Живот и желудок", en: "Abdomen & Stomach" },
    icon: "🫁",
    symptoms: ["Oshqozon og'rig'i", "Jigar sohasi og'rig'i", "Ko'ngil aynishi", "Ovqat hazm bo'lmasligi"],
    specialty: "Terapevt",
  },
  {
    id: "spine",
    name: { uz: "Umurtqa va Bel", ru: "Позвоночник и спина", en: "Spine & Back" },
    icon: "🦴",
    symptoms: ["Bel og'rig'i", "Umurtqa churrasi (Protruziya)", "Bo'yin qotishi", "Oyoqqa beruvchi og'riq"],
    specialty: "Ortoped",
  },
  {
    id: "limbs",
    name: { uz: "Bo'g'imlar va Oyoqlar", ru: "Суставы и конечности", en: "Joints & Limbs" },
    icon: "🦵",
    symptoms: ["Tizzada shish va og'riq", "Harakatlanish qiyinligi", "Tirishish", "Paylar zoriqishi"],
    specialty: "Ortoped",
  },
  {
    id: "skin",
    name: { uz: "Teri va Allergiya", ru: "Кожа и аллергия", en: "Skin & Allergy" },
    icon: "✨",
    symptoms: ["Qichishish va toshma", "Qizarish", "Allergik reaksiya", "Teri quruqligi"],
    specialty: "Dermatolog",
  },
];

const InteractiveBodyMap = () => {
  const { language, translateSpecialty, translateRegion } = useI18n();
  const { doctors, appointments } = useAppContext();
  const [selectedPart, setSelectedPart] = useState<BodyPart>(bodyParts[0]);

  const matchingDoctors = doctors.filter(
    (d) => d.specialty.toLowerCase() === selectedPart.specialty.toLowerCase() || d.specialty === "Terapevt",
  );

  const copy = {
    uz: {
      title: "Interaktiv Inson Anatomiyasi va Simptomlar Xaritasi",
      subtitle: "Og'riq mavjud tana a'zosini tanlang va masofaga qarab eng mos shifokorlarni toping",
      selectPart: "Tana a'zosini tanlang:",
      symptomsTitle: "Ushbu soha bo'yicha ehtimoliy simptomlar:",
      doctorsTitle: "Tavsiya etiladigan mutaxassislar va yaqin shifokorlar:",
      bookNow: "Qabulga yozilish",
      backHome: "Bosh sahifaga qaytish",
    },
    ru: {
      title: "Интерактивная карта симптомов анатомии человека",
      subtitle: "Выберите беспокоящую область и найдите лучших специалистов рядом",
      selectPart: "Выберите область тела:",
      symptomsTitle: "Возможные симптомы в этой области:",
      doctorsTitle: "Рекомендуемые специалисты рядом:",
      bookNow: "Записаться на прием",
      backHome: "На главную",
    },
    en: {
      title: "Interactive Human Body Symptom Anatomy Map",
      subtitle: "Click an anatomical region to discover symptoms and matching local doctors",
      selectPart: "Select Body Area:",
      symptomsTitle: "Common symptoms in this area:",
      doctorsTitle: "Recommended Specialists Nearby:",
      bookNow: "Book Appointment",
      backHome: "Back to Home",
    },
  }[language];

  return (
    <div className="page-shell">
      <Seo title={`MedElite | ${copy.title}`} description={copy.subtitle} path="/body-map" />
      <div className="site-orb site-orb-one" />
      <div className="site-orb site-orb-two" />

      <Navbar brandSuffix="BodyMap" />

      <main className="container section-block">
        <div className="body-map-hero glass-card">
          <span className="section-chip">
            <SparkIcon />
            {copy.title}
          </span>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>

        {/* Anatomical Selector Grid */}
        <div className="body-map-grid">
          <div className="body-parts-selector">
            <h3>{copy.selectPart}</h3>
            <div className="part-buttons-stack">
              {bodyParts.map((part) => (
                <button
                  key={part.id}
                  type="button"
                  className={`part-btn ${selectedPart.id === part.id ? "part-btn-active" : ""}`}
                  onClick={() => setSelectedPart(part)}
                >
                  <span className="part-icon">{part.icon}</span>
                  <span className="part-name">{part.name[language]}</span>
                  <span className="part-spec-tag">{translateSpecialty(part.specialty)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="body-part-details glass-card">
            <div className="part-details-header">
              <h2>{selectedPart.icon} {selectedPart.name[language]}</h2>
              <span className="badge badge-gold">
                <ShieldIcon />
                Tavsiya etiluvchi yo'nalish: {translateSpecialty(selectedPart.specialty)}
              </span>
            </div>

            <div className="symptoms-list-box">
              <h4>{copy.symptomsTitle}</h4>
              <ul className="symptoms-bullets">
                {selectedPart.symptoms.map((sym, idx) => (
                  <li key={idx}>
                    <SparkIcon /> {sym}
                  </li>
                ))}
              </ul>
            </div>

            <div className="matching-doctors-section">
              <h4>{copy.doctorsTitle}</h4>
              <div className="matching-doctor-cards">
                {matchingDoctors.slice(0, 3).map((doctor) => {
                  const slot = findNearestAvailableDoctorSlot(doctor, appointments);
                  const slotText = slot ? `${slot.date} | ${slot.time}` : "Bo'sh vaqt bor";
                  return (
                    <article key={doctor.id} className="matching-doctor-card">
                      <div className="matching-doc-head">
                        <div className="doctor-card-avatar">
                          <StethoscopeIcon />
                        </div>
                        <div>
                          <strong>{doctor.name}</strong>
                          <p>{translateSpecialty(doctor.specialty)} • {doctor.clinic}</p>
                        </div>
                        <span className="badge">
                          <StarIcon /> {doctor.rating.toFixed(1)}
                        </span>
                      </div>
                      <div className="matching-doc-meta">
                        <span><LocationIcon /> {translateRegion(doctor.region)} (~1.5 km)</span>
                        <span>{doctor.price}</span>
                      </div>
                      <Link
                        to={`/user?doctor=${encodeURIComponent(doctor.id)}`}
                        className="button button-primary button-small button-block"
                      >
                        {copy.bookNow} ({slotText})
                        <ArrowRightIcon />
                      </Link>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InteractiveBodyMap;
