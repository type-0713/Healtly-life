import { Suspense, lazy, type ReactElement } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { HeartPulseIcon } from "./components/PremiumIcons";
import { useAppContext } from "./context/AppContext";
import { useI18n } from "./context/I18nContext";

const Home = lazy(() => import("./pages/Home"));
const LoginPage = lazy(() => import("./pages/Login"));
const User = lazy(() => import("./pages/User"));
const Admin = lazy(() => import("./pages/Admin"));
const Doctor = lazy(() => import("./pages/Doctor"));
const AiAssistant = lazy(() => import("./pages/AiAssistant"));
const Services = lazy(() => import("./pages/Services"));
const About = lazy(() => import("./pages/About"));
const HealthGuide = lazy(() => import("./pages/HealthGuide"));
const DoctorPatientChatPage = lazy(() => import("./pages/DoctorPatientChatPage"));
const MedicalRecords = lazy(() => import("./pages/MedicalRecords"));
const EmergencyPage = lazy(() => import("./pages/EmergencyPage"));
const InteractiveBodyMap = lazy(() => import("./pages/InteractiveBodyMap"));
const TelemedicineRoom = lazy(() => import("./pages/TelemedicineRoom"));
const HealthCalculators = lazy(() => import("./pages/HealthCalculators"));
const Pharmacy = lazy(() => import("./pages/Pharmacy"));
const ProviderDashboard = lazy(() => import("./pages/ProviderDashboard"));

const loadingCopy = {
  uz: {
    chip: "Tizim yuklanmoqda",
    title: "MedElite paneli tayyorlanmoqda",
    text: "Kirish holati, rollar va buyurtmalar tekshirilmoqda.",
    footer: "Bir necha soniya kuting",
  },
  ru: {
    chip: "Realtime startup",
    title: "Панель MedElite подготавливается",
    text: "Проверяются вход, роли и поток бронирований в реальном времени.",
    footer: "Подождите несколько секунд",
  },
  en: {
    chip: "Realtime startup",
    title: "Preparing the MedElite workspace",
    text: "Checking sign-in, roles, and the realtime booking stream.",
    footer: "Please wait a few seconds",
  },
} as const;

const LoadingScreen = () => {
  const { language } = useI18n();
  const copy = loadingCopy[language];

  return (
    <div className="loading-shell">
      <span className="site-orb site-orb-one" />
      <span className="site-orb site-orb-two" />
      <div className="loading-card">
        <span className="section-chip">{copy.chip}</span>
        <span className="brand-mark loading-brand-mark">
          <HeartPulseIcon />
        </span>
        <h1>{copy.title}</h1>
        <p>{copy.text}</p>
        <div className="loading-bar">
          <span />
        </div>
        <span className="loading-footer">{copy.footer}</span>
      </div>
    </div>
  );
};

const UserGuard = ({ children }: { children: ReactElement }) => {
  const { authLoading, isUserAuthenticated } = useAppContext();
  const location = useLocation();

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!isUserAuthenticated) {
    return <Navigate to={`/login?mode=user&next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return children;
};

const AdminGuard = ({ children }: { children: ReactElement }) => {
  const { authLoading, isAdminAuthenticated } = useAppContext();

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/login?mode=admin" replace />;
  }

  return children;
};

const DoctorGuard = ({ children }: { children: ReactElement }) => {
  const { authLoading, isDoctorAuthenticated } = useAppContext();

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!isDoctorAuthenticated) {
    return <Navigate to="/login?mode=doctor" replace />;
  }

  return children;
};

const PharmacyGuard = ({ children }: { children: ReactElement }) => {
  const { authLoading, isPharmacyAuthenticated } = useAppContext();

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!isPharmacyAuthenticated) {
    return <Navigate to="/login?mode=pharmacy" replace />;
  }

  return children;
};

const HospitalGuard = ({ children }: { children: ReactElement }) => {
  const { authLoading, isHospitalAuthenticated } = useAppContext();

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!isHospitalAuthenticated) {
    return <Navigate to="/login?mode=hospital" replace />;
  }

  return children;
};

const LandingRoute = () => {
  const {
    authLoading,
    isAdminAuthenticated,
    isDoctorAuthenticated,
    isHospitalAuthenticated,
    isPharmacyAuthenticated,
    isUserAuthenticated,
  } = useAppContext();

  if (authLoading) {
    return <LoadingScreen />;
  }

  const dashboardPath = isAdminAuthenticated
    ? "/admin"
    : isDoctorAuthenticated
      ? "/doctor"
      : isPharmacyAuthenticated
        ? "/pharmacy-dashboard"
        : isHospitalAuthenticated
          ? "/hospital-dashboard"
          : isUserAuthenticated
            ? "/user"
            : null;

  return dashboardPath ? <Navigate to={dashboardPath} replace /> : <Home />;
};

const App = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route
          path="/ai-assistant"
          element={
            <UserGuard>
              <AiAssistant />
            </UserGuard>
          }
        />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        <Route path="/health-guide" element={<HealthGuide />} />
        <Route
          path="/chat"
          element={
            <UserGuard>
              <DoctorPatientChatPage />
            </UserGuard>
          }
        />
        <Route
          path="/medical-records"
          element={
            <UserGuard>
              <MedicalRecords />
            </UserGuard>
          }
        />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route
          path="/body-map"
          element={
            <UserGuard>
              <InteractiveBodyMap />
            </UserGuard>
          }
        />
        <Route
          path="/telemedicine"
          element={
            <UserGuard>
              <TelemedicineRoom />
            </UserGuard>
          }
        />
        <Route
          path="/calculators"
          element={
            <UserGuard>
              <HealthCalculators />
            </UserGuard>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/pharmacy"
          element={
            <UserGuard>
              <Pharmacy />
            </UserGuard>
          }
        />
        <Route
          path="/user"
          element={
            <UserGuard>
              <User />
            </UserGuard>
          }
        />
        <Route
          path="/doctor"
          element={
            <DoctorGuard>
              <Doctor />
            </DoctorGuard>
          }
        />
        <Route
          path="/pharmacy-dashboard"
          element={
            <PharmacyGuard>
              <ProviderDashboard role="pharmacy" />
            </PharmacyGuard>
          }
        />
        <Route
          path="/hospital-dashboard"
          element={
            <HospitalGuard>
              <ProviderDashboard role="hospital" />
            </HospitalGuard>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <Admin />
            </AdminGuard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
