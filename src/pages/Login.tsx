import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import EmergencyCallButton from "../components/EmergencyCallButton";
import LanguageSwitcher from "../components/LanguageSwitcher";
import Seo from "../components/Seo";
import ThemeToggle from "../components/ThemeToggle";
import {
  ArrowRightIcon,
  CalendarIcon,
  EyeIcon,
  EyeOffIcon,
  HeartPulseIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
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
    title: "Kabinetga oson kirish",
    text: "Bemor, doktor yoki admin sifatida tizimga kiring. Har bir bo'lim oddiy va tushunarli tarzda ishlaydi.",
    modes: { user: "Bemor", doctor: "Doktor", admin: "Admin" },
    actions: { login: "Kirish", register: "Ro'yxatdan o'tish" },
    userTitle: "Bemor kabineti",
    doctorTitle: "Doktor ro'yxatdan o'tishi",
    adminTitle: "Admin nazorati",
    userText: "Shifokor topish, bron qilish va qabul tarixini ko'rish uchun kiring.",
    doctorText:
      "Doktor sifatida ariza yuboring yoki kabinetga kiring. Admin tasdiqlagach qolgan ma'lumotlar to'ldiriladi.",
    adminText: "Doktorlarni tasdiqlash va buyurtmalarni boshqarish uchun kiring.",
    email: "Email",
    firstName: "Ism",
    lastName: "Familya",
    phone: "Telefon",
    password: "Parol",
    confirmPassword: "Parolni tasdiqlang",
    adminLogin: "Admin login",
    userLogin: "Kabinetga kirish",
    userRegister: "Kabinet yaratish",
    doctorLogin: "Doktor sifatida kirish",
    doctorRegister: "Doktor arizasini yuborish",
    adminSubmit: "Admin panelga kirish",
    waiting:
      "Admin tasdiqlagach, doktor kabinetiga kirganda qolgan ma'lumotlarni to'ldirish oynasi ochiladi.",
    provider: "Tez kirish",
    backHome: "Bosh sahifa",
    remember: "Sessiyani qurilmada ushlab turish",
    logout: "Chiqish",
    active: "Faol sessiya",
    metrics: [
      ["24/7", "So'rov yuborish"],
      ["Tez kirish", "Email va parol bilan"],
      ["Bir joyda", "Status va tarix"],
    ],
    highlights: [
      {
        title: "Bemor uchun qulay",
        text: "Kabinetga kirgach, doktor topish va bron qilish oson bo'ladi.",
      },
      {
        title: "Doktor uchun sodda",
        text: "Ariza topshirish va keyingi bosqichlarni kuzatish bitta sahifada ishlaydi.",
      },
      {
        title: "Admin uchun nazorat",
        text: "Tasdiqlash va boshqaruv jarayoni tartibli va tushunarli ko'rinishda berilgan.",
      },
    ],
  },
  ru: {
    title: "Вход в realtime медицинскую платформу",
    text: "Потоки user, doctor и admin управляются из одного места. Для doctor вход теперь работает без Firebase Auth.",
    modes: { user: "User", doctor: "Doctor", admin: "Admin" },
    actions: { login: "Вход", register: "Регистрация" },
    userTitle: "Кабинет пациента",
    doctorTitle: "Поток врача",
    adminTitle: "Панель администратора",
    userText: "Находите врачей, создавайте заявки 24/7 и управляйте историей приёмов.",
    doctorText:
      "На первом шаге для врача собираются только email, имя, фамилия и телефон. После одобрения администратора откроется следующий этап.",
    adminText: "Одобряйте врачей, отслеживайте поток и управляйте realtime очередью.",
    email: "Email",
    firstName: "Имя",
    lastName: "Фамилия",
    phone: "Телефон",
    password: "Пароль",
    confirmPassword: "Подтвердите пароль",
    adminLogin: "Логин администратора",
    userLogin: "Войти в кабинет",
    userRegister: "Создать кабинет",
    doctorLogin: "Войти как врач",
    doctorRegister: "Отправить заявку врача",
    adminSubmit: "Войти в админ-панель",
    waiting:
      "После одобрения администратором при входе в кабинет врача откроется модальное окно с дополнительными данными.",
    provider: "Быстрый вход",
    backHome: "Главная",
    remember: "Оставить сессию на устройстве",
    logout: "Выйти",
    active: "Активная сессия",
    metrics: [
      ["24/7", "Записи без ограничений"],
      ["30 min", "Отложенная отправка врачу"],
      ["No Auth", "Отдельный database login для doctor"],
    ],
    highlights: [
      {
        title: "Заявка врача",
        text: "На первом шаге запрашиваются только базовые личные данные.",
      },
      {
        title: "Одобрение admin",
        text: "После одобрения откроется следующий профессиональный этап.",
      },
      {
        title: "Запросы 24/7",
        text: "Запрос приходит врачу через 30 минут, и он сам решает принять или отклонить его.",
      },
    ],
  },
  en: {
    title: "Easy account access",
    text: "Sign in as a patient, doctor, or admin. Each area is designed to be simple and easy to understand.",
    modes: { user: "User", doctor: "Doctor", admin: "Admin" },
    actions: { login: "Sign in", register: "Register" },
    userTitle: "Patient workspace",
    doctorTitle: "Doctor onboarding",
    adminTitle: "Admin control",
    userText: "Sign in to find doctors, book a visit, and check appointment history.",
    doctorText:
      "Apply or sign in as a doctor. After admin approval, the remaining profile details can be completed.",
    adminText: "Sign in to approve doctors and manage bookings.",
    email: "Email",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone",
    password: "Password",
    confirmPassword: "Confirm password",
    adminLogin: "Admin login",
    userLogin: "Enter workspace",
    userRegister: "Create workspace",
    doctorLogin: "Sign in as doctor",
    doctorRegister: "Submit doctor request",
    adminSubmit: "Open admin panel",
    waiting:
      "Once approved by the admin, the doctor sees a modal with the remaining professional details on cabinet entry.",
    provider: "Quick access",
    backHome: "Home",
    remember: "Keep the session on this device",
    logout: "Logout",
    active: "Active session",
    metrics: [
      ["24/7", "Request sending"],
      ["Fast access", "Email and password"],
      ["One place", "Status and history"],
    ],
    highlights: [
      {
        title: "Easy for patients",
        text: "After sign in, doctor search and booking become quick and clear.",
      },
      {
        title: "Simple for doctors",
        text: "Application and next steps are handled on one page.",
      },
      {
        title: "Clear for admins",
        text: "Approval and management tools are shown in an organized way.",
      },
    ],
  },
} as const;

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    accountRole,
    currentDoctor,
    currentUser,
    doctorApprovalStatus,
    doctorSessionEmail,
    isAdminAuthenticated,
    isDoctorAuthenticated,
    isUserAuthenticated,
    localUserEmail,
    profile,
    registerDoctorWithCredentials,
    registerWithCredentials,
    signInAsAdmin,
    signInDoctorWithCredentials,
    signInWithApple,
    signInWithCredentials,
    signInWithGoogle,
    signInWithMicrosoft,
    signOutUser,
  } = useAppContext();
  const { language, translateError } = useI18n();
  const text = copy[language];
  const seoTitle =
    language === "ru"
      ? "MedElite | Вход в систему"
      : language === "en"
        ? "MedElite | Sign in"
        : "MedElite | Tizimga kirish";
  const seoDescription =
    language === "ru"
      ? "Авторизация для пациентов, врачей и администратора MedElite."
      : language === "en"
        ? "Secure sign in for MedElite patients, doctors, and administrators."
        : "MedElite foydalanuvchilari, doktorlari va adminlari uchun xavfsiz kirish sahifasi.";
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(profile.email || localUserEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
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
  const isDoctorRegister = mode === "doctor" && action === "register";

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
    setFirstName("");
    setLastName("");
    setPhone("");
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
      return { title: text.doctorTitle, body: text.doctorText };
    }

    if (mode === "admin") {
      return { title: text.adminTitle, body: text.adminText };
    }

    return { title: text.userTitle, body: text.userText };
  }, [mode, text.adminText, text.adminTitle, text.doctorText, text.doctorTitle, text.userText, text.userTitle]);

  const submitLabel =
    mode === "admin"
      ? text.adminSubmit
      : mode === "doctor"
        ? action === "register"
          ? text.doctorRegister
          : text.doctorLogin
        : action === "register"
          ? text.userRegister
          : text.userLogin;

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
          await registerDoctorWithCredentials({
            email,
            password,
            firstName,
            lastName,
            phone,
          });
        } else {
          await signInDoctorWithCredentials(email, password);
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

  const activeSessionLabel = isAdminAuthenticated
    ? "admin"
    : isDoctorAuthenticated
      ? `${doctorSessionEmail}${doctorApprovalStatus ? ` | ${doctorApprovalStatus}` : ""}`
      : `${currentUser?.email ?? email}${accountRole ? ` | ${accountRole}` : ""}`;

  return (
    <div className="auth-page">
      <Seo title={seoTitle} description={seoDescription} path="/login" noIndex />
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
            {text.actions.login}
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
            {text.highlights.map((item, index) => (
              <article key={item.title} className="glass-card auth-benefit-card">
                <div className="icon-shell">
                  {index === 0 ? <UserGroupIcon /> : index === 1 ? <ShieldIcon /> : <CalendarIcon />}
                </div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
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
              {isDoctorRegister && (
                <>
                  <label className="field">
                    <span>{text.firstName}</span>
                    <div className="field-box">
                      <UserGroupIcon />
                      <input value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
                    </div>
                  </label>

                  <label className="field">
                    <span>{text.lastName}</span>
                    <div className="field-box">
                      <UserGroupIcon />
                      <input value={lastName} onChange={(event) => setLastName(event.target.value)} required />
                    </div>
                  </label>

                  <label className="field">
                    <span>{text.phone}</span>
                    <div className="field-box">
                      <PhoneIcon />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="+998 90 123 45 67"
                        required
                      />
                    </div>
                  </label>
                </>
              )}

              <label className="field">
                <span>{mode === "admin" ? text.adminLogin : text.email}</span>
                <div className="field-box">
                  <MailIcon />
                  <input
                    type={mode === "admin" ? "text" : "email"}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={mode === "admin" ? "admin2486" : "doctor@medelite.uz"}
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
                    placeholder="********"
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
                      placeholder="********"
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
                <p className="provider-login-title">{text.provider}</p>
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

            {(currentUser || isAdminAuthenticated || isDoctorAuthenticated) && (
              <div className="auth-success-card">
                <div className="summary-checks">
                  <div>
                    <SparkIcon />
                    <span>
                      {text.active}: {activeSessionLabel}
                      {currentDoctor?.name ? ` | ${currentDoctor.name}` : ""}
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

      <EmergencyCallButton />
    </div>
  );
};

export default LoginPage;
