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
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  writeBatch,
  collection,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { inferUzbekRegion, isUzbekRegion } from "../lib/regions";
import {
  DEFAULT_TIME_SLOTS,
  getTodayInTashkent,
  hasAppointmentStarted,
  isPastBookingDate,
  isPastTimeSlotForDate,
  isTimeSlotAllowed,
} from "../lib/schedule";

export type DoctorApprovalStatus = "pending" | "approved" | "rejected";
export type AppointmentStatus =
  | "Tasdiqlandi"
  | "Kutilmoqda"
  | "Yakunlandi"
  | "Bekor qilindi"
  | "Rad etildi";

export type Doctor = {
  id: string;
  ownerUid: string;
  ownerEmail: string;
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
  approvalStatus: DoctorApprovalStatus;
  profileCompleted: boolean;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
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
  status: AppointmentStatus;
  createdAt: string;
  requestVisibleAt: string;
  doctorAssignedAt?: string;
  handledAt?: string;
  cancelledAt?: string;
  rejectedReason?: string;
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
export type AccountRole = "user" | "admin" | "doctor" | null;

export type DoctorProfileInput = {
  name: string;
  specialty: string;
  region: string;
  experience: string;
  price: string;
  clinic: string;
  address: string;
  mapQuery: string;
  bio: string;
  availableSlots: string[];
};

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
  doctorRoster: Doctor[];
  appointments: Appointment[];
  profile: UserProfile;
  currentUser: FirebaseUser | null;
  accountRole: AccountRole;
  currentDoctor: Doctor | null;
  localUserEmail: string;
  localUserId: string;
  theme: ThemeMode;
  authLoading: boolean;
  isUserAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  isDoctorAuthenticated: boolean;
  doctorApprovalStatus: DoctorApprovalStatus | null;
  bookAppointment: (input: BookingInput) => Promise<Appointment | null>;
  removeDoctor: (doctorId: string) => Promise<void>;
  setDoctorApproval: (doctorId: string, status: DoctorApprovalStatus) => Promise<void>;
  updateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => Promise<void>;
  updateDoctorAppointmentStatus: (
    appointmentId: string,
    status: Extract<AppointmentStatus, "Tasdiqlandi" | "Rad etildi" | "Yakunlandi">,
    reason?: string,
  ) => Promise<void>;
  submitDoctorReview: (
    appointmentId: string,
    rating: number,
    comment: string,
  ) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  updateDoctorProfile: (patch: DoctorProfileInput) => Promise<void>;
  toggleDoctorOnlineStatus: (isOnline: boolean) => Promise<void>;
  signInWithCredentials: (email: string, password: string) => Promise<void>;
  registerWithCredentials: (email: string, password: string) => Promise<void>;
  registerDoctorWithCredentials: (email: string, password: string) => Promise<void>;
  signInAsAdmin: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signOutUser: () => Promise<void>;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
};

type SeedDoctor = Omit<
  Doctor,
  "rating" | "reviewCount" | "approvalStatus" | "profileCompleted" | "isOnline" | "createdAt" | "updatedAt"
>;

const defaultDoctors: SeedDoctor[] = [
  {
    id: "default-alisher-karimov",
    ownerUid: "",
    ownerEmail: "",
    name: "Dr. Alisher Karimov",
    specialty: "Kardiolog",
    region: "Toshkent shahri",
    experience: "16 yil",
    price: "180 000 so'm",
    availability: "24/7 navbat qabul qiladi",
    clinic: "MedElite Heart Center",
    address: "Toshkent shahri, Yunusobod tumani, Amir Temur ko'chasi 108",
    mapQuery: "Tashkent, Amir Temur Avenue 108, MedElite Heart Center",
    bio: "Yurak-qon tomir kasalliklari bo'yicha premium konsultatsiya va monitoring.",
    availableSlots: DEFAULT_TIME_SLOTS,
  },
  {
    id: "default-gulsara-niyazova",
    ownerUid: "",
    ownerEmail: "",
    name: "Dr. Gulsara Niyazova",
    specialty: "Terapevt",
    region: "Toshkent shahri",
    experience: "12 yil",
    price: "140 000 so'm",
    availability: "24/7 navbat qabul qiladi",
    clinic: "MedElite Family Care",
    address: "Toshkent shahri, Mirzo Ulug'bek tumani, Buyuk Ipak Yo'li 215",
    mapQuery: "Tashkent, Buyuk Ipak Yoli 215, MedElite Family Care",
    bio: "Kundalik sog'liq nazorati va oilaviy davolash rejalarini boshqaradi.",
    availableSlots: DEFAULT_TIME_SLOTS,
  },
  {
    id: "default-rustam-abdullayev",
    ownerUid: "",
    ownerEmail: "",
    name: "Dr. Rustam Abdullayev",
    specialty: "Ortoped",
    region: "Toshkent shahri",
    experience: "18 yil",
    price: "210 000 so'm",
    availability: "24/7 navbat qabul qiladi",
    clinic: "MedElite Motion Lab",
    address: "Toshkent shahri, Chilonzor tumani, Bunyodkor shoh ko'chasi 47",
    mapQuery: "Tashkent, Bunyodkor Avenue 47, MedElite Motion Lab",
    bio: "Bo'g'im, umurtqa va reabilitatsiya bo'yicha keng tajribaga ega.",
    availableSlots: DEFAULT_TIME_SLOTS,
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
const DEFAULT_THEME: ThemeMode = "light";
const ADMIN_LOGIN = "admin1234";
const ADMIN_PASSWORD = "12345";

const normalizeTheme = (value: string | null): ThemeMode =>
  value === "dark" || value === "light" ? value : DEFAULT_THEME;

const AppContext = createContext<AppContextValue | null>(null);

const doctorCollection = collection(db, "doctors");
const appointmentCollection = collection(db, "appointments");
const roleCollection = collection(db, "accountRoles");

const createLocalUserId = () =>
  `local-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

const getRoleRef = (uid: string) => doc(roleCollection, uid);

const normalizeDoctorText = (value: unknown) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const normalizeDoctorIdentity = (
  doctor: Partial<Pick<Doctor, "name" | "specialty" | "clinic" | "address">>,
) =>
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

const buildAvailabilityLabel = (doctor: Pick<Doctor, "availableSlots" | "isOnline" | "approvalStatus">) => {
  if (doctor.approvalStatus !== "approved") {
    return "Admin tasdig'i kutilmoqda";
  }

  if (!doctor.isOnline) {
    return "Hozir ishda emas, lekin request qabul qiladi";
  }

  if (!doctor.availableSlots.length) {
    return "24/7 request qabul qiladi";
  }

  return `Bo'sh vaqtlar: ${doctor.availableSlots.slice(0, 3).join(", ")}`;
};

const createDoctorDraft = (uid: string, email: string) => {
  const createdAt = new Date().toISOString();
  const fallbackName = email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "Yangi doktor";
  return {
    id: uid,
    ownerUid: uid,
    ownerEmail: email,
    name: fallbackName,
    specialty: "",
    region: "Toshkent shahri",
    rating: 5,
    reviewCount: 0,
    experience: "",
    price: "",
    availability: "Admin tasdig'i kutilmoqda",
    clinic: "",
    address: "",
    mapQuery: "",
    bio: "",
    availableSlots: DEFAULT_TIME_SLOTS,
    approvalStatus: "pending" as const,
    profileCompleted: false,
    isOnline: false,
    createdAt,
    updatedAt: createdAt,
  };
};

const toDoctor = (id: string, data: Record<string, unknown>): Doctor => {
  const reviewCount = Number(data.reviewCount ?? 0);
  const rawRating = Number(data.rating ?? 5);
  const availableSlots = sanitizeDoctorSlots(data.availableSlots);
  const approvalStatus =
    String(data.approvalStatus ?? "") === "approved"
      ? "approved"
      : String(data.approvalStatus ?? "") === "rejected"
        ? "rejected"
        : "pending";
  const isOnline = Boolean(data.isOnline);
  const profileCompleted = Boolean(data.profileCompleted);

  const doctor: Doctor = {
    id,
    ownerUid: String(data.ownerUid ?? ""),
    ownerEmail: String(data.ownerEmail ?? ""),
    name: String(data.name ?? ""),
    specialty: String(data.specialty ?? ""),
    region: normalizeDoctorRegion(data.region, data.address, data.clinic, data.mapQuery),
    rating: reviewCount > 0 ? rawRating : 5,
    reviewCount,
    experience: String(data.experience ?? ""),
    price: String(data.price ?? ""),
    availability: "",
    clinic: String(data.clinic ?? ""),
    address: String(data.address ?? data.clinic ?? ""),
    mapQuery: String(data.mapQuery ?? data.address ?? data.clinic ?? ""),
    bio: String(data.bio ?? ""),
    availableSlots,
    approvalStatus,
    profileCompleted,
    isOnline,
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };

  doctor.availability = buildAvailabilityLabel(doctor);
  return doctor;
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
  status:
    String(data.status ?? "") === "Tasdiqlandi"
      ? "Tasdiqlandi"
      : String(data.status ?? "") === "Yakunlandi"
        ? "Yakunlandi"
        : String(data.status ?? "") === "Bekor qilindi"
          ? "Bekor qilindi"
          : String(data.status ?? "") === "Rad etildi"
            ? "Rad etildi"
            : "Kutilmoqda",
  createdAt: String(data.createdAt ?? ""),
  requestVisibleAt: String(data.requestVisibleAt ?? data.createdAt ?? ""),
  doctorAssignedAt: String(data.doctorAssignedAt ?? ""),
  handledAt: String(data.handledAt ?? ""),
  cancelledAt: String(data.cancelledAt ?? ""),
  rejectedReason: String(data.rejectedReason ?? ""),
  reviewRating:
    typeof data.reviewRating === "number" ? Number(data.reviewRating) : undefined,
  reviewComment: String(data.reviewComment ?? ""),
  reviewedAt: String(data.reviewedAt ?? ""),
});

const getStoredRole = async (uid: string) => {
  const snapshot = await getDoc(getRoleRef(uid));

  if (!snapshot.exists()) {
    return null;
  }

  const rawRole = String(snapshot.data().role ?? "");

  if (rawRole === "admin" || rawRole === "user" || rawRole === "doctor") {
    return rawRole;
  }

  return null;
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
  const doctorSnapshot = await getDocs(doctorCollection);
  const batch = writeBatch(db);
  let hasWrites = false;

  for (const defaultDoctor of defaultDoctors) {
    const matchingDoctor = doctorSnapshot.docs.find(
      (item) =>
        item.id === defaultDoctor.id ||
        normalizeDoctorIdentity(item.data() as Partial<Doctor>) ===
          normalizeDoctorIdentity(defaultDoctor),
    );
    const now = new Date().toISOString();

    const payload = {
      ...defaultDoctor,
      rating: Number(matchingDoctor?.data().rating ?? 5),
      reviewCount: Number(matchingDoctor?.data().reviewCount ?? 0),
      approvalStatus: "approved",
      profileCompleted: true,
      isOnline: true,
      availableSlots: DEFAULT_TIME_SLOTS,
      availability: "24/7 navbat qabul qiladi",
      createdAt: String(matchingDoctor?.data().createdAt ?? now),
      updatedAt: now,
    };

    batch.set(doc(db, "doctors", defaultDoctor.id), payload, { merge: true });

    if (matchingDoctor && matchingDoctor.id !== defaultDoctor.id) {
      batch.delete(matchingDoctor.ref);
    }

    hasWrites = true;
  }

  if (hasWrites) {
    await batch.commit();
  }
};

const getDoctorPriceValue = (price: string) => {
  const digits = price.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const initialLocalEmail =
    typeof window === "undefined" ? "" : window.localStorage.getItem(USER_SESSION_KEY) ?? "";
  const initialLocalUserId =
    typeof window === "undefined"
      ? ""
      : window.localStorage.getItem(USER_ID_KEY) ??
        (initialLocalEmail ? createLocalUserId() : "");
  const initialTheme =
    typeof window === "undefined"
      ? DEFAULT_THEME
      : normalizeTheme(window.localStorage.getItem(THEME_KEY));
  const initialAdminSession =
    typeof window === "undefined"
      ? false
      : window.localStorage.getItem(ADMIN_SESSION_KEY) === "active";

  const [doctorRoster, setDoctorRoster] = useState<Doctor[]>([]);
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

  const doctors = useMemo(
    () => doctorRoster.filter((doctor) => doctor.approvalStatus === "approved"),
    [doctorRoster],
  );

  const currentDoctor = useMemo(() => {
    if (!currentUser || accountRole !== "doctor") {
      return null;
    }

    return (
      doctorRoster.find(
        (doctor) =>
          doctor.ownerUid === currentUser.uid ||
          (currentUser.email && doctor.ownerEmail === currentUser.email),
      ) ?? null
    );
  }, [accountRole, currentUser, doctorRoster]);

  const doctorApprovalStatus = currentDoctor?.approvalStatus ?? null;
  const isAdminAuthenticated = adminSessionActive;
  const isDoctorAuthenticated = Boolean(currentUser && accountRole === "doctor");
  const isUserAuthenticated = Boolean(
    (currentUser && accountRole !== "doctor") || (localUserEmail && localUserId),
  );

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
      query(doctorCollection, orderBy("createdAt", "asc")),
      (snapshot) => {
        setDoctorRoster(snapshot.docs.map((item) => toDoctor(item.id, item.data())));
      },
      () => {
        setDoctorRoster([]);
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

    const unsubscribe = onSnapshot(getRoleRef(currentUser.uid), (snapshot) => {
      if (!snapshot.exists()) {
        setAccountRole(null);
        return;
      }

      const rawRole = String(snapshot.data().role ?? "");

      if (rawRole === "admin" || rawRole === "user" || rawRole === "doctor") {
        setAccountRole(rawRole);
        return;
      }

      setAccountRole(null);
    });

    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || accountRole !== "doctor") {
      return;
    }

    const existingDoctor = doctorRoster.find(
      (doctor) =>
        doctor.ownerUid === currentUser.uid ||
        (currentUser.email && doctor.ownerEmail === currentUser.email),
    );

    if (existingDoctor) {
      return;
    }

    const email = currentUser.email?.trim().toLowerCase();

    if (!email) {
      return;
    }

    void setDoc(doc(db, "doctors", currentUser.uid), createDoctorDraft(currentUser.uid, email), {
      merge: true,
    }).catch(() => undefined);
  }, [accountRole, currentUser, doctorRoster]);

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

  const removeDoctorHandler = useCallback(async (doctorId: string) => {
    const snapshot = await getDocs(appointmentCollection);
    const batch = writeBatch(db);

    snapshot.docs.forEach((item) => {
      const data = item.data() as Partial<Appointment>;

      if (String(data.doctorId ?? "") === doctorId && data.status === "Kutilmoqda") {
        batch.update(item.ref, {
          status: "Rad etildi",
          handledAt: new Date().toISOString(),
          rejectedReason: "Doktor ro'yxatdan olib tashlandi",
        });
      }
    });

    batch.delete(doc(db, "doctors", doctorId));
    await batch.commit();
  }, []);

  const setDoctorApprovalHandler = useCallback(
    async (doctorId: string, status: DoctorApprovalStatus) => {
      const doctorRef = doc(db, "doctors", doctorId);
      await setDoc(
        doctorRef,
        {
          approvalStatus: status,
          isOnline: status === "approved",
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    },
    [],
  );

  const bookAppointmentHandler = useCallback(
    async (input: BookingInput) => {
      const doctor = doctors.find((item) => item.id === input.doctorId);

      if (!doctor) {
        throw new Error("Shifokor topilmadi.");
      }

      if (doctor.approvalStatus !== "approved") {
        throw new Error("Bu doktor hali admin tomonidan tasdiqlanmagan.");
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
      const createdAt = new Date();
      const requestVisibleAt = new Date(createdAt.getTime() + 30 * 60 * 1000).toISOString();

      const payload: Appointment = {
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
        status: "Kutilmoqda",
        createdAt: createdAt.toISOString(),
        requestVisibleAt,
        doctorAssignedAt: "",
        handledAt: "",
        cancelledAt: "",
        rejectedReason: "",
      };

      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(appointmentRef);

        if (snapshot.exists()) {
          const existing = snapshot.data() as Partial<Appointment>;

          if (existing.status !== "Bekor qilindi" && existing.status !== "Rad etildi") {
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
    async (appointmentId: string, status: AppointmentStatus) => {
      const appointmentRef = doc(db, "appointments", appointmentId);
      const actorKey = (currentUser?.uid ?? localUserId).trim().toLowerCase();
      const actorEmail = (currentUser?.email ?? localUserEmail ?? profile.email)
        .trim()
        .toLowerCase();

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

        if (status !== "Bekor qilindi") {
          return;
        }

        transaction.update(appointmentRef, {
          status,
          cancelledAt: new Date().toISOString(),
          handledAt: new Date().toISOString(),
        });
      });
    },
    [currentUser?.email, currentUser?.uid, localUserEmail, localUserId, profile.email],
  );

  const updateDoctorAppointmentStatusHandler = useCallback(
    async (
      appointmentId: string,
      status: Extract<AppointmentStatus, "Tasdiqlandi" | "Rad etildi" | "Yakunlandi">,
      reason = "",
    ) => {
      if (!currentDoctor) {
        throw new Error("Doktor profili topilmadi.");
      }

      const appointmentRef = doc(db, "appointments", appointmentId);

      await runTransaction(db, async (transaction) => {
        const appointmentSnapshot = await transaction.get(appointmentRef);

        if (!appointmentSnapshot.exists()) {
          throw new Error("Qabul topilmadi.");
        }

        const appointmentData = appointmentSnapshot.data() as Partial<Appointment>;

        if (String(appointmentData.doctorId ?? "") !== currentDoctor.id) {
          throw new Error("Bu buyurtma sizga tegishli emas.");
        }

        if (status === "Tasdiqlandi") {
          transaction.update(appointmentRef, {
            status,
            handledAt: new Date().toISOString(),
            doctorAssignedAt: new Date().toISOString(),
            rejectedReason: "",
          });
          return;
        }

        if (status === "Rad etildi") {
          transaction.update(appointmentRef, {
            status,
            handledAt: new Date().toISOString(),
            rejectedReason: reason || "Doktor hozir buyurtma ola olmaydi",
          });
          return;
        }

        transaction.update(appointmentRef, {
          status,
          handledAt: new Date().toISOString(),
        });
      });
    },
    [currentDoctor],
  );

  const submitDoctorReviewHandler = useCallback(
    async (appointmentId: string, rating: number, comment: string) => {
      const normalizedRating = Math.min(5, Math.max(1, Math.round(rating)));
      const trimmedComment = comment.trim();
      const appointmentRef = doc(db, "appointments", appointmentId);
      const actorKey = (currentUser?.uid ?? localUserId).trim().toLowerCase();
      const actorEmail = (currentUser?.email ?? localUserEmail ?? profile.email)
        .trim()
        .toLowerCase();

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

        if (appointmentData.status === "Bekor qilindi" || appointmentData.status === "Rad etildi") {
          throw new Error("Bekor qilingan qabulga baho berib bo'lmaydi.");
        }

        const doctorRef = doc(db, "doctors", String(appointmentData.doctorId));
        const doctorSnapshot = await transaction.get(doctorRef);

        if (!doctorSnapshot.exists()) {
          throw new Error("Shifokor topilmadi.");
        }

        const doctorData = doctorSnapshot.data() as Partial<Doctor>;
        const currentReviewCount = Number(doctorData.reviewCount ?? 0);
        const currentRating = Number(doctorData.rating ?? 5);
        const nextReviewCount = currentReviewCount + 1;
        const nextRating = (currentRating * currentReviewCount + normalizedRating) / nextReviewCount;

        transaction.update(appointmentRef, {
          status: "Yakunlandi",
          reviewRating: normalizedRating,
          reviewComment: trimmedComment,
          reviewedAt: new Date().toISOString(),
        });

        transaction.update(doctorRef, {
          rating: Number(nextRating.toFixed(1)),
          reviewCount: nextReviewCount,
          updatedAt: new Date().toISOString(),
        });
      });
    },
    [currentUser?.email, currentUser?.uid, localUserEmail, localUserId, profile.email],
  );

  const updateProfileHandler = useCallback(
    async (patch: Partial<UserProfile>) => {
      const nextEmail = patch.email?.trim() ?? localUserEmail;
      const nextLocalProfileId = localUserId || (nextEmail ? createLocalUserId() : "");
      const profileDocId = currentUser ? currentUser.uid : nextLocalProfileId;

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

  const updateDoctorProfileHandler = useCallback(
    async (patch: DoctorProfileInput) => {
      if (!currentUser || accountRole !== "doctor") {
        throw new Error("Doktor kabinetiga kirish kerak.");
      }

      const availableSlots = sanitizeDoctorSlots(patch.availableSlots);
      const doctorRef = doc(db, "doctors", currentDoctor?.id ?? currentUser.uid);
      const existingDoctor = currentDoctor ?? createDoctorDraft(currentUser.uid, currentUser.email ?? "");

      const nextDoctor: Doctor = {
        ...existingDoctor,
        name: patch.name.trim(),
        specialty: patch.specialty.trim(),
        region: normalizeDoctorRegion(patch.region, patch.address, patch.clinic, patch.mapQuery),
        experience: patch.experience.trim(),
        price: patch.price.trim(),
        clinic: patch.clinic.trim(),
        address: patch.address.trim(),
        mapQuery: patch.mapQuery.trim() || patch.address.trim() || patch.clinic.trim(),
        bio: patch.bio.trim(),
        availableSlots,
        approvalStatus: existingDoctor.approvalStatus,
        profileCompleted: true,
        isOnline: existingDoctor.isOnline,
        updatedAt: new Date().toISOString(),
        availability: "",
      };

      nextDoctor.availability = buildAvailabilityLabel(nextDoctor);
      await setDoc(doctorRef, nextDoctor, { merge: true });
    },
    [accountRole, currentDoctor, currentUser],
  );

  const toggleDoctorOnlineStatusHandler = useCallback(
    async (isOnline: boolean) => {
      if (!currentDoctor) {
        throw new Error("Doktor profili topilmadi.");
      }

      const nextDoctor = { ...currentDoctor, isOnline };

      await setDoc(
        doc(db, "doctors", currentDoctor.id),
        {
          isOnline,
          availability: buildAvailabilityLabel(nextDoctor),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    },
    [currentDoctor],
  );

  const signInWithCredentialsHandler = useCallback(async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      throw new Error("Email va parolni to'liq kiriting.");
    }

    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const role = await ensureRole(credential.user.uid, "user");
    setAccountRole(role);
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

  const registerDoctorWithCredentialsHandler = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim()) {
      throw new Error("Email va parolni to'liq kiriting.");
    }

    const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    await setDoc(getRoleRef(credential.user.uid), { role: "doctor" }, { merge: true });
    await setDoc(
      doc(db, "doctors", credential.user.uid),
      createDoctorDraft(credential.user.uid, normalizedEmail),
      { merge: true },
    );
    setAccountRole("doctor");
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
      doctorRoster,
      appointments,
      profile,
      currentUser,
      accountRole,
      currentDoctor,
      localUserEmail,
      localUserId,
      theme,
      authLoading,
      isUserAuthenticated,
      isAdminAuthenticated,
      isDoctorAuthenticated,
      doctorApprovalStatus,
      bookAppointment: bookAppointmentHandler,
      removeDoctor: removeDoctorHandler,
      setDoctorApproval: setDoctorApprovalHandler,
      updateAppointmentStatus: updateAppointmentStatusHandler,
      updateDoctorAppointmentStatus: updateDoctorAppointmentStatusHandler,
      submitDoctorReview: submitDoctorReviewHandler,
      updateProfile: updateProfileHandler,
      updateDoctorProfile: updateDoctorProfileHandler,
      toggleDoctorOnlineStatus: toggleDoctorOnlineStatusHandler,
      signInWithCredentials: signInWithCredentialsHandler,
      registerWithCredentials: registerWithCredentialsHandler,
      registerDoctorWithCredentials: registerDoctorWithCredentialsHandler,
      signInAsAdmin: signInAsAdminHandler,
      signInWithGoogle: signInWithGoogleHandler,
      signInWithApple: signInWithAppleHandler,
      signInWithMicrosoft: signInWithMicrosoftHandler,
      signOutUser: signOutHandler,
      toggleTheme: toggleThemeHandler,
      setTheme: setThemeHandler,
    }),
    [
      appointments,
      accountRole,
      authLoading,
      bookAppointmentHandler,
      currentDoctor,
      currentUser,
      doctorApprovalStatus,
      doctorRoster,
      doctors,
      isAdminAuthenticated,
      isDoctorAuthenticated,
      isUserAuthenticated,
      localUserEmail,
      localUserId,
      profile,
      registerDoctorWithCredentialsHandler,
      registerWithCredentialsHandler,
      removeDoctorHandler,
      setDoctorApprovalHandler,
      setThemeHandler,
      signInAsAdminHandler,
      signInWithAppleHandler,
      signInWithCredentialsHandler,
      signInWithGoogleHandler,
      signInWithMicrosoftHandler,
      signOutHandler,
      submitDoctorReviewHandler,
      theme,
      toggleDoctorOnlineStatusHandler,
      toggleThemeHandler,
      updateAppointmentStatusHandler,
      updateDoctorAppointmentStatusHandler,
      updateDoctorProfileHandler,
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

export const calculateDoctorPerformance = (doctor: Doctor, appointments: Appointment[]) => {
  const doctorAppointments = appointments.filter(
    (appointment) =>
      appointment.doctorId === doctor.id &&
      appointment.status !== "Bekor qilindi" &&
      appointment.status !== "Rad etildi",
  );
  const totalOrders = doctorAppointments.length;
  const totalEarnings = doctorAppointments.reduce((sum, appointment) => {
    if (appointment.status === "Kutilmoqda") {
      return sum;
    }

    return sum + getDoctorPriceValue(doctor.price);
  }, 0);

  return {
    totalOrders,
    totalEarnings,
    pendingOrders: doctorAppointments.filter((appointment) => appointment.status === "Kutilmoqda").length,
  };
};

export const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat("uz-UZ").format(value)} so'm`;

export const getDoctorRequestReady = (appointment: Appointment) =>
  !appointment.requestVisibleAt || appointment.requestVisibleAt <= new Date().toISOString();

export const getDoctorBookingRecommendation = (doctor: Doctor, appointments: Appointment[]) => {
  const performance = calculateDoctorPerformance(doctor, appointments);
  const today = getTodayInTashkent();
  const todayQueue = appointments.filter(
    (appointment) =>
      appointment.doctorId === doctor.id &&
      appointment.date === today &&
      appointment.status !== "Bekor qilindi" &&
      appointment.status !== "Rad etildi",
  ).length;

  if (doctor.isOnline && performance.pendingOrders === 0) {
    return "Hozir online va yangi requestlar uchun tayyor";
  }

  if (!doctor.isOnline && todayQueue > 0) {
    return "Offline bo'lsa ham bugungi navbatlar kelishda davom etadi";
  }

  if (performance.pendingOrders > 0) {
    return `${performance.pendingOrders} ta request javob kutmoqda`;
  }

  return "Bo'sh vaqtlar asosida request yuboriladi";
};
