import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AiChatWidget from "../components/AiChatWidget";
import EmergencyCallButton from "../components/EmergencyCallButton";
import LanguageSwitcher from "../components/LanguageSwitcher";
import Seo from "../components/Seo";
import ThemeToggle from "../components/ThemeToggle";
import {
  CloseIcon,
  HeartPulseIcon,
  MenuIcon,
} from "../components/PremiumIcons";
import { useI18n } from "../context/I18nContext";
import { aiAssistantCopy } from "../i18n/aiAssistantCopy";
import type { AiMode } from "../lib/aiCore";

const VALID_MODES: AiMode[] = ["symptoms", "doctor", "drugs", "risk", "imaging"];

const parseMode = (value: string | null): AiMode =>
  VALID_MODES.includes(value as AiMode) ? (value as AiMode) : "symptoms";

const AiAssistant = () => {
  const { language } = useI18n();
  const copy = aiAssistantCopy[language];
  const [searchParams] = useSearchParams();
  const initialMode = parseMode(searchParams.get("mode"));
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const navServices =
    language === "ru" ? "Услуги" : language === "en" ? "Services" : "Xizmatlar";
  const navBooking =
    language === "ru" ? "Запись" : language === "en" ? "Booking" : "Band qilish";
  const navGuide =
    language === "ru" ? "Справочник" : language === "en" ? "Health guide" : "Qo'llanma";

  return (
    <div className="page-shell ai-page-shell">
      <Seo title={copy.title} description={copy.description} path="/ai-assistant" />

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
              <Link to="/ai-assistant" onClick={closeMenu}>
                AI
              </Link>
              <Link to="/services" onClick={closeMenu}>
                {navServices}
              </Link>
              <Link to="/health-guide" onClick={closeMenu}>
                {navGuide}
              </Link>
              <Link to="/user" onClick={closeMenu}>
                {navBooking}
              </Link>
            </nav>
            <div className="nav-actions">
              <LanguageSwitcher compact />
              <ThemeToggle compact />
              <Link to="/" className="button button-ghost" onClick={closeMenu}>
                {copy.backHome}
              </Link>
            </div>
          </div>

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={menuOpen ? "Close" : "Open"}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </header>

      <main className="ai-main container">
        <section className="ai-chat-panel glass-card">
          <AiChatWidget initialMode={initialMode} showModeSelector />
        </section>
      </main>

      <EmergencyCallButton />
    </div>
  );
};

export default AiAssistant;
