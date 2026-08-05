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
  MenuIcon,
  CloseIcon,
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // On mobile: when channel selected, hide sidebar
  const handleChannelSelect = (channelId: string) => {
    setActiveChannelId(channelId);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

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
          if (window.innerWidth < 768) setSidebarOpen(false);
        });
      }
    }
  }, [targetDoctorId, doctors, isDoctor, currentUserKey, currentUserName, profile.email]);

  useEffect(() => {
    if (!currentUserKey) return;
    const unsub = subscribeToUserChatChannels(
      currentUserKey,
      isDoctor ? "doctor" : "patient",
      (chans) => {
        setChannels(chans);
        if (!activeChannelId && chans.length > 0) {
          setActiveChannelId(chans[0].id);
          if (window.innerWidth < 768) setSidebarOpen(false);
        }
      },
    );
    return unsub;
  }, [currentUserKey, isDoctor, activeChannelId]);

  useEffect(() => {
    if (!activeChannelId) return;
    markChatAsRead(activeChannelId, isDoctor ? "doctor" : "patient");
    const unsub = subscribeToChatMessages(activeChannelId, (msgs) => {
      setMessages(msgs);
    });
    return unsub;
  }, [activeChannelId, isDoctor]);

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
    }).then((c) => {
      setActiveChannelId(c.id);
      if (window.innerWidth < 768) setSidebarOpen(false);
    });
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

  const copy = {
    uz: {
      title: "Realtime Shifokor va Bemor Maslahat Chati",
      subtitle: "Tezkor va xavfsiz tibbiy onlayn muloqot",
      activeChats: "Muloqotlar",
      allDoctors: "Shifokorlar (Chat)",
      noChats: "Shifokorni tanlang",
      typePlaceholder: "Xabar yozing...",
      send: "Yuborish",
      quickPrompts: "Tezkor:",
      p1: "Simptomlarim haqida so'ramoqchi edim",
      p2: "Retsept va dori dozasini aniqlashtirsak?",
      p3: "Qabul vaqtimni tasdiqlash imkoni bormi?",
      backHome: "Orqaga",
      leaveChat: "Chiqish",
      onlineStatus: "Onlayn",
      chats: "Chatlar",
    },
    ru: {
      title: "Чат врач — пациент",
      subtitle: "Быстрое и безопасное медицинское общение",
      activeChats: "Диалоги",
      allDoctors: "Врачи (Чат)",
      noChats: "Выберите врача",
      typePlaceholder: "Введите сообщение...",
      send: "Отправить",
      quickPrompts: "Быстро:",
      p1: "Хочу проконсультироваться",
      p2: "Уточнить рецепт и дозировку?",
      p3: "Подтверждаем время визита?",
      backHome: "Назад",
      leaveChat: "Выйти",
      onlineStatus: "В сети",
      chats: "Чаты",
    },
    en: {
      title: "Doctor — Patient Chat",
      subtitle: "Instant & secure medical consultation",
      activeChats: "Chats",
      allDoctors: "Doctors (Chat)",
      noChats: "Select a doctor",
      typePlaceholder: "Type a message...",
      send: "Send",
      quickPrompts: "Quick:",
      p1: "I'd like to consult about my symptoms",
      p2: "Could we confirm the prescription?",
      p3: "Is my appointment confirmed?",
      backHome: "Back",
      leaveChat: "Close",
      onlineStatus: "Online",
      chats: "Chats",
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
              Med<span className="brand-accent">Elite</span>
              <span className="chat-brand-label"> Chat</span>
            </span>
          </Link>

          <div className="nav-actions">
            <LanguageSwitcher compact />
            <ThemeToggle compact />
            <Link
              to={isDoctor ? "/doctor" : isUserAuthenticated ? "/user" : "/"}
              className="button button-ghost button-small"
            >
              {copy.backHome}
            </Link>
          </div>
        </div>
      </header>

      <main className="container chat-page-main">
        <div className="chat-layout-card">
          {/* Mobile sidebar toggle bar */}
          <div className="chat-mobile-bar">
            <button
              type="button"
              className="chat-mobile-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
              <span>{sidebarOpen ? copy.leaveChat : copy.chats}</span>
            </button>
            {activeChannel && !sidebarOpen && (
              <span className="chat-mobile-peer-name">
                {isDoctor ? activeChannel.patientName : activeChannel.doctorName}
              </span>
            )}
          </div>

          {/* Left Sidebar */}
          <aside className={`chat-sidebar ${sidebarOpen ? "chat-sidebar-open" : "chat-sidebar-hidden"}`}>
            <div className="chat-sidebar-header">
              <span className="section-chip">
                <ChatIcon />
                {copy.activeChats}
              </span>
            </div>

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
                    onClick={() => handleChannelSelect(chan.id)}
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
                      {chan.lastMessage && (
                        <span className="chat-last-msg">{chan.lastMessage}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {!isDoctor && doctors.length > 0 && (
              <div className="quick-doctor-pick">
                <p className="pick-label">{copy.allDoctors}:</p>
                <div className="doctor-pick-stack">
                  {doctors.slice(0, 8).map((doc) => (
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
          <section className={`chat-main ${sidebarOpen ? "chat-main-hidden-mobile" : ""}`}>
            {activeChannel ? (
              <>
                {/* Chat Header */}
                <div className="chat-header">
                  <div className="chat-peer-details">
                    <div className="chat-avatar avatar-large">
                      {isDoctor ? <HeartPulseIcon /> : <StethoscopeIcon />}
                    </div>
                    <div className="chat-peer-info">
                      <h2>{isDoctor ? activeChannel.patientName : activeChannel.doctorName}</h2>
                      <p className="online-badge">
                        <span className="status-dot green" />
                        <span className="chat-peer-sub">
                          {isDoctor
                            ? activeChannel.patientEmail
                            : translateSpecialty(activeChannel.doctorSpecialty || "Shifokor")}
                        </span>
                        {" · "}
                        {copy.onlineStatus}
                      </p>
                    </div>
                  </div>

                  <div className="chat-header-actions">
                    <a
                      href={`tel:${doctorPhone}`}
                      className="button button-secondary button-small chat-action-btn"
                      title={doctorPhone}
                    >
                      <PhoneIcon />
                      <span className="chat-phone-text">{doctorPhone}</span>
                    </a>
                    <Link
                      to="/telemedicine"
                      className="button button-secondary button-small chat-action-btn"
                      title="Video Call"
                    >
                      <VideoIcon />
                    </Link>
                    <button
                      type="button"
                      className="button button-ghost button-small"
                      onClick={() => {
                        setActiveChannelId("");
                        if (window.innerWidth < 768) setSidebarOpen(true);
                      }}
                    >
                      <span className="chat-leave-text">{copy.leaveChat}</span>
                      <CloseIcon />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="chat-messages-container">
                  {messages.length === 0 && (
                    <div className="chat-messages-empty">
                      <ChatIcon />
                      <p>{copy.noChats}</p>
                    </div>
                  )}
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
                  <button type="button" onClick={() => setInputText(copy.p1)}>
                    {copy.p1}
                  </button>
                  <button type="button" onClick={() => setInputText(copy.p2)}>
                    {copy.p2}
                  </button>
                  <button type="button" onClick={() => setInputText(copy.p3)}>
                    {copy.p3}
                  </button>
                </div>

                {/* Input */}
                <form className="chat-input-bar" onSubmit={handleSendMessage}>
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
                    aria-label={copy.send}
                  >
                    <span className="chat-send-text">{copy.send}</span>
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
                    {doctors.slice(0, 6).map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        className="button button-primary button-small"
                        onClick={() => handleSelectDoctorForChat(doc)}
                      >
                        <StethoscopeIcon /> {doc.name}
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
