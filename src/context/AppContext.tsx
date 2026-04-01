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
  registerAsAdmin: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signOutUser: () => Promise<void>;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
};

const defaultDoctors: Omit<Doctor, "id">[] = [
  {
    name: "Dr. Alisher Karimov",
    specialty: "Kardiolog",
    region: "Toshkent shahri",
    rating: 5,
    reviewCount: 0,
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
    name: "Dr. Gulsara Niyazova",
    specialty: "Terapevt",
    region: "Toshkent shahri",
    rating: 5,
    reviewCount: 0,
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
    name: "Dr. Rustam Abdullayev",
    specialty: "Ortoped",
    region: "Toshkent shahri",
    rating: 5,
    reviewCount: 0,
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

const AppContext = createContext<AppContextValue | null>(null);

const doctorCollection = collection(db, "doctors");
const appointmentCollection = collection(db, "appointments");
const roleCollection = collection(db, "accountRoles");
const createLocalUserId = () =>
  `local-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

const toDoctor = (id: string, data: Record<string, unknown>): Doctor => {
  const reviewCount = Number(data.reviewCount ?? 0);
  const rawRating = Number(data.rating ?? 5);

  return {
    id,
    name: String(data.name ?? ""),
    specialty: String(data.specialty ?? ""),
    region:
      String(data.region ?? "").trim() ||
      inferUzbekRegion(
        String(data.address ?? ""),
        String(data.clinic ?? ""),
        String(data.mapQuery ?? ""),
      ) ||
      "Toshkent shahri",
    rating: reviewCount > 0 ? rawRating : 5,
    reviewCount,
    experience: String(data.experience ?? ""),
    price: String(data.price ?? ""),
    availability: String(data.availability ?? "") || "Bo'sh slotlar mavjud",
    clinic: String(data.clinic ?? ""),
    address: String(data.address ?? data.clinic ?? ""),
    mapQuery: String(data.mapQuery ?? data.address ?? data.clinic ?? ""),
    bio: String(data.bio ?? ""),
    availableSlots: Array.isArray(data.availableSlots)
      ? data.availableSlots
          .map((slot) => String(slot))
          .filter((slot) => isTimeSlotAllowed(slot))
      : DEFAULT_TIME_SLOTS,
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
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme);
  const [authLoading, setAuthLoading] = useState(true);

  const isAdminAuthenticated = Boolean(currentUser && accountRole === "admin");
  const isUserAuthenticated = Boolean(currentUser || isAdminAuthenticated);

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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setAccountRole(null);
        setProfile(defaultProfile);
      }
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const seedDoctorsIfNeeded = async () => {
      const snapshot = await getDocs(doctorCollection);

      if (!snapshot.empty) {
        return;
      }

      await Promise.all(defaultDoctors.map((doctor) => addDoc(doctorCollection, doctor)));
    };

    void seedDoctorsIfNeeded();

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

    void setDoc(profileRef, baseProfile, { merge: true });

    const unsubscribe = onSnapshot(profileRef, (snapshot) => {
      const data = snapshot.data() as Partial<UserProfile> | undefined;
      setProfile({ ...baseProfile, ...data });
    });

    return unsubscribe;
  }, [currentUser, localUserEmail, localUserId]);

  const addDoctorHandler = useCallback(async (doctor: NewDoctorInput) => {
    const sortedSlots = DEFAULT_TIME_SLOTS.filter((slot) => doctor.availableSlots.includes(slot));

    await addDoc(doctorCollection, {
      ...doctor,
      region: isUzbekRegion(doctor.region) ? doctor.region : "Toshkent shahri",
      availableSlots: sortedSlots.filter((slot) => isTimeSlotAllowed(slot)),
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
    setLocalUserEmail("");
    setLocalUserId("");
    window.localStorage.removeItem(USER_SESSION_KEY);
    window.localStorage.removeItem(USER_ID_KEY);
  }, []);

  const signInAsAdminHandler = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password.trim()) {
      throw new Error("Email va parolni to'liq kiriting.");
    }

    const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const role = await getStoredRole(credential.user.uid);

    if (role !== "admin") {
      await signOut(auth);
      throw new Error("Bu hisob admin roliga ega emas.");
    }

    setAccountRole("admin");
    setLocalUserEmail("");
    setLocalUserId("");
    window.localStorage.removeItem(USER_SESSION_KEY);
    window.localStorage.removeItem(USER_ID_KEY);
  }, []);

  const registerAsAdminHandler = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password.trim()) {
      throw new Error("Email va parolni to'liq kiriting.");
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      await setDoc(getRoleRef(credential.user.uid), { role: "admin" }, { merge: true });
      setAccountRole("admin");
    } catch (error) {
      const errorCode =
        typeof error === "object" && error && "code" in error ? String(error.code) : "";

      if (errorCode !== "auth/email-already-in-use") {
        throw error;
      }

      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      await setDoc(getRoleRef(credential.user.uid), { role: "admin" }, { merge: true });
      setAccountRole("admin");
    }

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
  }, []);

  const signInWithAppleHandler = useCallback(async () => {
    const provider = new OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");
    const credential = await signInWithPopup(auth, provider);
    await ensureRole(credential.user.uid, "user");
  }, []);

  const signInWithMicrosoftHandler = useCallback(async () => {
    const provider = new OAuthProvider("microsoft.com");
    provider.setCustomParameters({ prompt: "select_account", tenant: "common" });
    const credential = await signInWithPopup(auth, provider);
    await ensureRole(credential.user.uid, "user");
  }, []);

  const signOutHandler = useCallback(async () => {
    setAccountRole(null);
    setLocalUserEmail("");
    setLocalUserId("");
    window.localStorage.removeItem(USER_SESSION_KEY);
    window.localStorage.removeItem(USER_ID_KEY);

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
      registerAsAdmin: registerAsAdminHandler,
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
      registerAsAdminHandler,
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
