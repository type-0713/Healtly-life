import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ThemeToggle from "../components/ThemeToggle";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  CloseIcon,
  ClockIcon,
  HeartPulseIcon,
  LocationIcon,
  MenuIcon,
  ShieldIcon,
  SparkIcon,
  UserGroupIcon,
} from "../components/PremiumIcons";
import { useAppContext } from "../context/AppContext";
import { useI18n } from "../context/I18nContext";
import { adminCopy } from "../i18n/adminCopy";
import { getDoctorMapQuery, getMapEmbedUrl, getMapSearchUrl } from "../lib/maps";
import { UZBEKISTAN_REGIONS } from "../lib/regions";
import { DEFAULT_TIME_SLOTS } from "../lib/schedule";

const initialDoctorForm = {
  name: "",
  specialty: "",
  region: "",
  experience: "",
  price: "",
  clinic: "",
  address: "",
  mapQuery: "",
  bio: "",
  availableSlots: [] as string[],
};

const Admin = () => {
  const { language, format, translateError, translateRegion, translateSpecialty } = useI18n();
  const copy = adminCopy[language];
  const { addDoctor, appointments, doctors, removeDoctor, signOutUser } = useAppContext();
  const [doctorForm, setDoctorForm] = useState(initialDoctorForm);
  const [adminNotice, setAdminNotice] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isSavingDoctor, setIsSavingDoctor] = useState(false);
  const [removingDoctorId, setRemovingDoctorId] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const adminNoticeAdded =
    language === "ru"
      ? "Новый врач успешно добавлен и сразу виден всем пользователям."
      : language === "en"
        ? "A new doctor was added successfully and is instantly visible to all users."
        : "Yangi shifokor muvaffaqiyatli qo'shildi va barcha foydalanuvchilar uchun darhol ko'rinadi.";
  const adminErrorAdd =
    language === "ru"
      ? "Ошибка при добавлении врача."
      : language === "en"
        ? "An error occurred while adding the doctor."
        : "Shifokor qo'shishda xatolik yuz berdi.";
  const adminErrorRemove =
    language === "ru"
      ? "Ошибка при удалении врача."
      : language === "en"
        ? "An error occurred while removing the doctor."
        : "Shifokorni o'chirishda xatolik yuz berdi.";
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
  const experiencePlaceholder =
    language === "ru" ? "Например, 12 лет" : language === "en" ? "For example, 12 years" : "Masalan, 12 yil";
  const pricePlaceholder =
    language === "ru"
      ? "Например, 180 000 сум"
      : language === "en"
        ? "For example, 180,000 UZS"
        : "Masalan, 180 000 so'm";
  const addressPlaceholder = doctorForm.region
    ? language === "ru"
      ? `${translateRegion(doctorForm.region)}, район, улица и номер дома`
      : language === "en"
        ? `${translateRegion(doctorForm.region)}, district, street, and building number`
        : `${doctorForm.region}, tuman, ko'cha va uy raqami`
    : language === "ru"
      ? "Сначала выберите регион, затем введите полный адрес"
      : language === "en"
        ? "Choose a region first, then enter the full address"
        : "Viloyat tanlang, keyin to'liq manzil kiriting";
  const mapQueryPlaceholder =
    language === "ru"
      ? "Например, 41.3111, 69.2797 или текст поиска Google Maps"
      : language === "en"
        ? "For example, 41.3111, 69.2797 or a Google Maps search query"
        : "Masalan, 41.3111, 69.2797 yoki Google Maps qidiruv matni";
  const noBusySpecialty = language === "ru" ? "Нет" : language === "en" ? "None" : "Yo'q";

  const kpis = useMemo(
    () => [
      { label: copy.kpis[0], value: appointments.length.toString() },
      { label: copy.kpis[1], value: doctors.length.toString() },
      {
        label: copy.kpis[2],
        value: appointments.length
          ? `${Math.round(
              (appointments.filter((item) => item.status === "Tasdiqlandi").length / appointments.length) * 100,
            )}%`
          : "0%",
      },
      {
        label: copy.kpis[3],
        value: `${appointments.filter((item) => item.notes.toLowerCase().includes("vip")).length}`,
      },
    ],
    [appointments, copy.kpis, doctors.length],
  );

  const draftMapQuery = getDoctorMapQuery(doctorForm);
  const draftMapEmbedUrl = getMapEmbedUrl(draftMapQuery);
  const draftMapSearchUrl = getMapSearchUrl(draftMapQuery);
  const closeMenu = () => setMenuOpen(false);

  const selectedSlotPreview = useMemo(
    () => DEFAULT_TIME_SLOTS.filter((slot) => doctorForm.availableSlots.includes(slot)),
    [doctorForm.availableSlots],
  );

  const handleAddDoctor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAdminError("");
    setAdminNotice("");
    setIsSavingDoctor(true);

    try {
      await addDoctor({
        name: doctorForm.name.trim(),
        specialty: doctorForm.specialty.trim(),
        region: doctorForm.region,
        experience: doctorForm.experience.trim(),
        price: doctorForm.price.trim(),
        availability: selectedSlotPreview.length
          ? `Bo'sh slotlar: ${selectedSlotPreview.slice(0, 2).join(", ")}`
          : "Bo'sh vaqt belgilanmagan",
        clinic: doctorForm.clinic.trim(),
        address: doctorForm.address.trim(),
        mapQuery: doctorForm.mapQuery.trim(),
        bio: doctorForm.bio.trim(),
        availableSlots: selectedSlotPreview,
      });

      setDoctorForm(initialDoctorForm);
      setAdminNotice(adminNoticeAdded);
    } catch (error) {
      setAdminError(error instanceof Error ? translateError(error.message) : adminErrorAdd);
    } finally {
      setIsSavingDoctor(false);
    }
  };

  const handleRemoveDoctor = async (doctorId: string, doctorName: string) => {
    setAdminError("");
    setAdminNotice("");
    setRemovingDoctorId(doctorId);

    try {
      await removeDoctor(doctorId);
      setAdminNotice(
        language === "ru"
          ? `${doctorName} успешно удалён из списка.`
          : language === "en"
            ? `${doctorName} was removed successfully from the list.`
            : `${doctorName} ro'yxatdan muvaffaqiyatli olib tashlandi.`,
      );
    } catch (error) {
      setAdminError(error instanceof Error ? translateError(error.message) : adminErrorRemove);
    } finally {
      setRemovingDoctorId("");
    }
  };

  return (
    <div className="dashboard-page admin-page">
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
              <Link
                to="/user"
                className="button button-secondary"
                onClick={closeMenu}
              >
                {copy.userPanel}
              </Link>
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
            <span className="section-chip">{copy.panelChip}</span>
            <h1>{copy.heroTitle}</h1>
            <p>{copy.heroText}</p>
          </div>

          <div className="dashboard-tagline glass-card">
            <SparkIcon />
            {copy.heroTag}
          </div>
        </section>

        <section className="admin-kpi-grid">
          {kpis.map((item) => (
            <article key={item.label} className="dashboard-mini-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </section>

        <section className="ops-strip">
          <article className="ops-strip-card">
            <span>{copy.stream}</span>
            <strong>{appointments.length > 8 ? copy.high : copy.medium}</strong>
          </article>
          <article className="ops-strip-card">
            <span>{copy.occupancy}</span>
            <strong>{Math.min(95, 45 + doctors.length * 8)}%</strong>
          </article>
          <article className="ops-strip-card">
            <span>{copy.vip}</span>
            <strong>{appointments.filter((item) => item.notes.toLowerCase().includes("vip")).length}</strong>
          </article>
        </section>

        <section className="admin-management-grid">
          <article className="preview-card">
            <div className="panel-heading">
              <div>
                <span className="section-chip">{copy.doctorMgmt}</span>
                <h2>{copy.addDoctor}</h2>
              </div>
            </div>

            <form className="booking-form" onSubmit={handleAddDoctor}>
              <div className="field-grid">
                <label className="field">
                  <span>{copy.fullName}</span>
                  <div className="field-box">
                    <UserGroupIcon />
                    <input
                      type="text"
                      value={doctorForm.name}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, name: event.target.value }))
                      }
                      required
                    />
                  </div>
                </label>

                <label className="field">
                  <span>{copy.specialty}</span>
                  <div className="field-box">
                    <ShieldIcon />
                    <input
                      type="text"
                      value={doctorForm.specialty}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, specialty: event.target.value }))
                      }
                      required
                    />
                  </div>
                </label>

                <label className="field">
                  <span>{copy.region}</span>
                  <div className="field-box field-box-select">
                    <LocationIcon />
                    <select
                      value={doctorForm.region}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, region: event.target.value }))
                      }
                      required
                    >
                      <option value="">{copy.selectRegion}</option>
                      {UZBEKISTAN_REGIONS.map((region) => (
                        <option key={region} value={region}>
                          {translateRegion(region)}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="field">
                  <span>{copy.experience}</span>
                  <div className="field-box">
                    <ClockIcon />
                    <input
                      type="text"
                      value={doctorForm.experience}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, experience: event.target.value }))
                      }
                      placeholder={experiencePlaceholder}
                      required
                    />
                  </div>
                </label>

                <label className="field">
                  <span>{copy.price}</span>
                  <div className="field-box">
                    <SparkIcon />
                    <input
                      type="text"
                      value={doctorForm.price}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, price: event.target.value }))
                      }
                      placeholder={pricePlaceholder}
                      required
                    />
                  </div>
                </label>

                <label className="field field-full">
                  <span>{copy.clinic}</span>
                  <div className="field-box">
                    <ShieldIcon />
                    <input
                      type="text"
                      value={doctorForm.clinic}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, clinic: event.target.value }))
                      }
                      required
                    />
                  </div>
                </label>

                <label className="field field-full">
                  <span>{copy.address}</span>
                  <div className="field-box">
                    <LocationIcon />
                    <input
                      type="text"
                      value={doctorForm.address}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, address: event.target.value }))
                      }
                      placeholder={addressPlaceholder}
                      required
                    />
                  </div>
                </label>

                <label className="field field-full">
                  <span>{copy.mapQuery}</span>
                  <div className="field-box">
                    <LocationIcon />
                    <input
                      type="text"
                      value={doctorForm.mapQuery}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, mapQuery: event.target.value }))
                      }
                      placeholder={mapQueryPlaceholder}
                    />
                  </div>
                </label>

                <div className="field field-full">
                  <span>{copy.slots}</span>
                  <div className="slot-grid slot-grid-admin">
                    {DEFAULT_TIME_SLOTS.map((slot) => {
                      const active = doctorForm.availableSlots.includes(slot);

                      return (
                        <button
                          key={slot}
                          type="button"
                          className={`slot-button ${active ? "slot-button-active" : ""}`}
                          onClick={() =>
                            setDoctorForm((current) => ({
                              ...current,
                              availableSlots: active
                                ? current.availableSlots.filter((item) => item !== slot)
                                : [...current.availableSlots, slot],
                            }))
                          }
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                  <small className="field-note">
                    {copy.slotsNote}
                  </small>
                  {selectedSlotPreview.length > 0 && (
                    <div className="doctor-slot-list">
                      {selectedSlotPreview.map((slot) => (
                        <span key={`preview-${slot}`} className="doctor-slot-chip">
                          {slot}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <label className="field field-full">
                  <span>{copy.bio}</span>
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
                  <span>{copy.mapPreview}</span>
                  <div className="map-preview-card">
                    {draftMapEmbedUrl ? (
                      <iframe
                        className="map-preview-frame"
                        title="Shifokor lokatsiyasi preview"
                        src={draftMapEmbedUrl}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ) : (
                      <div className="map-preview-empty">
                        <LocationIcon />
                        <strong>{copy.mapPreviewTitle}</strong>
                        <p>{copy.mapPreviewText}</p>
                      </div>
                    )}

                    <div className="map-preview-copy">
                      <strong>{doctorForm.clinic || copy.pendingClinic}</strong>
                      <span>{doctorForm.region ? translateRegion(doctorForm.region) : copy.noRegion}</span>
                      <p>{doctorForm.address || copy.addressHint}</p>
                      {draftMapSearchUrl ? (
                        <a
                          href={draftMapSearchUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="button button-secondary"
                        >
                          {copy.openMap}
                          <ArrowRightIcon />
                        </a>
                      ) : (
                        <span className="map-preview-hint">{copy.mapHint}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="button button-primary button-large"
                disabled={doctorForm.availableSlots.length === 0 || isSavingDoctor}
              >
                {isSavingDoctor ? copy.saving : copy.addDoctorButton}
                <CheckIcon />
              </button>

              {adminError && <p className="auth-error-text">{adminError}</p>}
              {adminNotice && <p className="auth-success-text">{adminNotice}</p>}
            </form>
          </article>

          <article className="preview-card preview-highlight">
            <div className="panel-heading">
              <div>
                <span className="section-chip">{copy.doctors}</span>
                <h2>{copy.activeDoctors}</h2>
              </div>
            </div>

            <div className="doctor-admin-list">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="doctor-admin-row">
                  <div className="doctor-admin-copy">
                    <strong>{doctor.name}</strong>
                    <span>{translateSpecialty(doctor.specialty)} - {translateRegion(doctor.region)}</span>
                    <span>{doctor.clinic}</span>
                    <span>{doctor.address}</span>
                    <span>{format(copy.reviews, { rating: doctor.rating.toFixed(1), count: doctor.reviewCount })}</span>
                    <div className="doctor-admin-meta">
                      <span>{format(copy.experienceSummary, { value: doctor.experience })}</span>
                      <span>{doctor.price}</span>
                      <span>{doctor.availability}</span>
                    </div>
                    <div className="doctor-slot-list">
                      {doctor.availableSlots.map((slot) => (
                        <span key={`${doctor.id}-${slot}`} className="doctor-slot-chip">
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="doctor-admin-actions">
                    <a
                      href={getMapSearchUrl(getDoctorMapQuery(doctor))}
                      target="_blank"
                      rel="noreferrer"
                      className="button button-secondary"
                    >
                      {copy.map}
                    </a>
                    <button
                      type="button"
                      className="button button-ghost"
                      disabled={removingDoctorId === doctor.id}
                      onClick={() => void handleRemoveDoctor(doctor.id, doctor.name)}
                    >
                      {removingDoctorId === doctor.id ? copy.removing : copy.remove}
                    </button>
                  </div>
                </div>
              ))}

              {doctors.length === 0 && (
                <div className="empty-state">
                  <h3>{copy.noDoctors}</h3>
                  <p>{copy.noDoctorsText}</p>
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="admin-grid">
          <article className="preview-card preview-highlight">
            <div className="panel-heading">
              <div>
                <span className="section-chip">{copy.autoChip}</span>
                <h2>{copy.autoTitle}</h2>
              </div>
              <span className="badge">
                <ClockIcon />
                {copy.active}
              </span>
            </div>

            <div className="info-stack">
              <div>
                <span>{copy.bookingStatus}</span>
                <strong>{copy.instant}</strong>
              </div>
              <div>
                <span>{copy.todayFlow}</span>
                <strong>{language === "uz" ? `${appointments.length} ta bron` : `${appointments.length}`}</strong>
              </div>
              <div>
                <span>{copy.queuePanel}</span>
                <strong>{copy.removed}</strong>
              </div>
            </div>

            <div className="summary-checks">
              {copy.autoChecks.map((item: string) => (
                <div key={item}>
                  <CheckIcon />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="preview-card">
            <div className="panel-heading">
              <div>
                <span className="section-chip">{copy.qualityChip}</span>
                <h2>{copy.qualityTitle}</h2>
              </div>
            </div>

            <div className="summary-checks">
              {copy.qualityChecks.map((item: string, index: number) => (
                <div key={item}>
                  {index === 0 ? <ShieldIcon /> : index === 1 ? <CheckIcon /> : <CalendarIcon />}
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="preview-card">
            <div className="panel-heading">
              <div>
                <span className="section-chip">{copy.insightChip}</span>
                <h2>{copy.insightTitle}</h2>
              </div>
            </div>

            <div className="info-stack">
              <div>
                <span>{copy.busyTime}</span>
                <strong>10:00 - 12:00</strong>
              </div>
              <div>
                <span>{copy.busyField}</span>
                <strong>{doctors[0] ? translateSpecialty(doctors[0].specialty) : noBusySpecialty}</strong>
              </div>
              <div>
                <span>{copy.cancelRate}</span>
                <strong>
                  {appointments.length
                    ? `${Math.round(
                        (appointments.filter((item) => item.status === "Bekor qilindi").length /
                          appointments.length) *
                          100,
                      )}%`
                    : "0%"}
                </strong>
              </div>
            </div>
          </article>

          <article className="preview-card">
            <div className="panel-heading">
              <div>
                <span className="section-chip">{copy.teamChip}</span>
                <h2>{copy.teamTitle}</h2>
              </div>
            </div>

            <div className="summary-checks">
              {copy.teamChecks.map((item: string, index: number) => (
                <div key={item}>
                  {index === 0 ? <UserGroupIcon /> : index === 1 ? <SparkIcon /> : <ClockIcon />}
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
};

export default Admin;
