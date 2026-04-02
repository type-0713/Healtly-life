import type { FormEvent } from "react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
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
  StarIcon,
  StethoscopeIcon,
  UserGroupIcon,
} from "../components/PremiumIcons";
import { useAppContext, type Appointment } from "../context/AppContext";
import { useI18n } from "../context/I18nContext";
import { userCopy } from "../i18n/userCopy";
import { getDoctorMapQuery, getMapEmbedUrl, getMapSearchUrl } from "../lib/maps";
import { ALL_REGIONS_OPTION, UZBEKISTAN_REGIONS } from "../lib/regions";
import {
  getBookingRulesMessage,
  getTodayInTashkent,
  hasAppointmentStarted,
  isPastTimeSlotForDate,
  isSundayDate,
} from "../lib/schedule";

type TabId = "booking" | "appointments" | "profile";

const compareAppointmentsAsc = (left: Appointment, right: Appointment) =>
  left.date.localeCompare(right.date) ||
  left.time.localeCompare(right.time) ||
  left.createdAt.localeCompare(right.createdAt);

const compareAppointmentsDesc = (left: Appointment, right: Appointment) =>
  right.date.localeCompare(left.date) ||
  right.time.localeCompare(left.time) ||
  right.createdAt.localeCompare(left.createdAt);

const User = () => {
  const { language, format, translateError, translateRegion, translateSpecialty, translateStatus } =
    useI18n();
  const copy = userCopy[language];
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
  const bookingRulesMessage = getBookingRulesMessage(language);

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
  const deferredDoctorSearchTerm = useDeferredValue(doctorSearchTerm);
  const mapActionLabel =
    language === "ru" ? "Открыть на карте" : language === "en" ? "Open map" : "Xaritada ochish";
  const menuLabel = menuOpen
    ? language === "ru"
      ? "Закрыть меню"
      : language === "en"
        ? "Close menu"
        : "Menyuni yopish"
    : language === "ru"
      ? "Открыть меню"
      : language === "en"
        ? "Open menu"
        : "Menyuni ochish";
  const successBannerTitle =
    language === "ru"
      ? "Обновление выполнено успешно"
      : language === "en"
        ? "Update completed successfully"
        : "Yangilanish muvaffaqiyatli bajarildi";
  const errorBannerTitle =
    language === "ru" ? "Произошла ошибка" : language === "en" ? "Something went wrong" : "Amalda xatolik yuz berdi";
  const historyChip = language === "ru" ? "История" : language === "en" ? "History" : "Tarix";
  const historyTitle =
    language === "ru" ? "История приёмов" : language === "en" ? "Appointment history" : "Qabullar tarixi";
  const historyText =
    language === "ru"
      ? "Здесь хранятся завершённые и отменённые приёмы из Firebase."
      : language === "en"
        ? "Completed and cancelled visits saved in Firebase appear here."
        : "Firebase'da saqlangan yakunlangan va bekor qilingan qabullar shu yerda ko'rinadi.";
  const noHistoryTitle =
    language === "ru" ? "История пока пуста" : language === "en" ? "No history yet" : "Tarix hozircha bo'sh";
  const noHistoryText =
    language === "ru"
      ? "Завершённые или отменённые записи появятся здесь отдельно от активных приёмов."
      : language === "en"
        ? "Completed or cancelled bookings appear here separately from active visits."
        : "Yakunlangan yoki bekor qilingan bronlar aktiv qabullardan alohida shu yerda ko'rinadi.";

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesSearch =
        !deferredDoctorSearchTerm.trim() ||
        `${doctor.name} ${doctor.specialty} ${doctor.clinic} ${doctor.address} ${doctor.bio}`
          .toLowerCase()
          .includes(deferredDoctorSearchTerm.trim().toLowerCase());
      const matchesRegion =
        doctorRegionFilter === ALL_REGIONS_OPTION || doctor.region === doctorRegionFilter;

      return matchesSearch && matchesRegion;
    });
  }, [deferredDoctorSearchTerm, doctorRegionFilter, doctors]);

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

    return appointments.filter((appointment) => {
      const ownerKey = appointment.patientKey.trim().toLowerCase();
      const ownerEmail = appointment.patientEmail.trim().toLowerCase();

      if (ownerKey) {
        return ownerKey === activeUserKey;
      }

      return Boolean(ownerEmail) && ownerEmail === activeUserEmail;
    });
  }, [activeUserEmail, activeUserKey, appointments]);

  const activeAppointments = useMemo(
    () =>
      userAppointments
        .filter(
          (appointment) =>
            appointment.status !== "Yakunlandi" && appointment.status !== "Bekor qilindi",
        )
        .sort(compareAppointmentsAsc),
    [userAppointments],
  );

  const appointmentHistory = useMemo(
    () =>
      userAppointments
        .filter(
          (appointment) =>
            appointment.status === "Yakunlandi" || appointment.status === "Bekor qilindi",
        )
        .sort(compareAppointmentsDesc),
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

  const localizedTabs = useMemo<Array<{ id: TabId; label: string }>>(
    () => [
      { id: "booking", label: copy.tabs[0] },
      { id: "appointments", label: copy.tabs[1] },
      { id: "profile", label: copy.tabs[2] },
    ],
    [copy.tabs],
  );

  const dashboardStats = useMemo(
    () => [
      { label: copy.stats[0], value: activeAppointments.length.toString() },
      {
        label: copy.stats[1],
        value:
          language === "uz"
            ? `${activeAppointments.filter((item) => item.status === "Tasdiqlandi").length} ta`
            : activeAppointments.filter((item) => item.status === "Tasdiqlandi").length.toString(),
      },
      {
        label: copy.stats[2],
        value: language === "uz" ? `${Math.max(userAppointments.length * 3, 6)} ta` : `${Math.max(userAppointments.length * 3, 6)}`,
      },
    ],
    [activeAppointments, copy.stats, language, userAppointments.length],
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
        setBookingError(copy.bookFailed);
        return;
      }

      await updateProfile({
        name: patientName,
        phone: patientPhone,
        email: profile.email || currentUser?.email || localUserEmail,
      });

      setConfirmationText(
        language === "ru"
          ? `Приём у ${appointment.doctorName} подтверждён на ${appointment.date} в ${appointment.time}.`
          : language === "en"
            ? `Your appointment with ${appointment.doctorName} on ${appointment.date} at ${appointment.time} was confirmed.`
            : `${appointment.doctorName} bilan ${appointment.date} kuni ${appointment.time} da qabul tasdiqlandi.`,
      );
      setBookingSuccessModal(appointment);
      setSelectedDate("");
      setSelectedTime("");
      setNotes("");
    } catch (error) {
      setBookingError(error instanceof Error ? translateError(error.message) : copy.bookingError);
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
      setBookingError(
        translateError("Yakshanba kuni bron qilib bo'lmaydi. Iltimos, boshqa sanani tanlang."),
      );
      return;
    }

    if (value < minimumBookingDate) {
      setSelectedDate("");
      setSelectedTime("");
      setBookingError(translateError("O'tib ketgan sana uchun bron qilib bo'lmaydi."));
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
      setConfirmationText(
        language === "ru"
          ? "Данные профиля успешно обновлены."
          : language === "en"
            ? "Profile details were updated successfully."
            : "Profil ma'lumotlari muvaffaqiyatli yangilandi.",
      );
      setActiveTab("profile");
    } catch (error) {
      setWorkspaceError(
        error instanceof Error
          ? translateError(error.message)
          : language === "ru"
            ? "Ошибка при сохранении профиля."
            : language === "en"
              ? "There was an error while saving the profile."
              : "Profilni saqlashda xatolik yuz berdi.",
      );
    }
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    setConfirmationText("");
    setWorkspaceError("");

    try {
      await updateAppointmentStatus(appointment.id, "Bekor qilindi");
      setConfirmationText(
        language === "ru"
          ? `Запись к ${appointment.doctorName} на ${appointment.date} в ${appointment.time} была отменена. Этот слот снова доступен.`
          : language === "en"
            ? `Your booking with ${appointment.doctorName} on ${appointment.date} at ${appointment.time} was cancelled. This slot is available again.`
            : `${appointment.doctorName} bilan ${appointment.date} kuni ${appointment.time} dagi bron bekor qilindi. Ushbu slot yana bo'sh holatga qaytdi.`,
      );
    } catch (error) {
      setWorkspaceError(
        error instanceof Error
          ? translateError(error.message)
          : language === "ru"
            ? "Ошибка при отмене записи."
            : language === "en"
              ? "There was an error while cancelling the booking."
              : "Bronni bekor qilishda xatolik yuz berdi.",
      );
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
        language === "ru"
          ? `Оценка ${reviewRating} звёзд для ${reviewTarget.doctorName} успешно отправлена.`
          : language === "en"
            ? `A ${reviewRating}-star rating for ${reviewTarget.doctorName} was submitted successfully.`
            : `${reviewTarget.doctorName} uchun ${reviewRating} yulduzli baho muvaffaqiyatli yuborildi.`,
      );
      setReviewTarget(null);
      setReviewRating(5);
      setReviewComment("");
      setReviewError("");
    } catch (error) {
      setReviewError(
        error instanceof Error
          ? translateError(error.message)
          : language === "ru"
            ? "Ошибка при отправке оценки."
            : language === "en"
              ? "There was an error while submitting the review."
              : "Bahoni yuborishda xatolik yuz berdi.",
      );
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
              <LanguageSwitcher compact />
              <ThemeToggle compact />
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setActiveTab("profile");
                  closeMenu();
                }}
              >
                {copy.profileButton}
              </button>
              <button
                type="button"
                className="button button-ghost"
                onClick={() => {
                  closeMenu();
                  void signOutUser();
                }}
              >
                {copy.logout}
              </button>
            </div>
          </div>

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={menuLabel}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </header>

      <main className="container dashboard-content">
        <section className="dashboard-hero">
          <div>
            <span className="section-chip">{copy.patientCabinet}</span>
            <h1>{copy.heroTitle}</h1>
            <p>{copy.heroText}</p>
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
          {localizedTabs.map((tab) => (
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
                    <strong>{copy.progress[0]}</strong>
                  </div>
                  <div className="flow-progress-item flow-progress-item-active">
                    <span>02</span>
                    <strong>{copy.progress[1]}</strong>
                  </div>
                  <div className="flow-progress-item">
                    <span>03</span>
                    <strong>{copy.progress[2]}</strong>
                  </div>
                </div>

                <div className="panel-heading">
                  <div>
                    <span className="section-chip">{copy.step1}</span>
                    <h2>{copy.chooseDoctor}</h2>
                  </div>
                  <span className="badge">
                    <ShieldIcon />
                    {copy.approvedDoctors}
                  </span>
                </div>

                <div className="doctor-filter-bar">
                  <label className="field">
                    <span>{copy.search}</span>
                    <div className="field-box">
                      <SparkIcon />
                      <input
                        type="text"
                        value={doctorSearchTerm}
                        onChange={(event) => setDoctorSearchTerm(event.target.value)}
                        placeholder={copy.searchPlaceholder}
                      />
                    </div>
                  </label>

                  <label className="field">
                    <span>{copy.region}</span>
                    <div className="field-box field-box-select">
                      <LocationIcon />
                      <select
                        value={doctorRegionFilter}
                        onChange={(event) => setDoctorRegionFilter(event.target.value)}
                      >
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
                        <span className="doctor-specialty-text">{translateSpecialty(doctor.specialty)}</span>
                        <p className="doctor-clinic-text">{doctor.clinic}</p>
                        <div className="doctor-card-tags">
                          <span className="doctor-region-tag">{translateRegion(doctor.region)}</span>
                        </div>
                        <span className="doctor-location-line">
                          <LocationIcon />
                          <span>{doctor.address}</span>
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="empty-state">
                      <h3>{copy.noDoctorsTitle}</h3>
                      <p>{copy.noDoctorsText}</p>
                    </div>
                  )}
                </div>

                <form className="booking-form" onSubmit={handleBooking}>
                  <div className="panel-heading">
                    <div>
                      <span className="section-chip">{copy.step2}</span>
                      <h2>{copy.details}</h2>
                    </div>
                    <span className="badge">
                      <ClockIcon />
                      {copy.realtimeSlots}
                    </span>
                  </div>

                  <div className="field-grid">
                    <label className="field">
                      <span>{copy.date}</span>
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
                      <span>{copy.phone}</span>
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
                            {isBooked ? format(copy.slotBooked, { time }) : time}
                          </button>
                        );
                      })
                    ) : (
                      <div className="empty-state">
                          <h3>{selectedDate ? copy.noSlots : copy.chooseDateFirst}</h3>
                          <p>
                            {selectedDate ? copy.noSlotsText : copy.chooseDateText}
                          </p>
                      </div>
                    )}
                  </div>

                  <div className="field-grid">
                    <label className="field">
                      <span>{copy.fullname}</span>
                      <div className="field-box">
                        <UserGroupIcon />
                        <input
                          type="text"
                          value={patientName}
                          onChange={(event) => setPatientName(event.target.value)}
                           placeholder={copy.fullnamePlaceholder}
                        />
                      </div>
                    </label>

                    <label className="field field-full">
                      <span>{copy.note}</span>
                      <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        rows={4}
                        placeholder={copy.notePlaceholder}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="button button-primary button-large button-block"
                    disabled={!isReady || isSubmittingBooking}
                  >
                    {isSubmittingBooking ? copy.confirming : copy.confirmBooking}
                    <ArrowRightIcon />
                  </button>
                  {bookingError && <p className="auth-error-text">{bookingError}</p>}
                </form>
              </>
            )}

            {activeTab === "appointments" && (
              <div className="workspace-section workspace-history-stack">
                <div className="workspace-history-section">
                  <div className="panel-heading">
                    <div>
                      <span className="section-chip">{copy.appointmentsChip}</span>
                      <h2>{copy.activeAppointments}</h2>
                    </div>
                    <span className="badge">
                      <ClockIcon />
                      {activeAppointments.length}
                    </span>
                  </div>

                  <div className="appointment-list">
                    {activeAppointments.map((appointment) => {
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

                          {getMapSearchUrl(getDoctorMapQuery(appointment)) && (
                            <a
                              href={getMapSearchUrl(getDoctorMapQuery(appointment))}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-map-link"
                            >
                              {mapActionLabel}
                              <ArrowRightIcon />
                            </a>
                          )}

                          {alreadyReviewed && (
                            <div className="review-summary-card">
                              <div className="review-summary-head">
                                <strong>{copy.reviewLeft}</strong>
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
                            {canCompleteAppointment ? (
                              <button
                                type="button"
                                className="button button-secondary"
                                disabled={alreadyReviewed || isCancelled}
                                onClick={() => openReviewModal(appointment)}
                              >
                                {alreadyReviewed ? copy.reviewSent : copy.completeReview}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="button button-ghost"
                                onClick={() => void handleCancelAppointment(appointment)}
                              >
                                {copy.cancel}
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}

                    {activeAppointments.length === 0 && (
                      <div className="empty-state">
                        <h3>{copy.noAppointments}</h3>
                        <p>{copy.noAppointmentsText}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="workspace-history-section">
                  <div className="panel-heading">
                    <div>
                      <span className="section-chip">{historyChip}</span>
                      <h2>{historyTitle}</h2>
                    </div>
                    <span className="badge">
                      <ClockIcon />
                      {appointmentHistory.length}
                    </span>
                  </div>
                  <p className="preview-subtext">{historyText}</p>

                  <div className="appointment-list appointment-list-history">
                    {appointmentHistory.map((appointment) => (
                      <article key={`history-${appointment.id}`} className="appointment-card appointment-card-history">
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

                        {getMapSearchUrl(getDoctorMapQuery(appointment)) && (
                          <a
                            href={getMapSearchUrl(getDoctorMapQuery(appointment))}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-map-link"
                          >
                            {mapActionLabel}
                            <ArrowRightIcon />
                          </a>
                        )}

                        {appointment.reviewRating && (
                          <div className="review-summary-card">
                            <div className="review-summary-head">
                              <strong>{copy.reviewLeft}</strong>
                              <span>{appointment.reviewRating} / 5</span>
                            </div>
                            <div className="review-stars-row review-stars-row-readonly">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={`${appointment.id}-history-star-${star}`}
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
                      </article>
                    ))}

                    {appointmentHistory.length === 0 && (
                      <div className="empty-state">
                        <h3>{noHistoryTitle}</h3>
                        <p>{noHistoryText}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="workspace-section">
                <div className="panel-heading">
                  <div>
                    <span className="section-chip">{copy.profileChip}</span>
                    <h2>{copy.profileTitle}</h2>
                  </div>
                </div>

                <form className="booking-form" onSubmit={handleProfileSave}>
                  <div className="field-grid">
                    <label className="field">
                      <span>{copy.fullname}</span>
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
                      <span>{copy.email}</span>
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
                      <span>{copy.phone}</span>
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
                      <span>{copy.city}</span>
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
                      <span>{copy.birthDate}</span>
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
                      <span>{copy.about}</span>
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
                    {copy.saveProfile}
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
                {copy.bookingSummary}
              </span>
              <h2>{selectedDoctor?.name ?? copy.noDoctor}</h2>
              <p>{selectedDoctor ? translateSpecialty(selectedDoctor.specialty) : copy.noSpecialty}</p>
              {selectedDoctor?.bio && <p className="preview-subtext">{selectedDoctor.bio}</p>}

              <div className="preview-list">
                <div>
                  <CalendarIcon />
                  <span>{selectedDate || copy.noDate}</span>
                </div>
                <div>
                  <ClockIcon />
                  <span>{selectedTime || copy.noTime}</span>
                </div>
                <div>
                  <LocationIcon />
                  <span>{selectedDoctor ? translateRegion(selectedDoctor.region) : copy.noRegion}</span>
                </div>
                <div>
                  <LocationIcon />
                  <span>{selectedDoctor?.clinic ?? copy.noClinic}</span>
                </div>
                <div>
                  <LocationIcon />
                  <span>{selectedDoctor?.address ?? copy.noAddress}</span>
                </div>
              </div>

              <div className="price-line">
                <span>{copy.consultation}</span>
                <strong>{selectedDoctor?.price ?? "-"}</strong>
              </div>

              {selectedDoctorMapUrl && (
                <a href={selectedDoctorMapUrl} target="_blank" rel="noreferrer" className="button button-secondary button-block">
                  {mapActionLabel}
                  <ArrowRightIcon />
                </a>
              )}
            </article>

            <article className="preview-card">
              <div className="panel-heading">
                <div>
                  <h3>{copy.mapTitle}</h3>
                  <p>{copy.mapText}</p>
                </div>
                {selectedDoctorMapUrl && (
                  <a href={selectedDoctorMapUrl} target="_blank" rel="noreferrer" className="button button-secondary">
                    {mapActionLabel}
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
                  <strong>{copy.mapEmptyTitle}</strong>
                  <p>{copy.mapEmptyText}</p>
                </div>
              )}

              <p className="map-preview-caption">{selectedDoctor?.address ?? copy.addressMissing}</p>
            </article>

            <article className="preview-card">
              <h3>{copy.aboutDoctor}</h3>
              <div className="info-stack">
                <div>
                  <span>{copy.rating}</span>
                  <strong>{selectedDoctor ? selectedDoctor.rating.toFixed(1) : "-"}</strong>
                </div>
                <div>
                  <span>{copy.ratingCount}</span>
                  <strong>{language === "uz" ? `${selectedDoctor?.reviewCount ?? 0} ta` : `${selectedDoctor?.reviewCount ?? 0}`}</strong>
                </div>
                <div>
                  <span>{copy.experience}</span>
                  <strong>{selectedDoctor?.experience ?? "-"}</strong>
                </div>
                <div>
                  <span>{copy.nearestSlot}</span>
                  <strong>{selectedDoctor?.availability ?? "-"}</strong>
                </div>
              </div>
              <p className="preview-subtext">
                {copy.aboutDoctorText}
              </p>
            </article>

            <article className="preview-card">
              <h3>{copy.benefits}</h3>
              <div className="summary-checks">
                {copy.benefitList.map((item: string) => (
                  <div key={item}>
                    <CheckIcon />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="preview-card">
              <h3>{copy.serviceLevel}</h3>
              <div className="service-level-card">
                <span>{copy.serviceFlow}</span>
                <strong>{copy.serviceText}</strong>
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
              <h2>{successBannerTitle}</h2>
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
              <h2>{errorBannerTitle}</h2>
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
                  <span className="section-chip">{copy.reviewChip}</span>
                  <h2 id="review-modal-title">{copy.reviewTitle}</h2>
                </div>
                <button type="button" className="icon-button" onClick={closeReviewModal}>
                  <CloseIcon />
                </button>
              </div>

              <p className="review-modal-copy">
                {format(copy.reviewText, { doctorName: reviewTarget.doctorName })}
              </p>

              <div className="review-stars-block">
                <span>{copy.yourRating}</span>
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
                <span>{copy.reviewLabel}</span>
                <textarea
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  rows={4}
                  placeholder={copy.reviewPlaceholder}
                />
              </label>

              {reviewError && <p className="auth-error-text">{reviewError}</p>}

              <div className="modal-actions">
                <button type="button" className="button button-ghost" onClick={closeReviewModal}>
                  {copy.cancel}
                </button>
                <button type="submit" className="button button-primary" disabled={isSubmittingReview}>
                  {copy.send}
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
              <span className="section-chip">{copy.successChip}</span>
            </div>

            <div className="booking-success-copy">
              <h2 id="booking-success-title">{copy.successTitle}</h2>
              <p>{copy.successText}</p>
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
                {copy.later}
              </button>
              <button type="button" className="button button-primary" onClick={openAppointmentsAfterSuccess}>
                {copy.goAppointments}
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









