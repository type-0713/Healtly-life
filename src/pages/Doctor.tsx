import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ThemeToggle from "../components/ThemeToggle";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  HeartPulseIcon,
  LocationIcon,
  MenuIcon,
  PhoneIcon,
  ShieldIcon,
  SparkIcon,
  StethoscopeIcon,
  UserGroupIcon,
} from "../components/PremiumIcons";
import {
  calculateDoctorPerformance,
  formatCurrency,
  getDoctorRequestReady,
  useAppContext,
  type DoctorProfileInput,
} from "../context/AppContext";
import { useI18n } from "../context/I18nContext";
import { getMapSearchUrl } from "../lib/maps";
import { UZBEKISTAN_REGIONS } from "../lib/regions";
import { DEFAULT_TIME_SLOTS } from "../lib/schedule";

const emptyDoctorForm: DoctorProfileInput = {
  name: "",
  specialty: "",
  region: "Toshkent shahri",
  experience: "",
  price: "",
  clinic: "",
  address: "",
  mapQuery: "",
  bio: "",
  availableSlots: ["09:00", "10:00", "14:00", "18:00"],
};

const playDoctorAlert = () => {
  if (typeof window === "undefined") {
    return;
  }

  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  const audioContext = new AudioContextClass();
  const now = audioContext.currentTime;
  const duration = 3;
  const gain = audioContext.createGain();
  const compressor = audioContext.createDynamicsCompressor();
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.18, now + duration);

  const mainOsc = audioContext.createOscillator();
  mainOsc.type = "sawtooth";
  mainOsc.frequency.setValueAtTime(880, now);
  mainOsc.frequency.exponentialRampToValueAtTime(660, now + duration);

  const supportOsc = audioContext.createOscillator();
  supportOsc.type = "square";
  supportOsc.frequency.setValueAtTime(440, now);
  supportOsc.frequency.exponentialRampToValueAtTime(330, now + duration);

  mainOsc.connect(gain);
  supportOsc.connect(gain);
  gain.connect(compressor);
  compressor.connect(audioContext.destination);

  mainOsc.start(now);
  supportOsc.start(now);
  mainOsc.stop(now + duration);
  supportOsc.stop(now + duration);

  window.setTimeout(() => {
    void audioContext.close().catch(() => undefined);
  }, duration * 1000 + 300);
};

const Doctor = () => {
  const { translateError, translateStatus, translateRegion, translateSpecialty } = useI18n();
  const {
    appointments,
    currentDoctor,
    doctorApprovalStatus,
    signOutUser,
    toggleDoctorOnlineStatus,
    updateDoctorAppointmentStatus,
    updateDoctorProfile,
  } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [doctorForm, setDoctorForm] = useState<DoctorProfileInput>(emptyDoctorForm);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busyActionId, setBusyActionId] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const readyRequestIds = useRef<string[]>([]);

  useEffect(() => {
    if (!currentDoctor) {
      return;
    }

    setDoctorForm({
      name: currentDoctor.name || "",
      specialty: currentDoctor.specialty || "",
      region: currentDoctor.region || "Toshkent shahri",
      experience: currentDoctor.experience || "",
      price: currentDoctor.price || "",
      clinic: currentDoctor.clinic || "",
      address: currentDoctor.address || "",
      mapQuery: currentDoctor.mapQuery || "",
      bio: currentDoctor.bio || "",
      availableSlots: currentDoctor.availableSlots.length ? currentDoctor.availableSlots : emptyDoctorForm.availableSlots,
    });
  }, [currentDoctor]);

  useEffect(() => {
    if (doctorApprovalStatus === "approved" && currentDoctor && !currentDoctor.profileCompleted) {
      setShowProfileModal(true);
    }
  }, [currentDoctor, doctorApprovalStatus]);

  const doctorAppointments = useMemo(() => {
    if (!currentDoctor) {
      return [];
    }

    return appointments.filter((appointment) => appointment.doctorId === currentDoctor.id);
  }, [appointments, currentDoctor]);

  const requestQueue = useMemo(
    () =>
      doctorAppointments.filter(
        (appointment) => appointment.status === "Kutilmoqda" && getDoctorRequestReady(appointment),
      ),
    [doctorAppointments],
  );

  const delayedQueue = useMemo(
    () =>
      doctorAppointments.filter(
        (appointment) => appointment.status === "Kutilmoqda" && !getDoctorRequestReady(appointment),
      ),
    [doctorAppointments],
  );

  const acceptedQueue = useMemo(
    () =>
      doctorAppointments.filter(
        (appointment) => appointment.status === "Tasdiqlandi" || appointment.status === "Yakunlandi",
      ),
    [doctorAppointments],
  );

  const historyQueue = useMemo(
    () =>
      doctorAppointments.filter(
        (appointment) =>
          appointment.status === "Yakunlandi" ||
          appointment.status === "Bekor qilindi" ||
          appointment.status === "Rad etildi",
      ),
    [doctorAppointments],
  );

  const performance = currentDoctor
    ? calculateDoctorPerformance(currentDoctor, appointments)
    : { totalOrders: 0, totalEarnings: 0, pendingOrders: 0 };

  useEffect(() => {
    const nextReadyIds = requestQueue.map((appointment) => appointment.id);
    const previousIds = readyRequestIds.current;
    const hasNewRequest = nextReadyIds.some((id) => !previousIds.includes(id));

    if (hasNewRequest) {
      playDoctorAlert();
    }

    readyRequestIds.current = nextReadyIds;
  }, [requestQueue]);

  const handleDoctorAction = async (
    appointmentId: string,
    status: "Tasdiqlandi" | "Rad etildi" | "Yakunlandi",
    reason?: string,
  ) => {
    try {
      setBusyActionId(appointmentId + status);
      setNotice("");
      setError("");
      await updateDoctorAppointmentStatus(appointmentId, status, reason);
      setNotice(
        status === "Tasdiqlandi"
          ? "Buyurtma qabul qilindi."
          : status === "Rad etildi"
            ? "Buyurtma rad etildi."
            : "Qabul yakunlandi.",
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? translateError(actionError.message)
          : translateError("Kirishda xatolik yuz berdi."),
      );
    } finally {
      setBusyActionId("");
    }
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSavingProfile(true);
      setError("");
      await updateDoctorProfile(doctorForm);
      setNotice("Doktor profili muvaffaqiyatli saqlandi.");
      setShowProfileModal(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? translateError(submitError.message)
          : translateError("Kirishda xatolik yuz berdi."),
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const toggleSlot = (slot: string) => {
    setDoctorForm((current) => ({
      ...current,
      availableSlots: current.availableSlots.includes(slot)
        ? current.availableSlots.filter((item) => item !== slot)
        : [...current.availableSlots, slot].sort(),
    }));
  };

  if (!currentDoctor) {
    return null;
  }

  const waitingTitle =
    doctorApprovalStatus === "rejected"
      ? "Arizangiz hozircha rad etilgan"
      : "Admin tasdig'i kutilmoqda";
  const waitingText =
    doctorApprovalStatus === "rejected"
      ? "Admin bilan bog'lanib profil ma'lumotlarini yangilang yoki keyinroq qayta urinib ko'ring."
      : "Ro'yxatdan o'tish muvaffaqiyatli yakunlandi. Admin tasdiqlaganidan keyin kabinet to'liq ochiladi va onboarding modal chiqadi.";

  return (
    <div className="dashboard-page doctor-page">
      <header className="dashboard-topbar">
        <div className="container dashboard-topbar-inner">
          <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
            <span className="brand-mark">
              <HeartPulseIcon />
            </span>
            <span>
              Med<span className="brand-accent">Elite</span>
            </span>
          </Link>

          <div className={`dashboard-menu ${menuOpen ? "dashboard-menu-open" : ""}`}>
            <div className="dashboard-actions">
              <LanguageSwitcher compact />
              <ThemeToggle compact />
              <Link to="/user" className="button button-secondary" onClick={() => setMenuOpen(false)}>
                User panel
              </Link>
              <button type="button" className="button button-ghost" onClick={() => void signOutUser()}>
                Chiqish
              </button>
            </div>
          </div>

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </header>

      <main className="container dashboard-content">
        <section className="dashboard-hero doctor-hero">
          <div>
            <span className="section-chip">Doctor realtime desk</span>
            <h1>{currentDoctor.name || "Yangi doktor kabineti"}</h1>
            <p>
              Requestlar 30 daqiqalik kechikish bilan tushadi, online/offline holat esa faqat
              ishlash rejimingizni bildiradi. Offline bo'lsangiz ham, bo'sh vaqt bo'lsa request sizga
              yetib keladi va qabul qilish-qilmaslikni o'zingiz hal qilasiz.
            </p>
          </div>

          <div className="dashboard-tagline glass-card">
            <SparkIcon />
            {currentDoctor.approvalStatus === "approved"
              ? currentDoctor.isOnline
                ? "Ishda"
                : "Ishda emas, ammo requestlar keladi"
              : "Tasdiq kutilmoqda"}
          </div>
        </section>

        {doctorApprovalStatus !== "approved" ? (
          <section className="preview-card doctor-waiting-card">
            <div className="panel-heading">
              <div>
                <span className="section-chip">Approval flow</span>
                <h2>{waitingTitle}</h2>
              </div>
              <span className="badge">
                <ShieldIcon />
                {doctorApprovalStatus}
              </span>
            </div>
            <p className="preview-subtext">{waitingText}</p>
            <div className="summary-checks">
              <div>
                <CheckIcon />
                <span>Ro'yxatdan o'tgan email: {currentDoctor.ownerEmail}</span>
              </div>
              <div>
                <CheckIcon />
                <span>Profil approved bo'lgach modal orqali to'ldiriladi</span>
              </div>
              <div>
                <CheckIcon />
                <span>Admin istasa sizni ruxsat beradi yoki o'chiradi</span>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="doctor-kpi-grid">
              <article className="dashboard-mini-card">
                <span>Jami buyurtma</span>
                <strong>{performance.totalOrders}</strong>
              </article>
              <article className="dashboard-mini-card">
                <span>Kutilayotgan request</span>
                <strong>{requestQueue.length}</strong>
              </article>
              <article className="dashboard-mini-card">
                <span>Daromad</span>
                <strong>{formatCurrency(performance.totalEarnings)}</strong>
              </article>
              <article className="dashboard-mini-card">
                <span>Reyting</span>
                <strong>{currentDoctor.rating.toFixed(1)} / 5</strong>
              </article>
            </section>

            <section className="doctor-command-grid">
              <article className="preview-card preview-highlight">
                <div className="panel-heading">
                  <div>
                    <span className="section-chip">Work mode</span>
                    <h2>Ish holati va qabul oqimi</h2>
                  </div>
                  <span className={`badge ${currentDoctor.isOnline ? "badge-gold" : ""}`}>
                    <ClockIcon />
                    {currentDoctor.isOnline ? "Ishda" : "Ishda emas"}
                  </span>
                </div>
                <p className="preview-subtext">
                  Tugma sizning hozirgi ish holatingizni ko'rsatadi. Lekin bo'sh vaqtlar mavjud bo'lsa,
                  foydalanuvchi sizga request yubora oladi va siz uni keyin qabul qilishingiz yoki rad
                  etishingiz mumkin.
                </p>
                <div className="doctor-work-toggle">
                  <button
                    type="button"
                    className={`button ${currentDoctor.isOnline ? "button-primary" : "button-secondary"} button-large`}
                    onClick={() => void toggleDoctorOnlineStatus(!currentDoctor.isOnline)}
                  >
                    {currentDoctor.isOnline ? "Ishda turibman" : "Ishga qaytdim"}
                  </button>
                  <button
                    type="button"
                    className="button button-ghost button-large"
                    onClick={() => setShowProfileModal(true)}
                  >
                    Profilni tahrirlash
                  </button>
                </div>
              </article>

              <article className="preview-card">
                <div className="panel-heading">
                  <div>
                    <span className="section-chip">About doctor</span>
                    <h2>Profil ko'rinishi</h2>
                  </div>
                  <span className="badge">
                    <UserGroupIcon />
                    {currentDoctor.reviewCount} review
                  </span>
                </div>
                <div className="info-stack">
                  <div>
                    <span>Yo'nalish</span>
                    <strong>{translateSpecialty(currentDoctor.specialty || "-")}</strong>
                  </div>
                  <div>
                    <span>Hudud</span>
                    <strong>{translateRegion(currentDoctor.region || "-")}</strong>
                  </div>
                  <div>
                    <span>Klinika</span>
                    <strong>{currentDoctor.clinic || "-"}</strong>
                  </div>
                  <div>
                    <span>Narx</span>
                    <strong>{currentDoctor.price || "-"}</strong>
                  </div>
                </div>
                <div className="doctor-slot-list">
                  {currentDoctor.availableSlots.map((slot) => (
                    <span key={slot} className="doctor-slot-chip">
                      {slot}
                    </span>
                  ))}
                </div>
              </article>
            </section>

            <section className="doctor-workspace-grid">
              <article className="preview-card preview-highlight doctor-queue-card">
                <div className="panel-heading">
                  <div>
                    <span className="section-chip">Ready requests</span>
                    <h2>Qabul qilish uchun tayyor buyurtmalar</h2>
                  </div>
                  <span className="badge badge-gold">
                    <SparkIcon />
                    {requestQueue.length}
                  </span>
                </div>

                <div className="doctor-request-list">
                  {requestQueue.map((appointment) => (
                    <article key={appointment.id} className="doctor-request-item">
                      <div className="appointment-card-head">
                        <div>
                          <h3>{appointment.patientName}</h3>
                          <p>{appointment.patientPhone}</p>
                        </div>
                        <span className="badge">{translateStatus(appointment.status)}</span>
                      </div>
                      <div className="appointment-meta-grid">
                        <div>
                          <CalendarIcon />
                          <span>{appointment.date}</span>
                        </div>
                        <div>
                          <ClockIcon />
                          <span>{appointment.time}</span>
                        </div>
                        <div>
                          <LocationIcon />
                          <span>{appointment.clinic}</span>
                        </div>
                      </div>
                      {appointment.notes && <p>{appointment.notes}</p>}
                      <div className="doctor-request-actions">
                        <button
                          type="button"
                          className="button button-primary"
                          disabled={busyActionId === appointment.id + "Tasdiqlandi"}
                          onClick={() => void handleDoctorAction(appointment.id, "Tasdiqlandi")}
                        >
                          Qabul qilish
                        </button>
                        <button
                          type="button"
                          className="button button-ghost"
                          disabled={busyActionId === appointment.id + "Rad etildi"}
                          onClick={() =>
                            void handleDoctorAction(
                              appointment.id,
                              "Rad etildi",
                              currentDoctor.isOnline
                                ? "Doktor hozir band"
                                : "Doktor hozir ishda emas",
                            )
                          }
                        >
                          Rad etish
                        </button>
                      </div>
                    </article>
                  ))}

                  {requestQueue.length === 0 && (
                    <div className="empty-state">
                      <h3>Hozircha tayyor request yo'q</h3>
                      <p>Yangi buyurtma 30 daqiqa kechikishdan keyin shu bo'limga tushadi.</p>
                    </div>
                  )}
                </div>
              </article>

              <article className="preview-card doctor-queue-card">
                <div className="panel-heading">
                  <div>
                    <span className="section-chip">Delay queue</span>
                    <h2>30 daqiqalik navbat</h2>
                  </div>
                  <span className="badge">
                    <ClockIcon />
                    {delayedQueue.length}
                  </span>
                </div>
                <div className="doctor-request-list">
                  {delayedQueue.map((appointment) => (
                    <article key={appointment.id} className="doctor-request-item">
                      <div className="appointment-card-head">
                        <div>
                          <h3>{appointment.patientName}</h3>
                          <p>{appointment.patientEmail || appointment.patientPhone}</p>
                        </div>
                        <span className="badge">30 min queue</span>
                      </div>
                      <div className="appointment-meta-grid">
                        <div>
                          <CalendarIcon />
                          <span>{appointment.date}</span>
                        </div>
                        <div>
                          <ClockIcon />
                          <span>{appointment.time}</span>
                        </div>
                        <div>
                          <PhoneIcon />
                          <span>{appointment.patientPhone}</span>
                        </div>
                      </div>
                    </article>
                  ))}

                  {delayedQueue.length === 0 && (
                    <div className="empty-state">
                      <h3>Navbatda buyurtma yo'q</h3>
                      <p>Yangi bookinglar paydo bo'lsa avval shu yerda kechikish bilan ko'rinadi.</p>
                    </div>
                  )}
                </div>
              </article>
            </section>

            <section className="doctor-workspace-grid">
              <article className="preview-card doctor-queue-card">
                <div className="panel-heading">
                  <div>
                    <span className="section-chip">Accepted flow</span>
                    <h2>Faol qabullar</h2>
                  </div>
                  <span className="badge">
                    <CheckIcon />
                    {acceptedQueue.length}
                  </span>
                </div>
                <div className="doctor-request-list">
                  {acceptedQueue
                    .filter((appointment) => appointment.status === "Tasdiqlandi")
                    .map((appointment) => (
                      <article key={appointment.id} className="doctor-request-item">
                        <div className="appointment-card-head">
                          <div>
                            <h3>{appointment.patientName}</h3>
                            <p>{appointment.patientPhone}</p>
                          </div>
                          <span className="badge">{translateStatus(appointment.status)}</span>
                        </div>
                        <div className="appointment-meta-grid">
                          <div>
                            <CalendarIcon />
                            <span>{appointment.date}</span>
                          </div>
                          <div>
                            <ClockIcon />
                            <span>{appointment.time}</span>
                          </div>
                          <div>
                            <LocationIcon />
                            <span>{appointment.address}</span>
                          </div>
                        </div>
                        <div className="doctor-request-actions">
                          <a
                            href={getMapSearchUrl(appointment.mapQuery)}
                            target="_blank"
                            rel="noreferrer"
                            className="button button-secondary"
                          >
                            Xaritada ochish
                            <ArrowRightIcon />
                          </a>
                          <button
                            type="button"
                            className="button button-primary"
                            disabled={busyActionId === appointment.id + "Yakunlandi"}
                            onClick={() => void handleDoctorAction(appointment.id, "Yakunlandi")}
                          >
                            Qabulni yakunlash
                          </button>
                        </div>
                      </article>
                    ))}
                </div>
              </article>

              <article className="preview-card doctor-queue-card">
                <div className="panel-heading">
                  <div>
                    <span className="section-chip">History</span>
                    <h2>Tarix</h2>
                  </div>
                  <span className="badge">
                    <SparkIcon />
                    {historyQueue.length}
                  </span>
                </div>
                <div className="doctor-request-list">
                  {historyQueue.map((appointment) => (
                    <article key={appointment.id} className="doctor-request-item">
                      <div className="appointment-card-head">
                        <div>
                          <h3>{appointment.patientName}</h3>
                          <p>{appointment.patientPhone}</p>
                        </div>
                        <span className="badge">{translateStatus(appointment.status)}</span>
                      </div>
                      <div className="appointment-meta-grid">
                        <div>
                          <CalendarIcon />
                          <span>{appointment.date}</span>
                        </div>
                        <div>
                          <ClockIcon />
                          <span>{appointment.time}</span>
                        </div>
                        <div>
                          <LocationIcon />
                          <span>{appointment.clinic}</span>
                        </div>
                      </div>
                      {appointment.rejectedReason && <p>{appointment.rejectedReason}</p>}
                    </article>
                  ))}
                </div>
              </article>
            </section>
          </>
        )}

        {notice && (
          <section className="confirmation-banner">
            <div className="confirmation-icon">
              <CheckIcon />
            </div>
            <div>
              <h2>Yangilanish tayyor</h2>
              <p>{notice}</p>
            </div>
          </section>
        )}

        {error && (
          <section className="confirmation-banner confirmation-banner-error">
            <div className="confirmation-icon confirmation-icon-error">
              <CloseIcon />
            </div>
            <div>
              <h2>Xatolik yuz berdi</h2>
              <p>{error}</p>
            </div>
          </section>
        )}
      </main>

      {showProfileModal && (
        <div className="modal-backdrop" onClick={() => setShowProfileModal(false)} role="presentation">
          <div
            className="modal-card doctor-profile-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="doctor-profile-title"
          >
            <form className="booking-form modal-scroll-area" onSubmit={handleProfileSubmit}>
              <div className="panel-heading">
                <div>
                  <span className="section-chip">Doctor setup</span>
                  <h2 id="doctor-profile-title">Doktor profilini to'ldirish</h2>
                </div>
                <button type="button" className="icon-button" onClick={() => setShowProfileModal(false)}>
                  <CloseIcon />
                </button>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span>To'liq ism</span>
                  <div className="field-box">
                    <UserGroupIcon />
                    <input
                      value={doctorForm.name}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, name: event.target.value }))
                      }
                      required
                    />
                  </div>
                </label>
                <label className="field">
                  <span>Yo'nalish</span>
                  <div className="field-box">
                    <StethoscopeIcon />
                    <input
                      value={doctorForm.specialty}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, specialty: event.target.value }))
                      }
                      required
                    />
                  </div>
                </label>
                <label className="field">
                  <span>Hudud</span>
                  <div className="field-box field-box-select">
                    <LocationIcon />
                    <select
                      value={doctorForm.region}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, region: event.target.value }))
                      }
                    >
                      {UZBEKISTAN_REGIONS.map((region) => (
                        <option key={region} value={region}>
                          {translateRegion(region)}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
                <label className="field">
                  <span>Tajriba</span>
                  <div className="field-box">
                    <ClockIcon />
                    <input
                      value={doctorForm.experience}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, experience: event.target.value }))
                      }
                      placeholder="Masalan, 8 yil"
                      required
                    />
                  </div>
                </label>
                <label className="field">
                  <span>Narx</span>
                  <div className="field-box">
                    <SparkIcon />
                    <input
                      value={doctorForm.price}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, price: event.target.value }))
                      }
                      placeholder="Masalan, 180 000 so'm"
                      required
                    />
                  </div>
                </label>
                <label className="field field-full">
                  <span>Klinika</span>
                  <div className="field-box">
                    <ShieldIcon />
                    <input
                      value={doctorForm.clinic}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, clinic: event.target.value }))
                      }
                      required
                    />
                  </div>
                </label>
                <label className="field field-full">
                  <span>Manzil</span>
                  <div className="field-box">
                    <LocationIcon />
                    <input
                      value={doctorForm.address}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, address: event.target.value }))
                      }
                      required
                    />
                  </div>
                </label>
                <label className="field field-full">
                  <span>Map qidiruv matni</span>
                  <div className="field-box">
                    <LocationIcon />
                    <input
                      value={doctorForm.mapQuery}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, mapQuery: event.target.value }))
                      }
                    />
                  </div>
                </label>
                <label className="field field-full">
                  <span>Bio</span>
                  <textarea
                    rows={4}
                    value={doctorForm.bio}
                    onChange={(event) =>
                      setDoctorForm((current) => ({ ...current, bio: event.target.value }))
                    }
                    required
                  />
                </label>
                <div className="field field-full">
                  <span>Bo'sh vaqtlar</span>
                  <div className="slot-grid slot-grid-admin">
                    {DEFAULT_TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`slot-button ${
                          doctorForm.availableSlots.includes(slot) ? "slot-button-active" : ""
                        }`}
                        onClick={() => toggleSlot(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                  <small className="field-note">
                    Ishda bo'lmasangiz ham shu vaqtlar bo'yicha request sizga keladi.
                  </small>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="button button-ghost" onClick={() => setShowProfileModal(false)}>
                  Keyinroq
                </button>
                <button type="submit" className="button button-primary" disabled={isSavingProfile}>
                  Saqlash
                  <CheckIcon />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctor;
