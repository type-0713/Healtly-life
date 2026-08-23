import { useState, useRef, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { useI18n } from "../context/I18nContext";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
import {
  ActivityIcon,
  CheckCircleIcon,
  DownloadIcon,
  FileTextIcon,
  PaperclipIcon,
  PillIcon,
  ShieldIcon,
  SparkIcon,
  StethoscopeIcon,
  CloseIcon,
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

type UploadedMedicalFile = {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  dataUrl: string;
};

const VITAL_STORAGE_KEY = "medelite_user_vitals";
const PRESCRIPTION_STORAGE_KEY = "medelite_user_prescriptions";
const LAB_STORAGE_KEY = "medelite_user_labs";
const MEDICAL_FILE_STORAGE_KEY = "medelite_user_pdf_files";
const MAX_PDF_SIZE = 3 * 1024 * 1024;

const initialVitals: VitalEntry[] = [
  { id: "v1", type: "Qon bosimi", value: "120/80", unit: "mmHg", status: "normal", date: "2026-07-30 09:15" },
  { id: "v2", type: "Yurak urishi", value: "72", unit: "bpm", status: "normal", date: "2026-07-30 09:15" },
  { id: "v3", type: "Qondagi shakar", value: "5.4", unit: "mmol/L", status: "normal", date: "2026-07-28 14:00" },
  { id: "v4", type: "Tana harorati", value: "36.6", unit: "°C", status: "normal", date: "2026-07-28 14:00" },
  { id: "v5", type: "BMI (Vazn indeksi)", value: "23.2", unit: "kg/m²", status: "normal", date: "2026-07-25 10:00" },
];

const initialPrescriptions: PrescriptionItem[] = [
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
    notes: "Immunitet va energiya almashinuvini yaxshilash uchun.",
  },
];

const MedicalRecords = () => {
  const { language } = useI18n();
  const { profile } = useAppContext();
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"vitals" | "prescriptions" | "labs" | "files">("vitals");
  const [showAddVitalModal, setShowAddVitalModal] = useState(false);
  const [showAddPrescModal, setShowAddPrescModal] = useState(false);
  const [showAddLabModal, setShowAddLabModal] = useState(false);
  const [newMedName, setNewMedName] = useState("");
  const [newDocName, setNewDocName] = useState("");
  const [newDosage, setNewDosage] = useState("1 tabletka");
  const [newFrequency, setNewFrequency] = useState("Kuniga 1 mahal");
  const [newDuration, setNewDuration] = useState("14 kun");
  const [newPrescriptionNotes, setNewPrescriptionNotes] = useState("");
  const [newLabTitle, setNewLabTitle] = useState("");
  const [newLabFacility, setNewLabFacility] = useState("");
  const [newLabStatus, setNewLabStatus] = useState("Natija kutilmoqda");
  const [newLabSummary, setNewLabSummary] = useState("");
  const [fileError, setFileError] = useState("");

  const [vitals, setVitals] = useState<VitalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(VITAL_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as VitalEntry[]) : initialVitals;
    } catch {
      return initialVitals;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(VITAL_STORAGE_KEY, JSON.stringify(vitals)); } catch { /* quota */ }
  }, [vitals]);

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

  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>(() => {
    try {
      const saved = localStorage.getItem(PRESCRIPTION_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as PrescriptionItem[]) : initialPrescriptions;
    } catch {
      return initialPrescriptions;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(PRESCRIPTION_STORAGE_KEY, JSON.stringify(prescriptions)); } catch { /* quota */ }
  }, [prescriptions]);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedMedicalFile[]>(() => {
    try {
      const saved = localStorage.getItem(MEDICAL_FILE_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as UploadedMedicalFile[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try { localStorage.setItem(MEDICAL_FILE_STORAGE_KEY, JSON.stringify(uploadedFiles)); } catch { /* quota */ }
  }, [uploadedFiles]);

  const handleAddPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;
    const item: PrescriptionItem = {
      id: `p_${Date.now()}`,
      doctorName: newDocName.trim() || "Shaxsiy shifokor",
      specialty: "Umumiy amaliyot",
      medication: newMedName.trim(),
      dosage: newDosage.trim() || "Kiritilmagan",
      frequency: newFrequency.trim() || "Kiritilmagan",
      duration: newDuration.trim() || "Kiritilmagan",
      date: new Date().toISOString().slice(0, 10),
      notes: newPrescriptionNotes.trim() || "Bemor tomonidan kiritilgan ma'lumot.",
    };
    setPrescriptions((prev) => [item, ...prev]);
    setNewMedName("");
    setNewDocName("");
    setNewDosage("1 tabletka");
    setNewFrequency("Kuniga 1 mahal");
    setNewDuration("14 kun");
    setNewPrescriptionNotes("");
    setShowAddPrescModal(false);
  };

  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError("");

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setFileError("Faqat PDF fayl yuklash mumkin.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_PDF_SIZE) {
      setFileError("PDF hajmi 3MB dan oshmasligi kerak.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";

      if (!dataUrl) {
        setFileError("PDF faylni o'qishda xatolik yuz berdi.");
        return;
      }

      setUploadedFiles((current) => [
        {
          id: `file_${Date.now()}`,
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          dataUrl,
        },
        ...current,
      ]);
      event.target.value = "";
    };
    reader.onerror = () => {
      setFileError("PDF faylni o'qishda xatolik yuz berdi.");
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const downloadUploadedPdf = (file: UploadedMedicalFile) => {
    const link = document.createElement("a");
    link.href = file.dataUrl;
    link.download = file.name;
    link.click();
  };

  const removeUploadedPdf = (fileId: string) => {
    setUploadedFiles((current) => current.filter((file) => file.id !== fileId));
  };

  const [labs, setLabs] = useState<LabReport[]>(() => {
    try {
      const saved = localStorage.getItem(LAB_STORAGE_KEY);
      if (saved) return JSON.parse(saved) as LabReport[];
      return [
    {
      id: "l1",
      title: "Umumiy Qon Tahlili (CBC)",
      facility: "MedElite Diagnostic Lab",
      date: "2026-07-28",
      status: "Normada",
      summary: "Gemoglobin: 142 g/L, Eritrotsitlar: 4.8 ×10¹²/L, Leykotsitlar: 6.5 ×10⁹/L. Normativ me'yorda.",
    },
    {
      id: "l2",
      title: "Elektrokardiogramma (EKG)",
      facility: "MedElite Heart Center",
      date: "2026-07-20",
      status: "Normada",
      summary: "Sinusli ritm 72 bpm. Patologik o'zgarishlar aniqlanmadi.",
    },
      ];
    } catch {
      return [];
    }
  });

  // ── Real PDF download using browser print ──
  useEffect(() => {
    try { localStorage.setItem(LAB_STORAGE_KEY, JSON.stringify(labs)); } catch { /* quota */ }
  }, [labs]);

  const handleAddLab = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newLabTitle.trim() || !newLabSummary.trim()) return;

    setLabs((current) => [
      {
        id: `lab_${Date.now()}`,
        title: newLabTitle.trim(),
        facility: newLabFacility.trim() || "Kiritilmagan",
        date: new Date().toISOString().slice(0, 10),
        status: newLabStatus.trim() || "Kiritilmagan",
        summary: newLabSummary.trim(),
      },
      ...current,
    ]);
    setNewLabTitle("");
    setNewLabFacility("");
    setNewLabStatus("Natija kutilmoqda");
    setNewLabSummary("");
    setShowAddLabModal(false);
  };

  const downloadAsPdf = (title: string, content: string) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8"/>
<title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', sans-serif; color: #111; background: #fff; padding: 32px; font-size: 14px; }
  h1 { font-size: 22px; color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 8px; margin-bottom: 16px; }
  h2 { font-size: 16px; color: #1e40af; margin: 20px 0 8px; }
  .meta { background: #f1f5f9; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; line-height: 1.8; }
  .meta span { display: block; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #1e40af; color: #fff; padding: 10px 12px; text-align: left; font-size: 13px; }
  td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
  tr:nth-child(even) td { background: #f8fafc; }
  .badge { display: inline-block; background: #dcfce7; color: #166534; border-radius: 4px; padding: 2px 8px; font-size: 12px; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
<h1>🏥 MedElite — ${title}</h1>
<div class="meta">
  <span><strong>Bemor:</strong> ${profile.name || "Sardor Azimov"}</span>
  <span><strong>Email:</strong> ${profile.email || "patient@medelite.uz"}</span>
  <span><strong>Telefon:</strong> ${profile.phone || "+998 90 123 45 67"}</span>
  <span><strong>Sana:</strong> ${new Date().toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" })}</span>
</div>
${content}
<div class="footer">MedElite Digital Health Platform — Elektron tibbiy hujjat. Shifokor ko'rsatmasisiz ishlatilmasin.</div>
</body>
</html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 400);
  };

  const downloadVitalsPdf = () => {
    const rows = vitals.map(v =>
      `<tr><td>${v.type}</td><td><strong>${v.value}</strong></td><td>${v.unit}</td><td><span class="badge">${v.status === "normal" ? "Normal" : "Diqqat"}</span></td><td>${v.date}</td></tr>`
    ).join("");
    downloadAsPdf("Sog'liq Ko'rsatkichlari (Vitals)", `
      <h2>📊 Vitals — Sog'liq ko'rsatkichlari</h2>
      <table>
        <tr><th>Ko'rsatkich</th><th>Qiymat</th><th>Birlik</th><th>Holat</th><th>Sana</th></tr>
        ${rows}
      </table>`);
  };

  const downloadPrescriptionPdf = (p: PrescriptionItem) => {
    downloadAsPdf(`Retsept — ${p.medication}`, `
      <h2>💊 Retsept: ${p.medication}</h2>
      <table>
        <tr><th>Maydon</th><th>Ma'lumot</th></tr>
        <tr><td>Dori nomi</td><td><strong>${p.medication}</strong></td></tr>
        <tr><td>Shifokor</td><td>${p.doctorName} (${p.specialty})</td></tr>
        <tr><td>Dozasi</td><td>${p.dosage}</td></tr>
        <tr><td>Qabul tartibi</td><td>${p.frequency}</td></tr>
        <tr><td>Davomiyligi</td><td>${p.duration}</td></tr>
        <tr><td>Sana</td><td>${p.date}</td></tr>
        <tr><td>Doktor ko'rsatmasi</td><td>${p.notes}</td></tr>
      </table>`);
  };

  const downloadLabPdf = (l: LabReport) => {
    downloadAsPdf(`Lab Natija — ${l.title}`, `
      <h2>🔬 ${l.title}</h2>
      <table>
        <tr><th>Maydon</th><th>Ma'lumot</th></tr>
        <tr><td>Laboratoriya</td><td>${l.facility}</td></tr>
        <tr><td>Sana</td><td>${l.date}</td></tr>
        <tr><td>Holat</td><td><span class="badge">${l.status}</span></td></tr>
        <tr><td>Xulosa</td><td>${l.summary}</td></tr>
      </table>`);
  };

  const downloadFullReport = () => {
    const vitalRows = vitals.map(v =>
      `<tr><td>${v.type}</td><td>${v.value}</td><td>${v.unit}</td><td>${v.date}</td></tr>`
    ).join("");
    const prescRows = prescriptions.map(p =>
      `<tr><td>${p.medication}</td><td>${p.doctorName}</td><td>${p.dosage}</td><td>${p.frequency}</td><td>${p.duration}</td></tr>`
    ).join("");
    const labRows = labs.map(l =>
      `<tr><td>${l.title}</td><td>${l.facility}</td><td>${l.date}</td><td>${l.status}</td></tr>`
    ).join("");

    downloadAsPdf("To'liq Tibbiy Hisobot", `
      <h2>📊 Sog'liq Ko'rsatkichlari (Vitals)</h2>
      <table>
        <tr><th>Ko'rsatkich</th><th>Qiymat</th><th>Birlik</th><th>Sana</th></tr>
        ${vitalRows}
      </table>
      <h2>💊 Retseptlar</h2>
      <table>
        <tr><th>Dori</th><th>Shifokor</th><th>Doza</th><th>Tartib</th><th>Muddat</th></tr>
        ${prescRows}
      </table>
      <h2>🔬 Tahlil Natijalari</h2>
      <table>
        <tr><th>Tahlil</th><th>Laboratoriya</th><th>Sana</th><th>Natija</th></tr>
        ${labRows}
      </table>`);
  };

  const copy = {
    uz: {
      title: "Elektron Tibbiy Kartochka (EMR)",
      subtitle: "Bemorning shaxsiy ko'rsatkichlari, raqamli retseptlari va tahlil natijalari",
      tabVitals: "Vitals",
      tabPrescriptions: "Retseptlar",
      tabLabs: "Tahlillar",
      tabFiles: "PDF fayllar",
      uploadPdf: "PDF biriktirish",
      uploadedFilesTitle: "Yuklangan PDF fayllar",
      emptyFiles: "Hali PDF yuklanmagan. Tahlil, retsept yoki eski tibbiy kartangizni biriktiring.",
      addVitalBtn: "Ko'rsatkich kiritish",
      downloadReport: "To'liq PDF yuklab olish",
      patientInfo: "Bemor profili",
      name: "Ismi:",
      phone: "Telefon:",
      email: "Email:",
      city: "Shahar:",
      backHome: "Orqaga",
      downloadPdf: "PDF yuklash",
      modalTitle: "Yangi Ko'rsatkich Kiritish",
      typeLabel: "Ko'rsatkich turi:",
      valLabel: "Qiymati:",
      unitLabel: "O'lchov birligi:",
      saveBtn: "Saqlash",
      cancelBtn: "Bekor qilish",
      addPrescTitle: "Yangi Retsept Kiritish",
      medNameLabel: "Dori nomi:",
      docNameLabel: "Shifokor ismi (ixtiyoriy):",
      medPlaceholder: "Masalan: Ibuprofen 400mg",
      docPlaceholder: "Masalan: Dr. Karimov",
    },
    ru: {
      title: "Электронная медицинская карта (ЭМК)",
      subtitle: "Показатели здоровья, цифровые рецепты и результаты анализов",
      tabVitals: "Витальные",
      tabPrescriptions: "Рецепты",
      tabLabs: "Анализы",
      tabFiles: "PDF",
      uploadPdf: "PDF yuklash",
      uploadedFilesTitle: "Yuklangan PDF fayllar",
      emptyFiles: "Hali PDF yuklanmagan.",
      addVitalBtn: "Добавить показатель",
      downloadReport: "Скачать полный PDF",
      patientInfo: "Профиль пациента",
      name: "Имя:",
      phone: "Телефон:",
      email: "Email:",
      city: "Город:",
      backHome: "Назад",
      downloadPdf: "Скачать PDF",
      modalTitle: "Новый показатель здоровья",
      typeLabel: "Тип показателя:",
      valLabel: "Значение:",
      unitLabel: "Единица:",
      saveBtn: "Сохранить",
      cancelBtn: "Отмена",
      addPrescTitle: "Новый рецепт",
      medNameLabel: "Название лекарства:",
      docNameLabel: "Врач (необязательно):",
      medPlaceholder: "Напр.: Ибупрофен 400мг",
      docPlaceholder: "Напр.: Др. Каримов",
    },
    en: {
      title: "Electronic Medical Records (EMR)",
      subtitle: "Personal health vitals, digital prescriptions, and lab diagnostic reports",
      tabVitals: "Vitals",
      tabPrescriptions: "Prescriptions",
      tabLabs: "Lab Reports",
      tabFiles: "PDF files",
      uploadPdf: "Attach PDF",
      uploadedFilesTitle: "Uploaded PDF files",
      emptyFiles: "No PDF has been uploaded yet.",
      addVitalBtn: "Add Vital",
      downloadReport: "Download Full PDF",
      patientInfo: "Patient Profile",
      name: "Name:",
      phone: "Phone:",
      email: "Email:",
      city: "City:",
      backHome: "Back",
      downloadPdf: "Download PDF",
      modalTitle: "Record New Vital Sign",
      typeLabel: "Vital Type:",
      valLabel: "Value:",
      unitLabel: "Unit:",
      saveBtn: "Save",
      cancelBtn: "Cancel",
      addPrescTitle: "Add New Prescription",
      medNameLabel: "Medicine name:",
      docNameLabel: "Doctor name (optional):",
      medPlaceholder: "e.g. Ibuprofen 400mg",
      docPlaceholder: "e.g. Dr. Karimov",
    },
  }[language];

  return (
    <div className="page-shell" ref={printRef}>
      <Seo title={`MedElite | ${copy.title}`} description={copy.subtitle} path="/medical-records" />
      <div className="site-orb site-orb-one" />
      <div className="site-orb site-orb-two" />

      <Navbar brandSuffix="EMR" />

      <main className="container section-block">
        {/* Hero Banner */}
        <div className="emr-hero-banner glass-card">
          <div className="emr-hero-copy">
            <span className="section-chip"><ShieldIcon />{copy.patientInfo}</span>
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
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="visually-hidden-file"
              onChange={handlePdfUpload}
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="button button-secondary">
              <PaperclipIcon />{copy.uploadPdf}
            </button>
            <button type="button" onClick={() => setShowAddVitalModal(true)} className="button button-primary">
              <ActivityIcon />{copy.addVitalBtn}
            </button>
            <button type="button" onClick={downloadFullReport} className="button button-secondary">
              <DownloadIcon />{copy.downloadReport}
            </button>
          </div>
        </div>

        {/* ── Add Vital Modal ── */}
        {showAddVitalModal && (
          <div className="modal-backdrop" onClick={() => setShowAddVitalModal(false)}>
            <div className="modal-card glass-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-card-head">
                <h3>{copy.modalTitle}</h3>
                <button type="button" className="modal-close-btn" onClick={() => setShowAddVitalModal(false)}>
                  <CloseIcon />
                </button>
              </div>
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
                    <option value="Yurak urishi">Yurak urishi (Pulse)</option>
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
                    <CheckCircleIcon />{copy.saveBtn}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Add Prescription Modal ── */}
        {showAddPrescModal && (
          <div className="modal-backdrop" onClick={() => setShowAddPrescModal(false)}>
            <div className="modal-card glass-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-card-head">
                <h3>{copy.addPrescTitle}</h3>
                <button type="button" className="modal-close-btn" onClick={() => setShowAddPrescModal(false)}>
                  <CloseIcon />
                </button>
              </div>
              <form onSubmit={handleAddPrescription} className="vital-form-stack">
                <label className="field">
                  <span>{copy.medNameLabel}</span>
                  <input
                    type="text"
                    placeholder={copy.medPlaceholder}
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    required
                    autoFocus
                    className="hero-search-input"
                  />
                </label>
                <label className="field">
                  <span>{copy.docNameLabel}</span>
                  <input
                    type="text"
                    placeholder={copy.docPlaceholder}
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="hero-search-input"
                  />
                </label>
                <label className="field">
                  <span>Dozasi</span>
                  <input
                    type="text"
                    value={newDosage}
                    onChange={(e) => setNewDosage(e.target.value)}
                    className="hero-search-input"
                  />
                </label>
                <label className="field">
                  <span>Qabul tartibi</span>
                  <input
                    type="text"
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value)}
                    className="hero-search-input"
                  />
                </label>
                <label className="field">
                  <span>Davomiyligi</span>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="hero-search-input"
                  />
                </label>
                <label className="field">
                  <span>Izoh</span>
                  <textarea
                    rows={3}
                    value={newPrescriptionNotes}
                    onChange={(e) => setNewPrescriptionNotes(e.target.value)}
                    className="hero-search-input"
                    placeholder="Qo'shimcha ko'rsatma"
                  />
                </label>
                <div className="modal-actions-row">
                  <button type="button" onClick={() => setShowAddPrescModal(false)} className="button button-ghost">
                    {copy.cancelBtn}
                  </button>
                  <button type="submit" className="button button-primary">
                    <CheckCircleIcon />{copy.saveBtn}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAddLabModal && (
          <div className="modal-backdrop" onClick={() => setShowAddLabModal(false)}>
            <div className="modal-card glass-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-card-head">
                <h3>Yangi tahlil kiritish</h3>
                <button type="button" className="modal-close-btn" onClick={() => setShowAddLabModal(false)}>
                  <CloseIcon />
                </button>
              </div>
              <form onSubmit={handleAddLab} className="vital-form-stack">
                <label className="field">
                  <span>Tahlil nomi</span>
                  <input className="hero-search-input" value={newLabTitle} onChange={(e) => setNewLabTitle(e.target.value)} required />
                </label>
                <label className="field">
                  <span>Laboratoriya yoki klinika</span>
                  <input className="hero-search-input" value={newLabFacility} onChange={(e) => setNewLabFacility(e.target.value)} />
                </label>
                <label className="field">
                  <span>Holat</span>
                  <input className="hero-search-input" value={newLabStatus} onChange={(e) => setNewLabStatus(e.target.value)} />
                </label>
                <label className="field">
                  <span>Xulosa yoki natija</span>
                  <textarea className="hero-search-input" rows={4} value={newLabSummary} onChange={(e) => setNewLabSummary(e.target.value)} required />
                </label>
                <div className="modal-actions-row">
                  <button type="button" onClick={() => setShowAddLabModal(false)} className="button button-ghost">{copy.cancelBtn}</button>
                  <button type="submit" className="button button-primary"><CheckCircleIcon />{copy.saveBtn}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="emr-tabs">
          <button type="button" className={`emr-tab-btn ${activeTab === "vitals" ? "emr-tab-active" : ""}`} onClick={() => setActiveTab("vitals")}>
            <ActivityIcon />{copy.tabVitals}
          </button>
          <button type="button" className={`emr-tab-btn ${activeTab === "prescriptions" ? "emr-tab-active" : ""}`} onClick={() => setActiveTab("prescriptions")}>
            <PillIcon />{copy.tabPrescriptions}
          </button>
          <button type="button" className={`emr-tab-btn ${activeTab === "labs" ? "emr-tab-active" : ""}`} onClick={() => setActiveTab("labs")}>
            <FileTextIcon />{copy.tabLabs}
          </button>
          <button type="button" className={`emr-tab-btn ${activeTab === "files" ? "emr-tab-active" : ""}`} onClick={() => setActiveTab("files")}>
            <PaperclipIcon />{copy.tabFiles}
          </button>
        </div>

        {fileError && (
          <section className="confirmation-banner confirmation-banner-error">
            <div className="confirmation-icon confirmation-icon-error">
              <CloseIcon />
            </div>
            <div>
              <h2>PDF yuklashda xatolik</h2>
              <p>{fileError}</p>
            </div>
          </section>
        )}

        {/* ── Vitals Tab ── */}
        {activeTab === "vitals" && (
          <>
            <div className="emr-tab-action-bar">
              <button type="button" onClick={downloadVitalsPdf} className="button button-secondary button-small">
                <DownloadIcon />{copy.downloadPdf}
              </button>
            </div>
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
          </>
        )}

        {/* ── Prescriptions Tab ── */}
        {activeTab === "prescriptions" && (
          <div className="emr-stack">
            <div className="emr-add-presc-bar">
              <button type="button" className="button button-primary button-small" onClick={() => setShowAddPrescModal(true)}>
                + {copy.addPrescTitle}
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
                  <button type="button" onClick={() => downloadPrescriptionPdf(p)} className="button button-secondary button-small">
                    <DownloadIcon />{copy.downloadPdf}
                  </button>
                </div>
                <div className="prescription-details-grid">
                  <div><span>Dozasi:</span><strong>{p.dosage}</strong></div>
                  <div><span>Qabul tartibi:</span><strong>{p.frequency}</strong></div>
                  <div><span>Davomiyligi:</span><strong>{p.duration}</strong></div>
                </div>
                <p className="prescription-notes">
                  <strong>Doktor ko'rsatmasi:</strong> {p.notes}
                </p>
              </article>
            ))}
          </div>
        )}

        {/* ── Labs Tab ── */}
        {activeTab === "labs" && (
          <div className="emr-stack">
            <div className="emr-add-presc-bar">
              <button type="button" className="button button-primary button-small" onClick={() => setShowAddLabModal(true)}>
                + Tahlil kiritish
              </button>
            </div>
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
                <button type="button" onClick={() => downloadLabPdf(l)} className="button button-secondary button-small">
                  <DownloadIcon />{copy.downloadPdf}
                </button>
              </article>
            ))}
            {labs.length === 0 && (
              <div className="empty-state">
                <h3>Tahlil hali kiritilmagan</h3>
                <p>Tahlil natijasini qo'lda kiriting yoki PDF fayl sifatida biriktiring.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "files" && (
          <div className="emr-stack">
            <div className="emr-add-presc-bar">
              <button type="button" className="button button-primary button-small" onClick={() => fileInputRef.current?.click()}>
                <PaperclipIcon />
                {copy.uploadPdf}
              </button>
            </div>

            <article className="emr-lab-card glass-card">
              <div className="lab-header">
                <div>
                  <h3>{copy.uploadedFilesTitle}</h3>
                  <p className="lab-sub">PDF | maksimum 3MB</p>
                </div>
                <span className="badge">{uploadedFiles.length}</span>
              </div>

              {uploadedFiles.length > 0 ? (
                <div className="uploaded-file-list">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="uploaded-file-row">
                      <div>
                        <strong>{file.name}</strong>
                        <span>
                          {(file.size / 1024 / 1024).toFixed(2)} MB |{" "}
                          {new Date(file.uploadedAt).toLocaleDateString("uz-UZ")}
                        </span>
                      </div>
                      <div className="uploaded-file-actions">
                        <button type="button" className="button button-secondary button-small" onClick={() => downloadUploadedPdf(file)}>
                          <DownloadIcon />
                          Yuklash
                        </button>
                        <button type="button" className="button button-ghost button-small" onClick={() => removeUploadedPdf(file.id)}>
                          <CloseIcon />
                          O'chirish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <h3>PDF yo'q</h3>
                  <p>{copy.emptyFiles}</p>
                </div>
              )}
            </article>
          </div>
        )}
      </main>
    </div>
  );
};

export default MedicalRecords;
