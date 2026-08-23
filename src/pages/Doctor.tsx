import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  LocationIcon,
  PhoneIcon,
  ShieldIcon,
  SparkIcon,
  StarIcon,
  StethoscopeIcon,
  UserGroupIcon,
} from "../components/PremiumIcons";
import {
  calculateDoctorPerformance,
  formatCurrency,
  getAppointmentVisibilityDelayMinutes,
  getDoctorRequestReady,
  useAppContext,
  type DoctorProfileInput,
} from "../context/AppContext";
import { useI18n } from "../context/I18nContext";
import { getMapSearchUrl } from "../lib/maps";

const emptyDoctorForm: DoctorProfileInput = {
  firstName: "",
  lastName: "",
  phone: "",
  specialty: "",
  clinic: "",
  address: "",
  bio: "",
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
  const { language, translateError, translateStatus, translateRegion, translateSpecialty } = useI18n();
  const {
    appointments,
    currentDoctor,
    doctorApprovalStatus,
    signOutUser,
    toggleDoctorOnlineStatus,
    updateDoctorAppointmentStatus,
    updateDoctorProfile,
  } = useAppContext();
  const [doctorForm, setDoctorForm] = useState<DoctorProfileInput>(emptyDoctorForm);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busyActionId, setBusyActionId] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const readyRequestIds = useRef<string[]>([]);
  const seoTitle =
    language === "ru"
      ? "MedElite | Кабинет врача"
      : language === "en"
        ? "MedElite | Doctor dashboard"
        : "MedElite | Doktor kabineti";
  const seoDescription =
    language === "ru"
      ? "Приватная рабочая панель врача MedElite."
      : language === "en"
        ? "Private MedElite doctor workspace."
        : "MedElite doktorlari uchun yopiq ish paneli.";

  const formatTimestamp = (timestamp?: string) =>
    timestamp ? String(timestamp).slice(0, 16).replace("T", " ") : "-";

  useEffect(() => {
    if (!currentDoctor) {
      return;
    }

    setDoctorForm({
      firstName: currentDoctor.firstName || "",
      lastName: currentDoctor.lastName || "",
      phone: currentDoctor.phone || "",
      specialty: currentDoctor.specialty || "",
      clinic: currentDoctor.clinic || "",
      address: currentDoctor.address || "",
      bio: currentDoctor.bio || "",
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
      doctorAppointments.filter((appointment) => appointment.status === "Tasdiqlandi"),
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
  const doctorReviews = useMemo(
    () =>
      doctorAppointments
        .filter((appointment) => typeof appointment.reviewRating === "number")
        .sort((left, right) =>
          String(right.reviewedAt || right.handledAt || right.createdAt).localeCompare(
            String(left.reviewedAt || left.handledAt || left.createdAt),
          ),
        ),
    [doctorAppointments],
  );

  useEffect(() => {
    const nextReadyIds = requestQueue.map((appointment) => appointment.id);
    const previousIds = readyRequestIds.current;
    const hasNewRequest = nextReadyIds.some((id) => !previousIds.includes(id));

    if (hasNewRequest) {
      playDoctorAlert();
    }

    readyRequestIds.current = nextReadyIds;
  }, [requestQueue]);

  useEffect(() => {
    if (typeof window === "undefined" || !showProfileModal) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowProfileModal(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showProfileModal]);

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

  if (!currentDoctor) {
    return (
      <div className="dashboard-page doctor-page">
        <Seo title={seoTitle} description={seoDescription} path="/doctor" noIndex />
        <main className="container dashboard-content">
          <section className="preview-card doctor-waiting-card">
            <div className="panel-heading">
              <div>
                <span className="section-chip">Doktor sessiyasi</span>
                <h2>Doktor profili topilmadi</h2>
              </div>
            </div>
            <p className="preview-subtext">
              Sessiya saqlangan, lekin doktor yozuvi database'da topilmadi. Qayta kirib ko'ring.
            </p>
            <div className="modal-actions">
              <Link to="/login?mode=doctor" className="button button-secondary">
                Login sahifasi
              </Link>
              <button type="button" className="button button-primary" onClick={() => void signOutUser()}>
                Sessiyani tozalash
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const waitingTitle =
    doctorApprovalStatus === "rejected"
      ? "Arizangiz hozircha rad etilgan"
      : "Admin tasdig'i kutilmoqda";
  const waitingText =
    doctorApprovalStatus === "rejected"
      ? "Admin bilan bog'lanib profil ma'lumotlarini yangilang yoki keyinroq qayta urinib ko'ring."
      : "Ro'yxatdan o'tish muvaffaqiyatli yakunlandi. Admin tasdiqlagach kabinet to'liq ochiladi va qolgan ma'lumotlarni kiritish oynasi chiqadi.";

  return (
    <div className="dashboard-page doctor-page">
      <Seo title={seoTitle} description={seoDescription} path="/doctor" noIndex />
      <Navbar brandSuffix="Doctor" />

      <main className="container dashboard-content">
        <section className="dashboard-hero doctor-hero">
          <div>
            <span className="section-chip">Doktor bo'limi</span>
            <h1>{currentDoctor.name || "Yangi doktor kabineti"}</h1>
            <p>
              Ishda va bo'sh paytingizda so'rovlar darhol tushadi. Faol qabul mavjud bo'lsa keyingi
              request 22 daqiqalik kechikish bilan keladi, offline holatda esa navbat 30 daqiqagacha cho'ziladi.
            </p>
          </div>

          <div className="dashboard-tagline glass-card">
            <SparkIcon />
            {currentDoctor.approvalStatus === "approved"
              ? currentDoctor.isOnline
                ? "Ishda"
                : "Ishda emas, ammo so'rovlar keladi"
              : "Tasdiq kutilmoqda"}
          </div>
        </section>

        {doctorApprovalStatus !== "approved" ? (
          <section className="preview-card doctor-waiting-card">
            <div className="panel-heading">
              <div>
                <span className="section-chip">Tasdiqlash holati</span>
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
                <span>Kutilayotgan so'rov</span>
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
                    <span className="section-chip">Ish holati</span>
                    <h2>Ish holati va qabul oqimi</h2>
                  </div>
                  <span className={`badge ${currentDoctor.isOnline ? "badge-gold" : ""}`}>
                    <ClockIcon />
                    {currentDoctor.isOnline ? "Ishda" : "Ishda emas"}
                  </span>
                </div>
                <p className="preview-subtext">
                  Tugma sizning hozirgi ish holatingizni ko'rsatadi. Lekin bo'sh vaqtlar mavjud bo'lsa,
                  foydalanuvchi sizga so'rov yubora oladi va siz uni keyin qabul qilishingiz yoki rad
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
                    <span className="section-chip">Doktor haqida</span>
                    <h2>Profil ko'rinishi</h2>
                  </div>
                  <span className="badge">
                    <UserGroupIcon />
                    {currentDoctor.reviewCount} baho
                  </span>
                </div>
                <div className="info-stack">
                  <div>
                    <span>Asosiy ism</span>
                    <strong>{currentDoctor.name || "-"}</strong>
                  </div>
                  <div>
                    <span>Telefon</span>
                    <strong>{currentDoctor.phone || "-"}</strong>
                  </div>
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
                    <span>Manzil</span>
                    <strong>{currentDoctor.address || "-"}</strong>
                  </div>
                  <div>
                    <span>Qisqacha ma'lumot</span>
                    <strong>{currentDoctor.bio || "-"}</strong>
                  </div>
                </div>
              </article>
            </section>

            <section className="doctor-workspace-grid">
              <article className="preview-card preview-highlight doctor-queue-card">
                <div className="panel-heading">
                  <div>
                    <span className="section-chip">Tayyor so'rovlar</span>
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
                          <p>
                            <a href={`tel:${appointment.patientPhone}`} className="doctor-request-link">
                              {appointment.patientPhone}
                            </a>
                          </p>
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
                      <div className="appointment-meta-grid">
                        <div>
                          <UserGroupIcon />
                          <span>Kim: {appointment.patientName}</span>
                        </div>
                        <div>
                          <ClockIcon />
                          <span>Qachon: {formatTimestamp(appointment.createdAt)}</span>
                        </div>
                        <div>
                          <PhoneIcon />
                          <span>
                            <a href={`tel:${appointment.patientPhone}`} className="doctor-request-link">
                              {appointment.patientPhone}
                            </a>
                          </span>
                        </div>
                      </div>
                      <p>
                        <strong>Nima uchun:</strong> {appointment.notes || "Izoh kiritilmagan"}
                      </p>
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
                      <h3>Hozircha tayyor so'rov yo'q</h3>
                      <p>Yangi buyurtma doktor yuklamasi va online holatiga qarab shu bo'limga tushadi.</p>
                    </div>
                  )}
                </div>
              </article>

              <article className="preview-card doctor-queue-card">
                <div className="panel-heading">
                  <div>
                    <span className="section-chip">Kechikish navbati</span>
                    <h2>Kechiktirilgan navbat</h2>
                  </div>
                  <span className="badge">
                    <ClockIcon />
                    {delayedQueue.length}
                  </span>
                </div>
                <div className="doctor-request-list">
                  {delayedQueue.map((appointment) => {
                    const delayMinutes = getAppointmentVisibilityDelayMinutes(appointment);

                    return (
                      <article key={appointment.id} className="doctor-request-item">
                        <div className="appointment-card-head">
                          <div>
                            <h3>{appointment.patientName}</h3>
                            <p>
                              <a href={`tel:${appointment.patientPhone}`} className="doctor-request-link">
                                {appointment.patientPhone}
                              </a>
                            </p>
                          </div>
                          <span className="badge">
                            {delayMinutes === 0 ? "Darhol" : `${delayMinutes} daqiqalik navbat`}
                          </span>
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
                            <span>
                              <a href={`tel:${appointment.patientPhone}`} className="doctor-request-link">
                                {appointment.patientPhone}
                              </a>
                            </span>
                          </div>
                        </div>
                        <div className="appointment-meta-grid">
                          <div>
                            <UserGroupIcon />
                            <span>Kim: {appointment.patientName}</span>
                          </div>
                          <div>
                            <ClockIcon />
                            <span>Qachon: {formatTimestamp(appointment.createdAt)}</span>
                          </div>
                          <div>
                            <PhoneIcon />
                            <span>{appointment.patientEmail || appointment.patientPhone}</span>
                          </div>
                        </div>
                        <p>
                          <strong>Nima uchun:</strong> {appointment.notes || "Izoh kiritilmagan"}
                        </p>
                      </article>
                    );
                  })}

                  {delayedQueue.length === 0 && (
                    <div className="empty-state">
                      <h3>Navbatda buyurtma yo'q</h3>
                      <p>Yangi buyurtmalar paydo bo'lsa, avval shu yerda kutiladi.</p>
                    </div>
                  )}
                </div>
              </article>
            </section>

            <section className="doctor-workspace-grid">
              <article className="preview-card doctor-queue-card">
                <div className="panel-heading">
                  <div>
                    <span className="section-chip">Qabul qilinganlar</span>
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
                    <span className="section-chip">Tarix</span>
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

            <section className="preview-card preview-highlight">
              <div className="panel-heading">
                <div>
                  <span className="section-chip">Bemor baholari</span>
                  <h2>Anonim izohlar va reytinglar</h2>
                  <p className="panel-heading-note">
                    Har bir baho anonim ko'rsatiladi. Siz faqat qo'yilgan yulduzlar, izoh va vaqtni ko'rasiz.
                  </p>
                </div>
                <span className="badge badge-gold">
                  <StarIcon />
                  {doctorReviews.length} baho
                </span>
              </div>

              <div className="doctor-table-wrap">
                <table className="doctor-performance-table doctor-review-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Bemor</th>
                      <th>Baho</th>
                      <th>Izoh</th>
                      <th>Vaqt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorReviews.map((appointment, index) => (
                      <tr key={appointment.id}>
                        <td>{index + 1}</td>
                        <td>
                          <div className="doctor-table-main">
                            <strong>Anonim bemor</strong>
                            <span>{appointment.reviewRating} / 5 baho</span>
                          </div>
                        </td>
                        <td>
                          <div className="doctor-review-rating">
                            <strong>{appointment.reviewRating} / 5</strong>
                            <div className="review-stars-row review-stars-row-readonly">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={`${appointment.id}-review-star-${star}`}
                                  className={`review-star-icon ${
                                    star <= Number(appointment.reviewRating) ? "review-star-icon-active" : ""
                                  }`}
                                >
                                  <StarIcon />
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="doctor-review-comment">
                          {appointment.reviewComment?.trim() || "Izoh qoldirilmagan"}
                        </td>
                        <td>{String(appointment.reviewedAt || appointment.handledAt || appointment.createdAt).slice(0, 16).replace("T", " ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {doctorReviews.length === 0 && (
                <div className="empty-state">
                  <h3>Hali baho qoldirilmagan</h3>
                  <p>Qabullar yakunlangach, foydalanuvchilar qoldirgan anonim baholar shu yerda ko'rinadi.</p>
                </div>
              )}
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
                  <span className="section-chip">Ma'lumotlarni to'ldirish</span>
                  <h2 id="doctor-profile-title">Doktor profilini to'ldirish</h2>
                </div>
                <button type="button" className="icon-button" onClick={() => setShowProfileModal(false)}>
                  <CloseIcon />
                </button>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span>Ism</span>
                  <div className="field-box">
                    <UserGroupIcon />
                    <input
                      value={doctorForm.firstName}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, firstName: event.target.value }))
                      }
                      required
                    />
                  </div>
                </label>
                <label className="field">
                  <span>Familya</span>
                  <div className="field-box">
                    <UserGroupIcon />
                    <input
                      value={doctorForm.lastName}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, lastName: event.target.value }))
                      }
                      required
                    />
                  </div>
                </label>
                <label className="field">
                  <span>Telefon</span>
                  <div className="field-box">
                    <PhoneIcon />
                    <input
                      value={doctorForm.phone}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, phone: event.target.value }))
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
                <label className="field field-full">
                  <span>Shifoxona</span>
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
                  <span>Shifoxona manzili</span>
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
                  <span>O'zingiz haqingizda</span>
                  <textarea
                    rows={4}
                    value={doctorForm.bio}
                    onChange={(event) =>
                      setDoctorForm((current) => ({ ...current, bio: event.target.value }))
                    }
                    required
                  />
                </label>
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
