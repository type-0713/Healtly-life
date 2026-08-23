import { useMemo, useState, type FormEvent } from "react";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
import {
  CheckIcon,
  CloseIcon,
  LocationIcon,
  PhoneIcon,
  PillIcon,
  ShieldIcon,
  SparkIcon,
  StethoscopeIcon,
  UserGroupIcon,
} from "../components/PremiumIcons";
import {
  useAppContext,
  type HospitalRoom,
  type HospitalBookingStatus,
  type MedicineInput,
  type PharmacyOrderStatus,
  type ProviderRole,
} from "../context/AppContext";

const createEmptyMedicine = (): MedicineInput => ({
  name: "",
  category: "",
  price: 0,
  prescriptionRequired: false,
  dosage: "",
  manufacturer: "",
  stock: 0,
  description: "",
});

const createDefaultRoom = (): HospitalRoom => ({
  id: `room-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: "",
  price: "",
  capacity: "1",
  isLuxury: false,
  description: "",
});

const ProviderDashboardContent = ({ role }: { role: ProviderRole }) => {
  const {
    addMedicine,
    currentHospital,
    currentPharmacy,
    hospitalRoomBookings,
    medicines,
    partnerApprovalStatus,
    pharmacyOrders,
    removeMedicine,
    updateHospitalProfile,
    updateHospitalBookingStatus,
    updatePharmacyOrderStatus,
    updatePharmacyProfile,
  } = useAppContext();
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [medicineForm, setMedicineForm] = useState<MedicineInput>(createEmptyMedicine);

  const [pharmacyForm, setPharmacyForm] = useState(() => ({
    name: currentPharmacy?.name ?? "",
    phone: currentPharmacy?.phone ?? "",
    address: currentPharmacy?.address ?? "",
    license: currentPharmacy?.license ?? "",
    description: currentPharmacy?.description ?? "",
  }));
  const [hospitalForm, setHospitalForm] = useState(() => ({
    name: currentHospital?.name ?? "",
    phone: currentHospital?.phone ?? "",
    address: currentHospital?.address ?? "",
    license: currentHospital?.license ?? "",
    description: currentHospital?.description ?? "",
    rooms: currentHospital?.rooms.length ? currentHospital.rooms : [createDefaultRoom()],
    doctorNamesText: currentHospital?.doctorNames.join("\n") ?? "",
  }));

  const ownMedicines = useMemo(
    () => medicines.filter((medicine) => medicine.pharmacyId === currentPharmacy?.id),
    [currentPharmacy?.id, medicines],
  );

  const ownOrders = useMemo(
    () => pharmacyOrders.filter((order) => order.pharmacyId === currentPharmacy?.id),
    [currentPharmacy?.id, pharmacyOrders],
  );

  const ownHospitalBookings = useMemo(
    () => hospitalRoomBookings.filter((booking) => booking.hospitalId === currentHospital?.id),
    [currentHospital?.id, hospitalRoomBookings],
  );

  const providerName = role === "pharmacy" ? currentPharmacy?.name : currentHospital?.name;
  const approved = partnerApprovalStatus === "approved";
  const waitingTitle =
    partnerApprovalStatus === "rejected" ? "Arizangiz rad etilgan" : "Admin tasdig'i kutilmoqda";
  const waitingText =
    partnerApprovalStatus === "rejected"
      ? "Admin bilan bog'lanib ma'lumotlarni aniqlashtiring."
      : "Ro'yxatdan o'tish qabul qilindi. Admin tasdiqlagach kabinet to'liq ochiladi.";


  const savePharmacyProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setError("");
      setNotice("");
      await updatePharmacyProfile(pharmacyForm);
      setNotice("Dorixona ma'lumotlari saqlandi.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Xatolik yuz berdi.");
    }
  };

  const saveHospitalProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setError("");
      setNotice("");
      await updateHospitalProfile({
        name: hospitalForm.name,
        phone: hospitalForm.phone,
        address: hospitalForm.address,
        license: hospitalForm.license,
        description: hospitalForm.description,
        rooms: hospitalForm.rooms,
        doctorNames: hospitalForm.doctorNamesText.split("\n"),
      });
      setNotice("Shifoxona ma'lumotlari saqlandi.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Xatolik yuz berdi.");
    }
  };

  const saveMedicine = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setError("");
      setNotice("");
      await addMedicine(medicineForm);
      setMedicineForm(createEmptyMedicine());
      setNotice("Dori foydalanuvchilar dorixona bo'limiga qo'shildi.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Xatolik yuz berdi.");
    }
  };

  const updateOrder = async (orderId: string, status: PharmacyOrderStatus) => {
    try {
      setError("");
      setNotice("");
      await updatePharmacyOrderStatus(orderId, status);
      setNotice("Buyurtma holati yangilandi.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Xatolik yuz berdi.");
    }
  };

  const updateHospitalBooking = async (bookingId: string, status: HospitalBookingStatus) => {
    try {
      setError("");
      setNotice("");
      await updateHospitalBookingStatus(bookingId, status);
      setNotice("Xona bron holati yangilandi.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Xatolik yuz berdi.");
    }
  };

  return (
    <div className="dashboard-page">
      <Seo
        title={role === "pharmacy" ? "MedElite | Dorixona kabineti" : "MedElite | Shifoxona kabineti"}
        description="Provider private workspace"
        path={role === "pharmacy" ? "/pharmacy-dashboard" : "/hospital-dashboard"}
        noIndex
      />
      <Navbar brandSuffix={role === "pharmacy" ? "Pharmacy" : "Hospital"} />

      <main className="container dashboard-content">
        <section className="dashboard-hero">
          <div>
            <span className="section-chip">{role === "pharmacy" ? "Dorixona bo'limi" : "Shifoxona bo'limi"}</span>
            <h1>{providerName || (role === "pharmacy" ? "Dorixona kabineti" : "Shifoxona kabineti")}</h1>
            <p>
              {role === "pharmacy"
                ? "Dorilarni dorixona o'zi qo'shadi. User buyurtma berganda bemor ma'lumotlari va yashash manzili shu yerda ko'rinadi."
                : "Shifoxona o'z xonalari, har bir xona narxi va unda ishlaydigan doktorlarni shu yerdan boshqaradi."}
            </p>
          </div>
          <div className="dashboard-tagline glass-card">
            <SparkIcon />
            {partnerApprovalStatus || "session"}
          </div>
        </section>

        {!approved ? (
          <section className="preview-card doctor-waiting-card">
            <div className="panel-heading">
              <div>
                <span className="section-chip">Tasdiqlash holati</span>
                <h2>{waitingTitle}</h2>
              </div>
              <span className="badge">
                <ShieldIcon />
                {partnerApprovalStatus}
              </span>
            </div>
            <p className="preview-subtext">{waitingText}</p>
          </section>
        ) : role === "pharmacy" ? (
          <>
            <section className="admin-kpi-grid">
              <article className="dashboard-mini-card">
                <span>Dorilar</span>
                <strong>{ownMedicines.length}</strong>
              </article>
              <article className="dashboard-mini-card">
                <span>Yangi buyurtmalar</span>
                <strong>{ownOrders.filter((order) => order.status === "Yangi").length}</strong>
              </article>
              <article className="dashboard-mini-card">
                <span>Yetkazilgan</span>
                <strong>{ownOrders.filter((order) => order.status === "Yetkazildi").length}</strong>
              </article>
              <article className="dashboard-mini-card">
                <span>Jami buyurtma</span>
                <strong>{ownOrders.length}</strong>
              </article>
            </section>

            <section className="user-workspace-grid">
              <article className="preview-card">
                <div className="panel-heading">
                  <div>
                    <span className="section-chip">Dorixona haqida</span>
                    <h2>Profil</h2>
                  </div>
                </div>
                <form className="booking-form" onSubmit={savePharmacyProfile}>
                  <div className="field-grid">
                    <label className="field">
                      <span>Nomi</span>
                      <div className="field-box">
                        <PillIcon />
                        <input value={pharmacyForm.name} onChange={(event) => setPharmacyForm((current) => ({ ...current, name: event.target.value }))} required />
                      </div>
                    </label>
                    <label className="field">
                      <span>Telefon</span>
                      <div className="field-box">
                        <PhoneIcon />
                        <input value={pharmacyForm.phone} onChange={(event) => setPharmacyForm((current) => ({ ...current, phone: event.target.value }))} required />
                      </div>
                    </label>
                    <label className="field field-full">
                      <span>Manzil</span>
                      <div className="field-box">
                        <LocationIcon />
                        <input value={pharmacyForm.address} onChange={(event) => setPharmacyForm((current) => ({ ...current, address: event.target.value }))} required />
                      </div>
                    </label>
                    <label className="field">
                      <span>Litsenziya</span>
                      <div className="field-box">
                        <ShieldIcon />
                        <input value={pharmacyForm.license} onChange={(event) => setPharmacyForm((current) => ({ ...current, license: event.target.value }))} required />
                      </div>
                    </label>
                    <label className="field field-full">
                      <span>Dorixona haqida</span>
                      <textarea rows={4} value={pharmacyForm.description} onChange={(event) => setPharmacyForm((current) => ({ ...current, description: event.target.value }))} required />
                    </label>
                  </div>
                  <button className="button button-primary" type="submit">
                    Saqlash
                    <CheckIcon />
                  </button>
                </form>
              </article>

              <article className="preview-card preview-highlight">
                <div className="panel-heading">
                  <div>
                    <span className="section-chip">Dori qo'shish</span>
                    <h2>Yangi dori</h2>
                  </div>
                </div>
                <form className="booking-form" onSubmit={saveMedicine}>
                  <div className="field-grid">
                    <label className="field">
                      <span>Dori nomi</span>
                      <input className="hero-search-input" value={medicineForm.name} onChange={(event) => setMedicineForm((current) => ({ ...current, name: event.target.value }))} required />
                    </label>
                    <label className="field">
                      <span>Kategoriya</span>
                      <input className="hero-search-input" value={medicineForm.category} onChange={(event) => setMedicineForm((current) => ({ ...current, category: event.target.value }))} required />
                    </label>
                    <label className="field">
                      <span>Narx</span>
                      <input className="hero-search-input" type="number" min={1} value={medicineForm.price || ""} onChange={(event) => setMedicineForm((current) => ({ ...current, price: Number(event.target.value) }))} required />
                    </label>
                    <label className="field">
                      <span>Qoldiq</span>
                      <input className="hero-search-input" type="number" min={1} value={medicineForm.stock || ""} onChange={(event) => setMedicineForm((current) => ({ ...current, stock: Number(event.target.value) }))} required />
                    </label>
                    <label className="field">
                      <span>Doza</span>
                      <input className="hero-search-input" value={medicineForm.dosage} onChange={(event) => setMedicineForm((current) => ({ ...current, dosage: event.target.value }))} required />
                    </label>
                    <label className="field">
                      <span>Ishlab chiqaruvchi</span>
                      <input className="hero-search-input" value={medicineForm.manufacturer} onChange={(event) => setMedicineForm((current) => ({ ...current, manufacturer: event.target.value }))} required />
                    </label>
                    <label className="checkbox-line field-full">
                      <input type="checkbox" checked={medicineForm.prescriptionRequired} onChange={(event) => setMedicineForm((current) => ({ ...current, prescriptionRequired: event.target.checked }))} />
                      <span>Retsept talab qiladi</span>
                    </label>
                    <label className="field field-full">
                      <span>Tavsif</span>
                      <textarea rows={3} value={medicineForm.description} onChange={(event) => setMedicineForm((current) => ({ ...current, description: event.target.value }))} required />
                    </label>
                  </div>
                  <button className="button button-primary" type="submit">
                    Dori qo'shish
                    <PillIcon />
                  </button>
                </form>
              </article>
            </section>

            <section className="doctor-workspace-grid">
              <article className="preview-card doctor-queue-card">
                <div className="panel-heading">
                  <div>
                    <span className="section-chip">Buyurtmalar</span>
                    <h2>Yetkazib berish buyurtmalari</h2>
                  </div>
                </div>
                <div className="doctor-request-list">
                  {ownOrders.map((order) => (
                    <article key={order.id} className="doctor-request-item">
                      <div className="appointment-card-head">
                        <div>
                          <h3>{order.medicineName}</h3>
                          <p>{order.patientName} | {order.patientPhone}</p>
                        </div>
                        <span className="badge">{order.status}</span>
                      </div>
                      <div className="appointment-meta-grid">
                        <div>
                          <UserGroupIcon />
                          <span>{order.quantity} dona</span>
                        </div>
                        <div>
                          <LocationIcon />
                          <span>{order.deliveryAddress}</span>
                        </div>
                        <div>
                          <PillIcon />
                          <span>{new Intl.NumberFormat("uz-UZ").format(order.totalPrice)} so'm</span>
                        </div>
                      </div>
                      {order.notes && <p>{order.notes}</p>}
                      <div className="doctor-request-actions">
                        <button type="button" className="button button-secondary" onClick={() => void updateOrder(order.id, "Qabul qilindi")}>
                          Qabul qilindi
                        </button>
                        <button type="button" className="button button-primary" onClick={() => void updateOrder(order.id, "Yetkazildi")}>
                          Yetkazildi
                        </button>
                      </div>
                    </article>
                  ))}
                  {ownOrders.length === 0 && (
                    <div className="empty-state">
                      <h3>Buyurtma yo'q</h3>
                      <p>User dorixona bo'limidan buyurtma berganda shu yerda ko'rinadi.</p>
                    </div>
                  )}
                </div>
              </article>

              <article className="preview-card doctor-queue-card">
                <div className="panel-heading">
                  <div>
                    <span className="section-chip">Dorilarim</span>
                    <h2>Inventar</h2>
                  </div>
                </div>
                <div className="doctor-request-list">
                  {ownMedicines.map((medicine) => (
                    <article key={medicine.id} className="doctor-request-item">
                      <div className="appointment-card-head">
                        <div>
                          <h3>{medicine.name}</h3>
                          <p>{medicine.category} | {medicine.stock} dona</p>
                        </div>
                        <span className="badge">{new Intl.NumberFormat("uz-UZ").format(medicine.price)} so'm</span>
                      </div>
                      <button type="button" className="button button-ghost" onClick={() => void removeMedicine(medicine.id)}>
                        O'chirish
                      </button>
                    </article>
                  ))}
                </div>
              </article>
            </section>
          </>
        ) : (
          <>
          <section className="admin-kpi-grid">
            <article className="dashboard-mini-card">
              <span>Xonalar</span>
              <strong>{currentHospital?.rooms.length ?? 0}</strong>
            </article>
            <article className="dashboard-mini-card">
              <span>Lux xonalar</span>
              <strong>{currentHospital?.rooms.filter((room) => room.isLuxury).length ?? 0}</strong>
            </article>
            <article className="dashboard-mini-card">
              <span>Yangi bronlar</span>
              <strong>{ownHospitalBookings.filter((booking) => booking.status === "Yangi").length}</strong>
            </article>
            <article className="dashboard-mini-card">
              <span>Jami bron</span>
              <strong>{ownHospitalBookings.length}</strong>
            </article>
          </section>

          <section className="preview-card preview-highlight">
            <div className="panel-heading">
              <div>
                <span className="section-chip">Shifoxona haqida</span>
                <h2>Xonalar, narxlar va doktorlar</h2>
              </div>
            </div>
            <form className="booking-form" onSubmit={saveHospitalProfile}>
              <div className="field-grid">
                <label className="field">
                  <span>Nomi</span>
                  <input className="hero-search-input" value={hospitalForm.name} onChange={(event) => setHospitalForm((current) => ({ ...current, name: event.target.value }))} required />
                </label>
                <label className="field">
                  <span>Telefon</span>
                  <input className="hero-search-input" value={hospitalForm.phone} onChange={(event) => setHospitalForm((current) => ({ ...current, phone: event.target.value }))} required />
                </label>
                <label className="field field-full">
                  <span>Manzil</span>
                  <input className="hero-search-input" value={hospitalForm.address} onChange={(event) => setHospitalForm((current) => ({ ...current, address: event.target.value }))} required />
                </label>
                <label className="field">
                  <span>Litsenziya</span>
                  <input className="hero-search-input" value={hospitalForm.license} onChange={(event) => setHospitalForm((current) => ({ ...current, license: event.target.value }))} required />
                </label>
                <label className="field field-full">
                  <span>Shifoxona haqida</span>
                  <textarea rows={4} value={hospitalForm.description} onChange={(event) => setHospitalForm((current) => ({ ...current, description: event.target.value }))} required />
                </label>
              </div>

              <div className="doctor-request-list">
                {hospitalForm.rooms.map((room, index) => (
                  <article key={room.id} className="doctor-request-item">
                    <div className="field-grid">
                      <label className="field">
                        <span>Xona nomi</span>
                        <input className="hero-search-input" value={room.name} onChange={(event) => setHospitalForm((current) => ({ ...current, rooms: current.rooms.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) }))} required />
                      </label>
                      <label className="field">
                        <span>Narxi</span>
                        <input className="hero-search-input" value={room.price} onChange={(event) => setHospitalForm((current) => ({ ...current, rooms: current.rooms.map((item, itemIndex) => itemIndex === index ? { ...item, price: event.target.value } : item) }))} required />
                      </label>
                      <label className="field">
                        <span>Joylar soni</span>
                        <input className="hero-search-input" type="number" min={1} value={room.capacity} onChange={(event) => setHospitalForm((current) => ({ ...current, rooms: current.rooms.map((item, itemIndex) => itemIndex === index ? { ...item, capacity: event.target.value } : item) }))} required />
                      </label>
                      <label className="checkbox-line field-full">
                        <input type="checkbox" checked={room.isLuxury} onChange={(event) => setHospitalForm((current) => ({ ...current, rooms: current.rooms.map((item, itemIndex) => itemIndex === index ? { ...item, isLuxury: event.target.checked } : item) }))} />
                        <span>Lux xona</span>
                      </label>
                      <label className="field field-full">
                        <span>Tavsif</span>
                        <textarea rows={2} value={room.description} onChange={(event) => setHospitalForm((current) => ({ ...current, rooms: current.rooms.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item) }))} />
                      </label>
                    </div>
                  </article>
                ))}
              </div>
              <button type="button" className="button button-secondary" onClick={() => setHospitalForm((current) => ({ ...current, rooms: [...current.rooms, createDefaultRoom()] }))}>
                Xona qo'shish
              </button>

              <label className="field field-full">
                <span>Unda ishlaydigan doktorlar (har qatorda bitta)</span>
                <textarea rows={5} value={hospitalForm.doctorNamesText} onChange={(event) => setHospitalForm((current) => ({ ...current, doctorNamesText: event.target.value }))} placeholder="Dr. Alisher Karimov&#10;Dr. Gulsara Niyazova" />
              </label>

              <button className="button button-primary" type="submit">
                Shifoxona ma'lumotlarini saqlash
                <StethoscopeIcon />
              </button>
            </form>
          </section>
          <section className="preview-card">
            <div className="panel-heading">
              <div>
                <span className="section-chip">Xona bronlari</span>
                <h2>Yotish joyi buyurtmalari</h2>
              </div>
            </div>
            <div className="doctor-request-list">
              {ownHospitalBookings.map((booking) => (
                <article key={booking.id} className="doctor-request-item">
                  <div className="appointment-card-head">
                    <div>
                      <h3>{booking.roomName} | {booking.placeNumber}-joy</h3>
                      <p>{booking.patientName} | {booking.patientPhone}</p>
                    </div>
                    <span className="badge">{booking.status}</span>
                  </div>
                  <div className="appointment-meta-grid">
                    <div>
                      <UserGroupIcon />
                      <span>{booking.days} kun</span>
                    </div>
                    <div>
                      <LocationIcon />
                      <span>{booking.startDate} - {booking.endDate}</span>
                    </div>
                    <div>
                      <ShieldIcon />
                      <span>{booking.roomPrice}</span>
                    </div>
                  </div>
                  {booking.notes && <p>{booking.notes}</p>}
                  <div className="doctor-request-actions">
                    <button type="button" className="button button-secondary" onClick={() => void updateHospitalBooking(booking.id, "Tasdiqlandi")}>
                      Tasdiqlash
                    </button>
                    <button type="button" className="button button-primary" onClick={() => void updateHospitalBooking(booking.id, "Yakunlandi")}>
                      Yakunlash
                    </button>
                    <button type="button" className="button button-ghost" onClick={() => void updateHospitalBooking(booking.id, "Bekor qilindi")}>
                      Bekor qilish
                    </button>
                  </div>
                </article>
              ))}
              {ownHospitalBookings.length === 0 && (
                <div className="empty-state">
                  <h3>Bron yo'q</h3>
                  <p>User shifoxona xonasini bron qilganda shu yerda ko'rinadi.</p>
                </div>
              )}
            </div>
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
              <h2>Xatolik</h2>
              <p>{error}</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

// Remount the form workspace when the authenticated provider changes so form state
// is initialized from the correct pharmacy or hospital without an effect cascade.
const ProviderDashboard = ({ role }: { role: ProviderRole }) => {
  const { currentHospital, currentPharmacy } = useAppContext();
  const providerId = role === "pharmacy" ? currentPharmacy?.id : currentHospital?.id;

  return <ProviderDashboardContent key={`${role}:${providerId ?? "pending"}`} role={role} />;
};

export default ProviderDashboard;
