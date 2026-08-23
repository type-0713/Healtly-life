import { useState } from "react";
import { useI18n } from "../context/I18nContext";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
import {
  ActivityIcon,
  CheckCircleIcon,
  HeartPulseIcon,
  SparkIcon,
} from "../components/PremiumIcons";

const HealthCalculators = () => {
  const { language } = useI18n();

  // BMI State
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(70);

  // Water Intake State
  const [waterWeightKg, setWaterWeightKg] = useState<number>(70);
  const [activityMinutes, setActivityMinutes] = useState<number>(30);

  // BMI Calculation
  const bmiValue = heightCm > 0 ? Number((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1)) : 0;
  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { category: "Vazn yetishmovchiligi (Underweight)", color: "#3b82f6" };
    if (val <= 24.9) return { category: "Me'yorda (Normal Weight)", color: "#10b981" };
    if (val <= 29.9) return { category: "Ortiqcha vazn (Overweight)", color: "#f59e0b" };
    return { category: "Semizlik (Obesity)", color: "#ef4444" };
  };

  // Water Calculation (35ml per kg + 15ml per 30min activity)
  const waterLiters = Number(((waterWeightKg * 0.035) + (activityMinutes / 30) * 0.35).toFixed(1));

  const copy = {
    uz: {
      title: "Interaktiv Tibbiy va Salomatlik Kalkulyatorlari",
      subtitle: "BMI vazn indeksi, kunlik me'yoriy suv miqdori va salomatlik ko'rsatkichlarini tezkor hisoblash",
      bmiTitle: "BMI (Tana Massasi Indeksi) Kalkulyatori",
      height: "Boyingiz (cm):",
      weight: "Vazningiz (kg):",
      bmiResult: "Sizning BMI ko'rsatkichingiz:",
      waterTitle: "Kunlik Suv Ehtiyoji Kalkulyatori",
      waterWeight: "Vazningiz (kg):",
      activity: "Kunlik jismoniy harakat (daqiqa):",
      waterResult: "Tavsiya etiladigan kunlik suv miqdori:",
      liters: "Litr / kuniga",
      backHome: "Bosh sahifaga qaytish",
    },
    ru: {
      title: "Интерактивные медицинские калькуляторы здоровья",
      subtitle: "Быстрый расчет ИМТ, суточной нормы воды и показателей организма",
      bmiTitle: "Калькулятор ИМТ (Индекс Массы Тела)",
      height: "Рост (см):",
      weight: "Вес (кг):",
      bmiResult: "Ваш показатель ИМТ:",
      waterTitle: "Калькулятор суточной нормы воды",
      waterWeight: "Вес (кг):",
      activity: "Активность в день (мин):",
      waterResult: "Рекомендуемый объем воды:",
      liters: "Литров / день",
      backHome: "На главную",
    },
    en: {
      title: "Interactive Health & Wellness Calculators",
      subtitle: "Instantly calculate Body Mass Index (BMI), daily water hydration needs & health metrics",
      bmiTitle: "BMI (Body Mass Index) Calculator",
      height: "Height (cm):",
      weight: "Weight (kg):",
      bmiResult: "Your Calculated BMI:",
      waterTitle: "Daily Water Intake Calculator",
      waterWeight: "Weight (kg):",
      activity: "Daily Exercise (minutes):",
      waterResult: "Recommended Daily Water:",
      liters: "Liters / day",
      backHome: "Back to Home",
    },
  }[language];

  const bmiCat = getBmiCategory(bmiValue);

  return (
    <div className="page-shell">
      <Seo title={`MedElite | ${copy.title}`} description={copy.subtitle} path="/calculators" />
      <div className="site-orb site-orb-one" />
      <div className="site-orb site-orb-two" />

      <Navbar brandSuffix="Calc" />

      <main className="container section-block">
        <div className="calc-hero glass-card">
          <span className="section-chip">
            <SparkIcon />
            {copy.title}
          </span>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>

        <div className="calculators-grid">
          {/* BMI Calculator Card */}
          <div className="calc-card glass-card">
            <div className="calc-card-head">
              <ActivityIcon />
              <h2>{copy.bmiTitle}</h2>
            </div>

            <div className="calc-inputs-stack">
              <label className="field">
                <span>{copy.height} ({heightCm} cm)</span>
                <input
                  type="range"
                  min="120"
                  max="220"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="calc-range-slider"
                />
              </label>

              <label className="field">
                <span>{copy.weight} ({weightKg} kg)</span>
                <input
                  type="range"
                  min="30"
                  max="160"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="calc-range-slider"
                />
              </label>
            </div>

            <div className="calc-result-box" style={{ borderColor: bmiCat.color }}>
              <span>{copy.bmiResult}</span>
              <strong style={{ color: bmiCat.color }}>{bmiValue}</strong>
              <span className="bmi-cat-label" style={{ color: bmiCat.color }}>
                {bmiCat.category}
              </span>
            </div>
          </div>

          {/* Water Intake Calculator Card */}
          <div className="calc-card glass-card">
            <div className="calc-card-head">
              <HeartPulseIcon />
              <h2>{copy.waterTitle}</h2>
            </div>

            <div className="calc-inputs-stack">
              <label className="field">
                <span>{copy.waterWeight} ({waterWeightKg} kg)</span>
                <input
                  type="range"
                  min="30"
                  max="150"
                  value={waterWeightKg}
                  onChange={(e) => setWaterWeightKg(Number(e.target.value))}
                  className="calc-range-slider"
                />
              </label>

              <label className="field">
                <span>{copy.activity} ({activityMinutes} min)</span>
                <input
                  type="range"
                  min="0"
                  max="180"
                  step="15"
                  value={activityMinutes}
                  onChange={(e) => setActivityMinutes(Number(e.target.value))}
                  className="calc-range-slider"
                />
              </label>
            </div>

            <div className="calc-result-box">
              <span>{copy.waterResult}</span>
              <strong className="water-value-text">{waterLiters} {copy.liters}</strong>
              <span className="water-tip">
                <CheckCircleIcon /> Har 2 soatda 1 stakan toza suv ichish tavsiya etiladi.
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HealthCalculators;
