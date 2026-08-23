import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
import {
  CheckCircleIcon,
  LocationIcon,
  PaperclipIcon,
  PhoneIcon,
  PillIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
  UserGroupIcon,
} from "../components/PremiumIcons";
import { useAppContext, type Medicine } from "../context/AppContext";
import { useI18n } from "../context/I18nContext";

const Pharmacy = () => {
  const { language } = useI18n();
  const {
    currentUser,
    localUserEmail,
    localUserId,
    medicines,
    pharmacies,
    placePharmacyOrder,
    profile,
    updateProfile,
  } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Barchasi");
  const [orderTarget, setOrderTarget] = useState<Medicine | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [patientName, setPatientName] = useState(profile.name);
  const [patientPhone, setPatientPhone] = useState(profile.phone);
  const [deliveryAddress, setDeliveryAddress] = useState(profile.city);
  const [notes, setNotes] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const approvedPharmacyIds = useMemo(
    () => new Set(pharmacies.filter((pharmacy) => pharmacy.approvalStatus === "approved").map((pharmacy) => pharmacy.id)),
    [pharmacies],
  );

  const visibleMedicines = useMemo(
    () =>
      medicines.filter((medicine) => medicine.stock > 0 && approvedPharmacyIds.has(medicine.pharmacyId)),
    [approvedPharmacyIds, medicines],
  );

  const categories = useMemo(
    () => ["Barchasi", ...Array.from(new Set(visibleMedicines.map((medicine) => medicine.category))).filter(Boolean)],
    [visibleMedicines],
  );

  const filteredMedicines = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return visibleMedicines.filter((medicine) => {
      const matchSearch =
        !query ||
        `${medicine.name} ${medicine.description} ${medicine.pharmacyName} ${medicine.manufacturer}`
          .toLowerCase()
          .includes(query);
      const matchCategory = selectedCategory === "Barchasi" || medicine.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [searchTerm, selectedCategory, visibleMedicines]);

  const activeUserEmail = (currentUser?.email ?? localUserEmail ?? profile.email).trim().toLowerCase();
  const activeUserKey = (currentUser?.uid ?? localUserId ?? activeUserEmail).trim().toLowerCase();

  const openOrderModal = (medicine: Medicine) => {
    setOrderTarget(medicine);
    setQuantity(1);
    setPatientName(profile.name);
    setPatientPhone(profile.phone);
    setDeliveryAddress(profile.city);
    setNotes("");
    setError("");
    setNotice("");
  };

  const closeOrderModal = () => setOrderTarget(null);

  const submitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!orderTarget) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setNotice("");
      await placePharmacyOrder({
        medicineId: orderTarget.id,
        quantity,
        patientName,
        patientKey: activeUserKey,
        patientEmail: activeUserEmail,
        patientPhone,
        deliveryAddress,
        notes,
      });
      await updateProfile({ name: patientName, phone: patientPhone, city: deliveryAddress, email: activeUserEmail });
      setNotice("Buyurtma dorixonaga yuborildi. Dorixonachi siz bilan bog'lanib yetkazib beradi.");
      closeOrderModal();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Buyurtmada xatolik yuz berdi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copy = {
    uz: {
      title: "MedElite Online Dorixona",
      subtitle: "Tasdiqlangan dorixonalar qo'shgan dorilar va manzilga yetkazib berish",
      searchPlaceholder: "Dori nomi, dorixona yoki ishlab chiqaruvchi...",
      categories: "Kategoriyalar:",
      prescriptionBadge: "Retseptli",
      freeSaleBadge: "Erkin sotuv",
      order: "Buyurtma berish",
      emptyTitle: "Hozircha dori qo'shilmagan",
      emptyText: "Admin tasdiqlagan dorixonalar o'z dorilarini qo'shganda ular shu yerda ko'rinadi.",
      backHome: "Kabinetga qaytish",
    },
    ru: {
      title: "MedElite Online Dorixona",
      subtitle: "Tasdiqlangan dorixonalar qo'shgan dorilar va manzilga yetkazib berish",
      searchPlaceholder: "Dori nomi, dorixona yoki ishlab chiqaruvchi...",
      categories: "Kategoriyalar:",
      prescriptionBadge: "Retseptli",
      freeSaleBadge: "Erkin sotuv",
      order: "Buyurtma berish",
      emptyTitle: "Hozircha dori qo'shilmagan",
      emptyText: "Admin tasdiqlagan dorixonalar o'z dorilarini qo'shganda ular shu yerda ko'rinadi.",
      backHome: "Kabinetga qaytish",
    },
    en: {
      title: "MedElite Online Pharmacy",
      subtitle: "Medicines added by approved pharmacies with address-based delivery",
      searchPlaceholder: "Search medicine, pharmacy, or manufacturer...",
      categories: "Categories:",
      prescriptionBadge: "Prescription",
      freeSaleBadge: "Over the counter",
      order: "Place order",
      emptyTitle: "No medicines yet",
      emptyText: "Medicines from approved pharmacies will appear here after they add inventory.",
      backHome: "Back to workspace",
    },
  }[language];

  return (
    <div className="page-shell">
      <Seo title={`MedElite | ${copy.title}`} description={copy.subtitle} path="/pharmacy" noIndex />
      <div className="site-orb site-orb-one" />
      <div className="site-orb site-orb-two" />

      <Navbar brandSuffix="Pharmacy" />

      <main className="container section-block">
        <div className="pharmacy-hero glass-card">
          <div className="pharmacy-hero-copy">
            <span className="section-chip">
              <ShieldIcon />
              {copy.title}
            </span>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>

            <div className="pharmacy-search-bar">
              <SearchIcon />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={copy.searchPlaceholder}
                className="pharmacy-search-input"
              />
            </div>
          </div>

          <div className="pharmacy-rx-card">
            <PaperclipIcon className="rx-spark-icon" />
            <h3>Retseptli dorilar</h3>
            <p>Retsept talab qiladigan dori buyurtmasida izohga retsept raqami yoki shifokor ko'rsatmasini yozing.</p>
          </div>
        </div>

        <div className="pharmacy-categories">
          <span>{copy.categories}</span>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`category-pill ${selectedCategory === category ? "category-pill-active" : ""}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {notice && (
          <section className="confirmation-banner">
            <div className="confirmation-icon">
              <CheckCircleIcon />
            </div>
            <div>
              <h2>Buyurtma yuborildi</h2>
              <p>{notice}</p>
            </div>
          </section>
        )}

        {error && (
          <section className="confirmation-banner confirmation-banner-error">
            <div className="confirmation-icon confirmation-icon-error">
              <ShieldIcon />
            </div>
            <div>
              <h2>Xatolik</h2>
              <p>{error}</p>
            </div>
          </section>
        )}

        <div className="medicine-grid">
          {filteredMedicines.map((medicine) => (
            <article key={medicine.id} className="medicine-card glass-card">
              <div className="medicine-card-head">
                <span className={`badge ${medicine.prescriptionRequired ? "badge-gold" : ""}`}>
                  {medicine.prescriptionRequired ? copy.prescriptionBadge : copy.freeSaleBadge}
                </span>
                <span className="medicine-rating">
                  <StarIcon /> {medicine.stock} dona
                </span>
              </div>

              <div className="medicine-card-body">
                <h3>{medicine.name}</h3>
                <p className="medicine-dosage">
                  {medicine.dosage} | {medicine.manufacturer}
                </p>
                <p className="medicine-desc">{medicine.description}</p>
                <p className="medicine-desc">
                  <strong>{medicine.pharmacyName}</strong>
                </p>
              </div>

              <div className="medicine-card-foot">
                <strong className="medicine-price">
                  {new Intl.NumberFormat("uz-UZ").format(medicine.price)} so'm
                </strong>
                <button type="button" onClick={() => openOrderModal(medicine)} className="button button-primary button-small">
                  <PillIcon />
                  {copy.order}
                </button>
              </div>
            </article>
          ))}

          {filteredMedicines.length === 0 && (
            <div className="empty-state doctor-empty-state">
              <h3>{copy.emptyTitle}</h3>
              <p>{copy.emptyText}</p>
            </div>
          )}
        </div>
      </main>

      {orderTarget && (
        <div className="modal-backdrop" onClick={closeOrderModal} role="presentation">
          <div className="modal-card modal-card-wide" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="panel-heading">
              <div>
                <span className="section-chip">Yetkazib berish</span>
                <h2>{orderTarget.name}</h2>
              </div>
              <button type="button" className="icon-button" onClick={closeOrderModal}>
                x
              </button>
            </div>
            <form className="booking-form modal-scroll-area" onSubmit={submitOrder}>
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
                  <span>Soni</span>
                  <div className="field-box">
                    <PillIcon />
                    <input
                      type="number"
                      min={1}
                      max={orderTarget.stock}
                      value={quantity}
                      onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
                      required
                    />
                  </div>
                </label>
                <label className="field field-full">
                  <span>Yashash yoki yetkazish manzili</span>
                  <div className="field-box">
                    <LocationIcon />
                    <input value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} required />
                  </div>
                </label>
                <label className="field field-full">
                  <span>Izoh</span>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Retsept raqami, mo'ljal yoki qo'shimcha izoh"
                  />
                </label>
              </div>

              <div className="cart-total-row">
                <span>Jami</span>
                <strong>{new Intl.NumberFormat("uz-UZ").format(orderTarget.price * quantity)} so'm</strong>
              </div>

              <div className="modal-actions">
                <button type="button" className="button button-ghost" onClick={closeOrderModal}>
                  Bekor qilish
                </button>
                <button type="submit" className="button button-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Yuborilmoqda..." : "Buyurtmani yuborish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pharmacy;
