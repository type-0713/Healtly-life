import { PhoneIcon } from "./PremiumIcons";
import { useI18n } from "../context/I18nContext";

const emergencyCopy = {
  uz: {
    label: "SOS",
    hint: "Tez yordam 103",
    aria: "Tez yordamga 103 raqamiga qo'ng'iroq qilish",
  },
  ru: {
    label: "SOS",
    hint: "Скорая 103",
    aria: "Позвонить в скорую помощь по номеру 103",
  },
  en: {
    label: "SOS",
    hint: "Emergency 103",
    aria: "Call emergency service 103",
  },
} as const;

const EmergencyCallButton = () => {
  const { language } = useI18n();
  const copy = emergencyCopy[language];

  return (
    <a href="tel:103" className="emergency-fab" aria-label={copy.aria} title={copy.hint}>
      <span className="emergency-fab-pulse" />
      <span className="emergency-fab-core">
        <PhoneIcon />
        <strong>{copy.label}</strong>
      </span>
      <span className="emergency-fab-text">{copy.hint}</span>
    </a>
  );
};

export default EmergencyCallButton;
