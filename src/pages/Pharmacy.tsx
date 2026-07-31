import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../context/I18nContext";
import Seo from "../components/Seo";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSwitcher from "../components/LanguageSwitcher";
import {
  PillIcon,
  SearchIcon,
  ShieldIcon,
  SparkIcon,
  StarIcon,
  CheckCircleIcon,
  PaperclipIcon,
} from "../components/PremiumIcons";

type Medicine = {
  id: string;
  name: string;
  category: string;
  price: number;
  prescriptionRequired: boolean;
  dosage: string;
  manufacturer: string;
  rating: number;
  description: string;
};

const defaultMedicines: Medicine[] = [
  {
    id: "m1",
    name: "Cardio-Mag 75mg",
    category: "Yurak va qon tomir",
    price: 42000,
    prescriptionRequired: true,
    dosage: "75 mg tabletka N30",
    manufacturer: "Berlin-Chemie",
    rating: 4.9,
    description: "Yurak-qon tomir kasalliklarining oldini olish va tromb hosil bo'lish xavfini kamaytirish uchun.",
  },
  {
    id: "m2",
    name: "Vitamin D3 2000 IU Ultra",
    category: "Vitaminlar va mineral",
    price: 65000,
    prescriptionRequired: false,
    dosage: "2000 IU kapsula N60",
    manufacturer: "Nordic Health",
    rating: 4.8,
    description: "Suyaklarni mustahkamlash, immunitetni oshirish va energiya balansi uchun yuqori dozali Vitamin D3.",
  },
  {
    id: "m3",
    name: "Ibuprofen Express 400mg",
    category: "Og'riqsizlantiruvchi",
    price: 28000,
    prescriptionRequired: false,
    dosage: "400 mg kapsula N20",
    manufacturer: "Pharmstandard",
    rating: 4.7,
    description: "Bosh og'rig'i, tish og'rig'i va mushak og'riqlarida tez ta'sir etuvchi vosita.",
  },
  {
    id: "m4",
    name: "Amoksitsillin Forte 500mg",
    category: "Antibiotiklar",
    price: 35000,
    prescriptionRequired: true,
    dosage: "500 mg kapsula N16",
    manufacturer: "Sandoz",
    rating: 4.9,
    description: "Keng qamrovli antibakterial vosita. Faqat shifokor retsepti bo'yicha qabul qilinadi.",
  },
  {
    id: "m5",
    name: "Omega-3 Fish Oil 1000mg",
    category: "Vitaminlar va mineral",
    price: 89000,
    prescriptionRequired: false,
    dosage: "1000 mg kapsula N90",
    manufacturer: "Doppelherz",
    rating: 4.9,
    description: "Yurak, miya va ko'z salomatligini qo'llab-quvvatlovchi toza dengiz Omega-3 yog' kislotalari.",
  },
  {
    id: "m6",
    name: "Magne B6 Premium",
    category: "Vitaminlar va mineral",
    price: 54000,
    prescriptionRequired: false,
    dosage: "Tabletka N50",
    manufacturer: "Sanofi",
    rating: 4.8,
    description: "Asab tizimini tinchlantirish, uyquni yaxshilash va mushak tortishishlariga qarshi.",
  },
];

const Pharmacy = () => {
  const { language } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Barchasi");
  const [cart, setCart] = useState<{ medicine: Medicine; count: number }[]>([]);

  const categories = ["Barchasi", "Yurak va qon tomir", "Vitaminlar va mineral", "Og'riqsizlantiruvchi", "Antibiotiklar"];

  const filteredMedicines = useMemo(() => {
    return defaultMedicines.filter((m) => {
      const matchSearch = (m.name + " " + m.description).toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === "Barchasi" || m.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [searchTerm, selectedCategory]);

  const addToCart = (medicine: Medicine) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.medicine.id === medicine.id);
      if (existing) {
        return prev.map((item) =>
          item.medicine.id === medicine.id ? { ...item, count: item.count + 1 } : item,
        );
      }
      return [...prev, { medicine, count: 1 }];
    });
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.medicine.price * item.count, 0);

  const copy = {
    uz: {
      title: "MedElite Online Dorixona",
      subtitle: "Sertifikatlangan dorilar, vitaminlar va retsept bo'yicha yetkazib berish xizmati",
      searchPlaceholder: "Dori nomi yoki alomatini kiriting...",
      categories: "Kategoriyalar:",
      prescriptionBadge: "Retseptli",
      freeSaleBadge: "Erkin sotuv",
      addToCart: "Savatga qo'shish",
      cartTitle: "Buyurtma savatchasi",
      total: "Jami summasi:",
      checkout: "Buyurtmani tasdiqlash",
      uploadRx: "Retsept rasmini yuklash",
      rxNote: "Retseptli dorilar shifokor ko'rsatmasi tekshirilgandan so'ng yetkaziladi.",
      backHome: "Bosh sahifaga qaytish",
    },
    ru: {
      title: "MedElite Онлайн Аптека",
      subtitle: "Сертифицированные лекарства, витамины и доставка по рецепту",
      searchPlaceholder: "Введите название препарата...",
      categories: "Категории:",
      prescriptionBadge: "По рецепту",
      freeSaleBadge: "Без рецепта",
      addToCart: "В корзину",
      cartTitle: "Корзина заказов",
      total: "Итого:",
      checkout: "Оформить заказ",
      uploadRx: "Загрузить фото рецепта",
      rxNote: "Препараты по рецепту доставляются после проверки назначения врача.",
      backHome: "На главную",
    },
    en: {
      title: "MedElite Online Pharmacy",
      subtitle: "Certified pharmaceuticals, wellness supplements & prescription delivery",
      searchPlaceholder: "Search medicine name or symptom...",
      categories: "Categories:",
      prescriptionBadge: "Prescription Only",
      freeSaleBadge: "Over The Counter",
      addToCart: "Add to Cart",
      cartTitle: "Shopping Cart",
      total: "Total:",
      checkout: "Proceed to Checkout",
      uploadRx: "Upload Prescription Photo",
      rxNote: "Prescription drugs are verified by licensed pharmacists before dispatch.",
      backHome: "Back to Home",
    },
  }[language];

  return (
    <div className="page-shell">
      <Seo title={`MedElite | ${copy.title}`} description={copy.subtitle} path="/pharmacy" />
      <div className="site-orb site-orb-one" />
      <div className="site-orb site-orb-two" />

      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">
              <PillIcon />
            </span>
            <span>
              Med<span className="brand-accent">Elite</span> Pharmacy
            </span>
          </Link>

          <div className="nav-actions">
            <LanguageSwitcher compact />
            <ThemeToggle compact />
            <Link to="/" className="button button-ghost">
              {copy.backHome}
            </Link>
          </div>
        </div>
      </header>

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
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={copy.searchPlaceholder}
                className="pharmacy-search-input"
              />
            </div>
          </div>

          <div className="pharmacy-rx-card">
            <SparkIcon className="rx-spark-icon" />
            <h3>{copy.uploadRx}</h3>
            <p>{copy.rxNote}</p>
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={() => alert("Retsept rasmi yuklandi. Farmatsevt tekshiruviga yuborildi.")}
            >
              <PaperclipIcon />
              Fayl tanlash (JPG/PDF)
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="pharmacy-categories">
          <span>{copy.categories}</span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-pill ${selectedCategory === cat ? "category-pill-active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="pharmacy-layout">
          <div className="medicine-grid">
            {filteredMedicines.map((med) => (
              <article key={med.id} className="medicine-card glass-card">
                <div className="medicine-card-head">
                  <span className={`badge ${med.prescriptionRequired ? "badge-gold" : ""}`}>
                    {med.prescriptionRequired ? copy.prescriptionBadge : copy.freeSaleBadge}
                  </span>
                  <span className="medicine-rating">
                    <StarIcon /> {med.rating}
                  </span>
                </div>

                <div className="medicine-card-body">
                  <h3>{med.name}</h3>
                  <p className="medicine-dosage">{med.dosage} • {med.manufacturer}</p>
                  <p className="medicine-desc">{med.description}</p>
                </div>

                <div className="medicine-card-foot">
                  <strong className="medicine-price">
                    {new Intl.NumberFormat("uz-UZ").format(med.price)} so'm
                  </strong>
                  <button
                    type="button"
                    onClick={() => addToCart(med)}
                    className="button button-primary button-small"
                  >
                    <PillIcon />
                    {copy.addToCart}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Cart Sidebar */}
          {cart.length > 0 && (
            <aside className="pharmacy-cart-sidebar glass-card">
              <h3>{copy.cartTitle}</h3>
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item.medicine.id} className="cart-item">
                    <div>
                      <strong>{item.medicine.name}</strong>
                      <p>{item.count} x {new Intl.NumberFormat("uz-UZ").format(item.medicine.price)} so'm</p>
                    </div>
                    <span>{new Intl.NumberFormat("uz-UZ").format(item.medicine.price * item.count)} so'm</span>
                  </div>
                ))}
              </div>
              <div className="cart-total-row">
                <span>{copy.total}</span>
                <strong>{new Intl.NumberFormat("uz-UZ").format(totalPrice)} so'm</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  alert("Buyurtmangiz qabul qilindi! Kuryer tez orada bog'lanadi.");
                  setCart([]);
                }}
                className="button button-primary button-block"
              >
                <CheckCircleIcon />
                {copy.checkout}
              </button>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
};

export default Pharmacy;
