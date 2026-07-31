import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useI18n } from "../context/I18nContext";
import Seo from "../components/Seo";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSwitcher from "../components/LanguageSwitcher";
import {
  ChatIcon,
  CheckCircleIcon,
  MicIcon,
  SendIcon,
  ShieldIcon,
  StethoscopeIcon,
  VideoIcon,
} from "../components/PremiumIcons";

const TelemedicineRoom = () => {
  const { language } = useI18n();
  const { doctors, profile } = useAppContext();

  const activeDoctor = doctors[0] || {
    name: "Dr. Alisher Karimov",
    specialty: "Kardiolog",
    clinic: "MedElite Heart Center",
  };

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [streamError, setStreamError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: activeDoctor.name,
      text: "Salom! Konsultatsiyaga xush kelibsiz. Qanday belgilar bezovta qilyapti?",
      time: "10:00",
    },
    {
      id: "2",
      sender: "Tizim",
      text: "🔒 HD Onlayn telemeditsina kanali shifrlangan (256-bit SSL).",
      time: "10:01",
    },
  ]);

  const [chatInput, setChatInput] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState<string[]>([
    "Qon bosimi va puls nazorati olib borilsin (kuniga 2 mahal).",
    "Kuniga 2 litr toza suv ichish va sho'r ovqatlarni kamaytirish tavsiya etiladi.",
  ]);
  const [newNote, setNewNote] = useState("");

  // Initialize Media Stream (Webcam / Audio)
  useEffect(() => {
    let isMounted = true;
    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          if (isMounted) {
            mediaStreamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          }
        }
      } catch (err) {
        console.warn("Webcam camera access fallback:", err);
        if (isMounted) setStreamError(true);
      }
    }

    if (isVideoOn) {
      startCamera();
    }

    return () => {
      isMounted = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isVideoOn]);

  const toggleCamera = () => {
    setIsVideoOn((prev) => {
      const next = !prev;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = next));
      }
      return next;
    });
  };

  const toggleMic = () => {
    setIsMicOn((prev) => {
      const next = !prev;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = next));
      }
      return next;
    });
  };

  const handleScreenShare = async () => {
    try {
      if (!isScreenSharing && navigator.mediaDevices?.getDisplayMedia) {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = displayStream;
        }
        setIsScreenSharing(true);
      } else {
        if (videoRef.current && mediaStreamRef.current) {
          videoRef.current.srcObject = mediaStreamRef.current;
        }
        setIsScreenSharing(false);
      }
    } catch {
      setIsScreenSharing(false);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = {
      id: String(Date.now()),
      sender: profile.name || "Bemor",
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");

    // Simulated Doctor Reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: activeDoctor.name,
          text: "Tushundim. Ko'rsatmalarga rioya qiling, retsept va xulosa konsultatsiya yakunida kartochkangizga yuklanadi.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 1500);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setClinicalNotes((prev) => [...prev, newNote.trim()]);
    setNewNote("");
  };

  const copy = {
    uz: {
      title: "HD Telemeditsina Virtual Video Konsultatsiya Xonasi",
      subtitle: "Shifokor bilan 100% xavfsiz, HD video va shaffof ovozli onlayn muloqot",
      connected: "Shifrlangan Aloqa Urnatildi (256-bit SSL)",
      doctorStatus: "Shifokor xonada (Onlayn)",
      doctorNotes: "Shifokor ko'rsatmalari va xulosasi (Clinical Notes)",
      backHome: "Bosh sahifaga qaytish",
      endCall: "Muloqotni yakunlash",
      addNoteBtn: "Ko'rsatma qo'shish",
    },
    ru: {
      title: "HD Виртуальная Телемедицинская комната консультаций",
      subtitle: "Безопасное видео и голосовое общение с врачом в режиме реального времени",
      connected: "Защищенное соединение (256-bit SSL)",
      doctorStatus: "Врач в комнате (В сети)",
      doctorNotes: "Рекомендации и заключение врача (Clinical Notes)",
      backHome: "На главную",
      endCall: "Завершить звонок",
      addNoteBtn: "Добавить заметку",
    },
    en: {
      title: "HD Telemedicine Virtual Consultation Room",
      subtitle: "100% Encrypted & private virtual video consultation with your specialist",
      connected: "Encrypted Connection Established (256-bit SSL)",
      doctorStatus: "Doctor in room (Online)",
      doctorNotes: "Clinical Notes & Consultation Summary",
      backHome: "Back to Home",
      endCall: "End Consultation",
      addNoteBtn: "Add Clinical Note",
    },
  }[language];

  return (
    <div className="page-shell">
      <Seo title={`MedElite | ${copy.title}`} description={copy.subtitle} path="/telemedicine" />
      <div className="site-orb site-orb-one" />
      <div className="site-orb site-orb-two" />

      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">
              <VideoIcon />
            </span>
            <span>
              Med<span className="brand-accent">Elite</span> Telemedicine HD
            </span>
          </Link>

          <div className="nav-actions">
            <LanguageSwitcher compact />
            <ThemeToggle compact />
            <Link to="/user" className="button button-ghost">
              {copy.backHome}
            </Link>
          </div>
        </div>
      </header>

      <main className="container section-block">
        <div className="telemed-layout glass-card">
          {/* Main Video Stream Window */}
          <div className="telemed-video-viewport">
            <div className="video-overlay-header">
              <span className="badge badge-gold">
                <ShieldIcon />
                {copy.connected}
              </span>
              <span className="online-badge">
                <span className="status-dot green" />
                {copy.doctorStatus}
              </span>
            </div>

            {/* Video Screen Feed */}
            <div className="video-feed-box">
              {isVideoOn ? (
                <div className="simulated-video-stream">
                  {!streamError ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="real-webcam-feed"
                    />
                  ) : (
                    <div className="doctor-video-avatar">
                      <StethoscopeIcon />
                      <h3>{activeDoctor.name}</h3>
                      <p>{activeDoctor.specialty} • {activeDoctor.clinic}</p>
                      <span className="video-live-tag">HD STREAM 1080P ACTIVE</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="video-off-placeholder">
                  <VideoIcon />
                  <p>Kamera o'chirilgan (Video Off)</p>
                </div>
              )}

              {/* Patient Self Mirror Box */}
              <div className="patient-self-mirror">
                <span>Siz ({profile.name || "Bemor"})</span>
              </div>
            </div>

            {/* Video Controls Bar */}
            <div className="telemed-controls-bar">
              <button
                type="button"
                className={`telemed-control-btn ${!isVideoOn ? "btn-off" : ""}`}
                onClick={toggleCamera}
              >
                <VideoIcon />
                {isVideoOn ? "Kamera (Yoqilgan)" : "Kamera (O'chirilgan)"}
              </button>

              <button
                type="button"
                className={`telemed-control-btn ${!isMicOn ? "btn-off" : ""}`}
                onClick={toggleMic}
              >
                <MicIcon />
                {isMicOn ? "Mikrofon (Yoqilgan)" : "Mikrofon (O'chirilgan)"}
              </button>

              <button
                type="button"
                className={`telemed-control-btn ${isScreenSharing ? "btn-active" : ""}`}
                onClick={handleScreenShare}
              >
                <VideoIcon />
                {isScreenSharing ? "Ekranni Ulashish (Faol)" : "Ekranni Ulashish"}
              </button>

              <Link to="/user" className="button button-danger">
                {copy.endCall}
              </Link>
            </div>
          </div>

          {/* Right Live Chat & Clinical Notes Sidebar */}
          <aside className="telemed-side-panel">
            <div className="telemed-chat-header">
              <ChatIcon />
              <h3>Video Chat & Ko'rsatmalar</h3>
            </div>

            <div className="telemed-messages">
              {messages.map((m) => (
                <div key={m.id} className="telemed-msg-bubble">
                  <strong>
                    {m.sender} <span className="telemed-time">{m.time}</span>
                  </strong>
                  <p>{m.text}</p>
                </div>
              ))}
            </div>

            <form className="telemed-input-form" onSubmit={handleSendChat}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Xabar yozing..."
                className="telemed-chat-input"
              />
              <button type="submit" className="button button-primary button-small">
                <SendIcon />
              </button>
            </form>

            <div className="telemed-notes-box">
              <h4>{copy.doctorNotes}</h4>
              <ul className="telemed-notes-list">
                {clinicalNotes.map((note, idx) => (
                  <li key={idx}>• {note}</li>
                ))}
              </ul>

              <form onSubmit={handleAddNote} className="add-note-form">
                <input
                  type="text"
                  placeholder="Yangi ko'rsatma..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="telemed-chat-input"
                />
                <button type="submit" className="button button-secondary button-small">
                  + Qo'shish
                </button>
              </form>

              <span className="badge badge-gold">
                <CheckCircleIcon /> E-retsept tayyorlandi
              </span>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default TelemedicineRoom;
