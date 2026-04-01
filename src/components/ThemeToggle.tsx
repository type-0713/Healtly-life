import { MoonIcon, SunIcon } from "./PremiumIcons";
import { useAppContext } from "../context/AppContext";

type ThemeToggleProps = {
  compact?: boolean;
};

const ThemeToggle = ({ compact = false }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useAppContext();

  return (
    <button
      type="button"
      className={`theme-toggle ${compact ? "theme-toggle-compact" : ""}`}
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Yorug' rejimga o'tish" : "Qorong'i rejimga o'tish"}
    >
      <span className="theme-toggle-icon">
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </span>
      {!compact && <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
};

export default ThemeToggle;
