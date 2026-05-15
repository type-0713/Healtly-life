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
  accountEmail: string;
  ownerEmail: string;
  firstName: string;
  lastName: string;
  phone: string;
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

export type DoctorRegistrationInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
};

export type DoctorProfileInput = {
  firstName: string;
  lastName: string;
  phone: string;
  specialty: string;
  clinic: string;
  address: string;
  bio: string;
};

type DoctorAccount = {
  doctorId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  approvalStatus: DoctorApprovalStatus;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
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
  doctorSessionEmail: string;
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
  signInDoctorWithCredentials: (email: string, password: string) => Promise<void>;
  registerDoctorWithCredentials: (input: DoctorRegistrationInput) => Promise<void>;
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
    accountEmail: "",
    ownerEmail: "",
    firstName: "Alisher",
    lastName: "Karimov",
    phone: "+998900000001",
    name: "Dr. Alisher Karimov",
    specialty: "Kardiolog",
    region: "Toshkent shahri",
    experience: "16 yil",
    price: "180 000 so'm",
    availability: "24/7 navbat qabul qiladi",
    clinic: "MedElite Heart Center",
    address: "Toshkent shahri, Yunusobod tumani, Amir Temur ko'chasi 108",
    mapQuery: "Tashkent, Amir Temur Avenue 108, MedElite Heart Center",
    bio: "Yurak-qon tomir kasalliklari bo'yicha konsultatsiya va muntazam kuzatuv olib boradi.",
    availableSlots: DEFAULT_TIME_SLOTS,
  },
  {
    id: "default-gulsara-niyazova",
    accountEmail: "",
    ownerEmail: "",
    firstName: "Gulsara",
    lastName: "Niyazova",
    phone: "+998900000002",
    name: "Dr. Gulsara Niyazova",
    specialty: "Terapevt",
    region: "Toshkent shahri",
    experience: "12 yil",
    price: "140 000 so'm",
    availability: "24/7 navbat qabul qiladi",
    clinic: "MedElite Family Care",
    address: "Toshkent shahri, Mirzo Ulug'bek tumani, Buyuk Ipak Yo'li 215",
    mapQuery: "Tashkent, Buyuk Ipak Yoli 215, MedElite Family Care",
    bio: "Kundalik sog'liq nazorati va oilaviy davolash rejasini yuritadi.",
    availableSlots: DEFAULT_TIME_SLOTS,
  },
  {
    id: "default-rustam-abdullayev",
    accountEmail: "",
    ownerEmail: "",
    firstName: "Rustam",
    lastName: "Abdullayev",
    phone: "+998900000003",
    name: "Dr. Rustam Abdullayev",
    specialty: "Ortoped",
    region: "Toshkent shahri",
    experience: "18 yil",
    price: "210 000 so'm",
    availability: "24/7 navbat qabul qiladi",
    clinic: "MedElite Motion Lab",
    address: "Toshkent shahri, Chilonzor tumani, Bunyodkor shoh ko'chasi 47",
    mapQuery: "Tashkent, Bunyodkor Avenue 47, MedElite Motion Lab",
    bio: "Bo'g'im, umurtqa va reabilitatsiya bo'yicha ko'p yillik tajribaga ega.",
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
const DOCTOR_SESSION_ID_KEY = "medelite-doctor-session-id";
const DOCTOR_SESSION_EMAIL_KEY = "medelite-doctor-session-email";
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

const sanitizeDoctorSlots = (slots: unknown, fallbackSlots: string[] = DEFAULT_TIME_SLOTS) => {
  const slotSet = new Set(
    (Array.isArray(slots) ? slots : fallbackSlots)
      .map((slot) => String(slot))
      .filter((slot) => isTimeSlotAllowed(slot)),
  );
  const orderedSlots = DEFAULT_TIME_SLOTS.filter((slot) => slotSet.has(slot));
  return orderedSlots.length ? orderedSlots : fallbackSlots;
};

const buildAvailabilityLabel = (doctor: Pick<Doctor, "availableSlots" | "isOnline" | "approvalStatus">) => {
  if (doctor.approvalStatus !== "approved") {
    return "Admin tasdig'i kutilmoqda";
  }

  if (!doctor.availableSlots.length) {
    return "Bo'sh vaqtlar hali qo'shilmagan";
  }

  if (!doctor.isOnline) {
    return "Hozir ishda emas, lekin bo'sh vaqtlari uchun so'rov qabul qiladi";
  }

  return `Bo'sh vaqtlar: ${doctor.availableSlots.slice(0, 3).join(", ")}`;
};

const toDoctor = (id: string, data: Record<string, unknown>): Doctor => {
  const reviewCount = Number(data.reviewCount ?? 0);
  const rating = Number(data.rating ?? 5);
  const availableSlots = sanitizeDoctorSlots(data.availableSlots);
  const approvalStatus =
    String(data.approvalStatus ?? "") === "approved"
      ? "approved"
      : String(data.approvalStatus ?? "") === "rejected"
        ? "rejected"
        : "pending";
  const isOnline = Boolean(data.isOnline);

  const doctor: Doctor = {
    id,
    accountEmail: String(data.accountEmail ?? data.ownerEmail ?? ""),
    ownerEmail: String(data.ownerEmail ?? data.accountEmail ?? ""),
    firstName: String(data.firstName ?? ""),
    lastName: String(data.lastName ?? ""),
    phone: String(data.phone ?? ""),
    name: String(data.name ?? "").trim(),
    specialty: String(data.specialty ?? ""),
    region: normalizeDoctorRegion(data.region, data.address, data.clinic, data.mapQuery),
    rating: reviewCount > 0 ? rating : 5,
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
    profileCompleted: Boolean(data.profileCompleted),
    isOnline,
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };

  doctor.name =
    doctor.name || [doctor.firstName, doctor.lastName].filter(Boolean).join(" ").trim() || "Yangi doktor";
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
  reviewRating: typeof data.reviewRating === "number" ? Number(data.reviewRating) : undefined,
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
  return rawRole === "user" ? "user" : null;
};

const ensureRole = async (uid: string) => {
  const currentRole = await getStoredRole(uid);

  if (currentRole) {
    return currentRole;
  }

  await setDoc(getRoleRef(uid), { role: "user" }, { merge: true });
  return "user";
};

const mapFirebaseAuthError = (error: unknown) => {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  switch (code) {
    case "auth/email-already-in-use":
      return "Bu email allaqachon ro'yxatdan o'tgan.";
    case "auth/invalid-email":
      return "Email formati noto'g'ri.";
    case "auth/weak-password":
      return "Parol kamida 6 ta belgidan iborat bo'lishi kerak.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email yoki parol noto'g'ri.";
    case "auth/popup-closed-by-user":
      return "Kirish oynasi yopib yuborildi.";
    default:
      return error instanceof Error ? error.message : "Kirishda xatolik yuz berdi.";
  }
};

const createDoctorDraft = (input: {
  doctorId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}): Doctor => {
  const now = new Date().toISOString();
  const name = [input.firstName, input.lastName].filter(Boolean).join(" ").trim() || "Yangi doktor";

  return {
    id: input.doctorId,
    accountEmail: input.email,
    ownerEmail: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    name,
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
    availableSlots: ["09:00", "10:00", "14:00", "18:00"],
    approvalStatus: "pending",
    profileCompleted: false,
    isOnline: false,
    createdAt: now,
    updatedAt: now,
  };
};

const doctorAccountDocId = (email: string) => email.trim().toLowerCase();

const createDoctorId = (email: string) =>
  `doctor-${email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;

const syncDefaultDoctors = async () => {
  const doctorSnapshot = await getDocs(doctorCollection);
  const batch = writeBatch(db);

  defaultDoctors.forEach((defaultDoctor) => {
    const matchingDoctor = doctorSnapshot.docs.find(
      (item) =>
        item.id === defaultDoctor.id ||
        normalizeDoctorIdentity(item.data() as Partial<Doctor>) ===
          normalizeDoctorIdentity(defaultDoctor),
    );
    const now = new Date().toISOString();

    batch.set(
      doc(db, "doctors", defaultDoctor.id),
      {
        ...defaultDoctor,
        rating: Number(matchingDoctor?.data().rating ?? 5),
        reviewCount: Number(matchingDoctor?.data().reviewCount ?? 0),
        approvalStatus: "approved",
        profileCompleted: true,
        isOnline: true,
        createdAt: String(matchingDoctor?.data().createdAt ?? now),
        updatedAt: now,
      },
      { merge: true },
    );

    if (matchingDoctor && matchingDoctor.id !== defaultDoctor.id) {
      batch.delete(matchingDoctor.ref);
    }
  });

  await batch.commit();
};

const getDoctorPriceValue = (price: string) => {
  const digits = price.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
};

const getDoctorRequestDelayMinutes = (doctor: Pick<Doctor, "id" | "isOnline">) => {
  return doctor.isOnline ? 0 : 30;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const initialLocalEmail =
    typeof window === "undefined" ? "" : window.localStorage.getItem(USER_SESSION_KEY) ?? "";
  const initialLocalUserId =
    typeof window === "undefined"
      ? ""
      : window.localStorage.getItem(USER_ID_KEY) ??
        (initialLocalEmail ? createLocalUserId() : "");
  const initialDoctorSessionId =
    typeof window === "undefined" ? "" : window.localStorage.getItem(DOCTOR_SESSION_ID_KEY) ?? "";
  const initialDoctorSessionEmail =
    typeof window === "undefined"
      ? ""
      : window.localStorage.getItem(DOCTOR_SESSION_EMAIL_KEY) ?? "";
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
  const [accountRole, setAccountRole] = useState<AccountRole>(
    initialAdminSession ? "admin" : initialDoctorSessionId ? "doctor" : null,
  );
  const [doctorSessionId, setDoctorSessionId] = useState(initialDoctorSessionId);
  const [doctorSessionEmail, setDoctorSessionEmail] = useState(initialDoctorSessionEmail);
  const [localUserEmail, setLocalUserEmail] = useState(initialLocalEmail);
  const [localUserId, setLocalUserId] = useState(initialLocalUserId);
  const [adminSessionActive, setAdminSessionActive] = useState(initialAdminSession);
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme);
  const [authLoading, setAuthLoading] = useState(true);

  const doctors = useMemo(
    () =>
      doctorRoster.filter(
        (doctor) => doctor.approvalStatus === "approved" && doctor.profileCompleted,
      ),
    [doctorRoster],
  );

  const currentDoctor = useMemo(
    () => doctorRoster.find((doctor) => doctor.id === doctorSessionId) ?? null,
    [doctorRoster, doctorSessionId],
  );

  const doctorApprovalStatus = currentDoctor?.approvalStatus ?? null;
  const isAdminAuthenticated = adminSessionActive;
  const isDoctorAuthenticated = Boolean(doctorSessionId && doctorSessionEmail);
  const isUserAuthenticated = Boolean(
    (currentUser && accountRole === "user") || (!currentUser && localUserEmail && localUserId),
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
    if (doctorSessionId && doctorSessionEmail) {
      window.localStorage.setItem(DOCTOR_SESSION_ID_KEY, doctorSessionId);
      window.localStorage.setItem(DOCTOR_SESSION_EMAIL_KEY, doctorSessionEmail);
      return;
    }

    window.localStorage.removeItem(DOCTOR_SESSION_ID_KEY);
    window.localStorage.removeItem(DOCTOR_SESSION_EMAIL_KEY);
  }, [doctorSessionEmail, doctorSessionId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      if (user) {
        setAdminSessionActive(false);
        if (!doctorSessionId) {
          setAccountRole("user");
        }
      } else if (!adminSessionActive && !doctorSessionId) {
        setAccountRole(null);
        setProfile(defaultProfile);
      }

      setAuthLoading(false);
    });

    return unsubscribe;
  }, [adminSessionActive, doctorSessionId]);

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

  const clearLocalUserSession = useCallback(() => {
    setLocalUserEmail("");
    setLocalUserId("");
    window.localStorage.removeItem(USER_SESSION_KEY);
    window.localStorage.removeItem(USER_ID_KEY);
  }, []);

  const clearDoctorSession = useCallback(() => {
    setDoctorSessionId("");
    setDoctorSessionEmail("");
    window.localStorage.removeItem(DOCTOR_SESSION_ID_KEY);
    window.localStorage.removeItem(DOCTOR_SESSION_EMAIL_KEY);
  }, []);

  const removeDoctorHandler = useCallback(async (doctorId: string) => {
    const doctorRef = doc(db, "doctors", doctorId);
    const doctorSnapshot = await getDoc(doctorRef);
    const doctorData = doctorSnapshot.exists()
      ? (doctorSnapshot.data() as Partial<Doctor>)
      : undefined;

    if (doctorData?.ownerEmail) {
      await deleteDoc(doc(db, "doctorAccounts", doctorAccountDocId(String(doctorData.ownerEmail))));
    }

    await deleteDoc(doctorRef);
  }, []);

  const setDoctorApprovalHandler = useCallback(async (doctorId: string, status: DoctorApprovalStatus) => {
    const doctorRef = doc(db, "doctors", doctorId);
    const snapshot = await getDoc(doctorRef);

    if (!snapshot.exists()) {
      throw new Error("Doktor topilmadi.");
    }

    const doctorData = snapshot.data() as Partial<Doctor>;
    const email = String(doctorData.ownerEmail ?? doctorData.accountEmail ?? "").trim().toLowerCase();
    const now = new Date().toISOString();
    const payload = {
      approvalStatus: status,
      isOnline: false,
      availability:
        status === "approved"
          ? "Approved. Doktor ishga chiqishni o'zi yoqadi"
          : status === "rejected"
            ? "Admin tomonidan rad etildi"
            : "Admin tasdig'i kutilmoqda",
      updatedAt: now,
    };

    await setDoc(doctorRef, payload, { merge: true });

    if (email) {
      await setDoc(
        doc(db, "doctorAccounts", doctorAccountDocId(email)),
        {
          approvalStatus: status,
          updatedAt: now,
        },
        { merge: true },
      );
    }
  }, []);

  const bookAppointmentHandler = useCallback(
    async (input: BookingInput) => {
      const doctor = doctors.find((item) => item.id === input.doctorId);

      if (!doctor) {
        throw new Error("Shifokor topilmadi.");
      }

      if (!doctor.availableSlots.length) {
        throw new Error("Doktor hali bo'sh vaqtlarini qo'shmagan.");
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
      const requestDelayMinutes = getDoctorRequestDelayMinutes(doctor);
      const requestVisibleAt = new Date(createdAt.getTime() + requestDelayMinutes * 60 * 1000).toISOString();

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
        rejectedReason: doctor.isOnline
          ? ""
          : "Doktor ishda bo'lmasa ham, bo'sh vaqt mavjudligi sabab so'rov yuborildi",
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
    [appointments, doctors],
  );

  const updateAppointmentStatusHandler = useCallback(
    async (appointmentId: string, status: AppointmentStatus) => {
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

        if (status === "Bekor qilindi") {
          if (
            appointmentData.status === "Bekor qilindi" ||
            appointmentData.status === "Rad etildi" ||
            appointmentData.status === "Yakunlandi"
          ) {
            throw new Error("Bu qabul holatini endi o'zgartirib bo'lmaydi.");
          }

          if (
            appointmentData.status === "Tasdiqlandi" &&
            hasAppointmentStarted(String(appointmentData.date ?? ""), String(appointmentData.time ?? ""))
          ) {
            throw new Error("Boshlangan qabulni bekor qilib bo'lmaydi.");
          }

          transaction.update(appointmentRef, {
            status,
            cancelledAt: new Date().toISOString(),
            handledAt: new Date().toISOString(),
          });
        }
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
          if (appointmentData.status !== "Kutilmoqda") {
            throw new Error("Faqat kutilayotgan so'rovni qabul qilish mumkin.");
          }

          transaction.update(appointmentRef, {
            status,
            handledAt: new Date().toISOString(),
            doctorAssignedAt: new Date().toISOString(),
            rejectedReason: "",
          });
          return;
        }

        if (status === "Rad etildi") {
          if (appointmentData.status !== "Kutilmoqda") {
            throw new Error("Faqat kutilayotgan so'rovni rad etish mumkin.");
          }

          transaction.update(appointmentRef, {
            status,
            handledAt: new Date().toISOString(),
            rejectedReason: reason || "Doktor hozir buyurtma ola olmaydi",
          });
          return;
        }

        if (appointmentData.status !== "Tasdiqlandi") {
          throw new Error("Faqat tasdiqlangan qabulni yakunlash mumkin.");
        }

        if (!hasAppointmentStarted(String(appointmentData.date ?? ""), String(appointmentData.time ?? ""))) {
          throw new Error("Qabul vaqtiga yetmasdan uni yakunlab bo'lmaydi.");
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
      const actorEmail = (currentUser?.email ?? localUserEmail ?? profile.email).trim().toLowerCase();

      if (trimmedComment.length < 8) {
        throw new Error("Sharh kamida 8 ta belgidan iborat bo'lishi kerak.");
      }

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

        if (appointmentData.status !== "Tasdiqlandi" && appointmentData.status !== "Yakunlandi") {
          throw new Error("Faqat tasdiqlangan yoki yakunlangan qabul uchun sharh qoldirish mumkin.");
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
      if (!currentDoctor || !doctorSessionEmail) {
        throw new Error("Doktor kabinetiga kirish kerak.");
      }

      const firstName = patch.firstName.trim();
      const lastName = patch.lastName.trim();
      const phone = patch.phone.trim();
      const specialty = patch.specialty.trim();
      const clinic = patch.clinic.trim();
      const address = patch.address.trim();
      const bio = patch.bio.trim();
      const availableSlots = sanitizeDoctorSlots(
        currentDoctor.availableSlots,
        currentDoctor.availableSlots.length ? currentDoctor.availableSlots : DEFAULT_TIME_SLOTS,
      );

      if (!firstName || !lastName || !phone || !specialty || !clinic || !address || !bio) {
        throw new Error("Doktor ma'lumotlarini to'liq kiriting.");
      }

      const nextDoctor: Doctor = {
        ...currentDoctor,
        firstName,
        lastName,
        phone,
        name: [firstName, lastName].filter(Boolean).join(" ").trim(),
        specialty,
        region: normalizeDoctorRegion("", address, clinic, address),
        experience: currentDoctor.experience.trim() || "Tajriba kiritilmagan",
        price: currentDoctor.price.trim() || "Narx kelishiladi",
        clinic,
        address,
        mapQuery: address,
        bio,
        availableSlots,
        profileCompleted: true,
        updatedAt: new Date().toISOString(),
        availability: "",
      };

      nextDoctor.availability = buildAvailabilityLabel(nextDoctor);
      await setDoc(doc(db, "doctors", currentDoctor.id), nextDoctor, { merge: true });
      await setDoc(
        doc(db, "doctorAccounts", doctorAccountDocId(doctorSessionEmail)),
        {
          profileCompleted: true,
          updatedAt: nextDoctor.updatedAt,
        },
        { merge: true },
      );
    },
    [currentDoctor, doctorSessionEmail],
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

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await ensureRole(credential.user.uid);
      setAccountRole("user");
      setAdminSessionActive(false);
      clearDoctorSession();
      clearLocalUserSession();
    } catch (error) {
      throw new Error(mapFirebaseAuthError(error));
    }
  }, [clearDoctorSession, clearLocalUserSession]);

  const registerWithCredentialsHandler = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password.trim()) {
      throw new Error("Email va parolni to'liq kiriting.");
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      await setDoc(getRoleRef(credential.user.uid), { role: "user" }, { merge: true });
      setAccountRole("user");
      setAdminSessionActive(false);
      clearDoctorSession();
      clearLocalUserSession();
    } catch (error) {
      throw new Error(mapFirebaseAuthError(error));
    }
  }, [clearDoctorSession, clearLocalUserSession]);

  const signInDoctorWithCredentialsHandler = useCallback(
    async (email: string, password: string) => {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail || !password.trim()) {
        throw new Error("Email va parolni to'liq kiriting.");
      }

      const accountRef = doc(db, "doctorAccounts", doctorAccountDocId(normalizedEmail));
      const snapshot = await getDoc(accountRef);

      if (!snapshot.exists()) {
        throw new Error("Doktor login ma'lumotlari topilmadi.");
      }

      const account = snapshot.data() as DoctorAccount;

      if (String(account.password ?? "") !== password.trim()) {
        throw new Error("Doktor emaili yoki paroli noto'g'ri.");
      }

      if (auth.currentUser) {
        await signOut(auth);
      }

      clearLocalUserSession();
      setAdminSessionActive(false);
      setCurrentUser(null);
      setDoctorSessionId(account.doctorId);
      setDoctorSessionEmail(normalizedEmail);
      setAccountRole("doctor");
    },
    [clearLocalUserSession],
  );

  const registerDoctorWithCredentialsHandler = useCallback(
    async (input: DoctorRegistrationInput) => {
      const email = input.email.trim().toLowerCase();
      const password = input.password.trim();
      const firstName = input.firstName.trim();
      const lastName = input.lastName.trim();
      const phone = input.phone.trim();

      if (!email || !password || !firstName || !lastName || !phone) {
        throw new Error("Doktor uchun barcha maydonlarni to'liq kiriting.");
      }

      if (password.length < 6) {
        throw new Error("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
      }

      const doctorId = createDoctorId(email);
      const accountRef = doc(db, "doctorAccounts", doctorAccountDocId(email));
      const accountSnapshot = await getDoc(accountRef);

      if (accountSnapshot.exists()) {
        throw new Error("Bu email bilan doktor arizasi allaqachon mavjud.");
      }

      const now = new Date().toISOString();
      const accountPayload: DoctorAccount = {
        doctorId,
        email,
        password,
        firstName,
        lastName,
        phone,
        approvalStatus: "pending",
        profileCompleted: false,
        createdAt: now,
        updatedAt: now,
      };

      const doctorDraft = createDoctorDraft({
        doctorId,
        email,
        firstName,
        lastName,
        phone,
      });

      if (auth.currentUser) {
        await signOut(auth);
      }

      clearLocalUserSession();
      setAdminSessionActive(false);
      setCurrentUser(null);
      await setDoc(accountRef, accountPayload, { merge: true });
      await setDoc(doc(db, "doctors", doctorId), doctorDraft, { merge: true });
      setDoctorSessionId(doctorId);
      setDoctorSessionEmail(email);
      setAccountRole("doctor");
    },
    [clearLocalUserSession],
  );

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
    clearLocalUserSession();
    clearDoctorSession();
    setAccountRole("admin");
    setAdminSessionActive(true);
  }, [clearDoctorSession, clearLocalUserSession]);

  const signInWithGoogleHandler = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(auth, provider);
      await ensureRole(credential.user.uid);
      setAdminSessionActive(false);
      clearDoctorSession();
    } catch (error) {
      throw new Error(mapFirebaseAuthError(error));
    }
  }, [clearDoctorSession]);

  const signInWithAppleHandler = useCallback(async () => {
    try {
      const provider = new OAuthProvider("apple.com");
      provider.addScope("email");
      provider.addScope("name");
      const credential = await signInWithPopup(auth, provider);
      await ensureRole(credential.user.uid);
      setAdminSessionActive(false);
      clearDoctorSession();
    } catch (error) {
      throw new Error(mapFirebaseAuthError(error));
    }
  }, [clearDoctorSession]);

  const signInWithMicrosoftHandler = useCallback(async () => {
    try {
      const provider = new OAuthProvider("microsoft.com");
      provider.setCustomParameters({ prompt: "select_account", tenant: "common" });
      const credential = await signInWithPopup(auth, provider);
      await ensureRole(credential.user.uid);
      setAdminSessionActive(false);
      clearDoctorSession();
    } catch (error) {
      throw new Error(mapFirebaseAuthError(error));
    }
  }, [clearDoctorSession]);

  const signOutHandler = useCallback(async () => {
    setAccountRole(null);
    setAdminSessionActive(false);
    clearLocalUserSession();
    clearDoctorSession();
    window.localStorage.removeItem(ADMIN_SESSION_KEY);

    if (auth.currentUser) {
      await signOut(auth);
    }

    setCurrentUser(null);
    setProfile(defaultProfile);
  }, [clearDoctorSession, clearLocalUserSession]);

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
      doctorSessionEmail,
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
      signInDoctorWithCredentials: signInDoctorWithCredentialsHandler,
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
      accountRole,
      appointments,
      authLoading,
      bookAppointmentHandler,
      currentDoctor,
      currentUser,
      doctorApprovalStatus,
      doctorRoster,
      doctorSessionEmail,
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
      signInDoctorWithCredentialsHandler,
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

export const getAppointmentVisibilityDelayMinutes = (
  appointment: Pick<Appointment, "createdAt" | "requestVisibleAt">,
) => {
  const createdAt = new Date(appointment.createdAt).getTime();
  const requestVisibleAt = new Date(appointment.requestVisibleAt || appointment.createdAt).getTime();
  const diffMinutes = Math.max(0, Math.round((requestVisibleAt - createdAt) / 60000));

  return Number.isFinite(diffMinutes) ? diffMinutes : 0;
};

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

  if (!doctor.availableSlots.length) {
    return "Bo'sh vaqtlar kiritilmagani uchun yangi so'rov yuborilmaydi";
  }

  if (doctor.isOnline && performance.pendingOrders === 0) {
    return "Hozir ishda va yangi so'rovlar uchun tayyor";
  }

  if (!doctor.isOnline && todayQueue > 0) {
    return "Offline bo'lsa ham bugungi navbatlar kelishda davom etadi";
  }

  if (performance.pendingOrders > 0) {
    return `${performance.pendingOrders} ta so'rov javob kutmoqda`;
  }

  return "So'rovlar bo'sh vaqtlar asosida yuboriladi";
};
