import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  StarIcon,
  StethoscopeIcon,
  UserGroupIcon,
} from "../components/PremiumIcons";
import { useAppContext, type Appointment } from "../context/AppContext";
import { getDoctorMapQuery, getMapEmbedUrl, getMapSearchUrl } from "../lib/maps";
import { ALL_REGIONS_OPTION, UZBEKISTAN_REGIONS } from "../lib/regions";
import {
  getBookingRulesMessage,
  getTodayInTashkent,
  hasAppointmentStarted,
  isPastTimeSlotForDate,
  isSundayDate,
} from "../lib/schedule";

const tabs = [
  { id: "booking", label: "Bronlash" },
  { id: "appointments", label: "Qabullar" },
  { id: "profile", label: "Profil" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const User = () => {
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

  const minimumBookingDate = getTodayInTashkent();
  const bookingRulesMessage = getBookingRulesMessage();

  const [activeTab, setActiveTab] = useState<TabId>("booking");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id ?? "");
  const [doctorSearchTerm, setDoctorSearchTerm] = useState("");
  const [doctorRegionFilter, setDoctorRegionFilter] = useState(ALL_REGIONS_OPTION);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [patientName, setPatientName] = useState(profile.name);
  const [patientPhone, setPatientPhone] = useState(profile.phone);
  const [notes, setNotes] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [workspaceError, setWorkspaceError] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [profileDraft, setProfileDraft] = useState(profile);
  const [bookingSuccessModal, setBookingSuccessModal] = useState<Appointment | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Appointment | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesSearch =
        !doctorSearchTerm.trim() ||
        `${doctor.name} ${doctor.specialty} ${doctor.clinic} ${doctor.address} ${doctor.bio}`
          .toLowerCase()
          .includes(doctorSearchTerm.trim().toLowerCase());
      const matchesRegion =
        doctorRegionFilter === ALL_REGIONS_OPTION || doctor.region === doctorRegionFilter;

      return matchesSearch && matchesRegion;
    });
  }, [doctorRegionFilter, doctorSearchTerm, doctors]);

  useEffect(() => {
    if (!filteredDoctors.some((doctor) => doctor.id === selectedDoctorId) && filteredDoctors[0]) {
      setSelectedDoctorId(filteredDoctors[0].id);
    }
  }, [filteredDoctors, selectedDoctorId]);

  useEffect(() => {
    setPatientName(profile.name);
    setPatientPhone(profile.phone);
    setProfileDraft(profile);
  }, [profile]);

  useEffect(() => {
    if (!confirmationText && !bookingError && !workspaceError) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setConfirmationText("");
      setBookingError("");
      setWorkspaceError("");
    }, 4500);

    return () => window.clearTimeout(timeout);
  }, [bookingError, confirmationText, workspaceError]);

  const selectedDoctor = useMemo(
    () => filteredDoctors.find((doctor) => doctor.id === selectedDoctorId) ?? filteredDoctors[0],
    [filteredDoctors, selectedDoctorId],
  );
  const selectedDoctorMapQuery = getDoctorMapQuery(selectedDoctor ?? {});
  const selectedDoctorMapEmbedUrl = getMapEmbedUrl(selectedDoctorMapQuery);
  const selectedDoctorMapUrl = getMapSearchUrl(selectedDoctorMapQuery);

  const activeUserEmail = (currentUser?.email ?? localUserEmail ?? profile.email).trim().toLowerCase();
  const activeUserKey = (currentUser?.uid ?? localUserId ?? activeUserEmail).trim().toLowerCase();

  const userAppointments = useMemo(() => {
    if (!activeUserKey && !activeUserEmail) {
      return [];
    }

    return appointments.filter(
      (appointment) =>
        appointment.patientKey.trim().toLowerCase() === activeUserKey ||
        appointment.patientEmail.trim().toLowerCase() === activeUserEmail,
    );
  }, [activeUserEmail, activeUserKey, appointments]);

  const activeAppointments = useMemo(
    () =>
      userAppointments.filter(
        (appointment) =>
          appointment.status !== "Yakunlandi" && appointment.status !== "Bekor qilindi",
      ),
    [userAppointments],
  );

  const isReady = Boolean(selectedDoctor && selectedDate && selectedTime && patientName && patientPhone);

  const bookedSlotSet = useMemo(() => {
    return new Set(
      appointments
        .filter(
          (appointment) =>
            appointment.doctorId === selectedDoctor?.id &&
            appointment.date === selectedDate &&
            appointment.status !== "Bekor qilindi",
        )
        .map((appointment) => appointment.time),
    );
  }, [appointments, selectedDate, selectedDoctor?.id]);

  const availableSlots = useMemo(() => {
    if (!selectedDoctor || !selectedDate) {
      return [];
    }

    return selectedDoctor.availableSlots.filter((slot) => !isPastTimeSlotForDate(selectedDate, slot));
  }, [selectedDate, selectedDoctor]);

  useEffect(() => {
    if (!selectedDate) {
      setSelectedTime("");
      return;
    }

    const firstOpenSlot = availableSlots.find((slot) => !bookedSlotSet.has(slot)) ?? "";

    if (!selectedTime || !availableSlots.includes(selectedTime) || bookedSlotSet.has(selectedTime)) {
      setSelectedTime(firstOpenSlot);
    }
  }, [availableSlots, bookedSlotSet, selectedDate, selectedTime]);

  const dashboardStats = useMemo(
    () => [
      { label: "Yaqin qabul", value: activeAppointments.length.toString() },
      { label: "Aktiv eslatma", value: `${activeAppointments.filter((item) => item.status === "Tasdiqlandi").length} ta` },
      { label: "Tibbiy fayl", value: `${Math.max(userAppointments.length * 3, 6)} ta` },
    ],
    [activeAppointments, userAppointments.length],
  );

  const handleBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConfirmationText("");
    setBookingError("");
    setWorkspaceError("");

    if (!selectedDoctor || !isReady) {
      return;
    }

    setIsSubmittingBooking(true);

    try {
      const appointment = await bookAppointment({
        doctorId: selectedDoctor.id,
        date: selectedDate,
        time: selectedTime,
        patientName,
        patientKey: activeUserKey,
        patientEmail: (profile.email || currentUser?.email || localUserEmail).trim(),
        patientPhone,
        notes,
      });

      if (!appointment) {
        setBookingError("Tanlangan slotni bron qilib bo'lmadi.");
        return;
      }

      await updateProfile({
        name: patientName,
        phone: patientPhone,
        email: profile.email || currentUser?.email || localUserEmail,
      });

      setConfirmationText(
        `${appointment.doctorName} bilan ${appointment.date} kuni ${appointment.time} da qabul tasdiqlandi.`,
      );
      setBookingSuccessModal(appointment);
      setSelectedDate("");
      setSelectedTime("");
      setNotes("");
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "Bronlashda xatolik yuz berdi.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleDateChange = (value: string) => {
    if (!value) {
      setSelectedDate("");
      setSelectedTime("");
      setBookingError("");
      return;
    }

    if (isSundayDate(value)) {
      setSelectedDate("");
      setSelectedTime("");
      setBookingError("Yakshanba kuni bron qilib bo'lmaydi. Iltimos, boshqa sanani tanlang.");
      return;
    }

    if (value < minimumBookingDate) {
      setSelectedDate("");
      setSelectedTime("");
      setBookingError("O'tib ketgan sana uchun bron qilib bo'lmaydi.");
      return;
    }

    setBookingError("");
    setSelectedDate(value);
  };

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConfirmationText("");
    setWorkspaceError("");

    try {
      await updateProfile(profileDraft);
      setConfirmationText("Profil ma'lumotlari muvaffaqiyatli yangilandi.");
      setActiveTab("profile");
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Profilni saqlashda xatolik yuz berdi.");
    }
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    setConfirmationText("");
    setWorkspaceError("");

    try {
      await updateAppointmentStatus(appointment.id, "Bekor qilindi");
      setConfirmationText(
        `${appointment.doctorName} bilan ${appointment.date} kuni ${appointment.time} dagi bron bekor qilindi. Ushbu slot yana bo'sh holatga qaytdi.`,
      );
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Bronni bekor qilishda xatolik yuz berdi.");
    }
  };

  const openReviewModal = (appointment: Appointment) => {
    setReviewTarget(appointment);
    setReviewRating(5);
    setReviewComment("");
    setReviewError("");
  };

  const closeReviewModal = () => {
    if (isSubmittingReview) {
      return;
    }

    setReviewTarget(null);
    setReviewRating(5);
    setReviewComment("");
    setReviewError("");
  };

  const closeBookingSuccessModal = () => {
    setBookingSuccessModal(null);
  };

  const openAppointmentsAfterSuccess = () => {
    setBookingSuccessModal(null);
    setActiveTab("appointments");
  };

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reviewTarget) {
      return;
    }

    setIsSubmittingReview(true);
    setConfirmationText("");
    setReviewError("");
    setWorkspaceError("");

    try {
      await submitDoctorReview(reviewTarget.id, reviewRating, reviewComment);
      setConfirmationText(
        `${reviewTarget.doctorName} uchun ${reviewRating} yulduzli baho muvaffaqiyatli yuborildi.`,
      );
      setReviewTarget(null);
      setReviewRating(5);
      setReviewComment("");
      setReviewError("");
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Bahoni yuborishda xatolik yuz berdi.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="dashboard-page">
      <header className="dashboard-topbar">
        <div className="container dashboard-topbar-inner">
          <Link to="/" className="brand" onClick={closeMenu}>
            <span className="brand-mark">
              <HeartPulseIcon />
            </span>
            <span>
              Med<span className="brand-accent">Elite</span>
            </span>
          </Link>

          <div className={`dashboard-menu ${menuOpen ? "dashboard-menu-open" : ""}`}>
            <div className="dashboard-actions">
              <ThemeToggle compact />
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setActiveTab("profile");
                  closeMenu();
                }}
              >
                Profil
              </button>
              <button
                type="button"
                className="button button-ghost"
                onClick={() => {
                  closeMenu();
                  void signOutUser();
                }}
              >
                Chiqish
              </button>
            </div>
          </div>

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={menuOpen ? "Menyuni yopish" : "Menyuni ochish"}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </header>

      <main className="container dashboard-content">
        <section className="dashboard-hero">
          <div>
            <span className="section-chip">Bemor kabineti</span>
            <h1>Bronlash, tarix va tavsiyalar bir panelda</h1>
            <p>
              Tizim sizga eng mos doktorni tanlash, slotni band qilish va qabul tafsilotlarini bir
              joyda kuzatish imkonini beradi.
            </p>
          </div>

          <div className="dashboard-summary-grid">
            {dashboardStats.map((item) => (
              <article key={item.label} className="dashboard-mini-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-tabbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`dashboard-tab ${activeTab === tab.id ? "dashboard-tab-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </section>

        <section className="workspace-grid">
          <div className="booking-panel glass-card">
            {activeTab === "booking" && (
              <>
                <div className="flow-progress">
                  <div className="flow-progress-item flow-progress-item-active">
                    <span>01</span>
                    <strong>Shifokor tanlash</strong>
                  </div>
                  <div className="flow-progress-item flow-progress-item-active">
                    <span>02</span>
                    <strong>Vaqt tanlash</strong>
                  </div>
                  <div className="flow-progress-item">
                    <span>03</span>
                    <strong>Tasdiqlash</strong>
                  </div>
                </div>

                <div className="panel-heading">
                  <div>
                    <span className="section-chip">1-bosqich</span>
                    <h2>Shifokorni tanlang</h2>
                  </div>
                  <span className="badge">
                    <ShieldIcon />
                    Tasdiqlangan doktorlar
                  </span>
                </div>

                <div className="doctor-filter-bar">
                  <label className="field">
                    <span>Qidiruv</span>
                    <div className="field-box">
                      <SparkIcon />
                      <input
                        type="text"
                        value={doctorSearchTerm}
                        onChange={(event) => setDoctorSearchTerm(event.target.value)}
                        placeholder="Ism, yo'nalish yoki klinika"
                      />
                    </div>
                  </label>

                  <label className="field">
                    <span>Viloyat</span>
                    <div className="field-box field-box-select">
                      <LocationIcon />
                      <select
                        value={doctorRegionFilter}
                        onChange={(event) => setDoctorRegionFilter(event.target.value)}
                      >
                        <option value={ALL_REGIONS_OPTION}>{ALL_REGIONS_OPTION}</option>
                        {UZBEKISTAN_REGIONS.map((region) => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>
                </div>

                <div className="doctor-selector-grid">
                  {filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor) => (
                      <button
                        key={doctor.id}
                        type="button"
                        className={`doctor-select-card ${
                          doctor.id === selectedDoctorId ? "doctor-select-card-active" : ""
                        }`}
                        onClick={() => setSelectedDoctorId(doctor.id)}
                      >
                        <div className="doctor-card-top">
                          <div className="doctor-card-avatar">
                            <StethoscopeIcon />
                          </div>
                          <span className="badge">
                            <StarIcon />
                            {doctor.rating.toFixed(1)}
                          </span>
                        </div>
                        <strong>{doctor.name}</strong>
                        <span>{doctor.specialty}</span>
                        <p>{doctor.clinic}</p>
                        <span className="doctor-region-tag">{doctor.region}</span>
                        <span className="doctor-location-line">
                          <LocationIcon />
                          <span>{doctor.address}</span>
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="empty-state">
                      <h3>Shifokorlar mavjud emas</h3>
                      <p>Filterlarni o'zgartirib ko'ring yoki admin yangi shifokor qo'shgach ro'yxat to'ladi.</p>
                    </div>
                  )}
                </div>

                <form className="booking-form" onSubmit={handleBooking}>
                  <div className="panel-heading">
                    <div>
                      <span className="section-chip">2-bosqich</span>
                      <h2>Qabul tafsilotlari</h2>
                    </div>
                    <span className="badge">
                      <ClockIcon />
                      Slotlar real vaqtda yangilanadi
                    </span>
                  </div>

                  <div className="field-grid">
                    <label className="field">
                      <span>Sana</span>
                      <div className="field-box">
                        <CalendarIcon />
                        <input
                          type="date"
                          min={minimumBookingDate}
                          value={selectedDate}
                          onChange={(event) => handleDateChange(event.target.value)}
                        />
                      </div>
                      <small className="field-note">{bookingRulesMessage}</small>
                    </label>

                    <label className="field">
                      <span>Telefon</span>
                      <div className="field-box">
                        <PhoneIcon />
                        <input
                          type="tel"
                          value={patientPhone}
                          onChange={(event) => setPatientPhone(event.target.value)}
                          placeholder="+998 90 123 45 67"
                        />
                      </div>
                    </label>
                  </div>

                  <div className="slot-grid">
                    {selectedDate && availableSlots.length > 0 ? (
                      availableSlots.map((time) => {
                        const isBooked = bookedSlotSet.has(time);

                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={isBooked}
                            className={`slot-button ${
                              selectedTime === time ? "slot-button-active" : ""
                            } ${isBooked ? "slot-button-disabled" : ""}`}
                            onClick={() => setSelectedTime(time)}
                          >
                            {isBooked ? `${time} band` : time}
                          </button>
                        );
                      })
                    ) : (
                      <div className="empty-state">
                        <h3>{selectedDate ? "Mavjud slot topilmadi" : "Avval sanani tanlang"}</h3>
                        <p>
                          {selectedDate
                            ? "Ushbu sana uchun barcha slotlar band yoki vaqt o'tib ketgan."
                            : "Sana tanlanganidan keyin mavjud vaqtlar shu yerda ko'rinadi."}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="field-grid">
                    <label className="field">
                      <span>F.I.O</span>
                      <div className="field-box">
                        <UserGroupIcon />
                        <input
                          type="text"
                          value={patientName}
                          onChange={(event) => setPatientName(event.target.value)}
                          placeholder="Ismingizni kiriting"
                        />
                      </div>
                    </label>

                    <label className="field field-full">
                      <span>Izoh</span>
                      <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        rows={4}
                        placeholder="Shikoyat yoki qisqa izoh"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="button button-primary button-large button-block"
                    disabled={!isReady || isSubmittingBooking}
                  >
                    {isSubmittingBooking ? "Bron tasdiqlanmoqda..." : "Bronni tasdiqlash"}
                    <ArrowRightIcon />
                  </button>
                  {bookingError && <p className="auth-error-text">{bookingError}</p>}
                </form>
              </>
            )}

            {activeTab === "appointments" && (
              <div className="workspace-section">
                <div className="panel-heading">
                  <div>
                    <span className="section-chip">Qabullar</span>
                    <h2>Faol qabullaringiz</h2>
                  </div>
                </div>

                <div className="appointment-list">
                  {activeAppointments.map((appointment) => {
                    const isCompleted = appointment.status === "Yakunlandi";
                    const isCancelled = appointment.status === "Bekor qilindi";
                    const alreadyReviewed = Boolean(appointment.reviewRating);
                    const canCompleteAppointment = hasAppointmentStarted(
                      appointment.date,
                      appointment.time,
                    );

                    return (
                      <article key={appointment.id} className="appointment-card">
                        <div className="appointment-card-head">
                          <div>
                            <h3>{appointment.doctorName}</h3>
                            <p>{appointment.specialty}</p>
                          </div>
                          <span className="badge">{appointment.status}</span>
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

                        <p>{appointment.notes}</p>

                        {getMapSearchUrl(getDoctorMapQuery(appointment)) && (
                          <a
                            href={getMapSearchUrl(getDoctorMapQuery(appointment))}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-map-link"
                          >
                            Xaritada ochish
                            <ArrowRightIcon />
                          </a>
                        )}

                        {alreadyReviewed && (
                          <div className="review-summary-card">
                            <div className="review-summary-head">
                              <strong>Qoldirilgan baho</strong>
                              <span>{appointment.reviewRating} / 5</span>
                            </div>
                            <div className="review-stars-row review-stars-row-readonly">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`review-star-icon ${
                                    star <= (appointment.reviewRating ?? 0) ? "review-star-icon-active" : ""
                                  }`}
                                >
                                  <StarIcon />
                                </span>
                              ))}
                            </div>
                            {appointment.reviewComment && <p>{appointment.reviewComment}</p>}
                          </div>
                        )}

                        <div className="appointment-actions">
                          <button
                            type="button"
                            className="button button-secondary"
                            disabled={alreadyReviewed || isCancelled || !canCompleteAppointment}
                            onClick={() => openReviewModal(appointment)}
                          >
                            {alreadyReviewed
                              ? "Baho yuborildi"
                              : isCompleted
                                ? "Baho qoldirish"
                                : canCompleteAppointment
                                  ? "Yakunlash va baholash"
                                  : "Qabul vaqti kutilmoqda"}
                          </button>
                          <button
                            type="button"
                            className="button button-ghost"
                            disabled={isCompleted}
                            onClick={() => void handleCancelAppointment(appointment)}
                          >
                            Bekor qilish
                          </button>
                        </div>
                      </article>
                    );
                  })}

                  {activeAppointments.length === 0 && (
                    <div className="empty-state">
                      <h3>Aktiv qabul topilmadi</h3>
                      <p>Yangi bron qilganingizdan keyin aktiv qabul shu yerda ko'rinadi.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="workspace-section">
                <div className="panel-heading">
                  <div>
                    <span className="section-chip">Profil</span>
                    <h2>Profil ma'lumotlari</h2>
                  </div>
                </div>

                <form className="booking-form" onSubmit={handleProfileSave}>
                  <div className="field-grid">
                    <label className="field">
                      <span>To'liq ism</span>
                      <div className="field-box">
                        <UserGroupIcon />
                        <input
                          type="text"
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
                          type="tel"
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
                          type="text"
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
                      <span>Qisqacha ma'lumot</span>
                      <textarea
                        value={profileDraft.about}
                        onChange={(event) =>
                          setProfileDraft((current) => ({ ...current, about: event.target.value }))
                        }
                        rows={4}
                      />
                    </label>
                  </div>

                  <button type="submit" className="button button-primary button-large">
                    Profilni saqlash
                    <CheckIcon />
                  </button>
                </form>
              </div>
            )}
          </div>

          <aside className="preview-column">
            <article className="preview-card preview-highlight">
              <span className="badge badge-gold">
                <SparkIcon />
                Bron xulosasi
              </span>
              <h2>{selectedDoctor?.name ?? "Shifokor tanlanmagan"}</h2>
              <p>{selectedDoctor?.specialty ?? "Mutaxassislik tanlanmagan"}</p>
              {selectedDoctor?.bio && <p className="preview-subtext">{selectedDoctor.bio}</p>}

              <div className="preview-list">
                <div>
                  <CalendarIcon />
                  <span>{selectedDate || "Sana tanlanmagan"}</span>
                </div>
                <div>
                  <ClockIcon />
                  <span>{selectedTime || "Bo'sh vaqt tanlanmagan"}</span>
                </div>
                <div>
                  <LocationIcon />
                  <span>{selectedDoctor?.region ?? "Viloyat tanlanmagan"}</span>
                </div>
                <div>
                  <LocationIcon />
                  <span>{selectedDoctor?.clinic ?? "Klinika yo'q"}</span>
                </div>
                <div>
                  <LocationIcon />
                  <span>{selectedDoctor?.address ?? "Manzil kiritilmagan"}</span>
                </div>
              </div>

              <div className="price-line">
                <span>Konsultatsiya narxi</span>
                <strong>{selectedDoctor?.price ?? "-"}</strong>
              </div>

              {selectedDoctorMapUrl && (
                <a href={selectedDoctorMapUrl} target="_blank" rel="noreferrer" className="button button-secondary button-block">
                  Xaritada ochish
                  <ArrowRightIcon />
                </a>
              )}
            </article>

            <article className="preview-card">
              <div className="panel-heading">
                <div>
                  <h3>Lokatsiya xaritasi</h3>
                  <p>Tanlangan doktor uchun manzil va xarita preview shu yerda ko'rinadi.</p>
                </div>
                {selectedDoctorMapUrl && (
                  <a href={selectedDoctorMapUrl} target="_blank" rel="noreferrer" className="button button-secondary">
                    Xaritada ochish
                    <ArrowRightIcon />
                  </a>
                )}
              </div>

              {selectedDoctorMapEmbedUrl ? (
                <iframe
                  className="map-preview-frame map-preview-frame-user"
                  title="Tanlangan doktor lokatsiyasi"
                  src={selectedDoctorMapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="map-preview-empty">
                  <LocationIcon />
                  <strong>Doktor tanlangach xarita shu yerda chiqadi</strong>
                  <p>Admin lokatsiya kiritgach siz uni shu bo'limda ko'rasiz.</p>
                </div>
              )}

              <p className="map-preview-caption">{selectedDoctor?.address ?? "Manzil hali kiritilmagan."}</p>
            </article>

            <article className="preview-card">
              <h3>Doktor haqida</h3>
              <div className="info-stack">
                <div>
                  <span>Reyting</span>
                  <strong>{selectedDoctor ? selectedDoctor.rating.toFixed(1) : "-"}</strong>
                </div>
                <div>
                  <span>Baholar soni</span>
                  <strong>{selectedDoctor?.reviewCount ?? 0} ta</strong>
                </div>
                <div>
                  <span>Tajriba</span>
                  <strong>{selectedDoctor?.experience ?? "-"}</strong>
                </div>
                <div>
                  <span>Eng yaqin slot</span>
                  <strong>{selectedDoctor?.availability ?? "-"}</strong>
                </div>
              </div>
              <p className="preview-subtext">
                Tanlangan mutaxassis bo'yicha asosiy ko'rsatkichlar shu yerda jamlanadi, shuning
                uchun qaror qabul qilish osonlashadi.
              </p>
            </article>

            <article className="preview-card">
              <h3>Bron afzalliklari</h3>
              <div className="summary-checks">
                <div>
                  <CheckIcon />
                  <span>SMS eslatma</span>
                </div>
                <div>
                  <CheckIcon />
                  <span>Qabul tafsilotlari kabinetda</span>
                </div>
                <div>
                  <CheckIcon />
                  <span>Qayta bronlash tavsiyasi</span>
                </div>
              </div>
            </article>

            <article className="preview-card">
              <h3>Xizmat darajasi</h3>
              <div className="service-level-card">
                <span>Premium parvarish oqimi</span>
                <strong>Tezkor tasdiq va raqamli kuzatuv</strong>
              </div>
            </article>
          </aside>
        </section>

        {confirmationText && (
          <section className="confirmation-banner">
            <div className="confirmation-icon">
              <CheckIcon />
            </div>
            <div>
              <h2>Yangilanish muvaffaqiyatli bajarildi</h2>
              <p>{confirmationText}</p>
            </div>
          </section>
        )}

        {workspaceError && (
          <section className="confirmation-banner confirmation-banner-error">
            <div className="confirmation-icon confirmation-icon-error">
              <CloseIcon />
            </div>
            <div>
              <h2>Amalda xatolik yuz berdi</h2>
              <p>{workspaceError}</p>
            </div>
          </section>
        )}
      </main>

      {reviewTarget && (
        <div className="modal-backdrop" onClick={closeReviewModal} role="presentation">
          <div
            className="modal-card review-modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
          >
            <form className="review-form" onSubmit={handleReviewSubmit}>
              <div className="panel-heading">
                <div>
                  <span className="section-chip">Baho</span>
                  <h2 id="review-modal-title">Qabul yakunlandimi?</h2>
                </div>
                <button type="button" className="icon-button" onClick={closeReviewModal}>
                  <CloseIcon />
                </button>
              </div>

              <p className="review-modal-copy">
                {reviewTarget.doctorName} uchun tarif qoldiring va xizmat sifatini 1 dan 5 gacha
                yulduzcha bilan baholang.
              </p>

              <div className="review-stars-block">
                <span>Bahongiz</span>
                <div className="review-stars-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`review-star-button ${
                        star <= reviewRating ? "review-star-button-active" : ""
                      }`}
                      onClick={() => setReviewRating(star)}
                    >
                      <StarIcon />
                    </button>
                  ))}
                </div>
              </div>

              <label className="field">
                <span>Tarif</span>
                <textarea
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  rows={4}
                  placeholder="Doktor qabul sifati haqida qisqa fikringizni yozing"
                />
              </label>

              {reviewError && <p className="auth-error-text">{reviewError}</p>}

              <div className="modal-actions">
                <button type="button" className="button button-ghost" onClick={closeReviewModal}>
                  Bekor qilish
                </button>
                <button type="submit" className="button button-primary" disabled={isSubmittingReview}>
                  Yuborish
                  <CheckIcon />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {bookingSuccessModal && (
        <div className="modal-backdrop" onClick={closeBookingSuccessModal} role="presentation">
          <div
            className="modal-card review-modal-card booking-success-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-success-title"
          >
            <div className="booking-success-hero">
              <div className="confirmation-icon booking-success-icon">
                <CheckIcon />
              </div>
              <span className="section-chip">Bron tasdiqlandi</span>
            </div>

            <div className="booking-success-copy">
              <h2 id="booking-success-title">Broningiz muvaffaqiyatli yaratildi</h2>
              <p>
                Hurmatli foydalanuvchi, siz qabulni muvaffaqiyatli bron qildingiz. Endi
                <strong> Qabullar</strong> bo'limiga o'tib bron tafsilotlarini shifokorga
                ko'rsatishingiz mumkin va konsultatsiya jarayoni boshlanadi.
              </p>
            </div>

            <div className="preview-list booking-success-list">
              <div>
                <UserGroupIcon />
                <span>{bookingSuccessModal.doctorName}</span>
              </div>
              <div>
                <CalendarIcon />
                <span>{bookingSuccessModal.date}</span>
              </div>
              <div>
                <ClockIcon />
                <span>{bookingSuccessModal.time}</span>
              </div>
              <div>
                <LocationIcon />
                <span>{bookingSuccessModal.clinic}</span>
              </div>
            </div>

            <div className="modal-actions booking-success-actions">
              <button type="button" className="button button-ghost" onClick={closeBookingSuccessModal}>
                Keyinroq
              </button>
              <button type="button" className="button button-primary" onClick={openAppointmentsAfterSuccess}>
                Qabullar bo'limiga o'tish
                <ArrowRightIcon />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default User;
