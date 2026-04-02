import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
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
import { useI18n } from "../context/I18nContext";
import { homeCopy } from "../i18n/homeCopy";
import { getDoctorMapQuery, getMapSearchUrl } from "../lib/maps";
import { ALL_REGIONS_OPTION, UZBEKISTAN_REGIONS } from "../lib/regions";
import { getBookingRulesMessage } from "../lib/schedule";

const Home = () => {
  const { language, format, translateRegion, translateSpecialty } = useI18n();
  const copy = homeCopy[language];
  const { appointments, doctors } = useAppContext();
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

  const serviceSuites = useMemo(
    () => copy.suites.map(([meta, title, text]: [string, string, string]) => ({ meta, title, text })),
    [copy.suites],
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

  const closeMenu = () => setMenuOpen(false);
  const menuLabel = menuOpen ? copy.closeMenu : copy.openMenu;
  const highlightedDoctorAvailability = highlightedDoctor?.availableSlots[0]
    ? format(copy.nextSlot, { time: highlightedDoctor.availableSlots[0] })
    : copy.noOpenSlots;

  const getDoctorAvailability = (doctor: (typeof doctors)[number]) =>
    doctor.availableSlots[0] ? format(copy.nextSlot, { time: doctor.availableSlots[0] }) : copy.noOpenSlots;

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
                <Link to="/user" className="button button-primary button-large">
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
              <div className="hero-panel glass-card">
                <div className="hero-panel-header">
                  <span className="badge badge-gold">
                    <SparkIcon />
                    {copy.care}
                  </span>
                  <span className="status-dot">{copy.statusActive}</span>
                </div>

                <div className="hero-panel-grid">
                  <article className="metric-card">
                    <p>{copy.workingHours}</p>
                    <strong>09:00 - 18:00</strong>
                    <span>{bookingRules}</span>
                  </article>
                  <article className="metric-card metric-card-accent">
                    <p>{copy.responseTime}</p>
                    <strong>2.4 min</strong>
                    <span>{copy.responseMeta}</span>
                  </article>
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
                    <span>{copy.flow}</span>
                    <strong>{copy.history}</strong>
                  </div>
                </div>

                <div className="care-ribbon">
                  <div>
                    <span>{copy.userFlow}</span>
                    <strong>{copy.userFlowText}</strong>
                  </div>
                  <span className="badge">{copy.premiumUx}</span>
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

        <section className="section-block">
          <div className="container">
            <div className="section-heading section-heading-inline">
              <div>
                <span className="section-chip">{copy.suitesChip}</span>
                <h2>{copy.suitesTitle}</h2>
              </div>
              <span className="badge badge-gold">
                <SparkIcon />
                {copy.suitesBadge}
              </span>
            </div>

            <div className="suite-grid">
              {serviceSuites.map((suite: { meta: string; title: string; text: string }) => (
                <article key={suite.title} className="suite-card">
                  <span className="suite-meta">{suite.meta}</span>
                  <h3>{suite.title}</h3>
                  <p>{suite.text}</p>
                  <Link to="/user" className="suite-link">
                    {copy.details}
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

                  <h3>{doctor.name}</h3>
                  <p>{translateSpecialty(doctor.specialty)}</p>
                  <p>{doctor.bio}</p>
                  <span className="doctor-region-tag">{translateRegion(doctor.region)}</span>

                  <div className="doctor-card-quickline">
                    <span>{doctor.price}</span>
                    <span>{getDoctorAvailability(doctor)}</span>
                  </div>

                  <div className="doctor-meta">
                    <span>{doctor.clinic}</span>
                    <span>{format(copy.reviews, { count: doctor.reviewCount })}</span>
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
                    <Link to="/user" className="button button-primary button-block">
                      {copy.bookVisit}
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
            <div className="section-heading">
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

        <section className="section-block">
          <div className="container experience-grid">
            <article className="experience-hero">
              <span className="section-chip">{copy.expChip}</span>
              <h2>{copy.expTitle}</h2>
              <p>{copy.expText}</p>

              <div className="experience-metrics">
                <div>
                  <strong>12+</strong>
                  <span>{copy.expMetric1}</span>
                </div>
                <div>
                  <strong>3x</strong>
                  <span>{copy.expMetric2}</span>
                </div>
              </div>
            </article>

            <div className="experience-stack">
              {copy.expPoints.map((point: string) => (
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
                  <h3>{copy.satisfaction}</h3>
                  <p>{copy.satisfactionText}</p>
                </div>
              </div>

              <div className="summary-checks">
                {copy.satisfactionChecks.map((item: string) => (
                  <div key={item}>
                    <CheckIcon />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
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
            <div className="section-heading">
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
