import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import Seo, { SITE_URL } from "../components/Seo";
import ThemeToggle from "../components/ThemeToggle";
import EmergencyCallButton from "../components/EmergencyCallButton";
import {
  ArrowRightIcon,
  CalendarIcon,
  ChartIcon,
  CloseIcon,
  HeartPulseIcon,
  LocationIcon,
  MenuIcon,
  SearchIcon,
  ShieldIcon,
  SparkIcon,
  StarIcon,
  StethoscopeIcon,
} from "../components/PremiumIcons";
import { useAppContext } from "../context/AppContext";
import { useI18n } from "../context/I18nContext";
import { homeCopy } from "../i18n/homeCopy";
import { getDoctorMapQuery, getMapSearchUrl } from "../lib/maps";
import { ALL_REGIONS_OPTION, UZBEKISTAN_REGIONS } from "../lib/regions";
import { findNearestAvailableDoctorSlot, getBookingRulesMessage, getTodayInTashkent } from "../lib/schedule";

const Home = () => {
  const { language, format, translateRegion, translateSpecialty } = useI18n();
  const copy = homeCopy[language];
  const navigate = useNavigate();
  const { appointments, doctors, isAdminAuthenticated, isDoctorAuthenticated, isUserAuthenticated } =
    useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState(ALL_REGIONS_OPTION);
  const [menuOpen, setMenuOpen] = useState(false);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const deferredLocationTerm = useDeferredValue(locationTerm);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesSearch =
        `${doctor.name} ${doctor.specialty} ${doctor.bio}`
          .toLowerCase()
          .includes(deferredSearchTerm.toLowerCase());
      const matchesLocation =
        `${doctor.clinic} ${doctor.address} ${doctor.availability}`
          .toLowerCase()
          .includes(deferredLocationTerm.toLowerCase());
      const matchesRegion = regionFilter === ALL_REGIONS_OPTION || doctor.region === regionFilter;

      return matchesSearch && matchesLocation && matchesRegion;
    });
  }, [deferredLocationTerm, deferredSearchTerm, doctors, regionFilter]);

  const stats = useMemo(
    () => [
      { value: `${doctors.length}+`, label: copy.stats[0] },
      { value: `${appointments.length}+`, label: copy.stats[1] },
      {
        value: `${new Set(doctors.map((doctor) => doctor.clinic)).size}+`,
        label: copy.stats[2],
      },
      {
        value:
          doctors.length > 0
            ? `${(doctors.reduce((sum, doctor) => sum + doctor.rating, 0) / doctors.length).toFixed(1)}/5`
            : "0/5",
        label: copy.stats[3],
      },
    ],
    [appointments.length, copy.stats, doctors],
  );

  const highlightedDoctor = filteredDoctors[0] ?? doctors[0];
  const bookingRules = getBookingRulesMessage(language);

  const features = useMemo(
    () =>
      copy.features.map(([title, text]: [string, string], index: number) => ({
        icon: [<CalendarIcon key="calendar" />, <ShieldIcon key="shield" />, <ChartIcon key="chart" />][index],
        title,
        text,
      })),
    [copy.features],
  );

  const steps = useMemo(
    () => copy.steps.map(([index, title, text]: [string, string, string]) => ({ index, title, text })),
    [copy.steps],
  );

  const testimonials = useMemo(
    () => copy.testimonials.map(([name, role, quote]: [string, string, string]) => ({ name, role, quote })),
    [copy.testimonials],
  );

  const faqs = useMemo(
    () => copy.faqs.map(([question, answer]: [string, string]) => ({ question, answer })),
    [copy.faqs],
  );

  const seoTitle =
    language === "ru"
      ? "MedElite | Онлайн запись к врачу"
      : language === "en"
        ? "MedElite | Online doctor booking"
        : "MedElite | Shifokor qabuliga online yozilish";
  const seoDescription =
    language === "ru"
      ? "Найдите врача, посмотрите свободное время и запишитесь на прием через MedElite."
      : language === "en"
        ? "Find a doctor, check open slots, and book your appointment online with MedElite."
        : "MedElite orqali shifokor toping, bo'sh vaqtlarni ko'ring va qabulga online yoziling.";
  const seoKeywords =
    language === "ru"
      ? "MedElite, запись к врачу, клиника, врач, онлайн прием, медицинская платформа"
      : language === "en"
        ? "MedElite, doctor booking, clinic, online appointment, healthcare platform"
        : "MedElite, shifokor qabuliga yozilish, online doktor bron qilish, klinika, tibbiy xizmat, O'zbekiston";

  const structuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "MedicalOrganization",
          "@id": `${SITE_URL}/#organization`,
          name: "MedElite",
          url: `${SITE_URL}/`,
          logo: `${SITE_URL}/medelite-favicon.svg`,
          image: `${SITE_URL}/medelite-favicon.svg`,
          description: seoDescription,
          areaServed: {
            "@type": "Country",
            name: "Uzbekistan",
          },
          availableLanguage: ["uz", "ru", "en"],
        },
        {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          url: `${SITE_URL}/`,
          name: "MedElite",
          description: seoDescription,
          inLanguage: language,
          publisher: {
            "@id": `${SITE_URL}/#organization`,
          },
        },
        {
          "@type": "FAQPage",
          "@id": `${SITE_URL}/#faq`,
          mainEntity: faqs.map((faq: { question: string; answer: string }) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        },
      ],
    }),
    [faqs, language, seoDescription],
  );

  const closeMenu = () => setMenuOpen(false);
  const menuLabel = menuOpen ? copy.closeMenu : copy.openMenu;
  const formatDoctorSlotLabel = (date: string, time: string) =>
    date === getTodayInTashkent() ? time : `${date} | ${time}`;
  const buildDoctorBookingTarget = (doctor: (typeof doctors)[number] | undefined) => {
    if (!doctor) {
      return "/user";
    }

    const nearestSlot = findNearestAvailableDoctorSlot(doctor, appointments);

    if (!nearestSlot) {
      return `/user?doctor=${encodeURIComponent(doctor.id)}`;
    }

    const params = new URLSearchParams({
      doctor: doctor.id,
      date: nearestSlot.date,
      time: nearestSlot.time,
    });

    return `/user?${params.toString()}`;
  };

  const highlightedDoctorSlot = highlightedDoctor
    ? findNearestAvailableDoctorSlot(highlightedDoctor, appointments)
    : null;
  const highlightedDoctorAvailability = highlightedDoctorSlot
    ? format(copy.nextSlot, { time: formatDoctorSlotLabel(highlightedDoctorSlot.date, highlightedDoctorSlot.time) })
    : copy.noOpenSlots;
  const highlightedDoctorMapUrl = highlightedDoctor
    ? getMapSearchUrl(getDoctorMapQuery(highlightedDoctor))
    : getMapSearchUrl(getDoctorMapQuery({}));
  const heroGuideTitle =
    language === "ru" ? "Как это работает" : language === "en" ? "How it works" : "Qanday ishlaydi";
  const heroGuideText =
    language === "ru"
      ? "Выберите врача, отметьте удобное время и отправьте запись за пару шагов."
      : language === "en"
        ? "Choose a doctor, pick a time, and send your booking in a few easy steps."
        : "Shifokorni tanlang, qulay vaqtni belgilang va bir necha qadamda bron qiling.";
  const heroGuideNote =
    language === "ru"
      ? "Статус записи и история всегда доступны в кабинете."
      : language === "en"
        ? "Your booking status and history stay available in your account."
        : "Qabul holati va tarix kabinet ichida har doim ko'rinadi.";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (isAdminAuthenticated) {
      navigate("/admin");
      return;
    }

    if (isDoctorAuthenticated) {
      navigate("/doctor");
      return;
    }

    if (isUserAuthenticated) {
      navigate("/user");
    }
  }, [isAdminAuthenticated, isDoctorAuthenticated, isUserAuthenticated, navigate]);

  const getDoctorAvailability = (doctor: (typeof doctors)[number]) => {
    const nearestSlot = findNearestAvailableDoctorSlot(doctor, appointments);

    return nearestSlot
      ? format(copy.nextSlot, { time: formatDoctorSlotLabel(nearestSlot.date, nearestSlot.time) })
      : copy.noOpenSlots;
  };

  return (
    <div className="page-shell">
      <Seo
        title={seoTitle}
        description={seoDescription}
        path="/"
        keywords={seoKeywords}
        structuredData={structuredData}
      />
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
                {copy.nav[0]}
              </a>
              <a href="#specialists" onClick={closeMenu}>
                {copy.nav[1]}
              </a>
              <a href="#journey" onClick={closeMenu}>
                {copy.nav[2]}
              </a>
            </nav>

            <div className="nav-actions">
              <LanguageSwitcher compact />
              <ThemeToggle compact />
              <Link to="/login" className="button button-ghost" onClick={closeMenu}>
                {copy.enterAccount}
              </Link>
              <Link to="/user" className="button button-primary" onClick={closeMenu}>
                {copy.bookNow}
              </Link>
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

      <main>
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow-pill">
                <ShieldIcon />
                {copy.heroChip}
              </div>

              <h1>
                {copy.heroTitle}
                <span>{copy.heroAccent}</span>
              </h1>

              <p className="hero-text">{copy.heroText}</p>

              <div className="hero-actions">
                <Link to={buildDoctorBookingTarget(highlightedDoctor)} className="button button-primary button-large">
                  {copy.bookNow}
                  <ArrowRightIcon />
                </Link>
                <Link to="/login" className="button button-secondary button-large">
                  {copy.enterAccount}
                </Link>
              </div>

              <div className="hero-search glass-card">
                <div className="search-field">
                  <SearchIcon />
                  <div>
                    <span>{copy.specialty}</span>
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder={copy.specialtyPlaceholder}
                      className="hero-search-input"
                    />
                  </div>
                </div>
                <div className="search-field">
                  <LocationIcon />
                  <div>
                    <span>{copy.location}</span>
                    <input
                      value={locationTerm}
                      onChange={(event) => setLocationTerm(event.target.value)}
                      placeholder={copy.locationPlaceholder}
                      className="hero-search-input"
                    />
                  </div>
                </div>
                <a href="#specialists" className="button button-primary">
                  {copy.search}
                </a>
              </div>

              <div className="hero-inline-proof">
                <div>
                  <strong>98%</strong>
                  <span>{copy.quick[0]}</span>
                </div>
                <div>
                  <strong>24/7</strong>
                  <span>{copy.quick[1]}</span>
                </div>
                <div>
                  <strong>4.9/5</strong>
                  <span>{copy.quick[2]}</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-panel glass-card hero-panel-simple">
                <div className="hero-panel-header">
                  <span className="badge badge-gold">
                    <SparkIcon />
                    {copy.care}
                  </span>
                  <span className="status-dot">{copy.statusActive}</span>
                </div>

                <div className="hero-guide-copy">
                  <h3>{heroGuideTitle}</h3>
                  <p>{heroGuideText}</p>
                </div>

                <div className="hero-guide-grid">
                  {steps.map((step: { index: string; title: string; text: string }) => (
                    <article key={step.index} className="hero-guide-card">
                      <span className="hero-guide-step">{step.index}</span>
                      <strong>{step.title}</strong>
                      <p>{step.text}</p>
                    </article>
                  ))}
                </div>

                <div className="doctor-spotlight">
                  <div className="doctor-avatar">
                    <StethoscopeIcon />
                  </div>
                  <div className="doctor-spotlight-copy">
                    <h3>{highlightedDoctor?.name ?? copy.fallbackDoctor}</h3>
                    <p>
                      {highlightedDoctor
                        ? `${translateSpecialty(highlightedDoctor.specialty)} | ${highlightedDoctor.clinic}`
                        : copy.fallbackDoctorText}
                    </p>
                    {highlightedDoctor && (
                      <div className="spotlight-tags">
                        <span className="doctor-region-tag">{translateRegion(highlightedDoctor.region)}</span>
                        <span className="doctor-region-tag">{highlightedDoctor.price}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="schedule-strip">
                  <div>
                    <span>{copy.todaySlots}</span>
                    <strong>{highlightedDoctorAvailability}</strong>
                  </div>
                  <div>
                    <span>{copy.rating}</span>
                    <strong>{highlightedDoctor ? highlightedDoctor.rating.toFixed(1) : "5.0"}</strong>
                  </div>
                  <div>
                    <span>{copy.responseTime}</span>
                    <strong>0/22/30 min</strong>
                  </div>
                </div>

                <p className="hero-guide-note">
                  {heroGuideNote}
                  {" "}
                  {bookingRules}
                </p>

                <div className="hero-guide-actions">
                  <a href={highlightedDoctorMapUrl} target="_blank" rel="noreferrer" className="button button-secondary button-block">
                    {copy.viewMap}
                    <ArrowRightIcon />
                  </a>
                  <Link to={buildDoctorBookingTarget(highlightedDoctor)} className="button button-primary button-block">
                    {copy.bookVisit}
                    <ArrowRightIcon />
                  </Link>
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
            <div className="section-heading section-heading-compact">
              <span className="section-chip">{copy.advantagesChip}</span>
              <h2>{copy.advantagesTitle}</h2>
              <p>{copy.advantagesText}</p>
            </div>

            <div className="feature-grid">
              {features.map((feature: { icon: ReactNode; title: string; text: string }) => (
                <article key={feature.title} className="feature-card glass-card">
                  <div className="icon-shell">{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="specialists" className="section-block section-contrast">
          <div className="container">
            <div className="section-heading section-heading-inline">
              <div>
                <span className="section-chip">{copy.doctorsChip}</span>
                <h2>{copy.doctorsTitle}</h2>
              </div>
              <div className="section-actions-row">
                <label className="field section-filter">
                  <span>{copy.region}</span>
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

                <Link to="/user" className="button button-secondary">
                  {copy.viewAll}
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

                  <div className="doctor-card-copy">
                    <h3>{doctor.name}</h3>
                    <p className="doctor-specialty-text">{translateSpecialty(doctor.specialty)}</p>
                    <p className="doctor-clinic-text">{doctor.clinic}</p>
                    <p className="doctor-bio-text">{doctor.bio}</p>
                  </div>

                  <div className="doctor-card-tags">
                    <span className="doctor-region-tag">{translateRegion(doctor.region)}</span>
                  </div>

                  <div className="doctor-card-quickline">
                    <span>{doctor.price}</span>
                    <Link to={buildDoctorBookingTarget(doctor)} className="doctor-slot-link">
                      {getDoctorAvailability(doctor)}
                    </Link>
                  </div>

                  <div className="doctor-meta">
                    <span>{format(copy.reviews, { count: doctor.reviewCount })}</span>
                    <span>{doctor.experience}</span>
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
                      {copy.viewMap}
                      <ArrowRightIcon />
                    </a>
                    <Link to={buildDoctorBookingTarget(doctor)} className="button button-primary button-block">
                      {copy.bookVisit}
                      <ArrowRightIcon />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {filteredDoctors.length === 0 && (
              <div className="empty-state">
                <h3>{copy.noDoctorsTitle}</h3>
                <p>{copy.noDoctorsText}</p>
              </div>
            )}
          </div>
        </section>

        <section id="journey" className="section-block">
          <div className="container process-layout">
            <div className="section-heading section-heading-compact">
              <span className="section-chip">{copy.journeyChip}</span>
              <h2>{copy.journeyTitle}</h2>
              <p>{copy.journeyText}</p>
            </div>

            <div className="process-list">
              {steps.map((step: { index: string; title: string; text: string }) => (
                <article key={step.index} className="process-card">
                  <span>{step.index}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-block testimonial-section">
          <div className="container">
            <div className="section-heading section-heading-compact">
              <span className="section-chip">{copy.satisfaction}</span>
              <h2>{copy.satisfaction}</h2>
              <p>{copy.satisfactionText}</p>
            </div>

            <div className="testimonial-grid">
              {testimonials.map((item: { name: string; role: string; quote: string }) => (
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
            <div className="section-heading section-heading-compact">
              <span className="section-chip">{copy.faqChip}</span>
              <h2>{copy.faqTitle}</h2>
            </div>

            <div className="faq-grid">
              {faqs.map((faq: { question: string; answer: string }) => (
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
                <span className="section-chip">{copy.startChip}</span>
                <h2>{copy.startTitle}</h2>
                <p className="cta-note">{copy.startText}</p>
              </div>
              <div className="cta-actions">
                <Link to="/user" className="button button-primary button-large">
                  {copy.bookingWindow}
                </Link>
                <Link to="/login" className="button button-secondary button-large">
                  {copy.profileEntry}
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
            <p>{copy.footerText}</p>
          </div>

          <div>
            <h4>{copy.platform}</h4>
            <a href="#advantages">{copy.nav[0]}</a>
            <a href="#specialists">{copy.nav[1]}</a>
            <a href="#journey">{copy.nav[2]}</a>
          </div>

          <div>
            <h4>{copy.directions}</h4>
            {copy.fields.map((field: string) => (
              <p key={field}>{field}</p>
            ))}
          </div>

          <div>
            <h4>{copy.contact}</h4>
            <p><a href="tel:+998978040728">+998978040728</a></p>
            <p>Buxoro viloyati</p>
            <p><a href="https://t.me/jasur_07282012" target="_blank" rel="noreferrer">Telegram</a></p>
          </div>
        </div>
      </footer>

      <EmergencyCallButton />
    </div>
  );
};

export default Home;
