export const BOOKING_TIMEZONE = "Asia/Tashkent";
export const BOOKING_OPEN_HOUR = 9;
export const BOOKING_CLOSE_HOUR = 18;

export const DEFAULT_TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];

const getTashkentDateParts = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    hour: Number(read("hour")),
    minute: Number(read("minute")),
    weekday: read("weekday"),
  };
};

const pad = (value: number) => String(value).padStart(2, "0");

export const getTodayInTashkent = () => {
  const { year, month, day } = getTashkentDateParts(new Date());
  return `${year}-${pad(month)}-${pad(day)}`;
};

export const getCurrentTimeInTashkent = () => {
  const { hour, minute } = getTashkentDateParts(new Date());
  return `${pad(hour)}:${pad(minute)}`;
};

export const isSundayDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) {
    return false;
  }

  return new Date(year, month - 1, day).getDay() === 0;
};

export const isTimeSlotAllowed = (time: string) => DEFAULT_TIME_SLOTS.includes(time);

export const isPastBookingDate = (dateString: string) => {
  const today = getTodayInTashkent();

  if (!dateString) {
    return false;
  }

  return dateString < today;
};

export const isPastTimeSlotForDate = (dateString: string, time: string) => {
  if (!dateString || !time || !isTimeSlotAllowed(time)) {
    return false;
  }

  if (isPastBookingDate(dateString)) {
    return true;
  }

  if (dateString !== getTodayInTashkent()) {
    return false;
  }

  return time <= getCurrentTimeInTashkent();
};

export const hasAppointmentStarted = (dateString: string, time: string) => {
  if (!dateString || !time || !isTimeSlotAllowed(time)) {
    return false;
  }

  if (isPastBookingDate(dateString)) {
    return true;
  }

  if (dateString > getTodayInTashkent()) {
    return false;
  }

  return time <= getCurrentTimeInTashkent();
};

export const isBookingWindowOpen = (date = new Date()) => {
  const { weekday, hour, minute } = getTashkentDateParts(date);
  const currentMinutes = hour * 60 + minute;
  const openMinutes = BOOKING_OPEN_HOUR * 60;
  const closeMinutes = BOOKING_CLOSE_HOUR * 60;

  if (weekday === "Sun") {
    return false;
  }

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
};

export const getNextAvailableBookingDate = () => {
  const today = getTodayInTashkent();
  const [year, month, day] = today.split("-").map(Number);
  const candidate = new Date(year, month - 1, day);

  while (candidate.getDay() === 0) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return `${candidate.getFullYear()}-${pad(candidate.getMonth() + 1)}-${pad(candidate.getDate())}`;
};

export const getBookingRulesMessage = (language: "uz" | "ru" | "en" = "uz") => {
  if (language === "ru") {
    return `Слоты приёма показываются с ${BOOKING_OPEN_HOUR}:00 до 17:30. В воскресенье запись закрыта.`;
  }

  if (language === "en") {
    return `Appointment slots are shown from ${BOOKING_OPEN_HOUR}:00 to 17:30. Booking is closed on Sundays.`;
  }

  return `Qabul slotlari ${BOOKING_OPEN_HOUR}:00 dan 17:30 gacha ko'rsatiladi. Yakshanba kuni bron yopiq.`;
};
