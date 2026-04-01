import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckIcon,
  ArrowRightIcon,
  CalendarIcon,
  EyeIcon,
  EyeOffIcon,
  HeartPulseIcon,
  LockIcon,
  MailIcon,
  ShieldIcon,
  SparkIcon,
  UserGroupIcon,
} from "../components/PremiumIcons";
import ThemeToggle from "../components/ThemeToggle";
import { useAppContext } from "../context/AppContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    accountRole,
    currentUser,
    isAdminAuthenticated,
    profile,
    registerAsAdmin,
    registerWithCredentials,
    signInAsAdmin,
    signInWithApple,
    signInWithCredentials,
    signInWithGoogle,
    signInWithMicrosoft,
    signOutUser,
    updateProfile,
  } = useAppContext();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authAction, setAuthAction] = useState<"login" | "register">(
    searchParams.get("action") === "register" ? "register" : "login",
  );

  const mode = searchParams.get("mode") === "admin" ? "admin" : "user";
  const isAdminMode = mode === "admin";
  const nextPath = searchParams.get("next") ?? (mode === "admin" ? "/admin" : "/user");
  const isRegisterMode = authAction === "register";
  const buildLoginLink = (targetMode: "user" | "admin", targetAction: "login" | "register" = authAction) => {
    const params = new URLSearchParams();
    params.set("mode", targetMode);

    if (targetAction === "register") {
      params.set("action", "register");
    }

    if (searchParams.get("next") && targetMode === "user") {
      params.set("next", searchParams.get("next") ?? "");
    }

    return `/login?${params.toString()}`;
  };

  const userModeLink = buildLoginLink("user");
  const adminModeLink = buildLoginLink("admin");

  const cardTitle = useMemo(
    () =>
      isAdminMode
        ? isRegisterMode
          ? "Admin hisobini tayyorlash"
          : "Admin nazorat markaziga kirish"
        : isRegisterMode
          ? "Yangi kabinetni yaratish"
          : "Kabinetga premium darajadagi kirish",
    [isAdminMode, isRegisterMode],
  );

  useEffect(() => {
    setAuthAction(searchParams.get("action") === "register" ? "register" : "login");
    setAuthMessage("");
    setPassword("");
    setConfirmPassword("");
  }, [searchParams]);

  const handleActionChange = (nextAction: "login" | "register") => {
    setAuthAction(nextAction);
    navigate(buildLoginLink(mode, nextAction), { replace: true });
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setAuthMessage("");
      setIsSubmittingAuth(true);

      if (isRegisterMode && password !== confirmPassword) {
        throw new Error("Parollar bir xil emas.");
      }

      if (isAdminMode) {
        if (isRegisterMode) {
          await registerAsAdmin(email, password);
        } else {
          await signInAsAdmin(email, password);
        }
        navigate("/admin");
        return;
      }

      if (isRegisterMode) {
        await registerWithCredentials(email, password);
      } else {
        await signInWithCredentials(email, password);
      }
      await updateProfile({ email });
      navigate(nextPath);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Kirishda xatolik yuz berdi.");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleProviderLogin = async (
    action: () => Promise<void>,
    providerName: string,
  ) => {
    try {
      setAuthMessage("");
      setIsSubmittingAuth(true);
      await action();
      navigate("/user");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `${providerName} loginida xatolik yuz berdi.`;
      setAuthMessage(message);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const showActiveSession = Boolean(currentUser || isAdminAuthenticated);

  return (
    <div className="auth-page">
      <div className="site-orb site-orb-three" />
      <div className="auth-layout">
        <section className="auth-showcase">
          <div className="auth-showcase-top">
            <Link to="/" className="brand">
              <span className="brand-mark">
                <HeartPulseIcon />
              </span>
              <span>
                Med<span className="brand-accent">Elite</span>
              </span>
            </Link>
            <ThemeToggle />
          </div>

          <span className="section-chip">{isAdminMode ? "Yopiq kirish" : "Himoyalangan kirish"}</span>
          <h1>{cardTitle}</h1>
          <p>
            {isAdminMode
              ? isRegisterMode
                ? "Admin ham endi Firebase orqali alohida rol bilan ro'yhatdan o'tadi va so'ng panelga kira oladi."
                : "Faqat admin roli biriktirilgan hisob boshqaruv paneliga kira oladi."
              : isRegisterMode
                ? "Yangi foydalanuvchi hisobi ochib bronlash, tarix va profil oqimini birdaniga ishga tushiring."
                : "Ro'yhatdan o'tmagan foydalanuvchi ichki sahifalarga kira olmaydi. Faqat bosh sahifa ochiq."}
          </p>

          <div className="auth-mode-switch">
            <Link
              to={userModeLink}
              className={`auth-mode-pill ${mode === "user" ? "auth-mode-pill-active" : ""}`}
            >
              User kabineti
            </Link>
            <Link
              to={adminModeLink}
              className={`auth-mode-pill ${mode === "admin" ? "auth-mode-pill-active" : ""}`}
            >
              Admin kabineti
            </Link>
          </div>

          <div className="auth-mode-switch auth-action-switch">
            <button
              type="button"
              className={`auth-mode-pill ${!isRegisterMode ? "auth-mode-pill-active" : ""}`}
              onClick={() => handleActionChange("login")}
            >
              Kirish
            </button>
            <button
              type="button"
              className={`auth-mode-pill ${isRegisterMode ? "auth-mode-pill-active" : ""}`}
              onClick={() => handleActionChange("register")}
            >
              Ro'yhatdan o'tish
            </button>
          </div>

          <div className="auth-stats">
            <div>
              <strong>62k+</strong>
              <span>aktiv foydalanuvchi</span>
            </div>
            <div>
              <strong>4.9</strong>
              <span>xizmat reytingi</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>qo'llab-quvvatlash</span>
            </div>
          </div>

          <div className="auth-benefits">
            <article className="glass-card">
              <div className="icon-shell">
                <ShieldIcon />
              </div>
              <div>
                <h3>Himoyalangan kirish</h3>
                <p>Ichki sahifalar endi guest foydalanuvchilar uchun yopiq.</p>
              </div>
            </article>
            <article className="glass-card">
              <div className="icon-shell">
                <CalendarIcon />
              </div>
              <div>
                <h3>Real booking nazorati</h3>
                <p>Bir vaqt bir kishi tomonidan band qilinadi va barcha qurilmalarda sinxron ishlaydi.</p>
              </div>
            </article>
            <article className="glass-card">
              <div className="icon-shell">
                <UserGroupIcon />
              </div>
              <div>
                <h3>Rollar bo'yicha kirish</h3>
                <p>User va admin sahifalari alohida himoyalangan oqimga ega.</p>
              </div>
            </article>
          </div>

          <div className="auth-luxury-note">
            {isAdminMode
              ? "Admin kirish va ro'yhatdan o'tish Firebase'dagi rol tizimi bilan boshqariladi."
              : "User login qilmasdan yoki ro'yhatdan o'tmasdan ichki bo'limlarga kira olmaydi."}
          </div>
        </section>

        <section className="auth-card-wrapper">
          <div className="auth-card">
            <div className="auth-card-head">
              <span className="badge badge-gold">
                <SparkIcon />
                {isAdminMode ? "Admin kirish" : isRegisterMode ? "Yangi hisob" : "Premium kirish"}
              </span>
              <h2>
                {isAdminMode
                  ? isRegisterMode
                    ? "Admin ro'yxati"
                    : "Admin tasdiqlash"
                  : isRegisterMode
                    ? "Hisob yaratish"
                    : "Xush kelibsiz"}
              </h2>
              <p>
                {isAdminMode
                  ? isRegisterMode
                    ? "Admin roli bilan yangi hisob yaratiladi va shu zahoti boshqaruv paneliga tayyor bo'ladi."
                    : "Admin roli biriktirilgan hisob bilan tizimga kiring."
                  : isRegisterMode
                    ? "Email va parol bilan yangi hisob ochib tizimga kiring."
                    : "Tizimga kirib bronlash, tashrif tarixi va tibbiy fayllarni boshqaring."}
              </p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>Email manzil</span>
                <div className="field-box">
                  <MailIcon />
                  <input
                    type="text"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={isAdminMode ? "Admin hisob emaili" : "sizning.email@medelite.uz"}
                    required
                  />
                </div>
              </label>

              <label className="field">
                <span>Parol</span>
                <div className="field-box">
                  <LockIcon />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={isAdminMode ? "Parolni kiriting" : "Kamida 4 ta belgi"}
                    required
                  />
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label="Parol ko'rinishini almashtirish"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </label>

              {isRegisterMode && (
                <label className="field">
                  <span>Parolni tasdiqlang</span>
                  <div className="field-box">
                    <LockIcon />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Parolni qayta kiriting"
                      required
                    />
                  </div>
                </label>
              )}

              <div className="auth-meta">
                <label className="checkbox-line">
                  <input type="checkbox" defaultChecked />
                  <span>Meni eslab qol</span>
                </label>
                <a href="/">Bosh sahifaga qaytish</a>
              </div>

              <button type="submit" className="button button-primary button-block button-large" disabled={isSubmittingAuth}>
                {isAdminMode
                  ? isRegisterMode
                    ? "Admin hisobini yaratish"
                    : "Admin panelga kirish"
                  : isRegisterMode
                    ? "Kabinet yaratish"
                    : "Kabinetga kirish"}
                <ArrowRightIcon />
              </button>
            </form>

            {mode === "user" && !isRegisterMode && (
              <div className="provider-login-block">
                <p className="provider-login-title">Firebase orqali tezkor kirish</p>
                <div className="provider-login-grid">
                  <button
                    type="button"
                    className="button button-secondary button-block"
                    disabled={isSubmittingAuth}
                    onClick={() => handleProviderLogin(signInWithGoogle, "Google")}
                  >
                    Google bilan kirish
                  </button>
                  <button
                    type="button"
                    className="button button-secondary button-block"
                    disabled={isSubmittingAuth}
                    onClick={() => handleProviderLogin(signInWithApple, "Apple")}
                  >
                    Apple bilan kirish
                  </button>
                  <button
                    type="button"
                    className="button button-secondary button-block"
                    disabled={isSubmittingAuth}
                    onClick={() => handleProviderLogin(signInWithMicrosoft, "Microsoft")}
                  >
                    Microsoft bilan kirish
                  </button>
                </div>
              </div>
            )}

            {showActiveSession && (
              <div className="auth-success-card">
                <div className="summary-checks">
                  <div>
                    <CheckIcon />
                    <span>
                      {isAdminAuthenticated
                        ? "Admin sessiyasi faol"
                        : `${currentUser?.email ?? currentUser?.displayName ?? email}${
                            accountRole ? ` | ${accountRole}` : ""
                          }`}
                    </span>
                  </div>
                </div>
                <button type="button" className="button button-ghost" onClick={() => void signOutUser()}>
                  Chiqish
                </button>
              </div>
            )}

            {authMessage && <p className="auth-error-text">{authMessage}</p>}

            <div className="auth-footer">
              <p>
                {isAdminMode
                  ? "Admin panelga kirish Firebase'dagi admin rol orqali boshqariladi."
                  : isRegisterMode
                    ? "Ro'yhatdan o'tganingizdan keyin kabinet va bronlash bo'limlari darhol ochiladi."
                    : "Bosh sahifa ochiq, qolgan ichki sahifalar login talab qiladi."}
              </p>
              <div className="auth-shortcuts">
                <Link to="/" className="button button-secondary">
                  Bosh sahifa
                </Link>
                {isAdminMode && (
                  <Link to={userModeLink} className="button button-ghost">
                    User ko'rinishi
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
