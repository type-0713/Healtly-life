import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useI18n } from "../context/I18nContext";
import Seo from "../components/Seo";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSwitcher from "../components/LanguageSwitcher";
import {
  ActivityIcon,
  CheckCircleIcon,
  DownloadIcon,
  FileTextIcon,
  HeartPulseIcon,
  PillIcon,
  ShieldIcon,
  SparkIcon,
  StethoscopeIcon,
} from "../components/PremiumIcons";

type VitalEntry = {
  id: string;
  type: string;
  value: string;
  unit: string;
  status: "normal" | "warning";
  date: string;
};

type PrescriptionItem = {
  id: string;
  doctorName: string;
  specialty: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  date: string;
  notes: string;
};

type LabReport = {
  id: string;
  title: string;
  facility: string;
  date: string;
  status: string;
  summary: string;
};

const VITAL_STORAGE_KEY = "medelite_user_vitals";

const initialVitals: VitalEntry[] = [
  { id: "v1", type: "Qon bosimi", value: "120/80", unit: "mmHg", status: "normal", date: "2026-07-30 09:15" },
  { id: "v2", type: "Yurak urishi", value: "72", unit: "bpm", status: "normal", date: "2026-07-30 09:15" },
  { id: "v3", type: "Qondagi shakar", value: "5.4", unit: "mmol/L", status: "normal", date: "2026-07-28 14:00" },
  { id: "v4", type: "Tana harorati", value: "36.6", unit: "°C", status: "normal", date: "2026-07-28 14:00" },
  { id: "v5", type: "BMI (Vazn indeksi)", value: "23.2", unit: "kg/m²", status: "normal", date: "2026-07-25 10:00" },
];

const MedicalRecords = () => {
  const { language } = useI18n();
  const { profile } = useAppContext();

  const [activeTab, setActiveTab] = useState<"vitals" | "prescriptions" | "labs">("vitals");
  const [showAddVitalModal, setShowAddVitalModal] = useState(false);

  // Vitals State with localStorage Persistence
  const [vitals, setVitals] = useState<VitalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(VITAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialVitals;
    } catch {
      return initialVitals;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(VITAL_STORAGE_KEY, JSON.stringify(vitals));
    } catch {
      // Ignore quota
    }
  }, [vitals]);

  // New Vital Form State
  const [newType, setNewType] = useState("Qon bosimi");
  const [newValue, setNewValue] = useState("");
  const [newUnit, setNewUnit] = useState("mmHg");

  const handleAddVital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    const entry: VitalEntry = {
      id: `v_${Date.now()}`,
      type: newType,
      value: newValue.trim(),
      unit: newUnit,
      status: "normal",
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
    };

    setVitals([entry, ...vitals]);
    setNewValue("");
    setShowAddVitalModal(false);
  };

  const PRESCRIPTION_STORAGE_KEY = "medelite_user_prescriptions";
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>(() => {
    try {
      const saved = localStorage.getItem(PRESCRIPTION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [
        {
          id: "p1",
          doctorName: "Dr. Alisher Karimov",
          specialty: "Kardiolog",
          medication: "Cardio-Mag 75mg",
          dosage: "1 tabletka",
          frequency: "Kuniga 1 mahal (kechqurun)",
          duration: "30 kun",
          date: "2026-07-20",
          notes: "Yurak-qon tomir profilaktikasi uchun. Ovqatdan so'ng ichiladi.",
        },
        {
          id: "p2",
          doctorName: "Dr. Gulsara Niyazova",
          specialty: "Terapevt",
          medication: "Vitamin D3 2000 IU",
          dosage: "1 kapsula",
          frequency: "Har kuni ertalab",
          duration: "60 kun",
          date: "2026-07-15",
          notes: "Immunat va energiya almashinuvini yaxshilash uchun.",
        },
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PRESCRIPTION_STORAGE_KEY, JSON.stringify(prescriptions));
    } catch {
      // Ignore quota
    }
  }, [prescriptions]);

  const handleAddCustomPrescription = (medName: string, docName: string) => {
    const item: PrescriptionItem = {
      id: `p_${Date.now()}`,
      doctorName: docName || "Shaxsiy shifokor",
      specialty: "Umumiy amaliyot",
      medication: medName,
      dosage: "1 tabletka",
      frequency: "Kuniga 1-2 mahal",
      duration: "14 kun",
      date: new Date().toISOString().slice(0, 10),
      notes: "Bemor tomonidan kiritilgan dori retsepti.",
    };
    setPrescriptions((prev) => [item, ...prev]);
  };

  const [labs] = useState<LabReport[]>([
    {
      id: "l1",
      title: "Umumiy Qon Tahlili (CBC)",
      facility: "MedElite Diagnostic Lab",
      date: "2026-07-28",
      status: "Normada",
      summary: "Gemoglobin: 142 g/L, Eritrotsitlar: 4.8 x10^12/L, Leykotsitlar: 6.5 x10^9/L. Normativ me'yorda.",
    },
    {
      id: "l2",
      title: "Elektrokardiogramma (EKG)",
      facility: "MedElite Heart Center",
      date: "2026-07-20",
      status: "Normada",
      summary: "Sinusli ritm 72 bpm. Patologik o'zgarishlar aniqlanmadi.",
    },
  ]);

  const copy = {
    uz: {
      title: "Elektron Tibbiy Kartochka (EMR)",
      subtitle: "Bemorning shaxsiy ko'rsatkichlari, raqamli retseptlari va tahlil natijalari",
      tabVitals: "Sog'liq ko'rsatkichlari (Vitals)",
      tabPrescriptions: "Raqamli Retseptlar",
      tabLabs: "Tahlil Natijalari (Labs)",
      addVitalBtn: "Yangi ko'rsatkich kiritish",
      downloadReport: "Hisobotni yuklab olish",
      patientInfo: "Bemor profili",
      name: "Ismi:",
      phone: "Telefon:",
      email: "Email:",
      city: "Shahar:",
      backHome: "Bosh sahifaga qaytish",
      downloadPdf: "PDF yuklab olish",
      modalTitle: "Yangi Sog'liq Ko'rsatkichini Kiritish",
      typeLabel: "Ko'rsatkich turi:",
      valLabel: "Qiymati:",
      unitLabel: "O'lchov birligi:",
      saveBtn: "Saqlash",
      cancelBtn: "Bekor qilish",
    },
    ru: {
      title: "Электронная медицинская карта (ЭМК)",
      subtitle: "Личные показатели здоровья, цифровые рецепты и результаты анализов",
      tabVitals: "Показатели здоровья (Vitals)",
      tabPrescriptions: "Цифровые Рецепты",
      tabLabs: "Результаты Анализов (Labs)",
      addVitalBtn: "Добавить показатель",
      downloadReport: "Скачать отчет",
      patientInfo: "Профиль пациента",
      name: "Имя:",
      phone: "Телефон:",
      email: "Email:",
      city: "Город:",
      backHome: "На главную",
      downloadPdf: "Скачать PDF",
      modalTitle: "Ввод нового показателя здоровья",
      typeLabel: "Тип показателя:",
      valLabel: "Значение:",
      unitLabel: "Единица измерения:",
      saveBtn: "Сохранить",
      cancelBtn: "Отмена",
    },
    en: {
      title: "Electronic Medical Records (EMR)",
      subtitle: "Personal health vitals, digital prescriptions, and lab diagnostic reports",
      tabVitals: "Vital Signs",
      tabPrescriptions: "Digital Prescriptions",
      tabLabs: "Lab Test Reports",
      addVitalBtn: "Add New Vital Record",
      downloadReport: "Download Full Summary",
      patientInfo: "Patient Profile",
      name: "Name:",
      phone: "Phone:",
      email: "Email:",
      city: "City:",
      backHome: "Back to Home",
      downloadPdf: "Download PDF",
      modalTitle: "Record New Vital Sign",
      typeLabel: "Vital Type:",
      valLabel: "Value:",
      unitLabel: "Unit:",
      saveBtn: "Save Record",
      cancelBtn: "Cancel",
    },
  }[language];

  const downloadFullReport = () => {
    alert("Tibbiy kartochka hisoboti yuklab olindi (PDF).");
  };

  return (
    <div className="page-shell">
      <Seo title={`MedElite | ${copy.title}`} description={copy.subtitle} path="/medical-records" />
      <div className="site-orb site-orb-one" />
      <div className="site-orb site-orb-two" />

      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">
              <HeartPulseIcon />
            </span>
            <span>
              Med<span className="brand-accent">Elite</span> EMR
            </span>
          </Link>

          <div className="nav-actions">
            <LanguageSwitcher compact />
            <ThemeToggle compact />
            <Link to="/user" className="button button-ghost">
              {copy.backHome}
            </Link>
          </div>
        </div>
      </header>

      <main className="container section-block">
        <div className="emr-hero-banner glass-card">
          <div className="emr-hero-copy">
            <span className="section-chip">
              <ShieldIcon />
              {copy.patientInfo}
            </span>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>

            <div className="emr-patient-strip">
              <span><strong>{copy.name}</strong> {profile.name || "Sardor Azimov"}</span>
              <span><strong>{copy.phone}</strong> {profile.phone || "+998 90 123 45 67"}</span>
              <span><strong>{copy.email}</strong> {profile.email || "patient@medelite.uz"}</span>
              <span><strong>{copy.city}</strong> {profile.city || "Toshkent shahri"}</span>
            </div>
          </div>

          <div className="emr-hero-actions">
            <button
              type="button"
              onClick={() => setShowAddVitalModal(true)}
              className="button button-primary button-large"
            >
              <ActivityIcon />
              {copy.addVitalBtn}
            </button>
            <button
              type="button"
              onClick={() => alert("Elektron Med Daftarcha fayli (PDF/JPG) biriktirildi va saqlandi.")}
              className="button button-secondary button-large"
            >
              <FileTextIcon />
              Med Daftarcha Yuklash (PDF)
            </button>
            <button
              type="button"
              onClick={downloadFullReport}
              className="button button-secondary button-large"
            >
              <DownloadIcon />
              {copy.downloadReport}
            </button>
          </div>
        </div>

        {/* Modal for adding patient vital */}
        {showAddVitalModal && (
          <div className="modal-backdrop" onClick={() => setShowAddVitalModal(false)}>
            <div className="modal-card glass-card" onClick={(e) => e.stopPropagation()}>
              <h3>{copy.modalTitle}</h3>
              <form onSubmit={handleAddVital} className="vital-form-stack">
                <label className="field">
                  <span>{copy.typeLabel}</span>
                  <select
                    value={newType}
                    onChange={(e) => {
                      setNewType(e.target.value);
                      if (e.target.value === "Qon bosimi") setNewUnit("mmHg");
                      else if (e.target.value === "Yurak urishi") setNewUnit("bpm");
                      else if (e.target.value === "Qondagi shakar") setNewUnit("mmol/L");
                      else if (e.target.value === "Tana harorati") setNewUnit("°C");
                      else setNewUnit("kg/m²");
                    }}
                    className="hero-search-input"
                  >
                    <option value="Qon bosimi">Qon bosimi (Blood Pressure)</option>
                    <option value="Yurak urishi">Yurak urishi (Pulse/Heart Rate)</option>
                    <option value="Qondagi shakar">Qondagi shakar (Blood Glucose)</option>
                    <option value="Tana harorati">Tana harorati (Temperature)</option>
                    <option value="BMI (Vazn indeksi)">BMI (Body Mass Index)</option>
                  </select>
                </label>

                <label className="field">
                  <span>{copy.valLabel}</span>
                  <input
                    type="text"
                    placeholder="Masalan: 120/80 yoki 72"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    required
                    className="hero-search-input"
                  />
                </label>

                <label className="field">
                  <span>{copy.unitLabel}</span>
                  <input
                    type="text"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="hero-search-input"
                  />
                </label>

                <div className="modal-actions-row">
                  <button type="button" onClick={() => setShowAddVitalModal(false)} className="button button-ghost">
                    {copy.cancelBtn}
                  </button>
                  <button type="submit" className="button button-primary">
                    <CheckCircleIcon />
                    {copy.saveBtn}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="emr-tabs">
          <button
            type="button"
            className={`emr-tab-btn ${activeTab === "vitals" ? "emr-tab-active" : ""}`}
            onClick={() => setActiveTab("vitals")}
          >
            <ActivityIcon />
            {copy.tabVitals}
          </button>
          <button
            type="button"
            className={`emr-tab-btn ${activeTab === "prescriptions" ? "emr-tab-active" : ""}`}
            onClick={() => setActiveTab("prescriptions")}
          >
            <PillIcon />
            {copy.tabPrescriptions}
          </button>
          <button
            type="button"
            className={`emr-tab-btn ${activeTab === "labs" ? "emr-tab-active" : ""}`}
            onClick={() => setActiveTab("labs")}
          >
            <FileTextIcon />
            {copy.tabLabs}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "vitals" && (
          <div className="emr-grid">
            {vitals.map((v) => (
              <article key={v.id} className="emr-vital-card glass-card">
                <div className="vital-header">
                  <span className="vital-title">{v.type}</span>
                  <span className="badge badge-gold">
                    <SparkIcon />
                    {v.status === "normal" ? "Normada" : "Diqqat"}
                  </span>
                </div>
                <div className="vital-body">
                  <strong>{v.value}</strong>
                  <span className="vital-unit">{v.unit}</span>
                </div>
                <span className="vital-date">{v.date}</span>
              </article>
            ))}
          </div>
        )}

        {activeTab === "prescriptions" && (
          <div className="emr-stack">
            <div className="emr-add-presc-bar">
              <button
                type="button"
                className="button button-primary button-small"
                onClick={() => {
                  const med = prompt("Dori nomini kiriting:");
                  if (med) handleAddCustomPrescription(med, "Dr. Shaxsiy tavsiya");
                }}
              >
                + Yangi retsept dori kiritish
              </button>
            </div>
            {prescriptions.map((p) => (
              <article key={p.id} className="emr-prescription-card glass-card">
                <div className="prescription-header">
                  <div>
                    <h3>{p.medication}</h3>
                    <p className="doctor-sub">
                      <StethoscopeIcon /> {p.doctorName} ({p.specialty}) • {p.date}
                    </p>
                  </div>
                  <button type="button" onClick={downloadFullReport} className="button button-secondary button-small">
                    <DownloadIcon />
                    {copy.downloadPdf}
                  </button>
                </div>
                <div className="prescription-details-grid">
                  <div>
                    <span>Dozasi:</span>
                    <strong>{p.dosage}</strong>
                  </div>
                  <div>
                    <span>Qabul tartibi:</span>
                    <strong>{p.frequency}</strong>
                  </div>
                  <div>
                    <span>Davomiyligi:</span>
                    <strong>{p.duration}</strong>
                  </div>
                </div>
                <p className="prescription-notes">
                  <strong>Doktor ko'rsatmasi:</strong> {p.notes}
                </p>
              </article>
            ))}
          </div>
        )}

        {activeTab === "labs" && (
          <div className="emr-stack">
            {labs.map((l) => (
              <article key={l.id} className="emr-lab-card glass-card">
                <div className="lab-header">
                  <div>
                    <h3>{l.title}</h3>
                    <p className="lab-sub">{l.facility} • {l.date}</p>
                  </div>
                  <span className="badge">{l.status}</span>
                </div>
                <p className="lab-summary">{l.summary}</p>
                <button type="button" onClick={downloadFullReport} className="button button-secondary button-small">
                  <DownloadIcon />
                  {copy.downloadPdf}
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MedicalRecords;
