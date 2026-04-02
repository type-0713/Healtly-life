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
import LanguageSwitcher from "../components/LanguageSwitcher";
import ThemeToggle from "../components/ThemeToggle";
import { useAppContext } from "../context/AppContext";
import { useI18n } from "../context/I18nContext";
import { loginCopy } from "../i18n/loginCopy";

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    accountRole,
    currentUser,
    isAdminAuthenticated,
    profile,
    registerWithCredentials,
    signInAsAdmin,
    signInWithApple,
    signInWithCredentials,
    signInWithGoogle,
    signInWithMicrosoft,
    signOutUser,
    updateProfile,
  } = useAppContext();
  const { language, translateError } = useI18n();
  const copy = loginCopy[language];
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
  const isRegisterMode = !isAdminMode && authAction === "register";
  const sessionLogoutLabel =
    language === "ru" ? "�����" : language === "en" ? "Logout" : "Chiqish";
  const userViewLabel =
    language === "ru" ? "����� ������������" : language === "en" ? "User view" : "User ko'rinishi";
  const passwordToggleLabel =
    language === "ru" ? "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0438\u043B\u0438 \u0441\u043A\u0440\u044B\u0442\u044C \u043F\u0430\u0440\u043E\u043B\u044C" : language === "en" ? "Show or hide password" : "Parolni ko'rsatish yoki yashirish";
  const providerFallbackError =
    language === "ru" ? "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u043E\u0439\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0433\u043E \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440\u0430." : language === "en" ? "Could not sign in with the selected provider." : "Tanlangan provider orqali kirib bo'lmadi.";
  const adminLoginHint =
    language === "ru" ? "\u0410\u0434\u043C\u0438\u043D email \u0435\u043C\u0430\u0441, \u0430\u0439\u043D\u0430\u043D \u043B\u043E\u0433\u0438\u043D\u043D\u0438 \u043A\u0438\u0440\u0438\u0442\u0435." : language === "en" ? "Enter the admin login itself, not an email address." : "Email emas, aynan admin loginni kiriting.";
  const buildLoginLink = (
    targetMode: "user" | "admin",
    targetAction: "login" | "register" = authAction,
  ) => {
    const params = new URLSearchParams();
    params.set("mode", targetMode);

    if (targetMode === "user" && targetAction === "register") {
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
        ? copy.adminTitle
        : isRegisterMode
          ? copy.registerTitle
          : copy.userTitle,
    [copy.adminTitle, copy.registerTitle, copy.userTitle, isAdminMode, isRegisterMode],
  );

  useEffect(() => {
    const nextMode = searchParams.get("mode") === "admin" ? "admin" : "user";

    setAuthAction(
      nextMode === "admin"
        ? "login"
        : searchParams.get("action") === "register"
          ? "register"
          : "login",
    );
    setEmail(nextMode === "admin" ? "" : profile.email);
    setAuthMessage("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  }, [profile.email, searchParams]);

  const handleActionChange = (nextAction: "login" | "register") => {
    setAuthAction(nextAction);
    navigate(buildLoginLink(mode, nextAction), { replace: true });
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedLogin = email.trim();

    try {
      setAuthMessage("");
      setIsSubmittingAuth(true);

      if (isRegisterMode && password !== confirmPassword) {
        throw new Error(translateError("Parollar bir xil emas."));
      }

      if (isAdminMode) {
        await signInAsAdmin(normalizedLogin, password);
        navigate("/admin");
        return;
      }

      if (isRegisterMode) {
        await registerWithCredentials(normalizedLogin, password);
      } else {
        await signInWithCredentials(normalizedLogin, password);
      }
      await updateProfile({ email: normalizedLogin });
      navigate(nextPath);
    } catch (error) {
      setAuthMessage(
        error instanceof Error ? translateError(error.message) : translateError("Kirishda xatolik yuz berdi."),
      );
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleProviderLogin = async (
    action: () => Promise<void>,
  ) => {
    try {
      setAuthMessage("");
      setIsSubmittingAuth(true);
      await action();
      navigate("/user");
    } catch (error) {
      const message =
        error instanceof Error ? translateError(error.message) : providerFallbackError;
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
        <div className="auth-card-wrapper">
          <div className={`auth-card ${isAdminMode ? "auth-card-compact" : ""}`}>
            <div className="auth-card-head">
              <span className="badge badge-gold">
                <SparkIcon />
                {isAdminMode ? copy.adminEntry : isRegisterMode ? copy.newAccount : copy.premiumEntry}
              </span>
              <h2>
                {isAdminMode
                  ? copy.adminVerify
                  : isRegisterMode
                    ? copy.createAccount
                    : copy.welcome}
              </h2>
              <p>
                {isAdminMode
                  ? copy.adminCardText
                  : isRegisterMode
                    ? copy.registerCardText
                    : copy.loginCardText}
              </p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>{isAdminMode ? copy.adminLoginLabel : copy.emailLabel}</span>
                <div className="field-box">
                  <MailIcon />
                  <input
                    type="text"
                    name={isAdminMode ? "admin-login" : "email"}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={isAdminMode ? copy.adminLoginPlaceholder : copy.emailPlaceholder}
                    required
                    autoComplete={isAdminMode ? "username" : "email"}
                    autoCapitalize="none"
                    spellCheck={false}
                    inputMode={isAdminMode ? "text" : "email"}
                  />
                </div>
                {isAdminMode && <small className="field-note">{adminLoginHint}</small>}
              </label>

              <label className="field">
                <span>{copy.passwordLabel}</span>
                <div className="field-box">
                  <LockIcon />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={isAdminMode ? copy.adminPasswordPlaceholder : copy.passwordPlaceholder}
                    required
                    autoComplete={isAdminMode ? "current-password" : isRegisterMode ? "new-password" : "current-password"}
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={passwordToggleLabel}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </label>

              {isAdminMode && (
                <div className="auth-admin-note">
                  <strong>{copy.adminOnlyLogin}</strong>
                  <span>{copy.adminOnlyText}</span>
                </div>
              )}

              {isRegisterMode && (
                <label className="field">
                  <span>{copy.confirmPassword}</span>
                  <div className="field-box">
                    <LockIcon />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirm-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder={copy.confirmPasswordPlaceholder}
                      required
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                  </div>
                </label>
              )}

              <div className="auth-meta">
                <label className="checkbox-line">
                  <input type="checkbox" defaultChecked />
                  <span>{copy.remember}</span>
                </label>
                <Link to="/">{copy.backHome}</Link>
              </div>

              <button
                type="submit"
                className="button button-primary button-block button-large"
                disabled={isSubmittingAuth}
              >
                {isAdminMode
                  ? copy.enterAdminPanel
                  : isRegisterMode
                    ? copy.createCabinet
                    : copy.enterCabinet}
                <ArrowRightIcon />
              </button>
            </form>

            {mode === "user" && !isRegisterMode && (
              <div className="provider-login-block">
                <p className="provider-login-title">{copy.quickProviderLogin}</p>
                <div className="provider-login-grid">
                  <button
                    type="button"
                    className="button button-secondary button-block"
                    disabled={isSubmittingAuth}
                    onClick={() => handleProviderLogin(signInWithGoogle)}
                  >
                    {copy.google}
                  </button>
                  <button
                    type="button"
                    className="button button-secondary button-block"
                    disabled={isSubmittingAuth}
                    onClick={() => handleProviderLogin(signInWithApple)}
                  >
                    {copy.apple}
                  </button>
                  <button
                    type="button"
                    className="button button-secondary button-block"
                    disabled={isSubmittingAuth}
                    onClick={() => handleProviderLogin(signInWithMicrosoft)}
                  >
                    {copy.microsoft}
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
                        ? copy.adminSessionActive
                        : `${currentUser?.email ?? currentUser?.displayName ?? email}${
                            accountRole ? ` | ${accountRole}` : ""
                          }`}
                    </span>
                  </div>
                </div>
                <button type="button" className="button button-ghost" onClick={() => void signOutUser()}>
                  {sessionLogoutLabel}
                </button>
              </div>
            )}

            {authMessage && <p className="auth-error-text">{authMessage}</p>}

            <div className="auth-footer">
              <p>
                {isAdminMode
                  ? copy.adminFooter
                  : isRegisterMode
                    ? copy.registerFooter
                    : copy.loginFooter}
              </p>
              <div className="auth-shortcuts">
                <Link to="/" className="button button-secondary">
                  {copy.backHome}
                </Link>
                {isAdminMode && (
                  <Link to={userModeLink} className="button button-ghost">
                    {userViewLabel}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

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
            <div className="nav-actions">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>

          <h1>{cardTitle}</h1>
          <p>
            {isAdminMode
              ? copy.adminText
              : isRegisterMode
                ? copy.registerText
                : copy.loginText}
          </p>

          <div className="auth-mode-switch">
            <Link
              to={userModeLink}
              className={`auth-mode-pill ${mode === "user" ? "auth-mode-pill-active" : ""}`}
            >
              {copy.userCabinet}
            </Link>
            <Link
              to={adminModeLink}
              className={`auth-mode-pill ${mode === "admin" ? "auth-mode-pill-active" : ""}`}
            >
              {copy.adminCabinet}
            </Link>
          </div>

          {!isAdminMode && (
            <div className="auth-mode-switch auth-action-switch">
              <button
                type="button"
                className={`auth-mode-pill ${!isRegisterMode ? "auth-mode-pill-active" : ""}`}
                onClick={() => handleActionChange("login")}
              >
                {copy.signIn}
              </button>
              <button
                type="button"
                className={`auth-mode-pill ${isRegisterMode ? "auth-mode-pill-active" : ""}`}
                onClick={() => handleActionChange("register")}
              >
                {copy.signUp}
              </button>
            </div>
          )}

          <div className="auth-stats">
            <div>
              <strong>62k+</strong>
              <span>{copy.activeUsers}</span>
            </div>
            <div>
              <strong>4.9</strong>
              <span>{copy.serviceRating}</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>{copy.support}</span>
            </div>
          </div>

          <div className="auth-benefits">
            <article className="glass-card">
              <div className="icon-shell">
                <ShieldIcon />
              </div>
              <div>
                <h3>{copy.secureTitle}</h3>
                <p>{copy.secureText}</p>
              </div>
            </article>
            <article className="glass-card">
              <div className="icon-shell">
                <CalendarIcon />
              </div>
              <div>
                <h3>{copy.realtimeTitle}</h3>
                <p>{copy.realtimeText}</p>
              </div>
            </article>
            <article className="glass-card">
              <div className="icon-shell">
                <UserGroupIcon />
              </div>
              <div>
                <h3>{copy.rolesTitle}</h3>
                <p>{copy.rolesText}</p>
              </div>
            </article>
          </div>

          <div className="auth-luxury-note">
            {isAdminMode
              ? copy.adminNote
              : copy.userNote}
          </div>
        </section>
      </div>
    </div>
  );
};
};

export default LoginPage;
