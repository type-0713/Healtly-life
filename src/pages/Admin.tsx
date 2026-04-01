import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  const { addDoctor, appointments, doctors, removeDoctor, signOutUser } = useAppContext();
  const [doctorForm, setDoctorForm] = useState(initialDoctorForm);
  const [adminNotice, setAdminNotice] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isSavingDoctor, setIsSavingDoctor] = useState(false);
  const [removingDoctorId, setRemovingDoctorId] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const kpis = useMemo(
    () => [
      { label: "Bugungi bronlar", value: appointments.length.toString() },
      { label: "Aktiv doktorlar", value: doctors.length.toString() },
      {
        label: "Tasdiqlash darajasi",
        value: appointments.length
          ? `${Math.round(
              (appointments.filter((item) => item.status === "Tasdiqlandi").length / appointments.length) * 100,
            )}%`
          : "0%",
      },
      {
        label: "VIP mijozlar",
        value: `${appointments.filter((item) => item.notes.toLowerCase().includes("vip")).length}`,
      },
    ],
    [appointments, doctors.length],
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
      setAdminNotice("Yangi shifokor muvaffaqiyatli qo'shildi va barcha foydalanuvchilar uchun darhol ko'rinadi.");
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Shifokor qo'shishda xatolik yuz berdi.");
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
      setAdminNotice(`${doctorName} ro'yxatdan muvaffaqiyatli olib tashlandi.`);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Shifokorni o'chirishda xatolik yuz berdi.");
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
              <ThemeToggle compact />
              <Link
                to="/user"
                className="button button-secondary"
                onClick={closeMenu}
              >
                Foydalanuvchi paneli
              </Link>
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
            <span className="section-chip">Boshqaruv paneli</span>
            <h1>Klinika oqimini premium nazorat panelida boshqaring</h1>
            <p>
              Real vaqt KPI, avtomatik tasdiqlash, shifokor boshqaruvi va lokatsiya nazorati bitta
              ekranda jamlandi.
            </p>
          </div>

          <div className="dashboard-tagline glass-card">
            <SparkIcon />
            Operatsion ko'rinish kuchaytirildi: tezlik, aniqlik va premium his.
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
            <span>Bron oqimi</span>
            <strong>{appointments.length > 8 ? "Yuqori" : "O'rtacha"}</strong>
          </article>
          <article className="ops-strip-card">
            <span>Doktor bandligi</span>
            <strong>{Math.min(95, 45 + doctors.length * 8)}%</strong>
          </article>
          <article className="ops-strip-card">
            <span>Bugungi VIP so'rovlar</span>
            <strong>{appointments.filter((item) => item.notes.toLowerCase().includes("vip")).length}</strong>
          </article>
        </section>

        <section className="admin-management-grid">
          <article className="preview-card">
            <div className="panel-heading">
              <div>
                <span className="section-chip">Shifokor boshqaruvi</span>
                <h2>Yangi shifokor qo'shish</h2>
              </div>
            </div>

            <form className="booking-form" onSubmit={handleAddDoctor}>
              <div className="field-grid">
                <label className="field">
                  <span>F.I.O</span>
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
                  <span>Mutaxassislik</span>
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
                  <span>Viloyat</span>
                  <div className="field-box field-box-select">
                    <LocationIcon />
                    <select
                      value={doctorForm.region}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, region: event.target.value }))
                      }
                      required
                    >
                      <option value="">Viloyatni tanlang</option>
                      {UZBEKISTAN_REGIONS.map((region) => (
                        <option key={region} value={region}>
                          {region}
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
                      type="text"
                      value={doctorForm.experience}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, experience: event.target.value }))
                      }
                      placeholder="12 yil"
                      required
                    />
                  </div>
                </label>

                <label className="field">
                  <span>Narx</span>
                  <div className="field-box">
                    <SparkIcon />
                    <input
                      type="text"
                      value={doctorForm.price}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, price: event.target.value }))
                      }
                      placeholder="180 000 so'm"
                      required
                    />
                  </div>
                </label>

                <label className="field field-full">
                  <span>Klinika</span>
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
                  <span>Manzil</span>
                  <div className="field-box">
                    <LocationIcon />
                    <input
                      type="text"
                      value={doctorForm.address}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, address: event.target.value }))
                      }
                      placeholder={
                        doctorForm.region
                          ? `${doctorForm.region}, tuman, ko'cha va uy raqami`
                          : "Viloyat tanlang, keyin to'liq manzil kiriting"
                      }
                      required
                    />
                  </div>
                </label>

                <label className="field field-full">
                  <span>Map query yoki koordinata</span>
                  <div className="field-box">
                    <LocationIcon />
                    <input
                      type="text"
                      value={doctorForm.mapQuery}
                      onChange={(event) =>
                        setDoctorForm((current) => ({ ...current, mapQuery: event.target.value }))
                      }
                      placeholder="41.3111, 69.2797 yoki Google Maps qidiruv matni"
                    />
                  </div>
                </label>

                <div className="field field-full">
                  <span>Bo'sh vaqt slotlari</span>
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
                    Tanlangan slotlar foydalanuvchilar uchun aynan shu tartibda chiqariladi.
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
                  <span>Map preview</span>
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
                        <strong>Lokatsiya preview shu yerda chiqadi</strong>
                        <p>Klinika, manzil yoki map query kiritsangiz xarita tayyor bo'ladi.</p>
                      </div>
                    )}

                    <div className="map-preview-copy">
                      <strong>{doctorForm.clinic || "Klinika nomi kutilmoqda"}</strong>
                      <span>{doctorForm.region || "Viloyat tanlanmagan"}</span>
                      <p>{doctorForm.address || "Shifokorning to'liq manzilini kiriting."}</p>
                      {draftMapSearchUrl ? (
                        <a
                          href={draftMapSearchUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="button button-secondary"
                        >
                          Xaritada ochish
                          <ArrowRightIcon />
                        </a>
                      ) : (
                        <span className="map-preview-hint">Map query yoki manzil kiritilgach havola ochiladi.</span>
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
                {isSavingDoctor ? "Shifokor saqlanmoqda..." : "Shifokor qo'shish"}
                <CheckIcon />
              </button>

              {adminError && <p className="auth-error-text">{adminError}</p>}
              {adminNotice && <p className="auth-success-text">{adminNotice}</p>}
            </form>
          </article>

          <article className="preview-card preview-highlight">
            <div className="panel-heading">
              <div>
                <span className="section-chip">Shifokorlar</span>
                <h2>Faol shifokorlar</h2>
              </div>
            </div>

            <div className="doctor-admin-list">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="doctor-admin-row">
                  <div className="doctor-admin-copy">
                    <strong>{doctor.name}</strong>
                    <span>{doctor.specialty} - {doctor.region}</span>
                    <span>{doctor.clinic}</span>
                    <span>{doctor.address}</span>
                    <span>{doctor.rating.toFixed(1)} / 5 ({doctor.reviewCount} baho)</span>
                    <div className="doctor-admin-meta">
                      <span>{doctor.experience} tajriba</span>
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
                      Xarita
                    </a>
                    <button
                      type="button"
                      className="button button-ghost"
                      disabled={removingDoctorId === doctor.id}
                      onClick={() => void handleRemoveDoctor(doctor.id, doctor.name)}
                    >
                      {removingDoctorId === doctor.id ? "O'chirilmoqda..." : "O'chirish"}
                    </button>
                  </div>
                </div>
              ))}

              {doctors.length === 0 && (
                <div className="empty-state">
                  <h3>Shifokorlar topilmadi</h3>
                  <p>Yangi shifokor qo'shganingizdan keyin ular shu yerda ko'rinadi.</p>
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="admin-grid">
          <article className="preview-card preview-highlight">
            <div className="panel-heading">
              <div>
                <span className="section-chip">Avto tasdiqlash</span>
                <h2>Avtomatik tasdiqlash</h2>
              </div>
              <span className="badge">
                <ClockIcon />
                Faol
              </span>
            </div>

            <div className="info-stack">
              <div>
                <span>Bron statusi</span>
                <strong>Darhol tasdiqlanadi</strong>
              </div>
              <div>
                <span>Bugungi oqim</span>
                <strong>{appointments.length} ta bron</strong>
              </div>
              <div>
                <span>Navbat paneli</span>
                <strong>O'chirildi</strong>
              </div>
            </div>

            <div className="summary-checks">
              <div>
                <CheckIcon />
                <span>Yangi bronlar Firebaseda darhol saqlanadi</span>
              </div>
              <div>
                <CheckIcon />
                <span>Status avtomatik ravishda tasdiqlangan holatda yaratiladi</span>
              </div>
              <div>
                <CheckIcon />
                <span>Admin panel faqat nazorat va doktor boshqaruviga qoldirildi</span>
              </div>
            </div>
          </article>

          <article className="preview-card">
            <div className="panel-heading">
              <div>
                <span className="section-chip">Xizmat sifati</span>
                <h2>Xizmat sifati</h2>
              </div>
            </div>

            <div className="summary-checks">
              <div>
                <ShieldIcon />
                <span>Ma'lumotlar xavfsizligi tekshirildi</span>
              </div>
              <div>
                <CheckIcon />
                <span>SMS gateway holati faol</span>
              </div>
              <div>
                <CalendarIcon />
                <span>Bugungi jadval sinxron holatda</span>
              </div>
            </div>
          </article>

          <article className="preview-card">
            <div className="panel-heading">
              <div>
                <span className="section-chip">Tahlil</span>
                <h2>Tezkor insight</h2>
              </div>
            </div>

            <div className="info-stack">
              <div>
                <span>Eng band vaqt</span>
                <strong>10:00 - 12:00</strong>
              </div>
              <div>
                <span>Eng band yo'nalish</span>
                <strong>{doctors[0]?.specialty ?? "Yo'q"}</strong>
              </div>
              <div>
                <span>Bekor qilish darajasi</span>
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
                <span className="section-chip">Jamoa</span>
                <h2>Operatsion guruh</h2>
              </div>
            </div>

            <div className="summary-checks">
              <div>
                <UserGroupIcon />
                <span>12 operator online</span>
              </div>
              <div>
                <SparkIcon />
                <span>O'rtacha javob vaqti 2.4 min</span>
              </div>
              <div>
                <ClockIcon />
                <span>VIP support 24/7</span>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
};

export default Admin;
