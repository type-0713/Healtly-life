import { useI18n, type Language } from "../context/I18nContext";

const languageLabels: Record<Language, string> = {
  uz: "UZ",
  ru: "RU",
  en: "EN",
};

type LanguageSwitcherProps = {
  compact?: boolean;
};

const LanguageSwitcher = ({ compact = false }: LanguageSwitcherProps) => {
  const { language, setLanguage } = useI18n();

  return (
    <div className={`language-switch ${compact ? "language-switch-compact" : ""}`}>
      {(Object.keys(languageLabels) as Language[]).map((item) => (
        <button
          key={item}
          type="button"
          className={`language-pill ${language === item ? "language-pill-active" : ""}`}
          onClick={() => setLanguage(item)}
          aria-label={`Switch language to ${item.toUpperCase()}`}
        >
          {languageLabels[item]}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
