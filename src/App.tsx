import { Suspense, lazy, type ReactElement } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { HeartPulseIcon } from "./components/PremiumIcons";
import { useAppContext } from "./context/AppContext";
import { useI18n } from "./context/I18nContext";

const Home = lazy(() => import("./pages/Home"));
const LoginPage = lazy(() => import("./pages/Login"));
const User = lazy(() => import("./pages/User"));
const Admin = lazy(() => import("./pages/Admin"));

const loadingCopy = {
  uz: {
    chip: "Xavfsiz ishga tushirish",
    title: "Premium workspace tayyorlanmoqda",
    text: "Profil, bronlar va himoyalangan panel holati tekshirilmoqda.",
    check: "Kirish tekshiruvi",
    sync: "Real vaqt sinxroni",
    theme: "Tema tiklanmoqda",
    flow: "Himoyalangan tibbiy oqim",
    wait: "Bir necha soniya",
  },
  ru: {
    chip: "Безопасный запуск",
    title: "Подготавливается премиальное рабочее пространство",
    text: "Проверяются профиль, записи и состояние защищённой панели.",
    check: "Проверка входа",
    sync: "Синхронизация в реальном времени",
    theme: "Восстановление темы",
    flow: "Защищённый медицинский поток",
    wait: "Несколько секунд",
  },
  en: {
    chip: "Secure startup",
    title: "Preparing premium workspace",
    text: "Checking profile, bookings, and protected panel status.",
    check: "Login verification",
    sync: "Realtime sync",
    theme: "Restoring theme",
    flow: "Protected medical flow",
    wait: "A few seconds",
  },
} as const;

const LoadingScreen = () => {
  const { language } = useI18n();
  const copy = loadingCopy[language];

  return (
    <div className="loading-shell">
      <span className="loading-orb loading-orb-one" />
      <span className="loading-orb loading-orb-two" />
      <div className="loading-card">
        <span className="section-chip loading-chip">{copy.chip}</span>
        <span className="brand-mark loading-brand-mark">
          <HeartPulseIcon />
        </span>
        <div className="loading-copy">
          <strong>MedElite</strong>
          <h1>{copy.title}</h1>
          <p>{copy.text}</p>
        </div>
        <div className="loading-meta">
          <span>{copy.check}</span>
          <span>{copy.sync}</span>
          <span>{copy.theme}</span>
        </div>
        <div className="loading-bar">
          <span />
        </div>
        <div className="loading-footer">
          <span>{copy.flow}</span>
          <span>{copy.wait}</span>
        </div>
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

const App = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/user"
          element={
            <UserGuard>
              <User />
            </UserGuard>
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
