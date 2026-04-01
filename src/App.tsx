import type { ReactElement } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { HeartPulseIcon } from "./components/PremiumIcons";
import { useAppContext } from "./context/AppContext";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import LoginPage from "./pages/Login";
import User from "./pages/User";

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

const LoadingScreen = () => (
  <div className="loading-shell">
    <span className="loading-orb loading-orb-one" />
    <span className="loading-orb loading-orb-two" />
    <div className="loading-card">
      <span className="section-chip loading-chip">Xavfsiz ishga tushirish</span>
      <span className="brand-mark loading-brand-mark">
        <HeartPulseIcon />
      </span>
      <div className="loading-copy">
        <strong>MedElite</strong>
        <h1>Premium workspace tayyorlanmoqda</h1>
        <p>Profil, bronlar va himoyalangan panel holati tekshirilmoqda.</p>
      </div>
      <div className="loading-meta">
        <span>Kirish tekshiruvi</span>
        <span>Real vaqt sinxroni</span>
        <span>Tema tiklanmoqda</span>
      </div>
      <div className="loading-bar">
        <span />
      </div>
      <div className="loading-footer">
        <span>Himoyalangan tibbiy oqim</span>
        <span>Bir necha soniya</span>
      </div>
    </div>
  </div>
);

const App = () => {
  return (
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
  );
};

export default App;
