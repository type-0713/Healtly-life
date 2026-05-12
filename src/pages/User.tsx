import type { FormEvent } from "react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmergencyCallButton from "../components/EmergencyCallButton";
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
  SparkIcon,
  StarIcon,
  StethoscopeIcon,
  UserGroupIcon,
} from "../components/PremiumIcons";
import {
  getDoctorBookingRecommendation,
  useAppContext,
  type Appointment,
} from "../context/AppContext";
import { useI18n } from "../context/I18nContext";
import { getDoctorMapQuery, getMapSearchUrl } from "../lib/maps";
import { ALL_REGIONS_OPTION, UZBEKISTAN_REGIONS } from "../lib/regions";
import { getBookingRulesMessage, getTodayInTashkent, hasAppointmentStarted, isPastTimeSlotForDate } from "../lib/schedule";

type TabId = "booking" | "appointments" | "profile";

const User = () => {
  const { language, translateError, translateRegion, translateSpecialty, translateStatus } = useI18n();
  const {
    appointments,
    bookAppointment,
    currentUser,
    doctors,
    localUserEmail,
    localUserId,
    profile,
    signOutUser,
    submitDoctorReview,
    updateAppointmentStatus,
    updateProfile,
  } = useAppContext();

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("booking");
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState(ALL_REGIONS_OPTION);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayInTashkent());
  const [selectedTime, setSelectedTime] = useState("");
  const [patientName, setPatientName] = useState(profile.name);
  const [patientPhone, setPatientPhone] = useState(profile.phone);
  const [notes, setNotes] = useState("");
  const [profileDraft, setProfileDraft] = useState(profile);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<Appointment | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const activeUserEmail = (currentUser?.email ?? localUserEmail ?? profile.email).trim().toLowerCase();
  const activeUserKey = (currentUser?.uid ?? localUserId ?? activeUserEmail).trim().toLowerCase();

  useEffect(() => {
    setPatientName(profile.name);
    setPatientPhone(profile.phone);
    setProfileDraft(profile);
  }, [profile]);

  const filteredDoctors = useMemo(
    () =>
      doctors.filter((doctor) => {
        const matchesSearch =
          !deferredSearchTerm.trim() ||
          `${doctor.name} ${doctor.specialty} ${doctor.clinic} ${doctor.bio}`
            .toLowerCase()
            .includes(deferredSearchTerm.trim().toLowerCase());
        const matchesRegion =
          regionFilter === ALL_REGIONS_OPTION || doctor.region === regionFilter;

        return matchesSearch && matchesRegion;
      }),
    [deferredSearchTerm, doctors, regionFilter],
  );

  useEffect(() => {
    if (!selectedDoctorId && filteredDoctors[0]) {
      setSelectedDoctorId(filteredDoctors[0].id);
      return;
    }

    if (!filteredDoctors.find((doctor) => doctor.id === selectedDoctorId) && filteredDoctors[0]) {
      setSelectedDoctorId(filteredDoctors[0].id);
    }
  }, [filteredDoctors, selectedDoctorId]);

  const selectedDoctor = useMemo(
    () => filteredDoctors.find((doctor) => doctor.id === selectedDoctorId) ?? filteredDoctors[0] ?? null,
    [filteredDoctors, selectedDoctorId],
  );

  const bookedSlotSet = useMemo(
    () =>
      new Set(
        appointments
          .filter(
            (appointment) =>
              appointment.doctorId === selectedDoctor?.id &&
              appointment.date === selectedDate &&
              appointment.status !== "Bekor qilindi" &&
              appointment.status !== "Rad etildi",
          )
          .map((appointment) => appointment.time),
      ),
    [appointments, selectedDate, selectedDoctor?.id],
  );

  const availableSlots = useMemo(() => {
    if (!selectedDoctor) {
      return [];
    }

    return selectedDoctor.availableSlots.filter((slot) => !isPastTimeSlotForDate(selectedDate, slot));
  }, [selectedDate, selectedDoctor]);

  useEffect(() => {
    if (!selectedTime && availableSlots[0]) {
      setSelectedTime(availableSlots[0]);
      return;
    }

    if (selectedTime && !availableSlots.includes(selectedTime)) {
      setSelectedTime(availableSlots[0] ?? "");
    }
  }, [availableSlots, selectedTime]);

  const userAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const ownerKey = appointment.patientKey.trim().toLowerCase();
        const ownerEmail = appointment.patientEmail.trim().toLowerCase();

        if (ownerKey) {
          return ownerKey === activeUserKey;
        }

        return Boolean(ownerEmail) && ownerEmail === activeUserEmail;
      }),
    [activeUserEmail, activeUserKey, appointments],
  );

  const activeAppointments = useMemo(
    () =>
      userAppointments.filter(
        (appointment) =>
          appointment.status !== "Yakunlandi" &&
          appointment.status !== "Bekor qilindi" &&
          appointment.status !== "Rad etildi",
      ),
    [userAppointments],
  );

  const historyAppointments = useMemo(
    () =>
      userAppointments.filter(
        (appointment) =>
          appointment.status === "Yakunlandi" ||
          appointment.status === "Bekor qilindi" ||
          appointment.status === "Rad etildi",
      ),
    [userAppointments],
  );

  const handleBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedDoctor || !selectedDate || !selectedTime || !patientName || !patientPhone) {
      return;
    }

    try {
      setIsSubmitting(true);
      setNotice("");
      setError("");
      const appointment = await bookAppointment({
        doctorId: selectedDoctor.id,
        date: selectedDate,
        time: selectedTime,
        patientName,
        patientKey: activeUserKey,
        patientEmail: activeUserEmail,
        patientPhone,
        notes,
      });

      await updateProfile({
        name: patientName,
        phone: patientPhone,
        email: activeUserEmail,
      });

      setNotice(
        appointment
          ? `Buyurtma yaratildi. Doktor bu so'rovni taxminan ${appointment.requestVisibleAt.slice(11, 16)} da ko'radi.`
          : "Buyurtma yaratilmadi.",
      );
      setNotes("");
      setActiveTab("appointments");
    } catch (bookingError) {
      setError(
        bookingError instanceof Error
          ? translateError(bookingError.message)
          : translateError("Kirishda xatolik yuz berdi."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      setError("");
      setNotice("");
      await updateAppointmentStatus(appointmentId, "Bekor qilindi");
      setNotice("Buyurtma bekor qilindi.");
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? translateError(cancelError.message)
          : translateError("Kirishda xatolik yuz berdi."),
      );
    }
  };

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setError("");
      setNotice("");
      await updateProfile(profileDraft);
      setNotice("Profil ma'lumotlari saqlandi.");
    } catch (profileError) {
      setError(
        profileError instanceof Error
          ? translateError(profileError.message)
          : translateError("Kirishda xatolik yuz berdi."),
      );
    }
  };

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reviewTarget) {
      return;
    }

    try {
      setError("");
      setNotice("");
      await submitDoctorReview(reviewTarget.id, reviewRating, reviewComment);
      setNotice("Baholash muvaffaqiyatli yuborildi.");
      setReviewTarget(null);
      setReviewComment("");
      setReviewRating(5);
    } catch (reviewErrorValue) {
      setError(
        reviewErrorValue instanceof Error
          ? translateError(reviewErrorValue.message)
          : translateError("Kirishda xatolik yuz berdi."),
      );
    }
  };

  const bookingRules = getBookingRulesMessage(language);
  const selectedDoctorMapUrl = getMapSearchUrl(getDoctorMapQuery(selectedDoctor ?? {}));

  return (
    <div className="dashboard-page">
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
              <Link to="/doctor" className="button button-secondary" onClick={() => setMenuOpen(false)}>
                Doktor bo'limi
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
        <section className="dashboard-hero">
          <div>
            <span className="section-chip">Foydalanuvchi bo'limi</span>
            <h1>Doktor tanlang va buyurtma yuboring</h1>
            <p>
              Platforma 24/7 ishlaydi. Siz tanlagan buyurtma darhol saqlanadi, ammo doktor uni 30
              daqiqadan keyin ko'radi va qabul qilish yoki rad etishni o'zi hal qiladi.
            </p>
          </div>
          <div className="dashboard-tagline glass-card">
            <SparkIcon />
            {bookingRules}
          </div>
        </section>

        <section className="admin-kpi-grid">
          <article className="dashboard-mini-card">
            <span>Topilgan doktorlar</span>
            <strong>{filteredDoctors.length}</strong>
          </article>
          <article className="dashboard-mini-card">
            <span>Faol buyurtmalar</span>
            <strong>{activeAppointments.length}</strong>
          </article>
          <article className="dashboard-mini-card">
            <span>Tarix</span>
            <strong>{historyAppointments.length}</strong>
          </article>
          <article className="dashboard-mini-card">
            <span>Reytingli doktor</span>
            <strong>{selectedDoctor ? selectedDoctor.rating.toFixed(1) : "0.0"}</strong>
          </article>
        </section>

        <div className="workspace-tabs">
          {([
            ["booking", "Bron qilish"],
            ["appointments", "Buyurtmalarim"],
            ["profile", "Profil"],
          ] as Array<[TabId, string]>).map(([tabId, label]) => (
            <button
              key={tabId}
              type="button"
              className={`dashboard-tab-pill ${activeTab === tabId ? "dashboard-tab-pill-active" : ""}`}
              onClick={() => setActiveTab(tabId)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "booking" && (
          <section className="user-workspace-grid">
            <article className="preview-card preview-highlight">
              <div className="panel-heading">
                <div>
                  <span className="section-chip">Doktorlar ro'yxati</span>
                  <h2>Doktorlar ro'yxati</h2>
                </div>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span>Qidiruv</span>
                  <div className="field-box">
                    <StethoscopeIcon />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Doktor, yo'nalish yoki klinika"
                    />
                  </div>
                </label>
                <label className="field">
                  <span>Hudud</span>
                  <div className="field-box field-box-select">
                    <LocationIcon />
                    <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}>
                      <option value={ALL_REGIONS_OPTION}>{translateRegion(ALL_REGIONS_OPTION)}</option>
                      {UZBEKISTAN_REGIONS.map((region) => (
                        <option key={region} value={region}>
                          {translateRegion(region)}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              </div>

              <div className="doctor-scroll-grid">
                {filteredDoctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    type="button"
                    className={`doctor-select-card ${
                      selectedDoctor?.id === doctor.id ? "doctor-select-card-active" : ""
                    }`}
                    onClick={() => setSelectedDoctorId(doctor.id)}
                  >
                    <div className="doctor-select-head">
                      <div className="doctor-card-avatar">
                        <StethoscopeIcon />
                      </div>
                      <span className="badge">{doctor.isOnline ? "Ishda" : "Ishda emas"}</span>
                    </div>
                    <div className="doctor-name-scroll">
                      <strong>{doctor.name}</strong>
                    </div>
                    <span>{translateSpecialty(doctor.specialty)}</span>
                    <span>{doctor.clinic}</span>
                    <p>{getDoctorBookingRecommendation(doctor, appointments)}</p>
                    <div className="doctor-slot-list">
                      {doctor.availableSlots.slice(0, 4).map((slot) => (
                        <span key={`${doctor.id}-${slot}`} className="doctor-slot-chip">
                          {slot}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </article>

            <article className="preview-card">
              <div className="panel-heading">
                <div>
                  <span className="section-chip">Buyurtma formasi</span>
                  <h2>Buyurtma yaratish</h2>
                </div>
              </div>

              {selectedDoctor ? (
                <form className="booking-form" onSubmit={handleBooking}>
                  <div className="booking-doctor-showcase">
                    <div className="doctor-card-avatar">
                      <StethoscopeIcon />
                    </div>
                    <div>
                      <div className="doctor-name-scroll doctor-name-scroll-title">
                        <h3>{selectedDoctor.name}</h3>
                      </div>
                      <p>{translateSpecialty(selectedDoctor.specialty)} | {selectedDoctor.clinic}</p>
                      <span>{translateRegion(selectedDoctor.region)} | {selectedDoctor.price}</span>
                    </div>
                  </div>

                  <div className="field-grid">
                    <label className="field">
                      <span>Ism</span>
                      <div className="field-box">
                        <UserGroupIcon />
                        <input value={patientName} onChange={(event) => setPatientName(event.target.value)} required />
                      </div>
                    </label>
                    <label className="field">
                      <span>Telefon</span>
                      <div className="field-box">
                        <PhoneIcon />
                        <input value={patientPhone} onChange={(event) => setPatientPhone(event.target.value)} required />
                      </div>
                    </label>
                    <label className="field">
                      <span>Sana</span>
                      <div className="field-box">
                        <CalendarIcon />
                        <input
                          type="date"
                          value={selectedDate}
                          min={getTodayInTashkent()}
                          onChange={(event) => setSelectedDate(event.target.value)}
                          required
                        />
                      </div>
                    </label>
                    <label className="field">
                      <span>Vaqt</span>
                      <div className="field-box field-box-select">
                        <ClockIcon />
                        <select value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)} required>
                          {availableSlots.map((slot) => (
                            <option key={slot} value={slot} disabled={bookedSlotSet.has(slot)}>
                              {slot}{bookedSlotSet.has(slot) ? " - band" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </label>
                    <label className="field field-full">
                      <span>Izoh</span>
                      <textarea
                        rows={4}
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Shikoyat yoki qo'shimcha ma'lumot"
                      />
                    </label>
                  </div>

                  <button type="submit" className="button button-primary button-large" disabled={isSubmitting}>
                    Buyurtma yuborish
                    <ArrowRightIcon />
                  </button>
                </form>
              ) : (
                <div className="empty-state">
                  <h3>Doktor topilmadi</h3>
                  <p>Filterlarni o'zgartirib ko'ring.</p>
                </div>
              )}
            </article>

            <aside className="preview-column">
              <article className="preview-card preview-highlight">
                <span className="badge badge-gold">
                  <SparkIcon />
                  Tanlangan doktor
                </span>
                <div className="doctor-name-scroll doctor-name-scroll-heading">
                  <h2>{selectedDoctor?.name ?? "Doktor tanlanmagan"}</h2>
                </div>
                <p>{selectedDoctor ? translateSpecialty(selectedDoctor.specialty) : "-"}</p>
                <p className="preview-subtext">{selectedDoctor?.bio ?? "Tanlangan doktorga oid ma'lumot shu yerda ko'rinadi."}</p>

                <div className="preview-list">
                  <div>
                    <ClockIcon />
                    <span>{selectedDoctor?.availability ?? "-"}</span>
                  </div>
                  <div>
                    <LocationIcon />
                    <span>{selectedDoctor?.address ?? "-"}</span>
                  </div>
                  <div>
                    <StarIcon />
                    <span>{selectedDoctor ? `${selectedDoctor.rating.toFixed(1)} / 5` : "-"}</span>
                  </div>
                </div>

                {selectedDoctorMapUrl && (
                  <a href={selectedDoctorMapUrl} target="_blank" rel="noreferrer" className="button button-secondary button-block">
                    Xaritada ochish
                    <ArrowRightIcon />
                  </a>
                )}
              </article>
            </aside>
          </section>
        )}

        {activeTab === "appointments" && (
          <section className="user-workspace-grid user-workspace-grid-full">
            <article className="preview-card preview-highlight doctor-queue-card">
              <div className="panel-heading">
                <div>
                  <span className="section-chip">Faol buyurtmalar</span>
                  <h2>Faol buyurtmalarim</h2>
                </div>
              </div>
              <div className="doctor-request-list">
                {activeAppointments.map((appointment) => (
                  <article key={appointment.id} className="doctor-request-item">
                    <div className="appointment-card-head">
                      <div>
                        <h3>{appointment.doctorName}</h3>
                        <p>{translateSpecialty(appointment.specialty)}</p>
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
                      <button type="button" className="button button-ghost" onClick={() => void handleCancel(appointment.id)}>
                        Bekor qilish
                      </button>
                    </div>
                  </article>
                ))}

                {activeAppointments.length === 0 && (
                  <div className="empty-state">
                    <h3>Faol buyurtma yo'q</h3>
                    <p>Yangi buyurtma yaratganingizda shu yerda ko'rinadi.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="preview-card doctor-queue-card">
              <div className="panel-heading">
                <div>
                    <span className="section-chip">Tarix</span>
                  <h2>Tarix</h2>
                </div>
              </div>
              <div className="doctor-request-list">
                {historyAppointments.map((appointment) => {
                  const canReview =
                    appointment.status !== "Bekor qilindi" &&
                    appointment.status !== "Rad etildi" &&
                    hasAppointmentStarted(appointment.date, appointment.time) &&
                    !appointment.reviewRating;

                  return (
                    <article key={appointment.id} className="doctor-request-item">
                      <div className="appointment-card-head">
                        <div>
                          <h3>{appointment.doctorName}</h3>
                          <p>{translateSpecialty(appointment.specialty)}</p>
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
                      {appointment.reviewRating && (
                        <p>{appointment.reviewRating} / 5 | {appointment.reviewComment || "Izoh qoldirilmagan"}</p>
                      )}
                      {appointment.rejectedReason && <p>{appointment.rejectedReason}</p>}
                      {canReview && (
                        <button type="button" className="button button-secondary" onClick={() => setReviewTarget(appointment)}>
                          Baho berish
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </article>
          </section>
        )}

        {activeTab === "profile" && (
          <section className="user-workspace-grid user-workspace-grid-full">
            <article className="preview-card">
              <div className="panel-heading">
                <div>
                  <span className="section-chip">Profile</span>
                  <h2>Shaxsiy kabinet</h2>
                </div>
              </div>
              <form className="booking-form" onSubmit={handleProfileSave}>
                <div className="field-grid">
                  <label className="field">
                    <span>Ism</span>
                    <div className="field-box">
                      <UserGroupIcon />
                      <input
                        value={profileDraft.name}
                        onChange={(event) =>
                          setProfileDraft((current) => ({ ...current, name: event.target.value }))
                        }
                      />
                    </div>
                  </label>
                  <label className="field">
                    <span>Email</span>
                    <div className="field-box">
                      <SparkIcon />
                      <input
                        type="email"
                        value={profileDraft.email}
                        onChange={(event) =>
                          setProfileDraft((current) => ({ ...current, email: event.target.value }))
                        }
                      />
                    </div>
                  </label>
                  <label className="field">
                    <span>Telefon</span>
                    <div className="field-box">
                      <PhoneIcon />
                      <input
                        value={profileDraft.phone}
                        onChange={(event) =>
                          setProfileDraft((current) => ({ ...current, phone: event.target.value }))
                        }
                      />
                    </div>
                  </label>
                  <label className="field">
                    <span>Shahar</span>
                    <div className="field-box">
                      <LocationIcon />
                      <input
                        value={profileDraft.city}
                        onChange={(event) =>
                          setProfileDraft((current) => ({ ...current, city: event.target.value }))
                        }
                      />
                    </div>
                  </label>
                  <label className="field">
                    <span>Tug'ilgan sana</span>
                    <div className="field-box">
                      <CalendarIcon />
                      <input
                        type="date"
                        value={profileDraft.birthDate}
                        onChange={(event) =>
                          setProfileDraft((current) => ({ ...current, birthDate: event.target.value }))
                        }
                      />
                    </div>
                  </label>
                  <label className="field field-full">
                    <span>O'zingiz haqingizda</span>
                    <textarea
                      rows={4}
                      value={profileDraft.about}
                      onChange={(event) =>
                        setProfileDraft((current) => ({ ...current, about: event.target.value }))
                      }
                    />
                  </label>
                </div>
                <button type="submit" className="button button-primary button-large">
                  Saqlash
                  <CheckIcon />
                </button>
              </form>
            </article>
          </section>
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

      {reviewTarget && (
        <div className="modal-backdrop" onClick={() => setReviewTarget(null)} role="presentation">
          <div
            className="modal-card review-modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
          >
            <form className="review-form modal-scroll-area" onSubmit={handleReviewSubmit}>
              <div className="panel-heading">
                <div>
                  <span className="section-chip">Review</span>
                  <h2 id="review-title">{reviewTarget.doctorName} uchun baho</h2>
                </div>
                <button type="button" className="icon-button" onClick={() => setReviewTarget(null)}>
                  <CloseIcon />
                </button>
              </div>

              <div className="review-stars-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`review-star-button ${star <= reviewRating ? "review-star-button-active" : ""}`}
                    onClick={() => setReviewRating(star)}
                  >
                    <StarIcon />
                  </button>
                ))}
              </div>

              <label className="field">
                <span>Izoh</span>
                <textarea
                  rows={4}
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="button button-ghost" onClick={() => setReviewTarget(null)}>
                  Bekor qilish
                </button>
                <button type="submit" className="button button-primary">
                  Yuborish
                  <CheckIcon />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <EmergencyCallButton />
    </div>
  );
};

export default User;
