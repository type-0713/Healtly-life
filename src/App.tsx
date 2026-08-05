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

const App = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ai-assistant" element={<AiAssistant />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        <Route path="/health-guide" element={<HealthGuide />} />
        <Route path="/chat" element={<DoctorPatientChatPage />} />
        <Route path="/medical-records" element={<MedicalRecords />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/body-map" element={<InteractiveBodyMap />} />
        <Route path="/telemedicine" element={<TelemedicineRoom />} />
        <Route path="/calculators" element={<HealthCalculators />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pharmacy" element={<Pharmacy />} />
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
