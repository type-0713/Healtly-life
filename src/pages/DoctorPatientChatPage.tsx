import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useI18n } from "../context/I18nContext";
import Seo from "../components/Seo";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSwitcher from "../components/LanguageSwitcher";
import {
  ChatIcon,
  CheckCircleIcon,
  HeartPulseIcon,
  PaperclipIcon,
  PhoneIcon,
  SendIcon,
  StethoscopeIcon,
  VideoIcon,
} from "../components/PremiumIcons";
import {
  subscribeToChatMessages,
  subscribeToUserChatChannels,
  sendRealtimeChatMessage,
  getOrCreateChatChannel,
  markChatAsRead,
  type ChatChannel,
  type ChatMessageItem,
} from "../lib/realtimeChat";

const DoctorPatientChatPage = () => {
  const { language, translateSpecialty } = useI18n();
  const {
    doctors,
    currentDoctor,
    isDoctorAuthenticated,
    isUserAuthenticated,
    localUserId,
    profile,
  } = useAppContext();

  const [searchParams] = useSearchParams();
  const targetDoctorId = searchParams.get("doctor");

  const isDoctor = isDoctorAuthenticated;
  const currentUserKey = isDoctor
    ? currentDoctor?.id || "doctor-session"
    : localUserId || profile.email || "patient-user";
  const currentUserName = isDoctor
    ? currentDoctor?.name || "Dr. Shifokor"
    : profile.name || "Bemor";

  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or handle direct query parameter for doctor
  useEffect(() => {
    if (!isDoctor && targetDoctorId && doctors.length > 0) {
      const selectedDoctor = doctors.find((d) => d.id === targetDoctorId) || doctors[0];
      if (selectedDoctor) {
        getOrCreateChatChannel({
          doctorId: selectedDoctor.id,
          doctorName: selectedDoctor.name,
          doctorSpecialty: selectedDoctor.specialty,
          patientKey: currentUserKey,
          patientName: currentUserName,
          patientEmail: profile.email || "patient@medelite.uz",
        }).then((chan) => {
          setActiveChannelId(chan.id);
        });
      }
    }
  }, [targetDoctorId, doctors, isDoctor, currentUserKey, currentUserName, profile.email]);

  // Subscribe to channel list
  useEffect(() => {
    if (!currentUserKey) return;
    const unsub = subscribeToUserChatChannels(
      currentUserKey,
      isDoctor ? "doctor" : "patient",
      (chans) => {
        setChannels(chans);
        if (!activeChannelId && chans.length > 0) {
          setActiveChannelId(chans[0].id);
        }
      },
    );
    return unsub;
  }, [currentUserKey, isDoctor, activeChannelId]);

  // Subscribe to active channel messages
  useEffect(() => {
    if (!activeChannelId) return;
    markChatAsRead(activeChannelId, isDoctor ? "doctor" : "patient");
    const unsub = subscribeToChatMessages(activeChannelId, (msgs) => {
      setMessages(msgs);
    });
    return unsub;
  }, [activeChannelId, isDoctor]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const activeDoctorData = doctors.find(
    (d) => d.id === activeChannel?.doctorId || d.name === activeChannel?.doctorName,
  );
  const doctorPhone = activeDoctorData?.phone || "+998 90 123 45 67";

  const handleSelectDoctorForChat = (doc: (typeof doctors)[0]) => {
    getOrCreateChatChannel({
      doctorId: doc.id,
      doctorName: doc.name,
      doctorSpecialty: doc.specialty,
      patientKey: currentUserKey,
      patientName: currentUserName,
      patientEmail: profile.email || "patient@medelite.uz",
    }).then((c) => setActiveChannelId(c.id));
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeChannelId || isSending) return;

    const text = inputText;
    setInputText("");
    setIsSending(true);

    try {
      await sendRealtimeChatMessage({
        chatId: activeChannelId,
        senderId: currentUserKey,
        senderName: currentUserName,
        senderRole: isDoctor ? "doctor" : "patient",
        text,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setInputText(promptText);
  };

  const copy = {
    uz: {
      title: "Realtime Shifokor va Bemor Maslahat Chati",
      subtitle: "Tezkor va xavfsiz tibbiy onlayn muloqot",
      activeChats: "Muloqotlar",
      allDoctors: "Shifokorlar ro'yxati (Chat)",
      noChats: "Muloqotni boshlash uchun shifokorni tanlang",
      typePlaceholder: "Xabaringizni yozing...",
      send: "Yuborish",
      quickPrompts: "Tezkor savollar:",
      p1: "Salom doktor, simptomlarim haqida so'ramoqchi edim",
      p2: "Retsept va dori dozasini aniqlashtirsak bo'ladimi?",
      p3: "Qabul vaqtimni tasdiqlash imkoni bormi?",
      backHome: "Bosh sahifaga qaytish",
      leaveChat: "Chatdan chiqish",
      onlineStatus: "Onlayn aloqada",
    },
    ru: {
      title: "Чат консультации Врач — Пациент в реальном времени",
      subtitle: "Быстрое и безопасное медицинское общение",
      activeChats: "Диалоги",
      allDoctors: "Список врачей (Чат)",
      noChats: "Выберите врача для начала диалога",
      typePlaceholder: "Введите ваше сообщение...",
      send: "Отправить",
      quickPrompts: "Быстрые вопросы:",
      p1: "Здравствуйте, доктор, хочу проконсультироваться",
      p2: "Можно уточнить рецепт и дозировку лекарств?",
      p3: "Подтверждаем время визита?",
      backHome: "На главную",
      leaveChat: "Выйти из чата",
      onlineStatus: "В сети",
    },
    en: {
      title: "Realtime Doctor — Patient Consultation Chat",
      subtitle: "Instant & secure medical consultation",
      activeChats: "Chats",
      allDoctors: "Doctor Directory (Chat)",
      noChats: "Select a doctor to begin consultation",
      typePlaceholder: "Type your message...",
      send: "Send",
      quickPrompts: "Quick suggestions:",
      p1: "Hello Doctor, I'd like to consult about my symptoms",
      p2: "Could we confirm the prescription dosage?",
      p3: "Is my appointment slot confirmed?",
      backHome: "Back to Home",
      leaveChat: "Close Chat",
      onlineStatus: "Online now",
    },
  }[language];

  return (
    <div className="page-shell">
      <Seo title={`MedElite | ${copy.title}`} description={copy.subtitle} path="/chat" />
      <div className="site-orb site-orb-one" />
      <div className="site-orb site-orb-two" />

      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">
              <HeartPulseIcon />
            </span>
            <span>
              Med<span className="brand-accent">Elite</span> Chat
            </span>
          </Link>

          <div className="nav-actions">
            <LanguageSwitcher compact />
            <ThemeToggle compact />
            <Link to={isDoctor ? "/doctor" : isUserAuthenticated ? "/user" : "/"} className="button button-ghost">
              {copy.backHome}
            </Link>
          </div>
        </div>
      </header>

      <main className="container section-block">
        <div className="chat-layout-card glass-card">
          {/* Left Sidebar */}
          <aside className="chat-sidebar">
            <div className="chat-sidebar-header">
              <span className="section-chip">
                <ChatIcon />
                {copy.activeChats}
              </span>
            </div>

            {/* Active Channels List */}
            <div className="chat-channel-list">
              {channels.map((chan) => {
                const isActive = chan.id === activeChannelId;
                const unreadCount = isDoctor ? chan.unreadCountDoctor : chan.unreadCountPatient;
                const peerName = isDoctor ? chan.patientName : chan.doctorName;
                const peerSub = isDoctor
                  ? chan.patientEmail
                  : translateSpecialty(chan.doctorSpecialty || "Shifokor");

                return (
                  <button
                    key={chan.id}
                    type="button"
                    className={`chat-channel-item ${isActive ? "chat-channel-active" : ""}`}
                    onClick={() => setActiveChannelId(chan.id)}
                  >
                    <div className="chat-avatar">
                      {isDoctor ? <HeartPulseIcon /> : <StethoscopeIcon />}
                    </div>
                    <div className="chat-channel-info">
                      <div className="chat-channel-top">
                        <strong>{peerName}</strong>
                        {unreadCount > 0 && <span className="chat-unread-badge">{unreadCount}</span>}
                      </div>
                      <p>{peerSub}</p>
                      <span className="chat-last-msg">{chan.lastMessage}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Always Available Doctors Selector for Patients */}
            {!isDoctor && doctors.length > 0 && (
              <div className="quick-doctor-pick">
                <p className="pick-label">{copy.allDoctors}:</p>
                <div className="doctor-pick-stack">
                  {doctors.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      className="button button-ghost button-small button-block doc-pick-btn"
                      onClick={() => handleSelectDoctorForChat(doc)}
                    >
                      <StethoscopeIcon />
                      <span>{doc.name}</span>
                      <small>({translateSpecialty(doc.specialty)})</small>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main Chat Window */}
          <section className="chat-main">
            {activeChannel ? (
              <>
                <div className="chat-header">
                  <div className="chat-peer-details">
                    <div className="chat-avatar avatar-large">
                      {isDoctor ? <HeartPulseIcon /> : <StethoscopeIcon />}
                    </div>
                    <div>
                      <h2>{isDoctor ? activeChannel.patientName : activeChannel.doctorName}</h2>
                      <p className="online-badge">
                        <span className="status-dot green" />
                        {isDoctor
                          ? activeChannel.patientEmail
                          : translateSpecialty(activeChannel.doctorSpecialty || "Shifokor")}
                        {" • " + copy.onlineStatus}
                      </p>
                    </div>
                  </div>

                  <div className="chat-header-actions">
                    <a
                      href={`tel:${doctorPhone}`}
                      className="button button-secondary button-small"
                      title={`Shifokorga qo'ng'iroq qilish: ${doctorPhone}`}
                    >
                      <PhoneIcon />
                      {doctorPhone}
                    </a>
                    <Link
                      to="/telemedicine"
                      className="button button-secondary button-small"
                      title="HD Telemeditsina Video Call"
                    >
                      <VideoIcon />
                    </Link>
                    <button
                      type="button"
                      className="button button-ghost button-small"
                      onClick={() => setActiveChannelId("")}
                      title={copy.leaveChat}
                    >
                      {copy.leaveChat}
                    </button>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="chat-messages-container">
                  {messages.map((msg) => {
                    const isMe = msg.senderId === currentUserKey;
                    return (
                      <div
                        key={msg.id}
                        className={`chat-bubble-row ${isMe ? "chat-bubble-me" : "chat-bubble-peer"}`}
                      >
                        <div className="chat-bubble">
                          <span className="chat-sender-name">{msg.senderName}</span>
                          <p>{msg.text}</p>
                          <span className="chat-time">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {isMe && <CheckCircleIcon className="chat-check-icon" />}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts */}
                <div className="chat-quick-prompts">
                  <span>{copy.quickPrompts}</span>
                  <button type="button" onClick={() => handleQuickPrompt(copy.p1)}>
                    {copy.p1}
                  </button>
                  <button type="button" onClick={() => handleQuickPrompt(copy.p2)}>
                    {copy.p2}
                  </button>
                  <button type="button" onClick={() => handleQuickPrompt(copy.p3)}>
                    {copy.p3}
                  </button>
                </div>

                {/* Input Area */}
                <form className="chat-input-bar" onSubmit={handleSendMessage}>
                  <button
                    type="button"
                    className="chat-icon-btn"
                    onClick={() => alert("Fayl biriktirish xizmati faollashtirildi.")}
                    title="Attach file"
                  >
                    <PaperclipIcon />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={copy.typePlaceholder}
                    className="chat-input"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="button button-primary chat-send-btn"
                  >
                    {copy.send}
                    <SendIcon />
                  </button>
                </form>
              </>
            ) : (
              <div className="chat-empty-state">
                <ChatIcon className="chat-placeholder-icon" />
                <h3>{copy.title}</h3>
                <p>{copy.noChats}</p>
                {!isDoctor && doctors.length > 0 && (
                  <div className="empty-chat-doctor-grid">
                    {doctors.map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        className="button button-primary button-small"
                        onClick={() => handleSelectDoctorForChat(doc)}
                      >
                        <StethoscopeIcon /> {doc.name} bilan muloqot boshlash
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default DoctorPatientChatPage;
