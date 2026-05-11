import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ThemeToggle from "../components/ThemeToggle";
import {
  ArrowRightIcon,
  CalendarIcon,
  EyeIcon,
  EyeOffIcon,
  HeartPulseIcon,
  LockIcon,
  MailIcon,
  ShieldIcon,
  SparkIcon,
  StethoscopeIcon,
  UserGroupIcon,
} from "../components/PremiumIcons";
import { useAppContext } from "../context/AppContext";
import { useI18n } from "../context/I18nContext";

type Mode = "user" | "doctor" | "admin";
type Action = "login" | "register";

const copy = {
  uz: {
    title: "Realtime tibbiy platformaga kirish",
    text: "User, doktor va admin oqimlari bitta joyda boshqariladi. Doktor ro'yxatdan o'tgach, admin tasdig'idan keyin kabineti ochiladi.",
    modes: {
      user: "User",
      doctor: "Doktor",
      admin: "Admin",
    },
    actions: {
      login: "Kirish",
      register: "Ro'yxatdan o'tish",
    },
    email: "Email",
    adminLogin: "Admin login",
    password: "Parol",
    confirmPassword: "Parolni tasdiqlang",
    userTitle: "Bemor kabineti",
    doctorTitle: "Doktor onboarding",
    adminTitle: "Admin nazorati",
    userText: "Shifokor toping, 24/7 buyurtma bering va qabullar tarixini boshqaring.",
    doctorText: "Yangi doktor sifatida ro'yxatdan o'ting, admin tasdig'ini kuting va keyin shaxsiy kabinetni to'ldiring.",
    adminText: "Doktorlarni tasdiqlang, oqimni nazorat qiling va realtime holatni ko'ring.",
    submitUserLogin: "Kabinetga kirish",
    submitUserRegister: "Kabinet yaratish",
    submitDoctorLogin: "Doktor sifatida kirish",
    submitDoctorRegister: "Doktor sifatida ro'yxatdan o'tish",
    submitAdmin: "Admin panelga kirish",
    waiting: "Tasdiqlangandan keyin doktor modal orqali o'zi haqidagi ma'lumotlarni to'ldiradi.",
    providerTitle: "Tez kirish",
    activeSession: "Faol sessiya",
    logout: "Chiqish",
    remember: "Qurilmada sessiyani ushlab turish",
    backHome: "Bosh sahifa",
    metrics: [
      ["24/7", "Cheklovsiz booking"],
      ["30 min", "Doktorga kechikib tushadigan request"],
      ["Realtime", "Admin va doktor oqimi"],
    ],
    highlights: [
      {
        icon: ShieldIcon,
        title: "Tasdiqlash oqimi",
        text: "Har bir yangi doktor avval admin ko'rigidan o'tadi.",
      },
      {
        icon: CalendarIcon,
        title: "24/7 navbat",
        text: "Booking istalgan vaqtda yaratiladi, request esa 30 daqiqadan keyin doktorga boradi.",
      },
      {
        icon: StethoscopeIcon,
        title: "Shaxsiy kabinet",
        text: "Doktor approved bo'lgach profilini o'zi to'ldiradi va bo'sh vaqtlarini belgilaydi.",
      },
    ],
  },
  ru: {
    title: "Вход в медицинскую realtime платформу",
    text: "Потоки user, doctor и admin управляются из одной точки. После регистрации врача кабинет откроется только после одобрения администратора.",
    modes: {
      user: "User",
      doctor: "Doctor",
      admin: "Admin",
    },
    actions: {
      login: "Вход",
      register: "Регистрация",
    },
    email: "Email",
    adminLogin: "Логин администратора",
    password: "Пароль",
    confirmPassword: "Подтвердите пароль",
    userTitle: "Кабинет пациента",
    doctorTitle: "Поток врача",
    adminTitle: "Панель администратора",
    userText: "Находите врачей, создавайте заявки 24/7 и управляйте историей приёмов.",
    doctorText: "Регистрируйтесь как новый врач, ждите одобрения администратора и затем заполните личный кабинет.",
    adminText: "Одобряйте врачей, контролируйте поток и следите за realtime статусом.",
    submitUserLogin: "Войти в кабинет",
    submitUserRegister: "Создать кабинет",
    submitDoctorLogin: "Войти как врач",
    submitDoctorRegister: "Зарегистрироваться как врач",
    submitAdmin: "Войти в админ-панель",
    waiting: "После одобрения врач сам заполнит данные в модальном окне.",
    providerTitle: "Быстрый вход",
    activeSession: "Активная сессия",
    logout: "Выйти",
    remember: "Сохранить сессию на устройстве",
    backHome: "Главная",
    metrics: [
      ["24/7", "Записи без ограничений"],
      ["30 min", "Задержка перед отправкой врачу"],
      ["Realtime", "Поток admin и doctor"],
    ],
    highlights: [
      {
        icon: ShieldIcon,
        title: "Поток одобрения",
        text: "Каждый новый врач сначала проходит проверку администратора.",
      },
      {
        icon: CalendarIcon,
        title: "Очередь 24/7",
        text: "Бронирование создаётся в любое время, а запрос уходит врачу через 30 минут.",
      },
      {
        icon: StethoscopeIcon,
        title: "Личный кабинет",
        text: "После одобрения врач сам заполняет профиль и выбирает свободные часы.",
      },
    ],
  },
  en: {
    title: "Access the realtime medical platform",
    text: "User, doctor, and admin flows are managed in one place. A doctor account opens fully only after admin approval.",
    modes: {
      user: "User",
      doctor: "Doctor",
      admin: "Admin",
    },
    actions: {
      login: "Sign in",
      register: "Register",
    },
    email: "Email",
    adminLogin: "Admin login",
    password: "Password",
    confirmPassword: "Confirm password",
    userTitle: "Patient workspace",
    doctorTitle: "Doctor onboarding",
    adminTitle: "Admin control",
    userText: "Find doctors, place 24/7 requests, and manage appointment history.",
    doctorText: "Register as a new doctor, wait for admin approval, then complete your personal workspace.",
    adminText: "Approve doctors, control the flow, and monitor the realtime status.",
    submitUserLogin: "Enter workspace",
    submitUserRegister: "Create workspace",
    submitDoctorLogin: "Sign in as doctor",
    submitDoctorRegister: "Register as doctor",
    submitAdmin: "Open admin panel",
    waiting: "After approval, the doctor completes the profile in a modal inside the cabinet.",
    providerTitle: "Quick access",
    activeSession: "Active session",
    logout: "Logout",
    remember: "Keep this session on the device",
    backHome: "Home",
    metrics: [
      ["24/7", "Unlimited booking"],
      ["30 min", "Delayed doctor request"],
      ["Realtime", "Admin and doctor flow"],
    ],
    highlights: [
      {
        icon: ShieldIcon,
        title: "Approval flow",
        text: "Every new doctor passes admin review first.",
      },
      {
        icon: CalendarIcon,
        title: "24/7 queue",
        text: "Booking can be created anytime, and the doctor receives it 30 minutes later.",
      },
      {
        icon: StethoscopeIcon,
        title: "Personal cabinet",
        text: "Once approved, the doctor completes the profile and manages free time slots.",
      },
    ],
  },
} as const;

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    accountRole,
    currentUser,
    doctorApprovalStatus,
    isAdminAuthenticated,
    isDoctorAuthenticated,
    isUserAuthenticated,
    localUserEmail,
    profile,
    registerDoctorWithCredentials,
    registerWithCredentials,
    signInAsAdmin,
    signInWithApple,
    signInWithCredentials,
    signInWithGoogle,
    signInWithMicrosoft,
    signOutUser,
  } = useAppContext();
  const { language, translateError } = useI18n();
  const text = copy[language];
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(profile.email || localUserEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mode = (searchParams.get("mode") === "doctor"
    ? "doctor"
    : searchParams.get("mode") === "admin"
      ? "admin"
      : "user") as Mode;
  const action = (mode === "admin"
    ? "login"
    : searchParams.get("action") === "register"
      ? "register"
      : "login") as Action;
  const nextPath = searchParams.get("next") ?? "/user";

  useEffect(() => {
    if (isAdminAuthenticated) {
      navigate("/admin", { replace: true });
      return;
    }

    if (isDoctorAuthenticated || accountRole === "doctor") {
      navigate("/doctor", { replace: true });
      return;
    }

    if (isUserAuthenticated) {
      navigate(nextPath, { replace: true });
    }
  }, [
    accountRole,
    isAdminAuthenticated,
    isDoctorAuthenticated,
    isUserAuthenticated,
    navigate,
    nextPath,
  ]);

  useEffect(() => {
    setPassword("");
    setConfirmPassword("");
    setAuthMessage("");
  }, [mode, action]);

  const buildLink = (nextMode: Mode, nextAction: Action = action) => {
    const params = new URLSearchParams();
    params.set("mode", nextMode);

    if (nextMode !== "admin" && nextAction === "register") {
      params.set("action", "register");
    }

    if (nextMode === "user" && searchParams.get("next")) {
      params.set("next", searchParams.get("next") ?? "");
    }

    return `/login?${params.toString()}`;
  };

  const headerContent = useMemo(() => {
    if (mode === "doctor") {
      return {
        title: text.doctorTitle,
        body: text.doctorText,
      };
    }

    if (mode === "admin") {
      return {
        title: text.adminTitle,
        body: text.adminText,
      };
    }

    return {
      title: text.userTitle,
      body: text.userText,
    };
  }, [mode, text.adminText, text.adminTitle, text.doctorText, text.doctorTitle, text.userText, text.userTitle]);

  const submitLabel =
    mode === "admin"
      ? text.submitAdmin
      : mode === "doctor"
        ? action === "register"
          ? text.submitDoctorRegister
          : text.submitDoctorLogin
        : action === "register"
          ? text.submitUserRegister
          : text.submitUserLogin;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setAuthMessage("");

      if (action === "register" && password !== confirmPassword) {
        throw new Error(translateError("Parollar bir xil emas."));
      }

      if (mode === "admin") {
        await signInAsAdmin(email, password);
        navigate("/admin");
        return;
      }

      if (mode === "doctor") {
        if (action === "register") {
          await registerDoctorWithCredentials(email, password);
        } else {
          await signInWithCredentials(email, password);
        }
        navigate("/doctor");
        return;
      }

      if (action === "register") {
        await registerWithCredentials(email, password);
      } else {
        await signInWithCredentials(email, password);
      }

      navigate(nextPath);
    } catch (error) {
      setAuthMessage(
        error instanceof Error
          ? translateError(error.message)
          : translateError("Kirishda xatolik yuz berdi."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProviderLogin = async (providerAction: () => Promise<void>) => {
    try {
      setIsSubmitting(true);
      setAuthMessage("");
      await providerAction();
      navigate("/user");
    } catch (error) {
      setAuthMessage(
        error instanceof Error
          ? translateError(error.message)
          : translateError("Kirishda xatolik yuz berdi."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <span className="site-orb site-orb-one" />
      <span className="site-orb site-orb-two" />
      <span className="site-orb site-orb-three" />

      <div className="auth-layout auth-layout-extended">
        <section className="auth-showcase auth-showcase-revamp">
          <div className="auth-showcase-top">
            <Link to="/" className="brand">
              <span className="brand-mark">
                <HeartPulseIcon />
              </span>
              <span>
                Med<span className="brand-accent">Elite</span>
              </span>
            </Link>
            <div className="nav-actions">
              <LanguageSwitcher compact />
              <ThemeToggle compact />
            </div>
          </div>

          <span className="badge badge-gold">
            <SparkIcon />
            Realtime access
          </span>
          <h1>{text.title}</h1>
          <p>{text.text}</p>

          <div className="auth-stats auth-stats-rich">
            {text.metrics.map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="auth-benefits auth-benefits-rich">
            {text.highlights.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className="glass-card auth-benefit-card">
                  <div className="icon-shell">
                    <Icon />
                  </div>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className="auth-card-wrapper">
          <div className="auth-card auth-card-premium">
            <div className="auth-card-head">
              <span className="badge">
                {mode === "doctor" ? <StethoscopeIcon /> : mode === "admin" ? <ShieldIcon /> : <UserGroupIcon />}
                {headerContent.title}
              </span>
              <h2>{headerContent.title}</h2>
              <p>{headerContent.body}</p>
            </div>

            <div className="auth-mode-switch auth-mode-switch-three">
              {(["user", "doctor", "admin"] as Mode[]).map((item) => (
                <Link
                  key={item}
                  to={buildLink(item, item === "admin" ? "login" : action)}
                  className={`auth-mode-pill ${mode === item ? "auth-mode-pill-active" : ""}`}
                >
                  {text.modes[item]}
                </Link>
              ))}
            </div>

            {mode !== "admin" && (
              <div className="auth-mode-switch auth-action-switch">
                {(["login", "register"] as Action[]).map((item) => (
                  <Link
                    key={item}
                    to={buildLink(mode, item)}
                    className={`auth-mode-pill ${action === item ? "auth-mode-pill-active" : ""}`}
                  >
                    {text.actions[item]}
                  </Link>
                ))}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>{mode === "admin" ? text.adminLogin : text.email}</span>
                <div className="field-box">
                  <MailIcon />
                  <input
                    type={mode === "admin" ? "text" : "email"}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={mode === "admin" ? "admin1234" : "doctor@medelite.uz"}
                    required
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </div>
              </label>

              <label className="field">
                <span>{text.password}</span>
                <div className="field-box">
                  <LockIcon />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    required
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label="toggle password"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </label>

              {mode !== "admin" && action === "register" && (
                <label className="field">
                  <span>{text.confirmPassword}</span>
                  <div className="field-box">
                    <LockIcon />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </label>
              )}

              {mode === "doctor" && <p className="field-note">{text.waiting}</p>}

              <div className="auth-meta">
                <label className="checkbox-line">
                  <input type="checkbox" defaultChecked />
                  <span>{text.remember}</span>
                </label>
                <Link to="/">{text.backHome}</Link>
              </div>

              <button type="submit" className="button button-primary button-block button-large" disabled={isSubmitting}>
                {submitLabel}
                <ArrowRightIcon />
              </button>
            </form>

            {mode === "user" && action === "login" && (
              <div className="provider-login-block">
                <p className="provider-login-title">{text.providerTitle}</p>
                <div className="provider-login-grid">
                  <button
                    type="button"
                    className="button button-secondary button-block"
                    onClick={() => void handleProviderLogin(signInWithGoogle)}
                    disabled={isSubmitting}
                  >
                    Google
                  </button>
                  <button
                    type="button"
                    className="button button-secondary button-block"
                    onClick={() => void handleProviderLogin(signInWithApple)}
                    disabled={isSubmitting}
                  >
                    Apple
                  </button>
                  <button
                    type="button"
                    className="button button-secondary button-block"
                    onClick={() => void handleProviderLogin(signInWithMicrosoft)}
                    disabled={isSubmitting}
                  >
                    Microsoft
                  </button>
                </div>
              </div>
            )}

            {(currentUser || isAdminAuthenticated) && (
              <div className="auth-success-card">
                <div className="summary-checks">
                  <div>
                    <SparkIcon />
                    <span>
                      {text.activeSession}:{" "}
                      {isAdminAuthenticated
                        ? "admin"
                        : `${currentUser?.email ?? email}${accountRole ? ` | ${accountRole}` : ""}${
                            accountRole === "doctor" && doctorApprovalStatus
                              ? ` | ${doctorApprovalStatus}`
                              : ""
                          }`}
                    </span>
                  </div>
                </div>
                <button type="button" className="button button-ghost" onClick={() => void signOutUser()}>
                  {text.logout}
                </button>
              </div>
            )}

            {authMessage && <p className="auth-error-text">{authMessage}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
