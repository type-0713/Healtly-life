/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ALL_REGIONS_OPTION, UZBEKISTAN_REGIONS } from "../lib/regions";
import type { Appointment } from "./AppContext";

export type Language = "uz" | "ru" | "en";

type TranslationParams = Record<string, string | number>;

type I18nValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  format: (template: string, params?: TranslationParams) => string;
  translateStatus: (status: Appointment["status"]) => string;
  translateRegion: (region: string) => string;
  translateSpecialty: (specialty: string) => string;
  translateError: (message: string) => string;
};

const LANGUAGE_KEY = "medelite-language";

const statusLabels: Record<Language, Record<Appointment["status"], string>> = {
  uz: {
    Tasdiqlandi: "Tasdiqlandi",
    Kutilmoqda: "Kutilmoqda",
    Yakunlandi: "Yakunlandi",
    "Bekor qilindi": "Bekor qilindi",
  },
  ru: {
    Tasdiqlandi: "Подтверждено",
    Kutilmoqda: "Ожидает",
    Yakunlandi: "Завершено",
    "Bekor qilindi": "Отменено",
  },
  en: {
    Tasdiqlandi: "Confirmed",
    Kutilmoqda: "Pending",
    Yakunlandi: "Completed",
    "Bekor qilindi": "Cancelled",
  },
};

const regionLabels: Record<Language, Record<string, string>> = {
  uz: Object.fromEntries([
    [ALL_REGIONS_OPTION, ALL_REGIONS_OPTION],
    ...UZBEKISTAN_REGIONS.map((region) => [region, region]),
  ]),
  ru: {
    [ALL_REGIONS_OPTION]: "Все регионы",
    "Qoraqalpog'iston Respublikasi": "Республика Каракалпакстан",
    "Andijon viloyati": "Андижанская область",
    "Buxoro viloyati": "Бухарская область",
    "Farg'ona viloyati": "Ферганская область",
    "Jizzax viloyati": "Джизакская область",
    "Namangan viloyati": "Наманганская область",
    "Navoiy viloyati": "Навоийская область",
    "Qashqadaryo viloyati": "Кашкадарьинская область",
    "Samarqand viloyati": "Самаркандская область",
    "Sirdaryo viloyati": "Сырдарьинская область",
    "Surxondaryo viloyati": "Сурхандарьинская область",
    "Toshkent viloyati": "Ташкентская область",
    "Toshkent shahri": "Город Ташкент",
    "Xorazm viloyati": "Хорезмская область",
  },
  en: {
    [ALL_REGIONS_OPTION]: "All regions",
    "Qoraqalpog'iston Respublikasi": "Republic of Karakalpakstan",
    "Andijon viloyati": "Andijan Region",
    "Buxoro viloyati": "Bukhara Region",
    "Farg'ona viloyati": "Fergana Region",
    "Jizzax viloyati": "Jizzakh Region",
    "Namangan viloyati": "Namangan Region",
    "Navoiy viloyati": "Navoi Region",
    "Qashqadaryo viloyati": "Kashkadarya Region",
    "Samarqand viloyati": "Samarkand Region",
    "Sirdaryo viloyati": "Syrdarya Region",
    "Surxondaryo viloyati": "Surkhandarya Region",
    "Toshkent viloyati": "Tashkent Region",
    "Toshkent shahri": "Tashkent City",
    "Xorazm viloyati": "Khorezm Region",
  },
};

const specialtyLabels: Record<Language, Record<string, string>> = {
  uz: {},
  ru: {
    Kardiolog: "Кардиолог",
    Terapevt: "Терапевт",
    Ortoped: "Ортопед",
  },
  en: {
    Kardiolog: "Cardiologist",
    Terapevt: "Therapist",
    Ortoped: "Orthopedist",
  },
};

const knownErrors: Record<Language, Record<string, string>> = {
  uz: {},
  ru: {
    "Email va parolni to'liq kiriting.": "Введите email и пароль полностью.",
    "Admin login va parolini to'liq kiriting.": "Введите логин и пароль администратора полностью.",
    "Admin login yoki paroli noto'g'ri.": "Логин или пароль администратора неверный.",
    "Parollar bir xil emas.": "Пароли не совпадают.",
    "Yakshanba kuni bron qilib bo'lmaydi. Iltimos, boshqa sanani tanlang.": "Запись на воскресенье недоступна. Пожалуйста, выберите другую дату.",
    "O'tib ketgan sana uchun bron qilib bo'lmaydi.": "Нельзя оформить запись на прошедшую дату.",
    "Tanlangan vaqt ushbu shifokor uchun mavjud emas.": "Выбранное время недоступно для этого врача.",
    "Tanlangan vaqt allaqachon o'tib ketgan. Iltimos, boshqa slotni tanlang.": "Выбранное время уже прошло. Пожалуйста, выберите другой слот.",
    "Bu vaqt oralig'i allaqachon band qilingan.": "Этот временной слот уже занят.",
    "Qabul topilmadi.": "Приём не найден.",
    "Siz faqat o'zingizning qabulingizni boshqara olasiz.": "Вы можете управлять только своим приёмом.",
    "Siz faqat o'zingizning qabulingiz uchun baho bera olasiz.": "Вы можете оставить оценку только для своего приёма.",
    "Bu qabul uchun baho allaqachon yuborilgan.": "Оценка для этого приёма уже отправлена.",
    "Qabul vaqti hali kelmagan. Bahoni qabul tugagach yuborishingiz mumkin.": "Время приёма ещё не наступило. Оценку можно оставить после завершения приёма.",
    "Shifokor ma'lumoti topilmadi.": "Данные врача не найдены.",
    "Bekor qilingan qabulga baho berib bo'lmaydi.": "Нельзя оценить отменённый приём.",
    "Shifokor topilmadi.": "Врач не найден.",
    "Kirishda xatolik yuz berdi.": "Произошла ошибка при входе.",
  },
  en: {
    "Email va parolni to'liq kiriting.": "Please enter both email and password.",
    "Admin login va parolini to'liq kiriting.": "Please enter the full admin login and password.",
    "Admin login yoki paroli noto'g'ri.": "The admin login or password is incorrect.",
    "Parollar bir xil emas.": "Passwords do not match.",
    "Yakshanba kuni bron qilib bo'lmaydi. Iltimos, boshqa sanani tanlang.": "Booking is not available on Sunday. Please choose another date.",
    "O'tib ketgan sana uchun bron qilib bo'lmaydi.": "You cannot book a past date.",
    "Tanlangan vaqt ushbu shifokor uchun mavjud emas.": "The selected time is not available for this doctor.",
    "Tanlangan vaqt allaqachon o'tib ketgan. Iltimos, boshqa slotni tanlang.": "The selected time has already passed. Please choose another slot.",
    "Bu vaqt oralig'i allaqachon band qilingan.": "This time slot has already been booked.",
    "Qabul topilmadi.": "Appointment not found.",
    "Siz faqat o'zingizning qabulingizni boshqara olasiz.": "You can manage only your own appointment.",
    "Siz faqat o'zingizning qabulingiz uchun baho bera olasiz.": "You can rate only your own appointment.",
    "Bu qabul uchun baho allaqachon yuborilgan.": "A review for this appointment has already been submitted.",
    "Qabul vaqti hali kelmagan. Bahoni qabul tugagach yuborishingiz mumkin.": "The appointment time has not arrived yet. You can submit a review after it is finished.",
    "Shifokor ma'lumoti topilmadi.": "Doctor information was not found.",
    "Bekor qilingan qabulga baho berib bo'lmaydi.": "A cancelled appointment cannot be rated.",
    "Shifokor topilmadi.": "Doctor not found.",
    "Kirishda xatolik yuz berdi.": "There was an error while signing in.",
  },
};

const I18nContext = createContext<I18nValue | null>(null);

const formatTemplate = (template: string, params: TranslationParams = {}) =>
  Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const initialLanguage =
    typeof window === "undefined"
      ? "uz"
      : ((window.localStorage.getItem(LANGUAGE_KEY) as Language | null) ?? "uz");
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(LANGUAGE_KEY, nextLanguage);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      language,
      setLanguage,
      format: (template, params) => formatTemplate(template, params),
      translateStatus: (status) => statusLabels[language][status] ?? status,
      translateRegion: (region) => regionLabels[language][region] ?? region,
      translateSpecialty: (specialty) => specialtyLabels[language][specialty] ?? specialty,
      translateError: (message) => knownErrors[language][message] ?? message,
    }),
    [language, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return context;
};
