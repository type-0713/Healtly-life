import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useI18n } from "../context/I18nContext";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import { CloseIcon, HeartPulseIcon, MenuIcon } from "./PremiumIcons";

interface NavbarProps {
  brandSuffix?: string;
  className?: string;
}

const Navbar = ({ brandSuffix, className = "" }: NavbarProps) => {
  const {
    isUserAuthenticated,
    isDoctorAuthenticated,
    isAdminAuthenticated,
    isPharmacyAuthenticated,
    isHospitalAuthenticated,
    accountRole,
    signOutUser,
  } = useAppContext();
  const { language } = useI18n();
  const location = useLocation();
  const [openLocationKey, setOpenLocationKey] = useState<string | null>(null);
  const menuOpen = openLocationKey === location.key;

  const isAuthenticated =
    isUserAuthenticated ||
    isDoctorAuthenticated ||
    isAdminAuthenticated ||
    isPharmacyAuthenticated ||
    isHospitalAuthenticated;

  const closeMenu = () => setOpenLocationKey(null);

  // Close menu on Escape key
  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const getDashboardPath = () => {
    switch (accountRole) {
      case "doctor":
        return "/doctor";
      case "admin":
        return "/admin";
      case "pharmacy":
        return "/pharmacy-dashboard";
      case "hospital":
        return "/hospital-dashboard";
      case "user":
      default:
        return "/user";
    }
  };

  const navLabels = {
    ai: "AI",
    chat: "Chat",
    emr: "EMR",
    bodyMap: language === "ru" ? "Карта тела" : language === "en" ? "Body Map" : "Tana Xaritasi",
    telemedicine: language === "ru" ? "Телемедицина" : language === "en" ? "Telemedicine" : "Telemeditsina",
    calculators: language === "ru" ? "Калькулятор" : language === "en" ? "Calculators" : "Kalkulyator",
    pharmacy: language === "ru" ? "Аптека" : language === "en" ? "Pharmacy" : "Dorixona",
    emergency: language === "ru" ? "103 Yordam" : language === "en" ? "103 Emergency" : "103 Yordam",
    dashboard: language === "ru" ? "Кабинет" : language === "en" ? "Dashboard" : "Kabinet",
    logout: language === "ru" ? "Выйти" : language === "en" ? "Logout" : "Chiqish",
    login: language === "ru" ? "Войти" : language === "en" ? "Sign In" : "Kirish",
    book: language === "ru" ? "Запись" : language === "en" ? "Book" : "Band qilish",
  };

  const handleSignOut = async () => {
    closeMenu();
    try {
      await signOutUser();
    } catch {
      // Ignored
    }
  };

  return (
    <header className={`topbar ${className}`.trim()}>
      <div className="container topbar-inner">
        <Link to="/" className="brand" onClick={closeMenu}>
          <span className="brand-mark">
            <HeartPulseIcon />
          </span>
          <span>
            Med<span className="brand-accent">Elite</span>
            {brandSuffix ? <span className="brand-suffix"> {brandSuffix}</span> : null}
          </span>
        </Link>

        {/* Mobile menu backdrop */}
        {menuOpen && (
          <div
            className="nav-cluster-backdrop nav-cluster-backdrop-open"
            onClick={closeMenu}
            aria-hidden="true"
          />
        )}

        <div className={`nav-cluster ${menuOpen ? "nav-cluster-open" : ""}`}>
          <nav className="nav-links">
            <Link
              to="/ai-assistant"
              className={location.pathname === "/ai-assistant" ? "active" : ""}
              onClick={closeMenu}
            >
              {navLabels.ai}
            </Link>
            <Link
              to="/chat"
              className={location.pathname === "/chat" ? "active" : ""}
              onClick={closeMenu}
            >
              {navLabels.chat}
            </Link>
            <Link
              to="/medical-records"
              className={location.pathname === "/medical-records" ? "active" : ""}
              onClick={closeMenu}
            >
              {navLabels.emr}
            </Link>
            <Link
              to="/body-map"
              className={location.pathname === "/body-map" ? "active" : ""}
              onClick={closeMenu}
            >
              {navLabels.bodyMap}
            </Link>
            <Link
              to="/telemedicine"
              className={location.pathname === "/telemedicine" ? "active" : ""}
              onClick={closeMenu}
            >
              {navLabels.telemedicine}
            </Link>
            <Link
              to="/calculators"
              className={location.pathname === "/calculators" ? "active" : ""}
              onClick={closeMenu}
            >
              {navLabels.calculators}
            </Link>
            <Link
              to="/pharmacy"
              className={location.pathname === "/pharmacy" ? "active" : ""}
              onClick={closeMenu}
            >
              {navLabels.pharmacy}
            </Link>
            <Link
              to="/emergency"
              className={`nav-link-emergency ${location.pathname === "/emergency" ? "active" : ""}`}
              onClick={closeMenu}
            >
              {navLabels.emergency}
            </Link>
          </nav>

          <div className="nav-actions">
            <div className="nav-actions-controls">
              <LanguageSwitcher compact />
              <ThemeToggle compact />
            </div>

            <div className="nav-actions-buttons">
              {isAuthenticated ? (
                <>
                  {location.pathname !== getDashboardPath() && (
                    <Link to={getDashboardPath()} className="button button-primary" onClick={closeMenu}>
                      {navLabels.dashboard}
                    </Link>
                  )}
                  <button type="button" className="button button-ghost" onClick={handleSignOut}>
                    {navLabels.logout}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="button button-ghost" onClick={closeMenu}>
                    {navLabels.login}
                  </Link>
                  <Link to="/user" className="button button-primary" onClick={closeMenu}>
                    {navLabels.book}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setOpenLocationKey((current) => (current === location.key ? null : location.key))}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
