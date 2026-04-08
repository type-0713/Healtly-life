/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { inferUzbekRegion, isUzbekRegion } from "../lib/regions";
import {
  DEFAULT_TIME_SLOTS,
  hasAppointmentStarted,
  isSundayDate,
  isPastBookingDate,
  isPastTimeSlotForDate,
  isTimeSlotAllowed,
} from "../lib/schedule";

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  region: string;
  rating: number;
  reviewCount: number;
  experience: string;
  price: string;
  availability: string;
  clinic: string;
  address: string;
  mapQuery: string;
  bio: string;
  availableSlots: string[];
};

export type Appointment = {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  region: string;
  clinic: string;
  address: string;
  mapQuery: string;
  date: string;
  time: string;
  patientName: string;
  patientKey: string;
  patientEmail: string;
  patientPhone: string;
  notes: string;
  status: "Tasdiqlandi" | "Kutilmoqda" | "Yakunlandi" | "Bekor qilindi";
  createdAt: string;
  cancelledAt?: string;
  reviewRating?: number;
  reviewComment?: string;
  reviewedAt?: string;
};

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  city: string;
  birthDate: string;
  about: string;
};

export type ThemeMode = "dark" | "light";
export type AccountRole = "user" | "admin" | null;

type NewDoctorInput = Omit<Doctor, "id" | "rating" | "reviewCount">;
type SeedDoctor = Omit<Doctor, "rating" | "reviewCount">;

type BookingInput = {
  doctorId: string;
  date: string;
  time: string;
  patientName: string;
  patientKey: string;
  patientEmail: string;
  patientPhone: string;
  notes: string;
};

type AppContextValue = {
  doctors: Doctor[];
  appointments: Appointment[];
  profile: UserProfile;
  currentUser: FirebaseUser | null;
  accountRole: AccountRole;
  localUserEmail: string;
  localUserId: string;
  theme: ThemeMode;
  authLoading: boolean;
  isUserAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  addDoctor: (doctor: NewDoctorInput) => Promise<void>;
  removeDoctor: (doctorId: string) => Promise<void>;
  bookAppointment: (input: BookingInput) => Promise<Appointment | null>;
  updateAppointmentStatus: (
    appointmentId: string,
    status: Appointment["status"],
  ) => Promise<void>;
  submitDoctorReview: (
    appointmentId: string,
    rating: number,
    comment: string,
  ) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  signInWithCredentials: (email: string, password: string) => Promise<void>;
  registerWithCredentials: (email: string, password: string) => Promise<void>;
  signInAsAdmin: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signOutUser: () => Promise<void>;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
};

const defaultDoctors: SeedDoctor[] = [
  {
    id: "default-alisher-karimov",
    name: "Dr. Alisher Karimov",
    specialty: "Kardiolog",
    region: "Toshkent shahri",
    experience: "16 yil",
    price: "180 000 so'm",
    availability: "Bugun, 14:30",
    clinic: "MedElite Heart Center",
    address: "Toshkent shahri, Yunusobod tumani, Amir Temur ko'chasi 108",
    mapQuery: "Tashkent, Amir Temur Avenue 108, MedElite Heart Center",
    bio: "Yurak-qon tomir kasalliklari bo'yicha premium konsultatsiya va monitoring.",
    availableSlots: ["09:00", "10:00", "14:30", "16:00", "17:00"],
  },
  {
    id: "default-gulsara-niyazova",
    name: "Dr. Gulsara Niyazova",
    specialty: "Terapevt",
    region: "Toshkent shahri",
    experience: "12 yil",
    price: "140 000 so'm",
    availability: "Bugun, 16:00",
    clinic: "MedElite Family Care",
    address: "Toshkent shahri, Mirzo Ulug'bek tumani, Buyuk Ipak Yo'li 215",
    mapQuery: "Tashkent, Buyuk Ipak Yoli 215, MedElite Family Care",
    bio: "Kundalik sog'liq nazorati va oilaviy davolash rejalarini boshqaradi.",
    availableSlots: ["09:30", "11:00", "13:30", "16:00", "17:30"],
  },
  {
    id: "default-rustam-abdullayev",
    name: "Dr. Rustam Abdullayev",
    specialty: "Ortoped",
    region: "Toshkent shahri",
    experience: "18 yil",
    price: "210 000 so'm",
    availability: "Ertaga, 09:30",
    clinic: "MedElite Motion Lab",
    address: "Toshkent shahri, Chilonzor tumani, Bunyodkor shoh ko'chasi 47",
    mapQuery: "Tashkent, Bunyodkor Avenue 47, MedElite Motion Lab",
    bio: "Bo'g'im, umurtqa va reabilitatsiya bo'yicha keng tajribaga ega.",
    availableSlots: ["09:30", "10:30", "14:00", "15:30", "17:00"],
  },
];

const defaultProfile: UserProfile = {
  name: "",
  email: "",
  phone: "",
  city: "",
  birthDate: "",
  about: "",
};

const USER_SESSION_KEY = "medelite-user-session";
const USER_ID_KEY = "medelite-user-id";
const THEME_KEY = "medelite-theme";
const ADMIN_SESSION_KEY = "medelite-admin-session";
const ADMIN_LOGIN = "admin13579";
const ADMIN_PASSWORD = "2486";

const AppContext = createContext<AppContextValue | null>(null);

const doctorCollection = collection(db, "doctors");
const appointmentCollection = collection(db, "appointments");
const roleCollection = collection(db, "accountRoles");
const createLocalUserId = () =>
  `local-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

const normalizeDoctorText = (value: unknown) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const normalizeDoctorIdentity = (doctor: Partial<Pick<Doctor, "name" | "specialty" | "clinic" | "address">>) =>
  [
    normalizeDoctorText(doctor.name),
    normalizeDoctorText(doctor.specialty),
    normalizeDoctorText(doctor.clinic),
    normalizeDoctorText(doctor.address),
  ].join("::");

const sanitizeDoctorSlots = (slots: unknown, fallbackSlots: string[] = DEFAULT_TIME_SLOTS) => {
  const slotSet = new Set(
    (Array.isArray(slots) ? slots : fallbackSlots)
      .map((slot) => String(slot))
      .filter((slot) => isTimeSlotAllowed(slot)),
  );
  const orderedSlots = DEFAULT_TIME_SLOTS.filter((slot) => slotSet.has(slot));

  return orderedSlots.length ? orderedSlots : fallbackSlots;
};

const areSlotsEqual = (left: string[], right: string[]) =>
  left.length === right.length && left.every((slot, index) => slot === right[index]);

const buildAvailabilityLabel = (slots: string[], fallback?: string) => {
  const normalizedFallback = fallback?.trim();

  if (normalizedFallback) {
    return normalizedFallback;
  }

  return slots.length
    ? `Bo'sh slotlar: ${slots.slice(0, 2).join(", ")}`
    : "Bo'sh slotlar mavjud";
};

const normalizeDoctorRegion = (
  region: unknown,
  address: unknown,
  clinic: unknown,
  mapQuery: unknown,
) => {
  const directRegion = String(region ?? "").trim();

  if (isUzbekRegion(directRegion)) {
    return directRegion;
  }

  return (
    inferUzbekRegion(String(address ?? ""), String(clinic ?? ""), String(mapQuery ?? "")) ||
    "Toshkent shahri"
  );
};

const toDoctor = (id: string, data: Record<string, unknown>): Doctor => {
  const reviewCount = Number(data.reviewCount ?? 0);
  const rawRating = Number(data.rating ?? 5);
  const availableSlots = sanitizeDoctorSlots(data.availableSlots);

  return {
    id,
    name: String(data.name ?? ""),
    specialty: String(data.specialty ?? ""),
    region: normalizeDoctorRegion(
      data.region,
      data.address,
      data.clinic,
      data.mapQuery,
    ),
    rating: reviewCount > 0 ? rawRating : 5,
    reviewCount,
    experience: String(data.experience ?? ""),
    price: String(data.price ?? ""),
    availability: buildAvailabilityLabel(availableSlots, String(data.availability ?? "")),
    clinic: String(data.clinic ?? ""),
    address: String(data.address ?? data.clinic ?? ""),
    mapQuery: String(data.mapQuery ?? data.address ?? data.clinic ?? ""),
    bio: String(data.bio ?? ""),
    availableSlots,
  };
};

const toAppointment = (id: string, data: Record<string, unknown>): Appointment => ({
  id,
  doctorId: String(data.doctorId ?? ""),
  doctorName: String(data.doctorName ?? ""),
  specialty: String(data.specialty ?? ""),
  region:
    String(data.region ?? "").trim() ||
    inferUzbekRegion(
      String(data.address ?? ""),
      String(data.clinic ?? ""),
      String(data.mapQuery ?? ""),
    ) ||
    "Toshkent shahri",
  clinic: String(data.clinic ?? ""),
  address: String(data.address ?? data.clinic ?? ""),
  mapQuery: String(data.mapQuery ?? data.address ?? data.clinic ?? ""),
  date: String(data.date ?? ""),
  time: String(data.time ?? ""),
  patientName: String(data.patientName ?? ""),
  patientKey: String(data.patientKey ?? ""),
  patientEmail: String(data.patientEmail ?? ""),
  patientPhone: String(data.patientPhone ?? ""),
  notes: String(data.notes ?? ""),
  status: (data.status as Appointment["status"]) ?? "Kutilmoqda",
  createdAt: String(data.createdAt ?? ""),
  cancelledAt: String(data.cancelledAt ?? ""),
  reviewRating:
    typeof data.reviewRating === "number" ? Number(data.reviewRating) : undefined,
  reviewComment: String(data.reviewComment ?? ""),
  reviewedAt: String(data.reviewedAt ?? ""),
});

const getRoleRef = (uid: string) => doc(roleCollection, uid);

const getStoredRole = async (uid: string) => {
  const snapshot = await getDoc(getRoleRef(uid));

  if (!snapshot.exists()) {
    return null;
  }

  const rawRole = String(snapshot.data().role ?? "");
  return rawRole === "admin" ? "admin" : rawRole === "user" ? "user" : null;
};

const ensureRole = async (uid: string, fallbackRole: Exclude<AccountRole, null>) => {
  const currentRole = await getStoredRole(uid);

  if (currentRole) {
    return currentRole;
  }

  await setDoc(getRoleRef(uid), { role: fallbackRole }, { merge: true });
  return fallbackRole;
};

const syncDefaultDoctors = async () => {
  const [doctorSnapshot, appointmentSnapshot] = await Promise.all([
    getDocs(doctorCollection),
    getDocs(appointmentCollection),
  ]);
  const doctorEntries = doctorSnapshot.docs.map((item) => ({
    id: item.id,
    ref: item.ref,
    data: item.data() as Record<string, unknown>,
  }));
  const appointmentEntries = appointmentSnapshot.docs.map((item) => ({
    ref: item.ref,
    data: item.data() as Record<string, unknown>,
  }));
  const batch = writeBatch(db);
  let hasWrites = false;

  for (const defaultDoctor of defaultDoctors) {
    const doctorIdentity = normalizeDoctorIdentity(defaultDoctor);
    const matchingDoctors = doctorEntries.filter(
      (entry) => normalizeDoctorIdentity(entry.data as Partial<Doctor>) === doctorIdentity,
    );
    const reviewCount = matchingDoctors.reduce(
      (sum, entry) => sum + Number(entry.data.reviewCount ?? 0),
      0,
    );
    const ratingPoints = matchingDoctors.reduce((sum, entry) => {
      const entryReviewCount = Number(entry.data.reviewCount ?? 0);
      const entryRating = Number(entry.data.rating ?? 5);

      return sum + entryRating * entryReviewCount;
    }, 0);
    const slotSet = new Set(defaultDoctor.availableSlots);

    matchingDoctors.forEach((entry) => {
      sanitizeDoctorSlots(entry.data.availableSlots, []).forEach((slot) => slotSet.add(slot));
    });

    const mergedSlots = DEFAULT_TIME_SLOTS.filter((slot) => slotSet.has(slot));
    const canonicalDoctor = {
      ...defaultDoctor,
      availability: buildAvailabilityLabel(mergedSlots, defaultDoctor.availability),
      availableSlots: mergedSlots,
      rating: reviewCount > 0 ? Number((ratingPoints / reviewCount).toFixed(1)) : 5,
      reviewCount,
    };
    const existingDefaultDoctor = matchingDoctors.find((entry) => entry.id === defaultDoctor.id);
    const currentDefaultSlots = existingDefaultDoctor
      ? sanitizeDoctorSlots(existingDefaultDoctor.data.availableSlots)
      : [];
    const currentDefaultAvailability = existingDefaultDoctor
      ? String(existingDefaultDoctor.data.availability ?? "").trim()
      : "";
    const currentDefaultReviewCount = existingDefaultDoctor
      ? Number(existingDefaultDoctor.data.reviewCount ?? 0)
      : -1;
    const currentDefaultRating = existingDefaultDoctor
      ? Number(existingDefaultDoctor.data.rating ?? 5)
      : -1;
    const hasBaseFieldMismatch =
      !existingDefaultDoctor ||
      normalizeDoctorIdentity(existingDefaultDoctor.data as Partial<Doctor>) !== doctorIdentity ||
      String(existingDefaultDoctor.data.region ?? "").trim() !== defaultDoctor.region ||
      String(existingDefaultDoctor.data.experience ?? "").trim() !== defaultDoctor.experience ||
      String(existingDefaultDoctor.data.price ?? "").trim() !== defaultDoctor.price ||
      String(existingDefaultDoctor.data.mapQuery ?? "").trim() !== defaultDoctor.mapQuery ||
      String(existingDefaultDoctor.data.bio ?? "").trim() !== defaultDoctor.bio;
    const needsDefaultSync =
      hasBaseFieldMismatch ||
      matchingDoctors.some((entry) => entry.id !== defaultDoctor.id) ||
      !areSlotsEqual(currentDefaultSlots, mergedSlots) ||
      currentDefaultAvailability !== canonicalDoctor.availability ||
      currentDefaultReviewCount !== canonicalDoctor.reviewCount ||
      Number(currentDefaultRating.toFixed(1)) !== canonicalDoctor.rating;

    if (needsDefaultSync) {
      batch.set(doc(db, "doctors", defaultDoctor.id), canonicalDoctor, { merge: true });
      hasWrites = true;
    }

    matchingDoctors.forEach((entry) => {
      if (entry.id === defaultDoctor.id) {
        return;
      }

      appointmentEntries.forEach((appointment) => {
        if (String(appointment.data.doctorId ?? "") !== entry.id) {
          return;
        }

        batch.update(appointment.ref, {
          doctorId: defaultDoctor.id,
          doctorName: defaultDoctor.name,
          specialty: defaultDoctor.specialty,
          region: defaultDoctor.region,
          clinic: defaultDoctor.clinic,
          address: defaultDoctor.address,
          mapQuery: defaultDoctor.mapQuery,
        });
        hasWrites = true;
      });

      batch.delete(entry.ref);
      hasWrites = true;
    });
  }

  if (hasWrites) {
    await batch.commit();
  }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const initialLocalEmail =
    typeof window === "undefined" ? "" : window.localStorage.getItem(USER_SESSION_KEY) ?? "";
  const initialLocalUserId =
    typeof window === "undefined"
      ? ""
      : window.localStorage.getItem(USER_ID_KEY) ??
        (initialLocalEmail ? createLocalUserId() : "");
  const initialTheme: ThemeMode =
    typeof window === "undefined"
      ? "dark"
      : ((window.localStorage.getItem(THEME_KEY) as ThemeMode | null) ?? "dark");
  const initialAdminSession =
    typeof window === "undefined"
      ? false
      : window.localStorage.getItem(ADMIN_SESSION_KEY) === "active";
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    ...defaultProfile,
    email: initialLocalEmail || defaultProfile.email,
  });
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [accountRole, setAccountRole] = useState<AccountRole>(null);
  const [localUserEmail, setLocalUserEmail] = useState(initialLocalEmail);
  const [localUserId, setLocalUserId] = useState(initialLocalUserId);
  const [adminSessionActive, setAdminSessionActive] = useState(initialAdminSession);
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme);
  const [authLoading, setAuthLoading] = useState(true);

  const isAdminAuthenticated = adminSessionActive;
  const isUserAuthenticated = Boolean(currentUser || (localUserEmail && localUserId));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (localUserEmail && localUserId) {
      window.localStorage.setItem(USER_ID_KEY, localUserId);
    }
  }, [localUserEmail, localUserId]);

  useEffect(() => {
    if (adminSessionActive) {
      window.localStorage.setItem(ADMIN_SESSION_KEY, "active");
      return;
    }

    window.localStorage.removeItem(ADMIN_SESSION_KEY);
  }, [adminSessionActive]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setAdminSessionActive(false);
      }
      if (!user) {
        if (!adminSessionActive) {
          setAccountRole(null);
        }
        setProfile(defaultProfile);
      }
      setAuthLoading(false);
    });

    return unsubscribe;
  }, [adminSessionActive]);

  useEffect(() => {
    void syncDefaultDoctors().catch(() => undefined);

    const unsubscribe = onSnapshot(
      query(doctorCollection, orderBy("name", "asc")),
      (snapshot) => {
        setDoctors(snapshot.docs.map((item) => toDoctor(item.id, item.data())));
      },
      () => {
        setDoctors([]);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(appointmentCollection, orderBy("createdAt", "desc")),
      (snapshot) => {
        setAppointments(snapshot.docs.map((item) => toAppointment(item.id, item.data())));
      },
      () => {
        setAppointments([]);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const roleRef = getRoleRef(currentUser.uid);

    const unsubscribe = onSnapshot(roleRef, (snapshot) => {
      if (!snapshot.exists()) {
        setAccountRole(null);
        return;
      }

      const rawRole = String(snapshot.data().role ?? "");
      setAccountRole(rawRole === "admin" ? "admin" : "user");
    });

    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser && !localUserEmail) {
      return;
    }

    const profileRef = doc(db, "profiles", currentUser ? currentUser.uid : localUserId);
    const baseProfile: UserProfile = {
      name: currentUser?.displayName ?? defaultProfile.name,
      email: currentUser?.email ?? localUserEmail ?? defaultProfile.email,
      phone: currentUser?.phoneNumber ?? defaultProfile.phone,
      city: defaultProfile.city,
      birthDate: defaultProfile.birthDate,
      about: defaultProfile.about,
    };

    void setDoc(profileRef, baseProfile, { merge: true }).catch(() => undefined);

    const unsubscribe = onSnapshot(profileRef, (snapshot) => {
      const data = snapshot.data() as Partial<UserProfile> | undefined;
      setProfile({ ...baseProfile, ...data });
    });

    return unsubscribe;
  }, [currentUser, localUserEmail, localUserId]);

  const addDoctorHandler = useCallback(async (doctor: NewDoctorInput) => {
    const normalizedDoctor = {
      name: doctor.name.trim(),
      specialty: doctor.specialty.trim(),
      region: normalizeDoctorRegion(
        doctor.region,
        doctor.address,
        doctor.clinic,
        doctor.mapQuery,
      ),
      experience: doctor.experience.trim(),
      price: doctor.price.trim(),
      clinic: doctor.clinic.trim(),
      address: doctor.address.trim(),
      mapQuery: doctor.mapQuery.trim() || doctor.address.trim() || doctor.clinic.trim(),
      bio: doctor.bio.trim(),
    };
    const sortedSlots = sanitizeDoctorSlots(doctor.availableSlots);
    const doctorIdentity = normalizeDoctorIdentity(normalizedDoctor);
    const snapshot = await getDocs(doctorCollection);
    const duplicateDoctor = snapshot.docs.find(
      (item) =>
        normalizeDoctorIdentity(item.data() as Partial<Doctor>) === doctorIdentity,
    );

    if (duplicateDoctor) {
      throw new Error("Bu shifokor allaqachon ro'yxatda mavjud.");
    }

    await addDoc(doctorCollection, {
      ...normalizedDoctor,
      availability: buildAvailabilityLabel(sortedSlots, doctor.availability),
      availableSlots: sortedSlots,
      rating: 5,
      reviewCount: 0,
    });
  }, []);

  const removeDoctorHandler = useCallback(async (doctorId: string) => {
    await deleteDoc(doc(db, "doctors", doctorId));
  }, []);

  const bookAppointmentHandler = useCallback(
    async (input: BookingInput) => {
      const doctor = doctors.find((item) => item.id === input.doctorId);

      if (!doctor) {
        return null;
      }

      if (isSundayDate(input.date)) {
        throw new Error("Yakshanba kuni bron qilib bo'lmaydi. Iltimos, boshqa sanani tanlang.");
      }

      if (isPastBookingDate(input.date)) {
        throw new Error("O'tib ketgan sana uchun bron qilib bo'lmaydi.");
      }

      if (!isTimeSlotAllowed(input.time) || !doctor.availableSlots.includes(input.time)) {
        throw new Error("Tanlangan vaqt ushbu shifokor uchun mavjud emas.");
      }

      if (isPastTimeSlotForDate(input.date, input.time)) {
        throw new Error("Tanlangan vaqt allaqachon o'tib ketgan. Iltimos, boshqa slotni tanlang.");
      }

      const slotId = `${doctor.id}_${input.date}_${input.time.replace(":", "-")}`;
      const appointmentRef = doc(db, "appointments", slotId);

      const payload = {
        id: slotId,
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        region: doctor.region,
        clinic: doctor.clinic,
        address: doctor.address,
        mapQuery: doctor.mapQuery,
        date: input.date,
        time: input.time,
        patientName: input.patientName,
        patientKey: input.patientKey,
        patientEmail: input.patientEmail,
        patientPhone: input.patientPhone,
        notes: input.notes,
        status: "Tasdiqlandi" as const,
        createdAt: new Date().toISOString(),
        cancelledAt: "",
      };

      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(appointmentRef);

        if (snapshot.exists()) {
          const existing = snapshot.data() as Partial<Appointment>;

          if (existing.status !== "Bekor qilindi") {
            throw new Error("Bu vaqt oralig'i allaqachon band qilingan.");
          }
        }

        transaction.set(appointmentRef, payload);
      });

      return payload;
    },
    [doctors],
  );

  const updateAppointmentStatusHandler = useCallback(
    async (appointmentId: string, status: Appointment["status"]) => {
      const appointmentRef = doc(db, "appointments", appointmentId);
      const actorKey = (currentUser?.uid ?? localUserId).trim().toLowerCase();
      const actorEmail = (currentUser?.email ?? localUserEmail ?? profile.email).trim().toLowerCase();

      await runTransaction(db, async (transaction) => {
        const appointmentSnapshot = await transaction.get(appointmentRef);

        if (!appointmentSnapshot.exists()) {
          throw new Error("Qabul topilmadi.");
        }

        const appointmentData = appointmentSnapshot.data() as Partial<Appointment>;
        const ownerKey = String(appointmentData.patientKey ?? "").trim().toLowerCase();
        const ownerEmail = String(appointmentData.patientEmail ?? "").trim().toLowerCase();

        if ((ownerKey && actorKey !== ownerKey) || (!ownerKey && ownerEmail && actorEmail !== ownerEmail)) {
          throw new Error("Siz faqat o'zingizning qabulingizni boshqara olasiz.");
        }

        const payload =
          status === "Bekor qilindi"
            ? { status, cancelledAt: new Date().toISOString() }
            : { status, cancelledAt: "" };

        transaction.update(appointmentRef, payload);
      });
    },
    [currentUser?.email, currentUser?.uid, localUserEmail, localUserId, profile.email],
  );

  const submitDoctorReviewHandler = useCallback(
    async (appointmentId: string, rating: number, comment: string) => {
      const normalizedRating = Math.min(5, Math.max(1, Math.round(rating)));
      const trimmedComment = comment.trim();
      const appointmentRef = doc(db, "appointments", appointmentId);
      const actorKey = (currentUser?.uid ?? localUserId).trim().toLowerCase();
      const actorEmail = (currentUser?.email ?? localUserEmail ?? profile.email).trim().toLowerCase();

      await runTransaction(db, async (transaction) => {
        const appointmentSnapshot = await transaction.get(appointmentRef);

        if (!appointmentSnapshot.exists()) {
          throw new Error("Qabul topilmadi.");
        }

        const appointmentData = appointmentSnapshot.data() as Partial<Appointment>;
        const ownerKey = String(appointmentData.patientKey ?? "").trim().toLowerCase();
        const ownerEmail = String(appointmentData.patientEmail ?? "").trim().toLowerCase();

        if ((ownerKey && actorKey !== ownerKey) || (!ownerKey && ownerEmail && actorEmail !== ownerEmail)) {
          throw new Error("Siz faqat o'zingizning qabulingiz uchun baho bera olasiz.");
        }

        if (appointmentData.reviewRating) {
          throw new Error("Bu qabul uchun baho allaqachon yuborilgan.");
        }

        if (!hasAppointmentStarted(String(appointmentData.date ?? ""), String(appointmentData.time ?? ""))) {
          throw new Error("Qabul vaqti hali kelmagan. Bahoni qabul tugagach yuborishingiz mumkin.");
        }

        if (!appointmentData.doctorId) {
          throw new Error("Shifokor ma'lumoti topilmadi.");
        }

        if (appointmentData.status === "Bekor qilindi") {
          throw new Error("Bekor qilingan qabulga baho berib bo'lmaydi.");
        }

        const doctorRef = doc(db, "doctors", appointmentData.doctorId);
        const doctorSnapshot = await transaction.get(doctorRef);

        if (!doctorSnapshot.exists()) {
          throw new Error("Shifokor topilmadi.");
        }

        const doctorData = doctorSnapshot.data() as Partial<Doctor>;
        const currentReviewCount = Number(doctorData.reviewCount ?? 0);
        const currentRating = Number(doctorData.rating ?? 5);
        const nextReviewCount = currentReviewCount + 1;
        const nextRating =
          (currentRating * currentReviewCount + normalizedRating) / nextReviewCount;

        transaction.update(appointmentRef, {
          status: "Yakunlandi",
          reviewRating: normalizedRating,
          reviewComment: trimmedComment,
          reviewedAt: new Date().toISOString(),
        });

        transaction.update(doctorRef, {
          rating: Number(nextRating.toFixed(1)),
          reviewCount: nextReviewCount,
        });
      });
    },
    [currentUser?.email, currentUser?.uid, localUserEmail, localUserId, profile.email],
  );

  const updateProfileHandler = useCallback(
    async (patch: Partial<UserProfile>) => {
      const nextEmail = patch.email?.trim() ?? localUserEmail;
      const nextLocalProfileId = localUserId || (nextEmail ? createLocalUserId() : "");
      const profileDocId = currentUser
        ? currentUser.uid
        : nextLocalProfileId;

      setProfile((current) => ({ ...current, ...patch }));

      if (!currentUser && patch.email) {
        setLocalUserEmail(nextEmail);
        window.localStorage.setItem(USER_SESSION_KEY, nextEmail);
      }

      if (!currentUser && nextLocalProfileId && nextLocalProfileId !== localUserId) {
        setLocalUserId(nextLocalProfileId);
        window.localStorage.setItem(USER_ID_KEY, nextLocalProfileId);
      }

      if (!profileDocId) {
        return;
      }

      await setDoc(doc(db, "profiles", profileDocId), patch, { merge: true });
    },
    [currentUser, localUserEmail, localUserId],
  );

  const signInWithCredentialsHandler = useCallback(async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      throw new Error("Email va parolni to'liq kiriting.");
    }

    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    setAccountRole(await ensureRole(credential.user.uid, "user"));
    setAdminSessionActive(false);
    setLocalUserEmail("");
    setLocalUserId("");
    window.localStorage.removeItem(USER_SESSION_KEY);
    window.localStorage.removeItem(USER_ID_KEY);
  }, []);

  const registerWithCredentialsHandler = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password.trim()) {
      throw new Error("Email va parolni to'liq kiriting.");
    }

    const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);

    await setDoc(getRoleRef(credential.user.uid), { role: "user" }, { merge: true });
    setAccountRole("user");
    setAdminSessionActive(false);
    setLocalUserEmail("");
    setLocalUserId("");
    window.localStorage.removeItem(USER_SESSION_KEY);
    window.localStorage.removeItem(USER_ID_KEY);
  }, []);

  const signInAsAdminHandler = useCallback(async (email: string, password: string) => {
    const normalizedLogin = email.trim();
    const normalizedPassword = password.trim();

    if (!normalizedLogin || !normalizedPassword) {
      throw new Error("Admin login va parolini to'liq kiriting.");
    }

    if (normalizedLogin !== ADMIN_LOGIN || normalizedPassword !== ADMIN_PASSWORD) {
      throw new Error("Admin login yoki paroli noto'g'ri.");
    }

    if (auth.currentUser) {
      await signOut(auth);
    }

    setCurrentUser(null);
    setProfile(defaultProfile);
    setAccountRole("admin");
    setAdminSessionActive(true);
    setLocalUserEmail("");
    setLocalUserId("");
    window.localStorage.removeItem(USER_SESSION_KEY);
    window.localStorage.removeItem(USER_ID_KEY);
  }, []);

  const signInWithGoogleHandler = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const credential = await signInWithPopup(auth, provider);
    await ensureRole(credential.user.uid, "user");
    setAdminSessionActive(false);
  }, []);

  const signInWithAppleHandler = useCallback(async () => {
    const provider = new OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");
    const credential = await signInWithPopup(auth, provider);
    await ensureRole(credential.user.uid, "user");
    setAdminSessionActive(false);
  }, []);

  const signInWithMicrosoftHandler = useCallback(async () => {
    const provider = new OAuthProvider("microsoft.com");
    provider.setCustomParameters({ prompt: "select_account", tenant: "common" });
    const credential = await signInWithPopup(auth, provider);
    await ensureRole(credential.user.uid, "user");
    setAdminSessionActive(false);
  }, []);

  const signOutHandler = useCallback(async () => {
    setAccountRole(null);
    setAdminSessionActive(false);
    setLocalUserEmail("");
    setLocalUserId("");
    window.localStorage.removeItem(USER_SESSION_KEY);
    window.localStorage.removeItem(USER_ID_KEY);
    window.localStorage.removeItem(ADMIN_SESSION_KEY);

    if (auth.currentUser) {
      await signOut(auth);
    }

    setProfile(defaultProfile);
  }, []);

  const setThemeHandler = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
  }, []);

  const toggleThemeHandler = useCallback(() => {
    setThemeState((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      doctors,
      appointments,
      profile,
      currentUser,
      accountRole,
      localUserEmail,
      localUserId,
      theme,
      authLoading,
      isUserAuthenticated,
      isAdminAuthenticated,
      addDoctor: addDoctorHandler,
      removeDoctor: removeDoctorHandler,
      bookAppointment: bookAppointmentHandler,
      updateAppointmentStatus: updateAppointmentStatusHandler,
      submitDoctorReview: submitDoctorReviewHandler,
      updateProfile: updateProfileHandler,
      signInWithCredentials: signInWithCredentialsHandler,
      registerWithCredentials: registerWithCredentialsHandler,
      signInAsAdmin: signInAsAdminHandler,
      signInWithGoogle: signInWithGoogleHandler,
      signInWithApple: signInWithAppleHandler,
      signInWithMicrosoft: signInWithMicrosoftHandler,
      signOutUser: signOutHandler,
      toggleTheme: toggleThemeHandler,
      setTheme: setThemeHandler,
    }),
    [
      addDoctorHandler,
      accountRole,
      appointments,
      authLoading,
      bookAppointmentHandler,
      currentUser,
      doctors,
      isAdminAuthenticated,
      isUserAuthenticated,
      localUserEmail,
      localUserId,
      profile,
      removeDoctorHandler,
      registerWithCredentialsHandler,
      signInAsAdminHandler,
      signInWithCredentialsHandler,
      signInWithAppleHandler,
      signInWithGoogleHandler,
      signInWithMicrosoftHandler,
      signOutHandler,
      submitDoctorReviewHandler,
      theme,
      setThemeHandler,
      toggleThemeHandler,
      updateAppointmentStatusHandler,
      updateProfileHandler,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }

  return context;
};
