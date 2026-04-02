import type { Language } from "../context/I18nContext";

export const loginCopy: Record<
  Language,
  {
    protectedAccess: string;
    restrictedAccess: string;
    userTitle: string;
    registerTitle: string;
    adminTitle: string;
    adminText: string;
    registerText: string;
    loginText: string;
    userCabinet: string;
    adminCabinet: string;
    signIn: string;
    signUp: string;
    activeUsers: string;
    serviceRating: string;
    support: string;
    secureTitle: string;
    secureText: string;
    realtimeTitle: string;
    realtimeText: string;
    rolesTitle: string;
    rolesText: string;
    adminNote: string;
    userNote: string;
    adminEntry: string;
    newAccount: string;
    premiumEntry: string;
    adminVerify: string;
    createAccount: string;
    welcome: string;
    adminCardText: string;
    registerCardText: string;
    loginCardText: string;
    adminLoginLabel: string;
    emailLabel: string;
    adminLoginPlaceholder: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    adminPasswordPlaceholder: string;
    confirmPassword: string;
    confirmPasswordPlaceholder: string;
    remember: string;
    backHome: string;
    adminOnlyLogin: string;
    adminOnlyText: string;
    enterAdminPanel: string;
    createCabinet: string;
    enterCabinet: string;
    quickProviderLogin: string;
    google: string;
    apple: string;
    microsoft: string;
    adminSessionActive: string;
    adminFooter: string;
    registerFooter: string;
    loginFooter: string;
  }
> = {
  uz: {
    protectedAccess: "Himoyalangan kirish",
    restrictedAccess: "Yopiq kirish",
    userTitle: "Kabinetga premium darajadagi kirish",
    registerTitle: "Yangi kabinetni yaratish",
    adminTitle: "Admin nazorat markaziga kirish",
    adminText: "Faqat ruxsat berilgan admin login va paroli bilan boshqaruv paneliga kirish mumkin.",
    registerText: "Yangi foydalanuvchi hisobi ochib bronlash, tarix va profil oqimini birdaniga ishga tushiring.",
    loginText: "Ro'yhatdan o'tmagan foydalanuvchi ichki sahifalarga kira olmaydi. Faqat bosh sahifa ochiq.",
    userCabinet: "User kabineti",
    adminCabinet: "Admin kabineti",
    signIn: "Kirish",
    signUp: "Ro'yhatdan o'tish",
    activeUsers: "aktiv foydalanuvchi",
    serviceRating: "xizmat reytingi",
    support: "qo'llab-quvvatlash",
    secureTitle: "Himoyalangan kirish",
    secureText: "Ichki sahifalar endi guest foydalanuvchilar uchun yopiq.",
    realtimeTitle: "Real booking nazorati",
    realtimeText: "Bir vaqt bir kishi tomonidan band qilinadi va barcha qurilmalarda sinxron ishlaydi.",
    rolesTitle: "Rollar bo'yicha kirish",
    rolesText: "User va admin sahifalari alohida himoyalangan oqimga ega.",
    adminNote: "Admin uchun alohida ro'yhatdan o'tish yo'q. Faqat berilgan login va parol bilan kiriladi.",
    userNote: "User login qilmasdan yoki ro'yhatdan o'tmasdan ichki bo'limlarga kira olmaydi.",
    adminEntry: "Admin kirish",
    newAccount: "Yangi hisob",
    premiumEntry: "Premium kirish",
    adminVerify: "Admin tasdiqlash",
    createAccount: "Hisob yaratish",
    welcome: "Xush kelibsiz",
    adminCardText: "Admin bo'limi faqat login orqali ochiladi. Login va parol to'g'ri kiritilganda boshqaruv paneliga o'tasiz.",
    registerCardText: "Email va parol bilan yangi hisob ochib tizimga kiring.",
    loginCardText: "Tizimga kirib bronlash, tashrif tarixi va tibbiy fayllarni boshqaring.",
    adminLoginLabel: "Admin login",
    emailLabel: "Email manzil",
    adminLoginPlaceholder: "Admin logini kiriting",
    emailPlaceholder: "Email manzilingizni kiriting",
    passwordLabel: "Parol",
    passwordPlaceholder: "Parolni kiriting",
    adminPasswordPlaceholder: "Admin parolini kiriting",
    confirmPassword: "Parolni tasdiqlang",
    confirmPasswordPlaceholder: "Parolni yana bir bor kiriting",
    remember: "Meni eslab qol",
    backHome: "Bosh sahifaga qaytish",
    adminOnlyLogin: "Faqat kirish",
    adminOnlyText: "Admin bo'limida ro'yhatdan o'tish yopiq. Login va parolni kiriting.",
    enterAdminPanel: "Admin panelga kirish",
    createCabinet: "Kabinet yaratish",
    enterCabinet: "Kabinetga kirish",
    quickProviderLogin: "Firebase orqali tezkor kirish",
    google: "Google bilan kirish",
    apple: "Apple bilan kirish",
    microsoft: "Microsoft bilan kirish",
    adminSessionActive: "Admin sessiyasi faol",
    adminFooter: "Admin bo'limi yopiq rejimda ishlaydi va faqat login orqali ochiladi.",
    registerFooter: "Ro'yhatdan o'tganingizdan keyin kabinet va bronlash bo'limlari darhol ochiladi.",
    loginFooter: "Bosh sahifa ochiq, qolgan ichki sahifalar login talab qiladi.",
  },
  ru: {
    protectedAccess: "Защищённый вход",
    restrictedAccess: "Закрытый доступ",
    userTitle: "Премиальный вход в кабинет",
    registerTitle: "Создать новый кабинет",
    adminTitle: "Вход в центр администрирования",
    adminText: "Войти в панель управления можно только с разрешёнными логином и паролем администратора.",
    registerText: "Создайте новый пользовательский аккаунт и сразу запустите запись, историю и профиль.",
    loginText: "Неавторизованный пользователь не может открыть внутренние страницы. Доступна только главная страница.",
    userCabinet: "Кабинет пользователя",
    adminCabinet: "Панель администратора",
    signIn: "Вход",
    signUp: "Регистрация",
    activeUsers: "активных пользователей",
    serviceRating: "рейтинг сервиса",
    support: "поддержка",
    secureTitle: "Защищённый вход",
    secureText: "Внутренние страницы больше недоступны гостевым пользователям.",
    realtimeTitle: "Контроль записи в реальном времени",
    realtimeText: "Один слот может занять только один человек, и всё синхронизируется на всех устройствах.",
    rolesTitle: "Доступ по ролям",
    rolesText: "Страницы пользователя и администратора работают в отдельных защищённых потоках.",
    adminNote: "Для администратора отдельная регистрация отключена. Вход доступен только по выданным логину и паролю.",
    userNote: "Без входа или регистрации пользователь не может открыть внутренние разделы.",
    adminEntry: "Вход администратора",
    newAccount: "Новый аккаунт",
    premiumEntry: "Премиальный вход",
    adminVerify: "Проверка администратора",
    createAccount: "Создание аккаунта",
    welcome: "Добро пожаловать",
    adminCardText: "Админ-раздел открывается только по входу. При верных логине и пароле вы попадёте в панель управления.",
    registerCardText: "Создайте новый аккаунт по email и паролю для входа в систему.",
    loginCardText: "Войдите в систему, чтобы управлять записью, историей визитов и медицинскими файлами.",
    adminLoginLabel: "Логин администратора",
    emailLabel: "Email",
    adminLoginPlaceholder: "Введите логин администратора",
    emailPlaceholder: "Введите ваш email",
    passwordLabel: "Пароль",
    passwordPlaceholder: "Введите пароль",
    adminPasswordPlaceholder: "Введите пароль администратора",
    confirmPassword: "Подтвердите пароль",
    confirmPasswordPlaceholder: "Повторно введите пароль",
    remember: "Запомнить меня",
    backHome: "Вернуться на главную",
    adminOnlyLogin: "Только вход",
    adminOnlyText: "Регистрация для администратора закрыта. Введите логин и пароль.",
    enterAdminPanel: "Войти в админ-панель",
    createCabinet: "Создать кабинет",
    enterCabinet: "Войти в кабинет",
    quickProviderLogin: "Быстрый вход через Firebase",
    google: "Войти через Google",
    apple: "Войти через Apple",
    microsoft: "Войти через Microsoft",
    adminSessionActive: "Сессия администратора активна",
    adminFooter: "Раздел администратора работает в закрытом режиме и открывается только через вход.",
    registerFooter: "После регистрации кабинет и раздел записи открываются сразу.",
    loginFooter: "Главная страница открыта, остальные внутренние страницы требуют входа.",
  },
  en: {
    protectedAccess: "Protected access",
    restrictedAccess: "Restricted access",
    userTitle: "Premium account access",
    registerTitle: "Create a new account",
    adminTitle: "Enter the admin control center",
    adminText: "Only the approved admin login and password can open the control panel.",
    registerText: "Create a new user account and immediately unlock booking, history, and profile flow.",
    loginText: "Unauthenticated users cannot open internal pages. Only the home page is public.",
    userCabinet: "User account",
    adminCabinet: "Admin panel",
    signIn: "Sign in",
    signUp: "Register",
    activeUsers: "active users",
    serviceRating: "service rating",
    support: "support",
    secureTitle: "Secure access",
    secureText: "Internal pages are now closed for guest users.",
    realtimeTitle: "Realtime booking control",
    realtimeText: "One time slot can be taken by only one user, and it syncs across all devices.",
    rolesTitle: "Role-based access",
    rolesText: "User and admin pages run in separate protected flows.",
    adminNote: "Admin registration is disabled. Admin access is available only through the provided login and password.",
    userNote: "Without login or registration, users cannot access internal sections.",
    adminEntry: "Admin login",
    newAccount: "New account",
    premiumEntry: "Premium entry",
    adminVerify: "Admin verification",
    createAccount: "Create account",
    welcome: "Welcome back",
    adminCardText: "The admin area opens only through login. Once the login and password are correct, you will be sent to the control panel.",
    registerCardText: "Create a new account with email and password to enter the system.",
    loginCardText: "Sign in to manage bookings, visit history, and medical files.",
    adminLoginLabel: "Admin login",
    emailLabel: "Email",
    adminLoginPlaceholder: "Enter the admin login",
    emailPlaceholder: "Enter your email",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    adminPasswordPlaceholder: "Enter the admin password",
    confirmPassword: "Confirm password",
    confirmPasswordPlaceholder: "Enter the password again",
    remember: "Remember me",
    backHome: "Back to home",
    adminOnlyLogin: "Login only",
    adminOnlyText: "Admin registration is closed. Enter the login and password.",
    enterAdminPanel: "Enter admin panel",
    createCabinet: "Create account",
    enterCabinet: "Enter account",
    quickProviderLogin: "Quick login via Firebase",
    google: "Continue with Google",
    apple: "Continue with Apple",
    microsoft: "Continue with Microsoft",
    adminSessionActive: "Admin session is active",
    adminFooter: "The admin area runs in a restricted mode and opens only through login.",
    registerFooter: "After registration, the account and booking sections open immediately.",
    loginFooter: "The home page is open, while internal pages require login.",
  },
};
