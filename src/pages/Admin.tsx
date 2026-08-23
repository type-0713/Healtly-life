import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
import {
  CheckIcon,
  CloseIcon,
  ClockIcon,
  LocationIcon,
  PhoneIcon,
  PillIcon,
  ShieldIcon,
  SparkIcon,
  StethoscopeIcon,
  UserGroupIcon,
} from "../components/PremiumIcons";
import {
  getAppointmentVisibilityDelayMinutes,
  calculateDoctorPerformance,
  formatCurrency,
  getDoctorBookingRecommendation,
  useAppContext,
} from "../context/AppContext";
import { useI18n } from "../context/I18nContext";

const Admin = () => {
  const { translateRegion, translateSpecialty, translateStatus } = useI18n();
  const {
    appointments,
    doctorRoster,
    hospitals,
    pharmacies,
    removeDoctor,
    removeHospital,
    removePharmacy,
    setHospitalApproval,
    setPharmacyApproval,
    setDoctorApproval,
  } = useAppContext();
  const [busyKey, setBusyKey] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const seoTitle = "MedElite | Admin panel";
  const seoDescription = "Private administrative workspace for MedElite.";

  const pendingDoctors = useMemo(
    () => doctorRoster.filter((doctor) => doctor.approvalStatus === "pending"),
    [doctorRoster],
  );
  const approvedDoctors = useMemo(
    () => doctorRoster.filter((doctor) => doctor.approvalStatus === "approved"),
    [doctorRoster],
  );
  const rejectedDoctors = useMemo(
    () => doctorRoster.filter((doctor) => doctor.approvalStatus === "rejected"),
    [doctorRoster],
  );
  const pendingPharmacies = useMemo(
    () => pharmacies.filter((pharmacy) => pharmacy.approvalStatus === "pending"),
    [pharmacies],
  );
  const approvedPharmacies = useMemo(
    () => pharmacies.filter((pharmacy) => pharmacy.approvalStatus === "approved"),
    [pharmacies],
  );
  const pendingHospitals = useMemo(
    () => hospitals.filter((hospital) => hospital.approvalStatus === "pending"),
    [hospitals],
  );
  const approvedHospitals = useMemo(
    () => hospitals.filter((hospital) => hospital.approvalStatus === "approved"),
    [hospitals],
  );

  const latestAppointments = useMemo(() => appointments.slice(0, 8), [appointments]);

  const handleApproval = async (doctorId: string, status: "approved" | "rejected") => {
    try {
      setBusyKey(`${doctorId}-${status}`);
      setNotice("");
      setError("");
      await setDoctorApproval(doctorId, status);
      setNotice(
        status === "approved"
          ? "Doktor muvaffaqiyatli tasdiqlandi."
          : "Doktor arizasi rad etildi.",
      );
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Xatolik yuz berdi.");
    } finally {
      setBusyKey("");
    }
  };

  const handleRemoveDoctor = async (doctorId: string) => {
    try {
      setBusyKey(`${doctorId}-remove`);
      setNotice("");
      setError("");
      await removeDoctor(doctorId);
      setNotice("Doktor ro'yxatdan olib tashlandi.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Xatolik yuz berdi.");
    } finally {
      setBusyKey("");
    }
  };

  const handlePharmacyApproval = async (pharmacyId: string, status: "approved" | "rejected") => {
    try {
      setBusyKey(`${pharmacyId}-${status}`);
      setNotice("");
      setError("");
      await setPharmacyApproval(pharmacyId, status);
      setNotice(status === "approved" ? "Dorixona tasdiqlandi." : "Dorixona arizasi rad etildi.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Xatolik yuz berdi.");
    } finally {
      setBusyKey("");
    }
  };

  const handleHospitalApproval = async (hospitalId: string, status: "approved" | "rejected") => {
    try {
      setBusyKey(`${hospitalId}-${status}`);
      setNotice("");
      setError("");
      await setHospitalApproval(hospitalId, status);
      setNotice(status === "approved" ? "Shifoxona tasdiqlandi." : "Shifoxona arizasi rad etildi.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Xatolik yuz berdi.");
    } finally {
      setBusyKey("");
    }
  };

  const handleRemovePharmacy = async (pharmacyId: string) => {
    try {
      setBusyKey(`${pharmacyId}-remove`);
      setNotice("");
      setError("");
      await removePharmacy(pharmacyId);
      setNotice("Dorixona ro'yxatdan olib tashlandi.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Xatolik yuz berdi.");
    } finally {
      setBusyKey("");
    }
  };

  const handleRemoveHospital = async (hospitalId: string) => {
    try {
      setBusyKey(`${hospitalId}-remove`);
      setNotice("");
      setError("");
      await removeHospital(hospitalId);
      setNotice("Shifoxona ro'yxatdan olib tashlandi.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Xatolik yuz berdi.");
    } finally {
      setBusyKey("");
    }
  };

  return (
    <div className="dashboard-page admin-page">
      <Seo title={seoTitle} description={seoDescription} path="/admin" noIndex />
      <Navbar brandSuffix="Admin" />

      <main className="container dashboard-content">
        <section className="dashboard-hero">
          <div>
            <span className="section-chip">Admin boshqaruvi</span>
            <h1>Doktorlar va buyurtmalar boshqaruvi</h1>
            <p>
              Admin endi doktor qo'shmaydi. Yangi doktorlar o'zlari ro'yxatdan o'tadi, siz esa bu yerda
              ularga ruxsat berasiz, o'chirasiz va barcha buyurtmalarni kuzatib borasiz.
            </p>
          </div>
          <div className="dashboard-tagline glass-card">
            <SparkIcon />
            Tizim doimiy ishlaydi
          </div>
        </section>

        <section className="admin-kpi-grid">
          <article className="dashboard-mini-card">
            <span>Kutilayotgan arizalar</span>
            <strong>{pendingDoctors.length + pendingPharmacies.length + pendingHospitals.length}</strong>
          </article>
          <article className="dashboard-mini-card">
            <span>Aktiv doktorlar</span>
            <strong>{approvedDoctors.length}</strong>
          </article>
          <article className="dashboard-mini-card">
            <span>Aktiv dorixona</span>
            <strong>{approvedPharmacies.length}</strong>
          </article>
          <article className="dashboard-mini-card">
            <span>Aktiv shifoxona</span>
            <strong>{approvedHospitals.length}</strong>
          </article>
        </section>

        <section className="admin-command-grid">
          <article className="preview-card preview-highlight">
            <div className="panel-heading">
              <div>
                <span className="section-chip">Tasdiqlash</span>
                <h2>Yangi doktor arizalari</h2>
              </div>
              <span className="badge badge-gold">
                <ShieldIcon />
                {pendingDoctors.length}
              </span>
            </div>

            <div className="doctor-admin-list">
              {pendingDoctors.map((doctor) => (
                <article key={doctor.id} className="doctor-admin-row doctor-admin-row-rich">
                  <div className="doctor-admin-copy">
                    <strong>{doctor.name || doctor.ownerEmail}</strong>
                    <span>{doctor.ownerEmail}</span>
                    <span>{doctor.phone || "Telefon kiritilmagan"}</span>
                    <span>{translateSpecialty(doctor.specialty || "Mutaxassislik kiritilmagan")}</span>
                    <span>{translateRegion(doctor.region)}</span>
                    <p>{doctor.bio || "Doktor hali to'liq bio kiritmagan."}</p>
                  </div>

                  <div className="doctor-admin-actions">
                    <button
                      type="button"
                      className="button button-primary"
                      disabled={busyKey === `${doctor.id}-approved`}
                      onClick={() => void handleApproval(doctor.id, "approved")}
                    >
                      Ruxsat berish
                    </button>
                    <button
                      type="button"
                      className="button button-ghost"
                      disabled={busyKey === `${doctor.id}-rejected`}
                      onClick={() => void handleApproval(doctor.id, "rejected")}
                    >
                      Rad etish
                    </button>
                  </div>
                </article>
              ))}

              {pendingDoctors.length === 0 && (
                <div className="empty-state">
                  <h3>Yangi ariza yo'q</h3>
                  <p>Ro'yxatdan o'tgan yangi doktorlar shu yerda ko'rinadi.</p>
                </div>
              )}
            </div>
          </article>

          <article className="preview-card">
            <div className="panel-heading">
              <div>
                <span className="section-chip">Rad etilganlar</span>
                <h2>Rad etilgan arizalar</h2>
              </div>
              <span className="badge">
                <CloseIcon />
                {rejectedDoctors.length}
              </span>
            </div>
            <div className="summary-checks">
              {rejectedDoctors.slice(0, 5).map((doctor) => (
                <div key={doctor.id}>
                  <CloseIcon />
                  <span>{doctor.ownerEmail}</span>
                </div>
              ))}
              {rejectedDoctors.length === 0 && (
                <div>
                  <CheckIcon />
                  <span>Hozircha rad etilgan doktor yo'q</span>
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="admin-command-grid">
          <article className="preview-card preview-highlight">
            <div className="panel-heading">
              <div>
                <span className="section-chip">Dorixona arizalari</span>
                <h2>Yangi dorixonalar</h2>
              </div>
              <span className="badge badge-gold">
                <PillIcon />
                {pendingPharmacies.length}
              </span>
            </div>

            <div className="doctor-admin-list">
              {pendingPharmacies.map((pharmacy) => (
                <article key={pharmacy.id} className="doctor-admin-row doctor-admin-row-rich">
                  <div className="doctor-admin-copy">
                    <strong>{pharmacy.name}</strong>
                    <span>{pharmacy.ownerEmail}</span>
                    <span>{pharmacy.phone || "Telefon kiritilmagan"}</span>
                    <span>{translateRegion(pharmacy.region)}</span>
                    <p>{pharmacy.address || "Manzil kiritilmagan"}</p>
                  </div>

                  <div className="doctor-admin-actions">
                    <button
                      type="button"
                      className="button button-primary"
                      disabled={busyKey === `${pharmacy.id}-approved`}
                      onClick={() => void handlePharmacyApproval(pharmacy.id, "approved")}
                    >
                      Ruxsat berish
                    </button>
                    <button
                      type="button"
                      className="button button-ghost"
                      disabled={busyKey === `${pharmacy.id}-rejected`}
                      onClick={() => void handlePharmacyApproval(pharmacy.id, "rejected")}
                    >
                      Rad etish
                    </button>
                  </div>
                </article>
              ))}

              {pendingPharmacies.length === 0 && (
                <div className="empty-state">
                  <h3>Yangi dorixona arizasi yo'q</h3>
                  <p>Dorixona sifatida ro'yxatdan o'tganlar shu yerda ko'rinadi.</p>
                </div>
              )}
            </div>
          </article>

          <article className="preview-card preview-highlight">
            <div className="panel-heading">
              <div>
                <span className="section-chip">Shifoxona arizalari</span>
                <h2>Yangi shifoxonalar</h2>
              </div>
              <span className="badge badge-gold">
                <ShieldIcon />
                {pendingHospitals.length}
              </span>
            </div>

            <div className="doctor-admin-list">
              {pendingHospitals.map((hospital) => (
                <article key={hospital.id} className="doctor-admin-row doctor-admin-row-rich">
                  <div className="doctor-admin-copy">
                    <strong>{hospital.name}</strong>
                    <span>{hospital.ownerEmail}</span>
                    <span>{hospital.phone || "Telefon kiritilmagan"}</span>
                    <span>{translateRegion(hospital.region)}</span>
                    <p>{hospital.address || "Manzil kiritilmagan"}</p>
                  </div>

                  <div className="doctor-admin-actions">
                    <button
                      type="button"
                      className="button button-primary"
                      disabled={busyKey === `${hospital.id}-approved`}
                      onClick={() => void handleHospitalApproval(hospital.id, "approved")}
                    >
                      Ruxsat berish
                    </button>
                    <button
                      type="button"
                      className="button button-ghost"
                      disabled={busyKey === `${hospital.id}-rejected`}
                      onClick={() => void handleHospitalApproval(hospital.id, "rejected")}
                    >
                      Rad etish
                    </button>
                  </div>
                </article>
              ))}

              {pendingHospitals.length === 0 && (
                <div className="empty-state">
                  <h3>Yangi shifoxona arizasi yo'q</h3>
                  <p>Shifoxona sifatida ro'yxatdan o'tganlar shu yerda ko'rinadi.</p>
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="admin-grid">
          <article className="preview-card">
            <div className="panel-heading">
              <div>
                <span className="section-chip">Tasdiqlangan dorixonalar</span>
                <h2>Dorixonalar</h2>
              </div>
              <span className="badge">
                <PillIcon />
                {approvedPharmacies.length}
              </span>
            </div>
            <div className="doctor-request-list">
              {approvedPharmacies.map((pharmacy) => (
                <article key={pharmacy.id} className="doctor-request-item">
                  <div className="appointment-card-head">
                    <div>
                      <h3>{pharmacy.name}</h3>
                      <p>{pharmacy.ownerEmail}</p>
                    </div>
                    <span className="badge">{pharmacy.profileCompleted ? "Profil tayyor" : "Profil kutilmoqda"}</span>
                  </div>
                  <div className="appointment-meta-grid">
                    <div>
                      <PhoneIcon />
                      <span>{pharmacy.phone}</span>
                    </div>
                    <div>
                      <LocationIcon />
                      <span>{pharmacy.address}</span>
                    </div>
                    <div>
                      <ShieldIcon />
                      <span>{pharmacy.license}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="button button-ghost"
                    disabled={busyKey === `${pharmacy.id}-remove`}
                    onClick={() => void handleRemovePharmacy(pharmacy.id)}
                  >
                    O'chirish
                  </button>
                </article>
              ))}
              {approvedPharmacies.length === 0 && (
                <div className="empty-state">
                  <h3>Tasdiqlangan dorixona yo'q</h3>
                  <p>Ruxsat berilgan dorixonalar shu yerda boshqariladi.</p>
                </div>
              )}
            </div>
          </article>

          <article className="preview-card">
            <div className="panel-heading">
              <div>
                <span className="section-chip">Tasdiqlangan shifoxonalar</span>
                <h2>Shifoxonalar</h2>
              </div>
              <span className="badge">
                <ShieldIcon />
                {approvedHospitals.length}
              </span>
            </div>
            <div className="doctor-request-list">
              {approvedHospitals.map((hospital) => (
                <article key={hospital.id} className="doctor-request-item">
                  <div className="appointment-card-head">
                    <div>
                      <h3>{hospital.name}</h3>
                      <p>{hospital.ownerEmail}</p>
                    </div>
                    <span className="badge">{hospital.rooms.length} xona</span>
                  </div>
                  <div className="appointment-meta-grid">
                    <div>
                      <PhoneIcon />
                      <span>{hospital.phone}</span>
                    </div>
                    <div>
                      <LocationIcon />
                      <span>{hospital.address}</span>
                    </div>
                    <div>
                      <UserGroupIcon />
                      <span>{hospital.doctorNames.length} doktor</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="button button-ghost"
                    disabled={busyKey === `${hospital.id}-remove`}
                    onClick={() => void handleRemoveHospital(hospital.id)}
                  >
                    O'chirish
                  </button>
                </article>
              ))}
              {approvedHospitals.length === 0 && (
                <div className="empty-state">
                  <h3>Tasdiqlangan shifoxona yo'q</h3>
                  <p>Ruxsat berilgan shifoxonalar shu yerda boshqariladi.</p>
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="preview-card preview-highlight">
          <div className="panel-heading">
            <div>
              <span className="section-chip">Doktorlar jadvali</span>
              <h2>Doktorlar jadvali</h2>
              <p className="panel-heading-note">
                Har bir doktor uchun buyurtmalar soni, daromad, holat va qisqa izoh ko'rsatiladi.
              </p>
            </div>
            <span className="badge">
              <UserGroupIcon />
              {approvedDoctors.length}
            </span>
          </div>

          <div className="doctor-table-wrap">
            <table className="doctor-performance-table">
              <thead>
                <tr>
                  <th>Doktor</th>
                  <th>Yo'nalish</th>
                  <th>Status</th>
                  <th>Buyurtma</th>
                  <th>Daromad</th>
                  <th>Tavsif</th>
                  <th>Amal</th>
                </tr>
              </thead>
              <tbody>
                {approvedDoctors.map((doctor) => {
                  const performance = calculateDoctorPerformance(doctor, appointments);

                  return (
                    <tr key={doctor.id}>
                      <td>
                        <div className="doctor-table-main">
                          <strong>{doctor.name}</strong>
                          <span>{doctor.ownerEmail || doctor.clinic}</span>
                          <span>{doctor.phone}</span>
                        </div>
                      </td>
                      <td>{translateSpecialty(doctor.specialty)}</td>
                      <td>{doctor.isOnline ? "Ishda" : "Ishda emas"}</td>
                      <td>{performance.totalOrders}</td>
                      <td>{formatCurrency(performance.totalEarnings)}</td>
                      <td>{getDoctorBookingRecommendation(doctor, appointments)}</td>
                      <td>
                        <button
                          type="button"
                          className="button button-ghost"
                          disabled={busyKey === `${doctor.id}-remove`}
                          onClick={() => void handleRemoveDoctor(doctor.id)}
                        >
                          O'chirish
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-grid">
          <article className="preview-card">
            <div className="panel-heading">
              <div>
                <span className="section-chip">So'nggi buyurtmalar</span>
                <h2>So'nggi buyurtmalar</h2>
              </div>
            </div>
            <div className="doctor-request-list">
              {latestAppointments.map((appointment) => {
                const delayMinutes = getAppointmentVisibilityDelayMinutes(appointment);

                return (
                  <article key={appointment.id} className="doctor-request-item">
                    <div className="appointment-card-head">
                      <div>
                        <h3>{appointment.patientName}</h3>
                        <p>{appointment.doctorName}</p>
                      </div>
                      <span className="badge">{translateStatus(appointment.status)}</span>
                    </div>
                    <div className="appointment-meta-grid">
                      <div>
                        <ClockIcon />
                        <span>{appointment.time}</span>
                      </div>
                      <div>
                        <StethoscopeIcon />
                        <span>{translateSpecialty(appointment.specialty)}</span>
                      </div>
                      <div>
                        <ShieldIcon />
                        <span>{delayMinutes === 0 ? "Darhol" : `${delayMinutes} daqiqadan keyin`}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </article>

          <article className="preview-card">
            <div className="panel-heading">
              <div>
                <span className="section-chip">Holat</span>
                <h2>Tizimning joriy holati</h2>
              </div>
            </div>
            <div className="summary-checks">
              <div>
                <CheckIcon />
                <span>Doktor o'zi ro'yxatdan o'tadigan tizim yoqilgan</span>
              </div>
              <div>
                <CheckIcon />
                <span>Ruxsat berish va o'chirish admin bo'limida boshqariladi</span>
              </div>
              <div>
                <CheckIcon />
                <span>Online bo'sh doktorga so'rov darhol, faol qabul bo'lsa 22 daqiqadan keyin ko'rinadi</span>
              </div>
              <div>
                <CheckIcon />
                <span>Ish holati va bo'sh vaqtlar buyurtmalar bilan bog'langan</span>
              </div>
            </div>
          </article>
        </section>

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
    </div>
  );
};

export default Admin;
