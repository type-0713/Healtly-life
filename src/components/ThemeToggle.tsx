import { MoonIcon, SunIcon } from "./PremiumIcons";
import { useAppContext } from "../context/AppContext";
import { useI18n } from "../context/I18nContext";

type ThemeToggleProps = {
  compact?: boolean;
};

const ThemeToggle = ({ compact = false }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useAppContext();
  const { language } = useI18n();
  const copy =
    language === "ru"
      ? {
          light: "Светлая тема",
          dark: "Тёмная тема",
          toLight: "Переключить на светлую тему",
          toDark: "Переключить на тёмную тему",
        }
      : language === "en"
        ? {
            light: "Light mode",
            dark: "Dark mode",
            toLight: "Switch to light mode",
            toDark: "Switch to dark mode",
          }
        : {
            light: "Yorug' rejim",
            dark: "Qorong'i rejim",
            toLight: "Yorug' rejimga o'tish",
            toDark: "Qorong'i rejimga o'tish",
          };

  return (
    <button
      type="button"
      className={`theme-toggle ${compact ? "theme-toggle-compact" : ""}`}
      onClick={toggleTheme}
      aria-label={theme === "dark" ? copy.toLight : copy.toDark}
    >
      <span className="theme-toggle-icon">
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </span>
      {!compact && <span>{theme === "dark" ? copy.light : copy.dark}</span>}
    </button>
  );
};

export default ThemeToggle;
