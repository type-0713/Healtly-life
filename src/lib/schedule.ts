export const BOOKING_TIMEZONE = "Asia/Tashkent";

const pad = (value: number) => String(value).padStart(2, "0");

export const DEFAULT_TIME_SLOTS = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? "00" : "30";
  return `${pad(hour)}:${minute}`;
});

type SlotSearchAppointment = {
  doctorId: string;
  date: string;
  time: string;
  status: string;
};

type SlotSearchDoctor = {
  id: string;
  availableSlots: string[];
};

const getTashkentDateParts = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
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
  };
};

export const getTodayInTashkent = () => {
  const { year, month, day } = getTashkentDateParts(new Date());
  return `${year}-${pad(month)}-${pad(day)}`;
};

export const getCurrentTimeInTashkent = () => {
  const { hour, minute } = getTashkentDateParts(new Date());
  return `${pad(hour)}:${pad(minute)}`;
};

export const addDaysToDate = (dateString: string, days: number) => {
  if (!dateString) {
    return getTodayInTashkent();
  }

  const baseDate = new Date(`${dateString}T00:00:00Z`);
  baseDate.setUTCDate(baseDate.getUTCDate() + days);

  return `${baseDate.getUTCFullYear()}-${pad(baseDate.getUTCMonth() + 1)}-${pad(baseDate.getUTCDate())}`;
};

export const isSundayDate = () => false;

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

export const isBookingWindowOpen = () => true;

export const getNextAvailableBookingDate = () => getTodayInTashkent();

export const findNearestAvailableDoctorSlot = (
  doctor: SlotSearchDoctor | null | undefined,
  appointments: SlotSearchAppointment[],
  startDate = getTodayInTashkent(),
  daysToCheck = 14,
) => {
  if (!doctor || doctor.availableSlots.length === 0) {
    return null;
  }

  for (let offset = 0; offset < daysToCheck; offset += 1) {
    const candidateDate = addDaysToDate(startDate, offset);
    const activeBookedSlots = new Set(
      appointments
        .filter(
          (appointment) =>
            appointment.doctorId === doctor.id &&
            appointment.date === candidateDate &&
            appointment.status !== "Bekor qilindi" &&
            appointment.status !== "Rad etildi",
        )
        .map((appointment) => appointment.time),
    );

    const nextSlot = doctor.availableSlots.find(
      (slot) => !isPastTimeSlotForDate(candidateDate, slot) && !activeBookedSlots.has(slot),
    );

    if (nextSlot) {
      return {
        date: candidateDate,
        time: nextSlot,
      };
    }
  }

  return null;
};

export const getBookingRulesMessage = (language: "uz" | "ru" | "en" = "uz") => {
  if (language === "ru") {
    return "Если врач онлайн и свободен, запрос виден сразу. При активном приёме следующий запрос появится через 22 минуты, а офлайн-врачу через 30 минут.";
  }

  if (language === "en") {
    return "If the doctor is online, requests are visible immediately without extra queue delay. For an offline doctor, new requests appear after 30 minutes from the booking time.";
  }

  return "Doktor ishda bo'lsa, so'rovlar darhol ko'rinadi va cheklovlarsiz tushadi. Offline doktorga esa yangi so'rovlar 30 daqiqadan keyin ko'rinadi.";
};
