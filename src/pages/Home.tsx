import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import {
  ArrowRightIcon,
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  CloseIcon,
  HeartPulseIcon,
  LocationIcon,
  MenuIcon,
  SearchIcon,
  ShieldIcon,
  SparkIcon,
  StarIcon,
  StethoscopeIcon,
  UserGroupIcon,
} from "../components/PremiumIcons";
import { useAppContext } from "../context/AppContext";
import { getDoctorMapQuery, getMapSearchUrl } from "../lib/maps";
import { ALL_REGIONS_OPTION, UZBEKISTAN_REGIONS } from "../lib/regions";
import { getBookingRulesMessage } from "../lib/schedule";

const features = [
  {
    icon: <CalendarIcon />,
    title: "Smart bronlash",
    text: "30 soniyalik oqim bilan qabul vaqti tanlanadi, status esa real vaqtda yangilanadi.",
  },
  {
    icon: <ShieldIcon />,
    title: "Xavfsiz profil",
    text: "Profil, tarix va review ma'lumotlari Firestore bilan barqaror saqlanadi.",
  },
  {
    icon: <ChartIcon />,
    title: "Premium tahlil",
    text: "Doktorlar, rating va bo'sh slotlar foydalanuvchi uchun tez qaror beradigan formatda ko'rsatiladi.",
  },
];

const serviceSuites = [
  {
    title: "Ekspress chek-ap",
    text: "Band foydalanuvchilar uchun tezkor premium diagnostika va bitta oqimdagi koordinatsiya.",
    meta: "90 daqiqalik to'liq chek-up",
  },
  {
    title: "Oilaviy sog'liq rejasi",
    text: "Oila a'zolari uchun yagona kabinet, qayta bronlash va monitoring tizimi.",
    meta: "5 tagacha profil",
  },
  {
    title: "Jarrohlik yo'nalishi",
    text: "Konsultatsiya, operatsiya oldi tayyorgarlik va keyingi kuzatuv bitta panelda.",
    meta: "Koordinator yordami",
  },
  {
    title: "Uzluksiz parvarish",
    text: "Qabuldan keyingi tavsiyalar, rating va reviewlar orqali xizmat sifati oshiriladi.",
    meta: "30 kunlik kuzatuv",
  },
];

const steps = [
  {
    index: "01",
    title: "Mutaxassisni toping",
    text: "Yo'nalish, klinika, tajriba va reyting bo'yicha mos shifokorni tanlang.",
  },
  {
    index: "02",
    title: "Qulay vaqtni belgilang",
    text: "Faqat mavjud slotlar ko'rsatiladi, ikki kishi bir vaqtni olib qo'ya olmaydi.",
  },
  {
    index: "03",
    title: "Qabulni boshqaring",
    text: "Status, tarix va yakuniy bahoni kabinet ichida bir joydan yuriting.",
  },
];

const testimonials = [
  {
    name: "Dilnoza Rahimova",
    role: "Bemor",
    quote: "Interfeys juda premium ko'rinadi. Telefonimda ham, kompyuterda ham aniq va tez ishladi.",
  },
  {
    name: "Azizbek Usmonov",
    role: "Oilaviy foydalanuvchi",
    quote: "Bir nechta bronlarni boshqarish osonlashdi, doktor baholari esa tanlashni tezlashtirdi.",
  },
];

const experiencePoints = [
  "Yopishqoq navbar, responsiv layout va premium glassmorphism ritmi",
  "User, admin va login oqimlari yagona light va dark tema bilan birlashtirilgan",
  "Desktop va mobil uchun toza spacing, kuchli kontrast va silliq navigatsiya",
];

const faqs = [
  {
    question: "Bronlash qachon ochiq bo'ladi?",
    answer: "Bronlash har kuni 09:00 dan 18:00 gacha ishlaydi, yakshanba kuni esa yopiq.",
  },
  {
    question: "Qaysi vaqtgacha slot tanlash mumkin?",
    answer: "Qabul slotlari 09:00 dan 17:30 gacha ko'rsatiladi va faqat admin belgilagan vaqtlar chiqadi.",
  },
  {
    question: "Reytingni kim beradi?",
    answer: "Doktor reytingini faqat qabuldan keyin foydalanuvchilar beradi, admin uni qo'lda o'zgartirmaydi.",
  },
];

const Home = () => {
  const { appointments, doctors } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState(ALL_REGIONS_OPTION);
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesSearch =
        `${doctor.name} ${doctor.specialty} ${doctor.bio}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = `${doctor.clinic} ${doctor.address} ${doctor.availability}`
        .toLowerCase()
        .includes(locationTerm.toLowerCase());
      const matchesRegion =
        regionFilter === ALL_REGIONS_OPTION || doctor.region === regionFilter;

      return matchesSearch && matchesLocation && matchesRegion;
    });
  }, [doctors, locationTerm, regionFilter, searchTerm]);

  const stats = useMemo(
    () => [
      { value: `${doctors.length}+`, label: "Faol shifokor" },
      { value: `${appointments.length}+`, label: "Yozilgan qabul" },
      {
        value: `${new Set(doctors.map((doctor) => doctor.clinic)).size}+`,
        label: "Premium klinika",
      },
      {
        value:
          doctors.length > 0
            ? `${(doctors.reduce((sum, doctor) => sum + doctor.rating, 0) / doctors.length).toFixed(1)}/5`
            : "0/5",
        label: "O'rtacha baho",
      },
    ],
    [appointments.length, doctors],
  );

  const highlightedDoctor = filteredDoctors[0] ?? doctors[0];
  const bookingRules = getBookingRulesMessage();

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="page-shell">
      <div className="site-orb site-orb-one" />
      <div className="site-orb site-orb-two" />

      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand" onClick={closeMenu}>
            <span className="brand-mark">
              <HeartPulseIcon />
            </span>
            <span>
              Med<span className="brand-accent">Elite</span>
            </span>
          </Link>

          <div className={`nav-cluster ${menuOpen ? "nav-cluster-open" : ""}`}>
            <nav className="nav-links">
              <a href="#advantages" onClick={closeMenu}>
                Afzalliklar
              </a>
              <a href="#specialists" onClick={closeMenu}>
                Shifokorlar
              </a>
              <a href="#journey" onClick={closeMenu}>
                Jarayon
              </a>
            </nav>

            <div className="nav-actions">
              <ThemeToggle compact />
              <Link to="/login" className="button button-ghost" onClick={closeMenu}>
                Kirish
              </Link>
              <Link to="/user" className="button button-primary" onClick={closeMenu}>
                Qabul olish
              </Link>
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

      <main>
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow-pill">
                <ShieldIcon />
                Premium digital klinika ekotizimi
              </div>

              <h1>
                Sog'liq xizmatini
                <span>premium tajribaga aylantiring</span>
              </h1>

              <p className="hero-text">
                MedElite real booking, aniq slotlar, xarita bilan tanlash va review tizimini
                bitta silliq premium platformada birlashtiradi.
              </p>

              <div className="hero-actions">
                <Link to="/user" className="button button-primary button-large">
                  Hozir bron qiling
                  <ArrowRightIcon />
                </Link>
                <Link to="/login" className="button button-secondary button-large">
                  Kabinetga kirish
                </Link>
              </div>

              <div className="hero-search glass-card">
                <div className="search-field">
                  <SearchIcon />
                  <div>
                    <span>Mutaxassislik</span>
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Kardiolog, terapevt, ortoped"
                      className="hero-search-input"
                    />
                  </div>
                </div>
                <div className="search-field">
                  <LocationIcon />
                  <div>
                    <span>Klinika yoki hudud</span>
                    <input
                      value={locationTerm}
                      onChange={(event) => setLocationTerm(event.target.value)}
                      placeholder="Toshkent, Chilonzor"
                      className="hero-search-input"
                    />
                  </div>
                </div>
                <a href="#specialists" className="button button-primary">
                  Izlash
                </a>
              </div>

              <div className="hero-inline-proof">
                <div>
                  <strong>98%</strong>
                  <span>shu kunning o'zida bron</span>
                </div>
                <div>
                  <strong>24/7</strong>
                  <span>operator va qo'llab-quvvatlash</span>
                </div>
                <div>
                  <strong>4.9/5</strong>
                  <span>real foydalanuvchi bahosi</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-panel glass-card">
                <div className="hero-panel-header">
                  <span className="badge badge-gold">
                    <SparkIcon />
                    Premium parvarish
                  </span>
                  <span className="status-dot">Faol</span>
                </div>

                <div className="hero-panel-grid">
                  <article className="metric-card">
                    <p>Bugungi ish vaqti</p>
                    <strong>09:00 - 18:00</strong>
                    <span>{bookingRules}</span>
                  </article>
                  <article className="metric-card metric-card-accent">
                    <p>Javob vaqti</p>
                    <strong>2.4 min</strong>
                    <span>Operator va AI yordam</span>
                  </article>
                </div>

                <div className="doctor-spotlight">
                  <div className="doctor-avatar">
                    <StethoscopeIcon />
                  </div>
                  <div className="doctor-spotlight-copy">
                    <h3>{highlightedDoctor?.name ?? "Mos shifokor"}</h3>
                    <p>
                      {highlightedDoctor
                        ? `${highlightedDoctor.specialty} | ${highlightedDoctor.clinic}`
                        : "Holatingizga mos shifokor, vaqt va klinika avtomatik tavsiya qilinadi."}
                    </p>
                    {highlightedDoctor && (
                      <div className="spotlight-tags">
                        <span className="doctor-region-tag">{highlightedDoctor.region}</span>
                        <span className="doctor-region-tag">{highlightedDoctor.price}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="schedule-strip">
                  <div>
                    <span>Bugungi slotlar</span>
                    <strong>09:00 - 17:30</strong>
                  </div>
                  <div>
                    <span>Reyting</span>
                    <strong>{highlightedDoctor ? highlightedDoctor.rating.toFixed(1) : "5.0"}</strong>
                  </div>
                  <div>
                    <span>Tezkor oqim</span>
                    <strong>Baho va tarix</strong>
                  </div>
                </div>

                <div className="care-ribbon">
                  <div>
                    <span>Foydalanuvchi oqimi</span>
                    <strong>Qidirish, bronlash, tasdiqlash va baholash</strong>
                  </div>
                  <span className="badge">Premium UX</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <div className="container stat-grid">
            {stats.map((stat) => (
              <article key={stat.label} className="stat-card">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
        </section>

        <section id="advantages" className="section-block">
          <div className="container">
            <div className="section-heading">
              <span className="section-chip">Afzalliklar</span>
              <h2>Desktop va mobile uchun premium ritm bilan qurilgan platforma</h2>
              <p>
                Har bir blok tez qaror, kuchli ishonch va silliq booking tajribasini berish uchun
                yangilandi.
              </p>
            </div>

            <div className="feature-grid">
              {features.map((feature) => (
                <article key={feature.title} className="feature-card glass-card">
                  <div className="icon-shell">{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="container">
            <div className="section-heading section-heading-inline">
              <div>
                <span className="section-chip">Xizmat paketlari</span>
                <h2>Turli foydalanuvchi ehtiyojlari uchun premium xizmat paketlari</h2>
              </div>
              <span className="badge badge-gold">
                <SparkIcon />
                Tanlangan oqimlar
              </span>
            </div>

            <div className="suite-grid">
              {serviceSuites.map((suite) => (
                <article key={suite.title} className="suite-card">
                  <span className="suite-meta">{suite.meta}</span>
                  <h3>{suite.title}</h3>
                  <p>{suite.text}</p>
                  <Link to="/user" className="suite-link">
                    Batafsil
                    <ArrowRightIcon />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="specialists" className="section-block section-contrast">
          <div className="container">
            <div className="section-heading section-heading-inline">
              <div>
                <span className="section-chip">Top mutaxassislar</span>
                <h2>Eng kuchli mutaxassislar, real reyting va premium klinik muhitda</h2>
              </div>
              <div className="section-actions-row">
                <label className="field section-filter">
                  <span>Viloyat</span>
                  <div className="field-box field-box-select">
                    <LocationIcon />
                    <select
                      value={regionFilter}
                      onChange={(event) => setRegionFilter(event.target.value)}
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

                <Link to="/user" className="button button-secondary">
                  Barchasini ko'rish
                </Link>
              </div>
            </div>

            <div className="doctor-grid">
              {filteredDoctors.slice(0, 6).map((doctor) => (
                <article key={doctor.id} className="doctor-card">
                  <div className="doctor-card-top">
                    <div className="doctor-card-avatar">
                      <StethoscopeIcon />
                    </div>
                    <span className="badge">
                      <StarIcon />
                      {doctor.rating.toFixed(1)}
                    </span>
                  </div>

                  <h3>{doctor.name}</h3>
                  <p>{doctor.specialty}</p>
                  <p>{doctor.bio}</p>
                  <span className="doctor-region-tag">{doctor.region}</span>

                  <div className="doctor-card-quickline">
                    <span>{doctor.price}</span>
                    <span>{doctor.availability}</span>
                  </div>

                  <div className="doctor-meta">
                    <span>{doctor.clinic}</span>
                    <span>{doctor.reviewCount} baho</span>
                  </div>

                  <div className="doctor-location-line">
                    <LocationIcon />
                    <span>{doctor.address}</span>
                  </div>

                  <div className="card-actions-stack">
                    <a
                      href={getMapSearchUrl(getDoctorMapQuery(doctor))}
                      target="_blank"
                      rel="noreferrer"
                      className="button button-secondary button-block"
                    >
                      Xaritada ko'rish
                      <ArrowRightIcon />
                    </a>
                    <Link to="/user" className="button button-primary button-block">
                      Qabulga yozilish
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {filteredDoctors.length === 0 && (
              <div className="empty-state">
                <h3>Mos shifokor topilmadi</h3>
                <p>Boshqa mutaxassislik yoki klinika nomi bilan qayta qidirib ko'ring.</p>
              </div>
            )}
          </div>
        </section>

        <section id="journey" className="section-block">
          <div className="container process-layout">
            <div className="section-heading">
              <span className="section-chip">Jarayon</span>
              <h2>Foydalanuvchi uchun soddalashtirilgan va ishonchli 3 bosqichli oqim</h2>
              <p>
                Booking, tarix va review bir xil tilda ishlaydi. Shu sabab foydalanuvchi tizimni
                oson tushunadi.
              </p>
            </div>

            <div className="process-list">
              {steps.map((step) => (
                <article key={step.index} className="process-card">
                  <span>{step.index}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="container experience-grid">
            <article className="experience-hero">
              <span className="section-chip">Premium parvarish</span>
              <h2>Ko'rinish chiroyli, oqim esa haqiqatan ishlaydigan premium tajriba</h2>
              <p>
                Bu yerda maqsad shunchaki dizayn emas. Har bir ekran userni tezroq booking,
                aniqroq tanlov va kuchliroq ishonchga olib keladi.
              </p>

              <div className="experience-metrics">
                <div>
                  <strong>12+</strong>
                  <span>Premium xizmat ssenariysi</span>
                </div>
                <div>
                  <strong>3x</strong>
                  <span>Tezroq navigatsiya oqimi</span>
                </div>
              </div>
            </article>

            <div className="experience-stack">
              {experiencePoints.map((point) => (
                <article key={point} className="experience-card">
                  <div className="icon-shell">
                    <CheckIcon />
                  </div>
                  <p>{point}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="container testimonial-layout">
            <div className="summary-panel glass-card">
              <div className="summary-panel-header">
                <div className="icon-shell">
                  <UserGroupIcon />
                </div>
                <div>
                  <h3>Foydalanuvchi qoniqishi</h3>
                  <p>Qoniqish darajasi real review tizimi orqali doimiy ravishda yangilanadi.</p>
                </div>
              </div>

              <div className="summary-checks">
                <div>
                  <CheckIcon />
                  <span>Tezkor ro'yxatdan o'tish</span>
                </div>
                <div>
                  <CheckIcon />
                  <span>SMS va kabinet ichidagi eslatma</span>
                </div>
                <div>
                  <CheckIcon />
                  <span>Qabuldan keyin rating va tarif qoldirish</span>
                </div>
              </div>
            </div>

            <div className="testimonial-grid">
              {testimonials.map((item) => (
                <article key={item.name} className="testimonial-card">
                  <div className="testimonial-stars">
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                  </div>
                  <p>"{item.quote}"</p>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="container">
            <div className="section-heading">
              <span className="section-chip">FAQ</span>
              <h2>Premium xizmat va booking qoidalari bo'yicha muhim savollar</h2>
            </div>

            <div className="faq-grid">
              {faqs.map((faq) => (
                <article key={faq.question} className="faq-card">
                  <h3>{faq.question}</h3>
                  <p>{faq.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container">
            <div className="cta-card">
              <div>
                <span className="section-chip">Boshlash</span>
                <h2>Yangi, kuchli va premium MedElite tajribasini ishga tushiring</h2>
                <p className="cta-note">
                  Dark va light mode, real booking va premium ko'rinish endi bir tizimda ishlaydi.
                </p>
              </div>
              <div className="cta-actions">
                <Link to="/user" className="button button-primary button-large">
                  Bronlash oynasi
                </Link>
                <Link to="/login" className="button button-secondary button-large">
                  Profilga kirish
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <Link to="/" className="brand brand-footer">
              <span className="brand-mark">
                <HeartPulseIcon />
              </span>
              <span>MedElite</span>
            </Link>
            <p>
              Premium tibbiy servis, zamonaviy UX va yuqori ishonchni bitta platformada
              birlashtiradi.
            </p>
          </div>

          <div>
            <h4>Platforma</h4>
            <a href="#advantages">Afzalliklar</a>
            <a href="#specialists">Shifokorlar</a>
            <a href="#journey">Jarayon</a>
          </div>

          <div>
            <h4>Yo'nalishlar</h4>
            <p>Kardiologiya</p>
            <p>Terapiya</p>
            <p>Ortopediya</p>
          </div>

          <div>
            <h4>Bog'lanish</h4>
            <p>+998 71 200 00 00</p>
            <p>Toshkent sh., Navoiy ko'chasi</p>
            <p>support@medelite.uz</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
