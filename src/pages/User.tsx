import type { FormEvent } from "react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AiChatWidget from "../components/AiChatWidget";
import EmergencyCallButton from "../components/EmergencyCallButton";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  HeartPulseIcon,
  LocationIcon,
  PhoneIcon,
  SparkIcon,
  StarIcon,
  StethoscopeIcon,
  UserGroupIcon,
} from "../components/PremiumIcons";
import {
  getDoctorBookingRecommendation,
  useAppContext,
  type Appointment,
  type Doctor,
  type Hospital,
  type HospitalRoomBooking,
} from "../context/AppContext";
import { useI18n } from "../context/I18nContext";
import { aiAssistantCopy } from "../i18n/aiAssistantCopy";
import { getDoctorMapQuery, getMapSearchUrl } from "../lib/maps";
import { ALL_REGIONS_OPTION, UZBEKISTAN_REGIONS } from "../lib/regions";
import {
  findNearestAvailableDoctorSlot,
  getBookingRulesMessage,
  getTodayInTashkent,
  hasAppointmentStarted,
  isPastTimeSlotForDate,
} from "../lib/schedule";

type TabId = "booking" | "appointments" | "profile" | "ai";
type SearchTarget = "doctors" | "hospitals";
type PriceSort = "none" | "price-asc" | "price-desc";
type RatingSort = "none" | "rating-asc" | "rating-desc";
type RoomLuxuryFilter = "all" | "lux" | "standard";

const getNumericPrice = (price: string) => Number(price.replace(/[^\d]/g, "")) || 0;

const getRoomCapacity = (capacity: string) => Math.max(1, Number(capacity) || 1);

const addDaysToDate = (date: string, days: number) => {
  const nextDate = new Date(`${date}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString().slice(0, 10);
};

const getStayDates = (startDate: string, days: number) =>
  Array.from({ length: Math.max(1, days) }, (_, index) => addDaysToDate(startDate, index));

const isActiveHospitalBooking = (booking: HospitalRoomBooking) => booking.status !== "Bekor qilindi";

const canReviewAppointment = (appointment: Appointment) =>
  (appointment.status === "Tasdiqlandi" || appointment.status === "Yakunlandi") &&
  hasAppointmentStarted(appointment.date, appointment.time) &&
  !appointment.reviewRating;

const canCancelAppointment = (appointment: Appointment) =>
  appointment.status !== "Tasdiqlandi" || !hasAppointmentStarted(appointment.date, appointment.time);

const User = () => {
  const { language, translateError, translateRegion, translateSpecialty, translateStatus } = useI18n();
  const aiCopy = aiAssistantCopy[language];
  const {
    appointments,
    bookAppointment,
    bookHospitalRoom,
    currentUser,
    doctors,
    hospitals,
    hospitalRoomBookings,
    localUserEmail,
    localUserId,
    profile,
    submitDoctorReview,
    updateAppointmentStatus,
    updateProfile,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<TabId>("booking");
  const [searchTarget, setSearchTarget] = useState<SearchTarget>("doctors");
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState(ALL_REGIONS_OPTION);
  const [priceSort, setPriceSort] = useState<PriceSort>("none");
  const [ratingSort, setRatingSort] = useState<RatingSort>("rating-desc");
  const [roomLuxuryFilter, setRoomLuxuryFilter] = useState<RoomLuxuryFilter>("all");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayInTashkent());
  const [selectedTime, setSelectedTime] = useState("");
  const [patientName, setPatientName] = useState(profile.name);
  const [patientPhone, setPatientPhone] = useState(profile.phone);
  const [notes, setNotes] = useState("");
  const [profileDraft, setProfileDraft] = useState(profile);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<Appointment | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [doctorInfoTarget, setDoctorInfoTarget] = useState<Doctor | null>(null);
  const [doctorBookingTarget, setDoctorBookingTarget] = useState<Doctor | null>(null);
  const [hospitalBookingTarget, setHospitalBookingTarget] = useState<Hospital | null>(null);
  const [hospitalRoomId, setHospitalRoomId] = useState("");
  const [hospitalPlaceNumber, setHospitalPlaceNumber] = useState(1);
  const [hospitalDays, setHospitalDays] = useState(1);
  const [hospitalStartDate, setHospitalStartDate] = useState(getTodayInTashkent());
  const [hospitalNotes, setHospitalNotes] = useState("");
  const seoTitle =
    language === "ru"
      ? "MedElite | Кабинет пациента"
      : language === "en"
        ? "MedElite | Patient dashboard"
        : "MedElite | Bemor kabineti";
  const seoDescription =
    language === "ru"
      ? "Личный кабинет пациента MedElite."
      : language === "en"
        ? "Private patient dashboard for MedElite."
        : "MedElite foydalanuvchisi uchun shaxsiy kabinet.";
  const [searchParams, setSearchParams] = useSearchParams();
  const bookingSectionRef = useRef<HTMLElement | null>(null);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const requestedDoctorId = searchParams.get("doctor") ?? "";
  const requestedDate = searchParams.get("date") ?? "";
  const requestedTime = searchParams.get("time") ?? "";

  const activeUserEmail = (currentUser?.email ?? localUserEmail ?? profile.email).trim().toLowerCase();
  const activeUserKey = (currentUser?.uid ?? localUserId ?? activeUserEmail).trim().toLowerCase();

  useEffect(() => {
    setPatientName(profile.name);
    setPatientPhone(profile.phone);
    setProfileDraft(profile);
  }, [profile]);

  const filteredDoctors = useMemo(() => {
    const nextDoctors = doctors.filter((doctor) => {
        const matchesSearch =
          !deferredSearchTerm.trim() ||
          `${doctor.name} ${doctor.specialty} ${doctor.clinic} ${doctor.bio}`
            .toLowerCase()
            .includes(deferredSearchTerm.trim().toLowerCase());
        const matchesRegion =
          regionFilter === ALL_REGIONS_OPTION || doctor.region === regionFilter;

        return matchesSearch && matchesRegion;
      });

    return nextDoctors.sort((left, right) => {
      const priceDifference = getNumericPrice(left.price) - getNumericPrice(right.price);
      if (priceSort === "price-asc" && priceDifference !== 0) return priceDifference;
      if (priceSort === "price-desc" && priceDifference !== 0) return -priceDifference;
      if (ratingSort === "rating-asc") return left.rating - right.rating;
      if (ratingSort === "rating-desc") return right.rating - left.rating;
      return left.name.localeCompare(right.name, "uz");
    });
  }, [deferredSearchTerm, doctors, priceSort, ratingSort, regionFilter]);

  const filteredHospitals = useMemo(() => {
    const nextHospitals = hospitals.filter((hospital) => {
      const matchesSearch =
        !deferredSearchTerm.trim() ||
        `${hospital.name} ${hospital.address} ${hospital.description} ${hospital.doctorNames.join(" ")}`
          .toLowerCase()
          .includes(deferredSearchTerm.trim().toLowerCase());
      const matchesRegion = regionFilter === ALL_REGIONS_OPTION || hospital.region === regionFilter;
      const matchesRoomType =
        roomLuxuryFilter === "all" ||
        hospital.rooms.some((room) => roomLuxuryFilter === "lux" ? room.isLuxury : !room.isLuxury);

      return hospital.approvalStatus === "approved" && hospital.profileCompleted && matchesSearch && matchesRegion && matchesRoomType;
    });

    return nextHospitals.sort((left, right) => {
      const leftPrice = Math.min(...left.rooms.map((room) => getNumericPrice(room.price)), Number.MAX_SAFE_INTEGER);
      const rightPrice = Math.min(...right.rooms.map((room) => getNumericPrice(room.price)), Number.MAX_SAFE_INTEGER);
      const priceDifference = leftPrice - rightPrice;
      if (priceSort === "price-asc" && priceDifference !== 0) return priceDifference;
      if (priceSort === "price-desc" && priceDifference !== 0) return -priceDifference;
      if (ratingSort === "rating-asc") return left.rating - right.rating;
      if (ratingSort === "rating-desc") return right.rating - left.rating;
      return left.name.localeCompare(right.name, "uz");
    });
  }, [deferredSearchTerm, hospitals, priceSort, ratingSort, regionFilter, roomLuxuryFilter]);

  useEffect(() => {
    if (!selectedDoctorId && filteredDoctors[0]) {
      setSelectedDoctorId(filteredDoctors[0].id);
      return;
    }

    if (!filteredDoctors.find((doctor) => doctor.id === selectedDoctorId) && filteredDoctors[0]) {
      setSelectedDoctorId(filteredDoctors[0].id);
    }
  }, [filteredDoctors, selectedDoctorId]);

  const selectedDoctor = useMemo(
    () => filteredDoctors.find((doctor) => doctor.id === selectedDoctorId) ?? filteredDoctors[0] ?? null,
    [filteredDoctors, selectedDoctorId],
  );

  useEffect(() => {
    if (!requestedDoctorId && !requestedDate && !requestedTime) {
      return;
    }

    if (requestedDoctorId && !doctors.some((doctor) => doctor.id === requestedDoctorId)) {
      return;
    }

    if (requestedDoctorId) {
      setSelectedDoctorId(requestedDoctorId);
    }

    if (requestedDate) {
      setSelectedDate(requestedDate);
    }

    if (requestedTime) {
      setSelectedTime(requestedTime);
    }

    setError("");
    setNotice("Tanlangan doktor va eng yaqin bo'sh vaqt formaga joylandi.");
    setSearchParams({}, { replace: true });
  }, [doctors, requestedDate, requestedDoctorId, requestedTime, setSearchParams]);

  const bookedSlotSet = useMemo(
    () =>
      new Set(
        appointments
          .filter(
            (appointment) =>
              appointment.doctorId === selectedDoctor?.id &&
              appointment.date === selectedDate &&
              appointment.status !== "Bekor qilindi" &&
              appointment.status !== "Rad etildi",
          )
          .map((appointment) => appointment.time),
      ),
    [appointments, selectedDate, selectedDoctor?.id],
  );

  const availableSlots = useMemo(() => {
    if (!selectedDoctor) {
      return [];
    }

    return selectedDoctor.availableSlots.filter((slot) => !isPastTimeSlotForDate(selectedDate, slot));
  }, [selectedDate, selectedDoctor]);

  const selectableSlots = useMemo(
    () => availableSlots.filter((slot) => !bookedSlotSet.has(slot)),
    [availableSlots, bookedSlotSet],
  );

  const nearestSlot = useMemo(() => {
    if (!selectedDoctor) {
      return null;
    }

    const slotSearchStartDate = selectedDate < getTodayInTashkent() ? getTodayInTashkent() : selectedDate;
    return findNearestAvailableDoctorSlot(selectedDoctor, appointments, slotSearchStartDate);
  }, [appointments, selectedDate, selectedDoctor]);

  const nearestSlotLabel = nearestSlot
    ? nearestSlot.date === getTodayInTashkent()
      ? `Bugun | ${nearestSlot.time}`
      : `${nearestSlot.date} | ${nearestSlot.time}`
    : "Hozircha bo'sh vaqt topilmadi";

  useEffect(() => {
    if (!selectedTime && selectableSlots[0]) {
      setSelectedTime(selectableSlots[0]);
      return;
    }

    if (selectedTime && !selectableSlots.includes(selectedTime)) {
      setSelectedTime(selectableSlots[0] ?? "");
    }
  }, [selectableSlots, selectedTime]);

  const userAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const ownerKey = appointment.patientKey.trim().toLowerCase();
        const ownerEmail = appointment.patientEmail.trim().toLowerCase();

        if (ownerKey) {
          return ownerKey === activeUserKey;
        }

        return Boolean(ownerEmail) && ownerEmail === activeUserEmail;
      }),
    [activeUserEmail, activeUserKey, appointments],
  );

  const activeAppointments = useMemo(
    () =>
      userAppointments.filter(
        (appointment) =>
          appointment.status !== "Yakunlandi" &&
          appointment.status !== "Bekor qilindi" &&
          appointment.status !== "Rad etildi",
      ),
    [userAppointments],
  );

  const historyAppointments = useMemo(
    () =>
      userAppointments.filter(
        (appointment) =>
          appointment.status === "Yakunlandi" ||
          appointment.status === "Bekor qilindi" ||
          appointment.status === "Rad etildi",
      ),
    [userAppointments],
  );

  const userHospitalBookings = useMemo(
    () =>
      hospitalRoomBookings.filter((booking) => {
        const ownerKey = booking.patientKey.trim().toLowerCase();
        const ownerEmail = booking.patientEmail.trim().toLowerCase();

        return ownerKey ? ownerKey === activeUserKey : Boolean(ownerEmail) && ownerEmail === activeUserEmail;
      }),
    [activeUserEmail, activeUserKey, hospitalRoomBookings],
  );

  const activeHospitalBookings = useMemo(
    () => userHospitalBookings.filter((booking) => booking.status === "Yangi" || booking.status === "Tasdiqlandi"),
    [userHospitalBookings],
  );

  const historyHospitalBookings = useMemo(
    () => userHospitalBookings.filter((booking) => booking.status === "Yakunlandi" || booking.status === "Bekor qilindi"),
    [userHospitalBookings],
  );

  const hospitalTargetRooms = useMemo(
    () =>
      (hospitalBookingTarget?.rooms ?? []).filter(
        (room) => roomLuxuryFilter === "all" || (roomLuxuryFilter === "lux" ? room.isLuxury : !room.isLuxury),
      ),
    [hospitalBookingTarget?.rooms, roomLuxuryFilter],
  );

  const selectedHospitalRoom = useMemo(
    () => hospitalTargetRooms.find((room) => room.id === hospitalRoomId) ?? hospitalTargetRooms[0] ?? null,
    [hospitalRoomId, hospitalTargetRooms],
  );

  const hospitalStayDates = useMemo(
    () => getStayDates(hospitalStartDate, hospitalDays),
    [hospitalDays, hospitalStartDate],
  );

  const bookedHospitalPlaces = useMemo(() => {
    if (!hospitalBookingTarget || !selectedHospitalRoom) return new Set<number>();

    const stayDateSet = new Set(hospitalStayDates);
    return new Set(
      hospitalRoomBookings
        .filter(
          (booking) =>
            isActiveHospitalBooking(booking) &&
            booking.hospitalId === hospitalBookingTarget.id &&
            booking.roomId === selectedHospitalRoom.id &&
            getStayDates(booking.startDate, booking.days).some((date) => stayDateSet.has(date)),
        )
        .map((booking) => booking.placeNumber),
    );
  }, [hospitalBookingTarget, hospitalRoomBookings, hospitalStayDates, selectedHospitalRoom]);

  const selectableHospitalPlaces = useMemo(
    () =>
      selectedHospitalRoom
        ? Array.from({ length: getRoomCapacity(selectedHospitalRoom.capacity) }, (_, index) => index + 1).filter(
            (placeNumber) => !bookedHospitalPlaces.has(placeNumber),
          )
        : [],
    [bookedHospitalPlaces, selectedHospitalRoom],
  );

  useEffect(() => {
    if (!selectedHospitalRoom) {
      setHospitalRoomId("");
      return;
    }

    if (!hospitalTargetRooms.some((room) => room.id === hospitalRoomId)) {
      setHospitalRoomId(selectedHospitalRoom.id);
    }
  }, [hospitalRoomId, hospitalTargetRooms, selectedHospitalRoom]);

  useEffect(() => {
    if (!selectableHospitalPlaces.includes(hospitalPlaceNumber)) {
      setHospitalPlaceNumber(selectableHospitalPlaces[0] ?? 1);
    }
  }, [hospitalPlaceNumber, selectableHospitalPlaces]);

  const normalizedReviewComment = reviewComment.trim();
  const reviewReadyCount = useMemo(
    () => userAppointments.filter((appointment) => canReviewAppointment(appointment)).length,
    [userAppointments],
  );

  const handleBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedDoctor || !selectedDate || !selectedTime || !patientName || !patientPhone) {
      return;
    }

    if (!selectableSlots.includes(selectedTime)) {
      setError("Tanlangan sana uchun bo'sh vaqt qolmagan. Iltimos, boshqa vaqtni tanlang.");
      setNotice("");
      return;
    }

    try {
      setIsSubmitting(true);
      setNotice("");
      setError("");
      const appointment = await bookAppointment({
        doctorId: selectedDoctor.id,
        date: selectedDate,
        time: selectedTime,
        patientName,
        patientKey: activeUserKey,
        patientEmail: activeUserEmail,
        patientPhone,
        notes,
      });

      await updateProfile({
        name: patientName,
        phone: patientPhone,
        email: activeUserEmail,
      });

      const isImmediatelyVisible =
        appointment &&
        new Date(appointment.requestVisibleAt).getTime() - new Date(appointment.createdAt).getTime() < 60 * 1000;

      setNotice(
        appointment
          ? isImmediatelyVisible
            ? "Buyurtma yaratildi. Doktor bu so'rovni hozir ko'rishi mumkin."
            : `Buyurtma yaratildi. Doktor bu so'rovni taxminan ${appointment.requestVisibleAt.slice(11, 16)} da ko'radi.`
          : "Buyurtma yaratilmadi.",
      );
      setNotes("");
      setActiveTab("appointments");
      if (doctorBookingTarget) {
        closeDoctorBookingModal();
      }
    } catch (bookingError) {
      setError(
        bookingError instanceof Error
          ? translateError(bookingError.message)
          : translateError("Kirishda xatolik yuz berdi."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      setError("");
      setNotice("");
      await updateAppointmentStatus(appointmentId, "Bekor qilindi");
      setNotice("Buyurtma bekor qilindi.");
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? translateError(cancelError.message)
          : translateError("Kirishda xatolik yuz berdi."),
      );
    }
  };

  const handleHospitalBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hospitalBookingTarget || !selectedHospitalRoom || !selectableHospitalPlaces.includes(hospitalPlaceNumber)) {
      setError("Xona, joy va bron sanasini qayta tekshiring.");
      setNotice("");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setNotice("");
      await bookHospitalRoom({
        hospitalId: hospitalBookingTarget.id,
        roomId: selectedHospitalRoom.id,
        placeNumber: hospitalPlaceNumber,
        days: hospitalDays,
        startDate: hospitalStartDate,
        patientName,
        patientKey: activeUserKey,
        patientEmail: activeUserEmail,
        patientPhone,
        notes: hospitalNotes,
      });
      await updateProfile({ name: patientName, phone: patientPhone, email: activeUserEmail });
      setNotice("Xona bron qilindi. Shifoxona kabinetiga yangi bron sifatida yuborildi.");
      setHospitalBookingTarget(null);
      setHospitalNotes("");
      setActiveTab("appointments");
    } catch (bookingError) {
      setError(
        bookingError instanceof Error
          ? translateError(bookingError.message)
          : translateError("Kirishda xatolik yuz berdi."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setError("");
      setNotice("");
      await updateProfile(profileDraft);
      setNotice("Profil ma'lumotlari saqlandi.");
    } catch (profileError) {
      setError(
        profileError instanceof Error
          ? translateError(profileError.message)
          : translateError("Kirishda xatolik yuz berdi."),
      );
    }
  };

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reviewTarget) {
      return;
    }

    if (normalizedReviewComment.length < 8) {
      setError("Sharh kamida 8 ta belgidan iborat bo'lishi kerak.");
      setNotice("");
      return;
    }

    try {
      setIsReviewSubmitting(true);
      setError("");
      setNotice("");
      await submitDoctorReview(reviewTarget.id, reviewRating, normalizedReviewComment);
      setNotice("Baholash muvaffaqiyatli yuborildi.");
      closeReviewModal();
    } catch (reviewErrorValue) {
      setError(
        reviewErrorValue instanceof Error
          ? translateError(reviewErrorValue.message)
          : translateError("Kirishda xatolik yuz berdi."),
      );
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const openReviewModal = (appointment: Appointment) => {
    setReviewTarget(appointment);
    setReviewRating(5);
    setReviewComment("");
    setError("");
    setNotice("");
  };

  const closeReviewModal = () => {
    setReviewTarget(null);
    setReviewRating(5);
    setReviewComment("");
  };

  const openDoctorInfoModal = (doctor: Doctor) => {
    setDoctorInfoTarget(doctor);
    setError("");
    setNotice("");
  };

  const closeDoctorInfoModal = () => setDoctorInfoTarget(null);

  const openDoctorBookingFromInfoModal = (doctor: Doctor) => {
    closeDoctorInfoModal();

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        openDoctorBookingModal(doctor);
      });
      return;
    }

    openDoctorBookingModal(doctor);
  };

  const openDoctorBookingModal = (doctor: Doctor) => {
    setSelectedDoctorId(doctor.id);
    if (typeof window !== "undefined" && window.matchMedia("(max-width:760px)").matches) {
      setDoctorBookingTarget(doctor);
    } else {
      focusBookingSectionOnMobile();
    }
  };

  const closeDoctorBookingModal = () => setDoctorBookingTarget(null);

  const openHospitalBookingModal = (hospital: Hospital) => {
    const matchingRoom = hospital.rooms.find((room) =>
      roomLuxuryFilter === "all" ? true : roomLuxuryFilter === "lux" ? room.isLuxury : !room.isLuxury,
    );
    setHospitalBookingTarget(hospital);
    setHospitalRoomId(matchingRoom?.id ?? hospital.rooms[0]?.id ?? "");
    setHospitalPlaceNumber(1);
    setHospitalDays(1);
    setHospitalStartDate(getTodayInTashkent());
    setHospitalNotes("");
    setPatientName(profile.name);
    setPatientPhone(profile.phone);
    setError("");
    setNotice("");
  };

  const closeHospitalBookingModal = () => setHospitalBookingTarget(null);

  const isDoctorModalOpen = Boolean(doctorInfoTarget || doctorBookingTarget);
  const isAnyModalOpen = Boolean(reviewTarget || isDoctorModalOpen || hospitalBookingTarget);

  useEffect(() => {
    if (typeof window === "undefined" || !isAnyModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (reviewTarget) {
        closeReviewModal();
        return;
      }

      if (doctorBookingTarget) {
        closeDoctorBookingModal();
        return;
      }

      if (doctorInfoTarget) {
        closeDoctorInfoModal();
        return;
      }

      if (hospitalBookingTarget) {
        closeHospitalBookingModal();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [doctorBookingTarget, doctorInfoTarget, hospitalBookingTarget, isAnyModalOpen, reviewTarget]);

  const bookingRules = getBookingRulesMessage(language);
  const selectedDoctorMapUrl = getMapSearchUrl(getDoctorMapQuery(selectedDoctor ?? {}));
  const doctorInfoMapUrl = doctorInfoTarget ? getMapSearchUrl(getDoctorMapQuery(doctorInfoTarget)) : "";
  const doctorInfoMapLabel =
    language === "ru" ? "Открыть на карте" : language === "en" ? "View on map" : "Xaritadan ko'rish";
  const doctorInfoBookLabel =
    language === "ru" ? "Записаться" : language === "en" ? "Book appointment" : "Band qilish";
  const focusBookingSectionOnMobile = () => {
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 760px)").matches) {
      return;
    }

    window.requestAnimationFrame(() => {
      bookingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleDoctorSelect = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    focusBookingSectionOnMobile();
  };

  const handleUseNearestSlot = () => {
    if (!nearestSlot) {
      setError("Tanlangan doktor uchun hozircha bo'sh vaqt topilmadi.");
      setNotice("");
      return;
    }

    setSelectedDate(nearestSlot.date);
    setSelectedTime(nearestSlot.time);
    setError("");

    setNotice(`Eng yaqin bo'sh vaqt tanlandi: ${nearestSlotLabel}.`);
  };

  /*
  const bookingRules = getBookingRulesMessage(language);
  const selectedDoctorMapUrl = getMapSearchUrl(getDoctorMapQuery(selectedDoctor ?? {}));
  const doctorInfoMapUrl = doctorInfoTarget ? getMapSearchUrl(getDoctorMapQuery(doctorInfoTarget)) : "";
  const doctorInfoMapLabel =
    language === "ru" ? "Открыть на карте" : language === "en" ? "View on map" : "Xaritadan ko'rish";
  const doctorInfoBookLabel =
    language === "ru" ? "Записаться" : language === "en" ? "Book appointment" : "Band qilish";
  const focusBookingSectionOnMobile = () => {
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 760px)").matches) {
      return;
    }

    window.requestAnimationFrame(() => {
      bookingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleDoctorSelect = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    focusBookingSectionOnMobile();
  };

  const handleUseNearestSlot = () => {
    if (!nearestSlot) {
      setError("Tanlangan doktor uchun hozircha bo'sh vaqt topilmadi.");
      setNotice("");
      return;
    }

    setSelectedDate(nearestSlot.date);
    setSelectedTime(nearestSlot.time);
    setError("");
    setNotice(`Eng yaqin bo'sh vaqt tanlandi: ${nearestSlotLabel}.`);
  };

  */

  return (
    <div className="dashboard-page">
      <Seo title={seoTitle} description={seoDescription} path="/user" noIndex />
      <Navbar />

      <main className="container dashboard-content">
        <section className="dashboard-hero">
          <div>
            <span className="section-chip">Foydalanuvchi bo'limi</span>
            <h1>Doktor tanlang va buyurtma yuboring</h1>
            <p>
              Platforma 24/7 ishlaydi. Doktor ishda va bo'sh bo'lsa so'rovni darhol ko'radi, qabul
              yuklamasi bor paytda esa keyingi so'rov navbat qoidasi bo'yicha kechikib tushadi.
            </p>
          </div>
          <div className="dashboard-tagline glass-card">
            <SparkIcon />
            {bookingRules}
          </div>
        </section>

        <section className="admin-kpi-grid">
          <article className="dashboard-mini-card">
            <span>{searchTarget === "doctors" ? "Topilgan doktorlar" : "Topilgan shifoxonalar"}</span>
            <strong>{searchTarget === "doctors" ? filteredDoctors.length : filteredHospitals.length}</strong>
          </article>
          <article className="dashboard-mini-card">
            <span>Faol buyurtmalar</span>
            <strong>{activeAppointments.length + activeHospitalBookings.length}</strong>
          </article>
          <article className="dashboard-mini-card">
            <span>Tarix</span>
            <strong>{historyAppointments.length + historyHospitalBookings.length}</strong>
          </article>
          <article className="dashboard-mini-card">
            <span>Reytingli doktor</span>
            <strong>{selectedDoctor ? selectedDoctor.rating.toFixed(1) : "0.0"}</strong>
          </article>
        </section>

        <div className="workspace-tabs">
          {([
            ["booking", "Bron qilish"],
            ["ai", "AI yordamchi"],
            ["appointments", "Buyurtmalarim"],
            ["profile", "Profil"],
          ] as Array<[TabId, string]>).map(([tabId, label]) => (
            <button
              key={tabId}
              type="button"
              className={`dashboard-tab-pill ${activeTab === tabId ? "dashboard-tab-pill-active" : ""}`}
              onClick={() => setActiveTab(tabId)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "booking" && (
          <section className="user-workspace-grid">
            <article className="preview-card preview-highlight doctor-list-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-chip">Qidiruv natijalari</span>
                  <h2>{searchTarget === "doctors" ? "Doktorlar ro'yxati" : "Shifoxonalar ro'yxati"}</h2>
                </div>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span>Qidiruv</span>
                  <div className="field-box">
                    <StethoscopeIcon />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder={searchTarget === "doctors" ? "Doktor, yo'nalish yoki klinika" : "Shifoxona, manzil yoki doktor"}
                    />
                  </div>
                </label>
                <label className="field">
                  <span>Hudud</span>
                  <div className="field-box field-box-select">
                    <LocationIcon />
                    <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}>
                      <option value={ALL_REGIONS_OPTION}>{translateRegion(ALL_REGIONS_OPTION)}</option>
                      {UZBEKISTAN_REGIONS.map((region) => (
                        <option key={region} value={region}>
                          {translateRegion(region)}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              </div>

              <div className="result-mode-toolbar">
                <div className="result-mode-tabs" role="group" aria-label="Qidiruv turi">
                  <button
                    type="button"
                    className={`category-pill ${searchTarget === "doctors" ? "category-pill-active" : ""}`}
                    onClick={() => setSearchTarget("doctors")}
                  >
                    <StethoscopeIcon />
                    Doktorlar
                  </button>
                  <button
                    type="button"
                    className={`category-pill ${searchTarget === "hospitals" ? "category-pill-active" : ""}`}
                    onClick={() => setSearchTarget("hospitals")}
                  >
                    <HeartPulseIcon />
                    Shifoxonalar
                  </button>
                </div>
                <label className="field result-sort-field">
                  <span>Narx bo'yicha</span>
                  <select value={priceSort} onChange={(event) => setPriceSort(event.target.value as PriceSort)}>
                    <option value="none">Standart</option>
                    <option value="price-asc">Arzondan qimmatga</option>
                    <option value="price-desc">Qimmatdan arzonga</option>
                  </select>
                </label>
                <label className="field result-sort-field">
                  <span>Reyting bo'yicha</span>
                  <select value={ratingSort} onChange={(event) => setRatingSort(event.target.value as RatingSort)}>
                    <option value="rating-desc">Yuqoridan pastga</option>
                    <option value="rating-asc">Pastdan yuqoriga</option>
                    <option value="none">Reytingsiz</option>
                  </select>
                </label>
                {searchTarget === "hospitals" && (
                  <label className="field result-sort-field">
                    <span>Xona turi</span>
                    <select value={roomLuxuryFilter} onChange={(event) => setRoomLuxuryFilter(event.target.value as RoomLuxuryFilter)}>
                      <option value="all">Barcha xonalar</option>
                      <option value="lux">Faqat lux</option>
                      <option value="standard">Oddiy xonalar</option>
                    </select>
                  </label>
                )}
              </div>

              <div className="doctor-list-toolbar">
                <span className="badge">
                  <StethoscopeIcon />
                  {searchTarget === "doctors" ? `${filteredDoctors.length} ta doktor` : `${filteredHospitals.length} ta shifoxona`}
                </span>
                <p className="doctor-list-note">
                  {searchTarget === "hospitals"
                    ? "Xona narxi, turi, joylar soni va shifoxonadagi doktorlarni solishtiring."
                    : selectedDoctor
                    ? `${selectedDoctor.name} tanlangan. Kartalarni skroll qilib tezda solishtiring.`
                    : "Kartalardan birini tanlang va bron formasi avtomatik yangilanadi."}
                </p>
              </div>

              <div className="doctor-scroll-grid">
                {searchTarget === "hospitals" && filteredHospitals.map((hospital) => {
                  const visibleRooms = hospital.rooms.filter(
                    (room) => roomLuxuryFilter === "all" || (roomLuxuryFilter === "lux" ? room.isLuxury : !room.isLuxury),
                  );
                  const minimumPrice = visibleRooms.length
                    ? Math.min(...visibleRooms.map((room) => getNumericPrice(room.price)))
                    : 0;

                  return (
                    <article key={hospital.id} className="doctor-select-card hospital-select-card">
                      <div className="doctor-select-head">
                        <div className="doctor-select-identity">
                          <div className="doctor-card-avatar">
                            <HeartPulseIcon />
                          </div>
                          <div className="doctor-select-title">
                            <div className="doctor-name-scroll">
                              <strong>{hospital.name}</strong>
                            </div>
                            <span>{translateRegion(hospital.region)}</span>
                          </div>
                        </div>
                        <span className="badge doctor-status-badge doctor-status-online">Tasdiqlangan</span>
                      </div>

                      <div className="doctor-select-summary">
                        <div className="doctor-select-summary-card">
                          <span>Manzil</span>
                          <strong>{hospital.address}</strong>
                        </div>
                        <div className="doctor-select-summary-card">
                          <span>Eng arzon xona</span>
                          <strong>{minimumPrice ? `${new Intl.NumberFormat("uz-UZ").format(minimumPrice)} so'm/kun` : "Narx kiritilmagan"}</strong>
                        </div>
                      </div>

                      <div className="doctor-select-bio">
                        <span>Shifoxona haqida</span>
                        <p>{hospital.description}</p>
                      </div>

                      <div className="doctor-select-metrics">
                        <div>
                          <span>Reyting</span>
                          <strong>{hospital.rating.toFixed(1)}</strong>
                        </div>
                        <div>
                          <span>Xonalar</span>
                          <strong>{visibleRooms.length}</strong>
                        </div>
                        <div>
                          <span>Doktorlar</span>
                          <strong>{hospital.doctorNames.length}</strong>
                        </div>
                      </div>

                      <div className="hospital-room-list">
                        {visibleRooms.slice(0, 3).map((room) => (
                          <div key={room.id} className="hospital-room-row">
                            <div>
                              <strong>{room.name}</strong>
                              <span>{room.isLuxury ? "Lux xona" : "Oddiy xona"} | {getRoomCapacity(room.capacity)} ta joy</span>
                            </div>
                            <strong>{room.price}/kun</strong>
                            {room.description && <p>{room.description}</p>}
                          </div>
                        ))}
                        {visibleRooms.length === 0 && <p className="doctor-form-warning">Bu filterga mos xona yo'q.</p>}
                      </div>

                      {hospital.doctorNames.length > 0 && (
                        <p className="doctor-select-recommendation">Doktorlar: {hospital.doctorNames.join(", ")}</p>
                      )}

                      <div className="doctor-select-actions">
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={() => openHospitalBookingModal(hospital)}
                          disabled={visibleRooms.length === 0}
                        >
                          Xona bron qilish
                          <CalendarIcon />
                        </button>
                      </div>
                    </article>
                  );
                })}

                {searchTarget === "doctors" && filteredDoctors.map((doctor) => {
                  const isSelected = selectedDoctor?.id === doctor.id;
                  const bookingRecommendation = getDoctorBookingRecommendation(doctor, appointments);

                  return (
                    <article
                      key={doctor.id}
                      role="button"
                      tabIndex={0}
                      className={`doctor-select-card ${isSelected ? "doctor-select-card-active" : ""}`}
                      onClick={() => handleDoctorSelect(doctor.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleDoctorSelect(doctor.id);
                        }
                      }}
                    >
                      <div className="doctor-select-head">
                        <div className="doctor-select-identity">
                          <div className="doctor-card-avatar">
                            <StethoscopeIcon />
                          </div>
                          <div className="doctor-select-title">
                            <div className="doctor-name-scroll">
                              <strong>{doctor.name}</strong>
                            </div>
                            <span>{translateSpecialty(doctor.specialty)}</span>
                          </div>
                        </div>
                        <span className={`badge doctor-status-badge ${doctor.isOnline ? "doctor-status-online" : "doctor-status-offline"}`}>
                          {doctor.isOnline ? "Ishda" : "Ishda emas"}
                        </span>
                      </div>

                      <div className="doctor-select-summary">
                        <div className="doctor-select-summary-card">
                          <span>Klinika</span>
                          <strong>{doctor.clinic}</strong>
                        </div>
                        <div className="doctor-select-summary-card">
                          <span>Hudud</span>
                          <strong>{translateRegion(doctor.region)}</strong>
                        </div>
                      </div>

                      <div className="doctor-select-bio">
                        <span>O'zi haqida</span>
                        <p>{doctor.bio}</p>
                      </div>

                      <div className="doctor-select-metrics">
                        <div>
                          <span>Reyting</span>
                          <strong>{doctor.rating.toFixed(1)}</strong>
                        </div>
                        <div>
                          <span>Tajriba</span>
                          <strong>{doctor.experience}</strong>
                        </div>
                        <div>
                          <span>Narx</span>
                          <strong>{doctor.price}</strong>
                        </div>
                      </div>

                      <p className="doctor-select-recommendation">{bookingRecommendation}</p>

                      <div className="doctor-slot-list">
                        {doctor.availableSlots.slice(0, 4).map((slot) => (
                          <span key={`${doctor.id}-${slot}`} className="doctor-slot-chip">
                            {slot}
                          </span>
                        ))}
                      </div>

                      <div className="doctor-select-actions">
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={(event) => {
                            event.stopPropagation();
                            openDoctorInfoModal(doctor);
                          }}
                        >
                          Ma'lumotlarni ko'rish
                        </button>
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={(event) => {
                            event.stopPropagation();
                            openDoctorBookingModal(doctor);
                          }}
                        >
                          Band qilish
                        </button>
                      </div>
                    </article>
                  );
                })}

                {searchTarget === "doctors" && filteredDoctors.length === 0 && (
                  <div className="empty-state doctor-empty-state">
                    <h3>Doktor topilmadi</h3>
                    <p>Qidiruv yoki hudud filterini o'zgartirib qayta urinib ko'ring.</p>
                  </div>
                )}
                {searchTarget === "hospitals" && filteredHospitals.length === 0 && (
                  <div className="empty-state doctor-empty-state">
                    <h3>Shifoxona topilmadi</h3>
                    <p>Qidiruv, hudud yoki xona turi filterini o'zgartirib qayta urinib ko'ring.</p>
                  </div>
                )}
              </div>
            </article>

            <article ref={bookingSectionRef} className="preview-card booking-card-anchor">
              <div className="panel-heading">
                <div>
                  <span className="section-chip">{searchTarget === "doctors" ? "Buyurtma formasi" : "Xona bronlash"}</span>
                  <h2>{searchTarget === "doctors" ? "Buyurtma yaratish" : "Shifoxona xonasini tanlang"}</h2>
                </div>
              </div>

              {searchTarget === "hospitals" ? (
                <div className="empty-state">
                  <h3>Shifoxona kartasidan boshlang</h3>
                  <p>Xona turi, joy raqami va yotish kunlarini tanlash uchun kerakli shifoxonada “Xona bron qilish” tugmasini bosing.</p>
                </div>
              ) : selectedDoctor ? (
                <form className="booking-form" onSubmit={handleBooking}>
                  <div className="booking-doctor-showcase">
                    <div className="doctor-card-avatar">
                      <StethoscopeIcon />
                    </div>
                    <div className="booking-doctor-copy">
                      <div className="doctor-name-scroll doctor-name-scroll-title">
                        <h3>{selectedDoctor.name}</h3>
                      </div>
                      <p>{translateSpecialty(selectedDoctor.specialty)} | {selectedDoctor.clinic}</p>
                      <span>{translateRegion(selectedDoctor.region)} | {selectedDoctor.price}</span>
                      <div className="booking-doctor-pills">
                        <span className="doctor-slot-chip">{selectedDoctor.experience} tajriba</span>
                        <span className="doctor-slot-chip">{selectedDoctor.rating.toFixed(1)} reyting</span>
                        <span className="doctor-slot-chip">{selectedDoctor.isOnline ? "Hozir ishda" : "Hozir offline"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="booking-quick-actions">
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={handleUseNearestSlot}
                      disabled={!nearestSlot}
                    >
                      Eng yaqin bo'sh vaqt
                      <ClockIcon />
                    </button>
                    <span className="doctor-slot-hint">{nearestSlotLabel}</span>
                  </div>

                  <div className="field-grid">
                    <label className="field">
                      <span>Ism</span>
                      <div className="field-box">
                        <UserGroupIcon />
                        <input value={patientName} onChange={(event) => setPatientName(event.target.value)} required />
                      </div>
                    </label>
                    <label className="field">
                      <span>Telefon</span>
                      <div className="field-box">
                        <PhoneIcon />
                        <input value={patientPhone} onChange={(event) => setPatientPhone(event.target.value)} required />
                      </div>
                    </label>
                    <label className="field">
                      <span>Sana</span>
                      <div className="field-box">
                        <CalendarIcon />
                        <input
                          type="date"
                          value={selectedDate}
                          min={getTodayInTashkent()}
                          onChange={(event) => setSelectedDate(event.target.value)}
                          required
                        />
                      </div>
                    </label>
                    <label className="field">
                      <span>Vaqt</span>
                      <div className="field-box field-box-select">
                        <ClockIcon />
                        <select value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)} required>
                          {selectableSlots.length > 0 ? (
                            selectableSlots.map((slot) => (
                              <option key={slot} value={slot}>
                                {slot}
                              </option>
                            ))
                          ) : (
                            <option value="" disabled>
                              Bo'sh vaqt qolmagan
                            </option>
                          )}
                        </select>
                      </div>
                    </label>
                    <label className="field field-full">
                      <span>Izoh</span>
                      <textarea
                        rows={4}
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Shikoyat yoki qo'shimcha ma'lumot"
                      />
                    </label>
                  </div>

                  {selectableSlots.length === 0 && (
                    <p className="doctor-form-warning">
                      Tanlangan sana uchun barcha vaqtlar band. Sana yoki doktorni almashtiring.
                    </p>
                  )}

                  <button
                    type="submit"
                    className="button button-primary button-large"
                    disabled={isSubmitting || selectableSlots.length === 0}
                  >
                    Buyurtma yuborish
                    <ArrowRightIcon />
                  </button>
                </form>
              ) : (
                <div className="empty-state">
                  <h3>Doktor topilmadi</h3>
                  <p>Filterlarni o'zgartirib ko'ring.</p>
                </div>
              )}
            </article>

            {searchTarget === "doctors" && <aside className="preview-column">
              <article className="preview-card preview-highlight">
                <span className="badge badge-gold">
                  <SparkIcon />
                  Tanlangan doktor
                </span>
                <div className="doctor-name-scroll doctor-name-scroll-heading">
                  <h2>{selectedDoctor?.name ?? "Doktor tanlanmagan"}</h2>
                </div>
                <p>{selectedDoctor ? translateSpecialty(selectedDoctor.specialty) : "-"}</p>
                <p className="preview-subtext">{selectedDoctor?.bio ?? "Tanlangan doktorga oid ma'lumot shu yerda ko'rinadi."}</p>

                <div className="preview-list">
                  <div>
                    <ClockIcon />
                    <span>{selectedDoctor?.availability ?? "-"}</span>
                  </div>
                  <div>
                    <LocationIcon />
                    <span>{selectedDoctor?.address ?? "-"}</span>
                  </div>
                  <div>
                    <StarIcon />
                    <span>{selectedDoctor ? `${selectedDoctor.rating.toFixed(1)} / 5` : "-"}</span>
                  </div>
                </div>

                {selectedDoctorMapUrl && (
                  <a href={selectedDoctorMapUrl} target="_blank" rel="noreferrer" className="button button-secondary button-block">
                    Xaritada ochish
                    <ArrowRightIcon />
                  </a>
                )}
              </article>
            </aside>}
          </section>
        )}

        {activeTab === "appointments" && (
          <section className="user-workspace-grid user-workspace-grid-full">
            <article className="preview-card preview-highlight doctor-queue-card">
              <div className="panel-heading">
                <div>
                  <span className="section-chip">Faol buyurtmalar</span>
                  <h2>Faol buyurtmalarim</h2>
                </div>
                <span className="badge badge-gold">
                  <StarIcon />
                  {reviewReadyCount} ta sharh tayyor
                </span>
              </div>
              <div className="doctor-request-list">
                {activeAppointments.map((appointment) => {
                  const canReview = canReviewAppointment(appointment);
                  const canCancel = canCancelAppointment(appointment);

                  return (
                    <article key={appointment.id} className="doctor-request-item">
                      <div className="appointment-card-head">
                        <div>
                          <h3>{appointment.doctorName}</h3>
                          <p>{translateSpecialty(appointment.specialty)}</p>
                        </div>
                        <span className="badge">{translateStatus(appointment.status)}</span>
                      </div>
                      <div className="appointment-meta-grid">
                        <div>
                          <CalendarIcon />
                          <span>{appointment.date}</span>
                        </div>
                        <div>
                          <ClockIcon />
                          <span>{appointment.time}</span>
                        </div>
                        <div>
                          <LocationIcon />
                          <span>{appointment.clinic}</span>
                        </div>
                      </div>
                      {appointment.notes && <p>{appointment.notes}</p>}

                      {canReview && (
                        <div className="appointment-review-banner">
                          <strong>
                            <StarIcon />
                            Qabul tugadi, endi baho berishingiz mumkin
                          </strong>
                          <p>Izoh va yulduzcha bahosi doktor profilidagi reytingga darhol qo'shiladi.</p>
                        </div>
                      )}

                      {(canCancel || canReview) && (
                        <div className="doctor-request-actions">
                          {canCancel && (
                            <button
                              type="button"
                              className="button button-ghost"
                              onClick={() => void handleCancel(appointment.id)}
                            >
                              Bekor qilish
                            </button>
                          )}
                          {canReview && (
                            <button
                              type="button"
                              className="button button-primary"
                              onClick={() => openReviewModal(appointment)}
                            >
                              Baho berish
                              <StarIcon />
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}

                {activeHospitalBookings.map((booking) => (
                  <article key={booking.id} className="doctor-request-item">
                    <div className="appointment-card-head">
                      <div>
                        <h3>{booking.hospitalName}</h3>
                        <p>{booking.roomName} | {booking.placeNumber}-joy</p>
                      </div>
                      <span className="badge">{booking.status}</span>
                    </div>
                    <div className="appointment-meta-grid">
                      <div>
                        <CalendarIcon />
                        <span>{booking.startDate} - {booking.endDate}</span>
                      </div>
                      <div>
                        <ClockIcon />
                        <span>{booking.days} kun</span>
                      </div>
                      <div>
                        <LocationIcon />
                        <span>{booking.roomPrice}/kun</span>
                      </div>
                    </div>
                    {booking.notes && <p>{booking.notes}</p>}
                  </article>
                ))}

                {activeAppointments.length + activeHospitalBookings.length === 0 && (
                  <div className="empty-state">
                    <h3>Faol buyurtma yo'q</h3>
                    <p>Doktor qabuliga yoki shifoxona xonasiga bron qilganingizda shu yerda ko'rinadi.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="preview-card doctor-queue-card">
              <div className="panel-heading">
                <div>
                    <span className="section-chip">Tarix</span>
                  <h2>Tarix</h2>
                </div>
              </div>
              <div className="doctor-request-list">
                {historyAppointments.map((appointment) => {
                  const canReview = canReviewAppointment(appointment);

                  return (
                    <article key={appointment.id} className="doctor-request-item">
                      <div className="appointment-card-head">
                        <div>
                          <h3>{appointment.doctorName}</h3>
                          <p>{translateSpecialty(appointment.specialty)}</p>
                        </div>
                        <span className="badge">{translateStatus(appointment.status)}</span>
                      </div>
                      <div className="appointment-meta-grid">
                        <div>
                          <CalendarIcon />
                          <span>{appointment.date}</span>
                        </div>
                        <div>
                          <ClockIcon />
                          <span>{appointment.time}</span>
                        </div>
                        <div>
                          <LocationIcon />
                          <span>{appointment.clinic}</span>
                        </div>
                      </div>
                      {appointment.reviewRating && (
                        <p className="review-summary-text">
                          {appointment.reviewRating} / 5 | {appointment.reviewComment || "Izoh qoldirilmagan"}
                        </p>
                      )}
                      {appointment.rejectedReason && <p>{appointment.rejectedReason}</p>}
                      {canReview && (
                        <button type="button" className="button button-secondary" onClick={() => openReviewModal(appointment)}>
                          Baho berish
                        </button>
                      )}
                    </article>
                  );
                })}

                {historyHospitalBookings.map((booking) => (
                  <article key={booking.id} className="doctor-request-item">
                    <div className="appointment-card-head">
                      <div>
                        <h3>{booking.hospitalName}</h3>
                        <p>{booking.roomName} | {booking.placeNumber}-joy</p>
                      </div>
                      <span className="badge">{booking.status}</span>
                    </div>
                    <div className="appointment-meta-grid">
                      <div>
                        <CalendarIcon />
                        <span>{booking.startDate} - {booking.endDate}</span>
                      </div>
                      <div>
                        <ClockIcon />
                        <span>{booking.days} kun</span>
                      </div>
                      <div>
                        <LocationIcon />
                        <span>{booking.roomPrice}/kun</span>
                      </div>
                    </div>
                    {booking.notes && <p>{booking.notes}</p>}
                  </article>
                ))}

                {historyAppointments.length + historyHospitalBookings.length === 0 && (
                  <div className="empty-state">
                    <h3>Tarix hali bo'sh</h3>
                    <p>Yakunlangan, bekor qilingan yoki rad etilgan buyurtmalar shu yerda ko'rinadi.</p>
                  </div>
                )}
              </div>
            </article>
          </section>
        )}

        {activeTab === "ai" && (
          <section className="user-ai-section">
            <article className="preview-card preview-highlight user-ai-card">
              <div className="panel-heading">
                <div>
                  <span className="section-chip">
                    <SparkIcon />
                    {aiCopy.chip}
                  </span>
                  <h2>{aiCopy.title}</h2>
                  <p className="preview-subtext">{aiCopy.heroText}</p>
                </div>
                <Link to="/ai-assistant" className="button button-secondary">
                  {language === "ru" ? "To'liq ekran" : language === "en" ? "Full screen" : "To'liq ekran"}
                  <ArrowRightIcon />
                </Link>
              </div>
              <AiChatWidget compact showModeSelector />
            </article>
          </section>
        )}

        {activeTab === "profile" && (
          <section className="user-workspace-grid user-workspace-grid-full">
            <article className="preview-card">
                <div className="panel-heading">
                  <div>
                    <span className="section-chip">Profil</span>
                    <h2>Shaxsiy kabinet</h2>
                  </div>
                </div>
              <form className="booking-form" onSubmit={handleProfileSave}>
                <div className="field-grid">
                  <label className="field">
                    <span>Ism</span>
                    <div className="field-box">
                      <UserGroupIcon />
                      <input
                        value={profileDraft.name}
                        onChange={(event) =>
                          setProfileDraft((current) => ({ ...current, name: event.target.value }))
                        }
                      />
                    </div>
                  </label>
                  <label className="field">
                    <span>Email</span>
                    <div className="field-box">
                      <SparkIcon />
                      <input
                        type="email"
                        value={profileDraft.email}
                        onChange={(event) =>
                          setProfileDraft((current) => ({ ...current, email: event.target.value }))
                        }
                      />
                    </div>
                  </label>
                  <label className="field">
                    <span>Telefon</span>
                    <div className="field-box">
                      <PhoneIcon />
                      <input
                        value={profileDraft.phone}
                        onChange={(event) =>
                          setProfileDraft((current) => ({ ...current, phone: event.target.value }))
                        }
                      />
                    </div>
                  </label>
                  <label className="field">
                    <span>Shahar</span>
                    <div className="field-box">
                      <LocationIcon />
                      <input
                        value={profileDraft.city}
                        onChange={(event) =>
                          setProfileDraft((current) => ({ ...current, city: event.target.value }))
                        }
                      />
                    </div>
                  </label>
                  <label className="field">
                    <span>Tug'ilgan sana</span>
                    <div className="field-box">
                      <CalendarIcon />
                      <input
                        type="date"
                        value={profileDraft.birthDate}
                        onChange={(event) =>
                          setProfileDraft((current) => ({ ...current, birthDate: event.target.value }))
                        }
                      />
                    </div>
                  </label>
                  <label className="field field-full">
                    <span>O'zingiz haqingizda</span>
                    <textarea
                      rows={4}
                      value={profileDraft.about}
                      onChange={(event) =>
                        setProfileDraft((current) => ({ ...current, about: event.target.value }))
                      }
                    />
                  </label>
                </div>
                <button type="submit" className="button button-primary button-large">
                  Saqlash
                  <CheckIcon />
                </button>
              </form>
            </article>
          </section>
        )}

        {notice && (
          <section className="confirmation-banner">
            <div className="confirmation-icon">
              <CheckIcon />
            </div>
            <div>
              <h2>Yangilanish tayyor</h2>
              <p>{notice}</p>
            </div>
          </section>
        )}

        {error && (
          <section className="confirmation-banner confirmation-banner-error">
            <div className="confirmation-icon confirmation-icon-error">
              <CloseIcon />
            </div>
            <div>
              <h2>Xatolik yuz berdi</h2>
              <p>{error}</p>
            </div>
          </section>
        )}
      </main>

      {reviewTarget && (
        <div className="modal-backdrop" onClick={closeReviewModal} role="presentation">
          <div
            className="modal-card review-modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
          >
            <div className="panel-heading">
              <div>
                <span className="section-chip">Baho</span>
                <h2 id="review-title">{reviewTarget.doctorName} uchun baho</h2>
              </div>
              <button type="button" className="icon-button" onClick={closeReviewModal}>
                <CloseIcon />
              </button>
            </div>
            <form className="review-form modal-scroll-area" onSubmit={handleReviewSubmit}>
              <p className="review-modal-copy">
                Qabul sifati bo'yicha qisqa va aniq sharh yozing. Bu baho doktor reytingiga qo'shiladi.
              </p>

              <div className="review-stars-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`review-star-button ${star <= reviewRating ? "review-star-button-active" : ""}`}
                    onClick={() => setReviewRating(star)}
                  >
                    <StarIcon />
                  </button>
                ))}
              </div>

              <label className="field">
                <span>Izoh</span>
                <textarea
                  rows={4}
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  placeholder="Qabul qanday o'tganini qisqacha yozing"
                  maxLength={400}
                />
              </label>

              <p className="review-modal-copy">
                {normalizedReviewComment.length}/400 belgi. Kamida 8 ta belgi yozing.
              </p>

              <div className="modal-actions">
                <button type="button" className="button button-ghost" onClick={closeReviewModal}>
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={isReviewSubmitting || normalizedReviewComment.length < 8}
                >
                  {isReviewSubmitting ? "Yuborilmoqda..." : "Yuborish"}
                  <CheckIcon />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {doctorInfoTarget && (
        <div className="modal-backdrop" onClick={closeDoctorInfoModal} role="presentation">
          <div
            className="modal-card modal-card-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="doctor-info-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-heading">
              <div>
                <span className="section-chip">Doktor ma'lumotlari</span>
                <h2 id="doctor-info-title">{doctorInfoTarget.name}</h2>
              </div>
              <button type="button" className="icon-button" onClick={closeDoctorInfoModal} aria-label="Modalni yopish">
                <CloseIcon />
              </button>
            </div>
            <div className="info-stack modal-scroll-area">
              <div>
                <span>Yo'nalish</span>
                <strong>{translateSpecialty(doctorInfoTarget.specialty)}</strong>
              </div>
              <div>
                <span>Klinika</span>
                <strong>{doctorInfoTarget.clinic}</strong>
              </div>
              <div>
                <span>Hudud</span>
                <strong>{translateRegion(doctorInfoTarget.region)}</strong>
              </div>
              <div>
                <span>Manzil</span>
                <strong>{doctorInfoTarget.address}</strong>
              </div>
              <div>
                <span>Telefon</span>
                <strong>{doctorInfoTarget.phone}</strong>
              </div>
              <div>
                <span>Ta'rif</span>
                <p>{doctorInfoTarget.bio}</p>
              </div>

              <div className="modal-actions info-modal-actions">
                <a
                  href={doctorInfoMapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-secondary"
                >
                  {doctorInfoMapLabel}
                  <ArrowRightIcon />
                </a>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => openDoctorBookingFromInfoModal(doctorInfoTarget)}
                >
                  {doctorInfoBookLabel}
                  <ArrowRightIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {doctorBookingTarget && (
        <div className="modal-backdrop" onClick={closeDoctorBookingModal} role="presentation">
          <div
            className="modal-card modal-card-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="doctor-booking-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-heading">
              <div>
                <span className="section-chip">Band qilish</span>
                <h2 id="doctor-booking-title">{doctorBookingTarget.name}</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={closeDoctorBookingModal}
                aria-label="Modalni yopish"
              >
                <CloseIcon />
              </button>
            </div>
            <form className="booking-form modal-scroll-area" onSubmit={handleBooking}>
              <div className="booking-doctor-showcase">
                <div className="doctor-card-avatar">
                  <StethoscopeIcon />
                </div>
                <div className="booking-doctor-copy">
                  <div className="doctor-name-scroll doctor-name-scroll-title">
                    <h3>{doctorBookingTarget.name}</h3>
                  </div>
                  <p>{translateSpecialty(doctorBookingTarget.specialty)} | {doctorBookingTarget.clinic}</p>
                  <span>{translateRegion(doctorBookingTarget.region)} | {doctorBookingTarget.price}</span>
                  <div className="booking-doctor-pills">
                    <span className="doctor-slot-chip">{doctorBookingTarget.experience} tajriba</span>
                    <span className="doctor-slot-chip">{doctorBookingTarget.rating.toFixed(1)} reyting</span>
                    <span className="doctor-slot-chip">{doctorBookingTarget.isOnline ? "Hozir ishda" : "Hozir offline"}</span>
                  </div>
                </div>
              </div>

              <div className="booking-quick-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={handleUseNearestSlot}
                  disabled={!nearestSlot}
                >
                  Eng yaqin bo'sh vaqt
                  <ClockIcon />
                </button>
                <span className="doctor-slot-hint">{nearestSlotLabel}</span>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span>Ism</span>
                  <div className="field-box">
                    <UserGroupIcon />
                    <input value={patientName} onChange={(event) => setPatientName(event.target.value)} required />
                  </div>
                </label>
                <label className="field">
                  <span>Telefon</span>
                  <div className="field-box">
                    <PhoneIcon />
                    <input value={patientPhone} onChange={(event) => setPatientPhone(event.target.value)} required />
                  </div>
                </label>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span>Sana</span>
                  <div className="field-box field-box-select">
                    <CalendarIcon />
                    <input
                      type="date"
                      value={selectedDate}
                      min={getTodayInTashkent()}
                      onChange={(event) => setSelectedDate(event.target.value)}
                      required
                    />
                  </div>
                </label>
                <label className="field">
                  <span>Vaqt</span>
                  <div className="field-box field-box-select">
                    <ClockIcon />
                    <select value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)} required>
                      {selectableSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              </div>

              <label className="field">
                <span>Izoh</span>
                <div className="field-box">
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Qo'shimcha izoh"
                  />
                </div>
              </label>

              <div className="modal-actions">
                <button type="button" className="button button-ghost" onClick={closeDoctorBookingModal}>
                  Bekor qilish
                </button>
                <button type="submit" className="button button-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Yuborilmoqda..." : "Band qilish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {hospitalBookingTarget && (
        <div className="modal-backdrop" onClick={closeHospitalBookingModal} role="presentation">
          <div
            className="modal-card modal-card-wide"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="hospital-booking-title"
          >
            <div className="panel-heading">
              <div>
                <span className="section-chip">Xona bronlash</span>
                <h2 id="hospital-booking-title">{hospitalBookingTarget.name}</h2>
              </div>
              <button type="button" className="icon-button" onClick={closeHospitalBookingModal} aria-label="Yopish">
                <CloseIcon />
              </button>
            </div>

            <form className="booking-form modal-scroll-area" onSubmit={handleHospitalBooking}>
              <div className="booking-quick-actions">
                <span className="doctor-slot-hint">{hospitalBookingTarget.address}</span>
                <span className="doctor-slot-hint">{hospitalBookingTarget.phone}</span>
              </div>

              <div className="field-grid">
                <label className="field field-full">
                  <span>Xona</span>
                  <select value={hospitalRoomId} onChange={(event) => setHospitalRoomId(event.target.value)} required>
                    {hospitalTargetRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name} | {room.isLuxury ? "Lux" : "Oddiy"} | {room.price}/kun | {getRoomCapacity(room.capacity)} joy
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Yotish sanasi</span>
                  <div className="field-box">
                    <CalendarIcon />
                    <input
                      type="date"
                      value={hospitalStartDate}
                      min={getTodayInTashkent()}
                      onChange={(event) => setHospitalStartDate(event.target.value)}
                      required
                    />
                  </div>
                </label>
                <label className="field">
                  <span>Kunlar soni</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={hospitalDays}
                    onChange={(event) => setHospitalDays(Math.min(60, Math.max(1, Number(event.target.value) || 1)))}
                    required
                  />
                </label>
                <label className="field">
                  <span>Joy raqami</span>
                  <select
                    value={hospitalPlaceNumber}
                    onChange={(event) => setHospitalPlaceNumber(Number(event.target.value))}
                    disabled={selectableHospitalPlaces.length === 0}
                    required
                  >
                    {selectableHospitalPlaces.length > 0 ? selectableHospitalPlaces.map((placeNumber) => (
                      <option key={placeNumber} value={placeNumber}>{placeNumber}-joy</option>
                    )) : <option value="">Bo'sh joy qolmagan</option>}
                  </select>
                </label>
                <label className="field">
                  <span>Tanlangan davr</span>
                  <div className="field-box">
                    <ClockIcon />
                    <output>{hospitalStartDate} - {addDaysToDate(hospitalStartDate, hospitalDays)}</output>
                  </div>
                </label>
                <label className="field">
                  <span>Ism</span>
                  <div className="field-box">
                    <UserGroupIcon />
                    <input value={patientName} onChange={(event) => setPatientName(event.target.value)} required />
                  </div>
                </label>
                <label className="field">
                  <span>Telefon</span>
                  <div className="field-box">
                    <PhoneIcon />
                    <input value={patientPhone} onChange={(event) => setPatientPhone(event.target.value)} required />
                  </div>
                </label>
                <label className="field field-full">
                  <span>Izoh</span>
                  <textarea
                    rows={3}
                    value={hospitalNotes}
                    onChange={(event) => setHospitalNotes(event.target.value)}
                    placeholder="Holatingiz yoki qo'shimcha ehtiyojingizni yozing"
                  />
                </label>
              </div>

              <div className="appointment-review-banner">
                <strong>{selectedHospitalRoom ? `${selectedHospitalRoom.price}/kun` : "Xona tanlanmagan"}</strong>
                <p>
                  {selectableHospitalPlaces.length > 0
                    ? `${selectableHospitalPlaces.length} ta bo'sh joy bor. Tanlangan kunlar va joy qayta bron qilinmaydi.`
                    : "Tanlangan xona va kunlarda bo'sh joy yo'q. Xona, sana yoki kunlarni o'zgartiring."}
                </p>
              </div>

              <div className="modal-actions">
                <button type="button" className="button button-ghost" onClick={closeHospitalBookingModal}>
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={isSubmitting || !selectedHospitalRoom || selectableHospitalPlaces.length === 0}
                >
                  {isSubmitting ? "Yuborilmoqda..." : "Xona bron qilish"}
                  <CheckIcon />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!isAnyModalOpen && <EmergencyCallButton />}
    </div>
  );
};

export default User;
