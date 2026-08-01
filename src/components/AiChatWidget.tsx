import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon, LocationIcon, SparkIcon, StethoscopeIcon } from "./PremiumIcons";
import { useAppContext } from "../context/AppContext";
import { useI18n } from "../context/I18nContext";
import { aiAssistantCopy } from "../i18n/aiAssistantCopy";
import {
  createChatMessage,
  getModePrompts,
  sendAiMessage,
  type AiMode,
  type ChatMessage,
} from "../lib/aiChat";
import { formatDistance, requestUserLocation, type GeoPoint } from "../lib/geo";
import { getDoctorMapQuery, getMapSearchUrl } from "../lib/maps";
import { findNearestAvailableDoctorSlot } from "../lib/schedule";
import { rankDoctorsForSymptoms } from "../lib/specialtyMatch";

type AiChatWidgetProps = {
  initialMode?: AiMode;
  compact?: boolean;
  showModeSelector?: boolean;
  className?: string;
};

const AiChatWidget = ({
  initialMode = "symptoms",
  compact = false,
  showModeSelector = true,
  className = "",
}: AiChatWidgetProps) => {
  const { language, translateRegion, translateSpecialty } = useI18n();
  const copy = aiAssistantCopy[language];
  const { appointments, doctors } = useAppContext();

  const [mode, setMode] = useState<AiMode>(initialMode);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "active" | "error">("idle");
  const [lastProvider, setLastProvider] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const detectLocation = useCallback(async () => {
    try {
      const point = await requestUserLocation();
      setUserLocation(point);
      setLocationStatus("active");
    } catch {
      setLocationStatus("error");
    }
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  const buildBookingLink = (doctorId: string) => {
    const doctor = doctors.find((entry) => entry.id === doctorId);
    if (!doctor) {
      return `/user?doctor=${encodeURIComponent(doctorId)}`;
    }
    const slot = findNearestAvailableDoctorSlot(doctor, appointments);
    if (!slot) {
      return `/user?doctor=${encodeURIComponent(doctorId)}`;
    }
    const params = new URLSearchParams({ doctor: doctorId, date: slot.date, time: slot.time });
    return `/user?${params.toString()}`;
  };

  const handleModeChange = (nextMode: AiMode) => {
    setMode(nextMode);
    setMessages([]);
    setLastProvider(null);
    inputRef.current?.focus();
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const userMsg = createChatMessage("user", trimmed);
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setIsLoading(true);

    const ranked =
      mode === "symptoms" || mode === "risk"
        ? rankDoctorsForSymptoms(doctors, trimmed, userLocation).slice(0, 3)
        : [];

    try {
      const { reply, provider } = await sendAiMessage({
        history: messages,
        userMessage: trimmed,
        doctors,
        rankedDoctors: ranked,
        language,
        mode,
      });

      setLastProvider(provider);
      setMessages([...nextHistory, createChatMessage("assistant", reply, ranked, provider)]);
    } catch {
      setMessages([
        ...nextHistory,
        createChatMessage(
          "assistant",
          language === "ru"
            ? "Xatolik yuz berdi. Qayta urinib ko'ring."
            : language === "en"
              ? "Something went wrong. Please try again."
              : "Xatolik yuz berdi. Qayta urinib ko'ring.",
        ),
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void handleSend(input);
  };

  const modePrompts = getModePrompts(mode, language);
  const activeModeCopy = copy.modes[mode];

  return (
    <div className={`ai-chat-widget ${compact ? "ai-chat-widget-compact" : ""} ${className}`.trim()}>
      {showModeSelector && (
        <div className="ai-mode-tabs" role="tablist" aria-label="AI modes">
          {(Object.keys(copy.modes) as AiMode[]).map((modeId) => (
            <button
              key={modeId}
              type="button"
              role="tab"
              aria-selected={mode === modeId}
              className={`ai-mode-tab ${mode === modeId ? "ai-mode-tab-active" : ""}`}
              onClick={() => handleModeChange(modeId)}
            >
              {copy.modes[modeId].label}
            </button>
          ))}
        </div>
      )}

      <div className="ai-chat-panel-inner">
        <div className="ai-chat-header">
          <div className="ai-chat-avatar">
            <SparkIcon />
          </div>
          <div>
            <strong>{activeModeCopy.title}</strong>
            <span>
              {lastProvider === "groq"
                ? "Groq AI"
                : lastProvider === "fallback"
                  ? copy.offlineMode
                  : copy.aiPowered}
            </span>
          </div>
          {!compact && (
            <button
              type="button"
              className={`button button-small ${locationStatus === "active" ? "button-primary" : "button-secondary"}`}
              onClick={() => void detectLocation()}
            >
              <LocationIcon />
              {locationStatus === "active"
                ? copy.locationActive
                : locationStatus === "error"
                  ? copy.locationError
                  : copy.location}
            </button>
          )}
        </div>

        <p className="ai-mode-description">{activeModeCopy.description}</p>

        <div className="ai-chat-messages">
          {messages.length === 0 && (
            <div className="ai-empty-state">
              <SparkIcon />
              <p>{activeModeCopy.emptyState}</p>
              <div className="ai-prompt-grid">
                {modePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="ai-prompt-chip"
                    onClick={() => void handleSend(prompt)}
                    disabled={isLoading}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`ai-message ${message.role === "user" ? "ai-message-user" : "ai-message-assistant"}`}
            >
              {message.role === "assistant" && (
                <div className="ai-message-avatar">
                  <SparkIcon />
                </div>
              )}
              <div className="ai-message-bubble">
                <p>{message.content}</p>

                {message.doctors && message.doctors.length > 0 && (
                  <div className="ai-doctor-cards">
                    <span className="ai-doctor-cards-label">{copy.recommendedDoctors}</span>
                    {message.doctors.map(({ doctor, distanceKm }) => (
                      <article key={doctor.id} className="ai-doctor-card">
                        <div className="ai-doctor-card-head">
                          <div className="doctor-card-avatar">
                            <StethoscopeIcon />
                          </div>
                          <div>
                            <strong>{doctor.name}</strong>
                            <span>{translateSpecialty(doctor.specialty)}</span>
                          </div>
                        </div>
                        <p>
                          {doctor.clinic} · {translateRegion(doctor.region)}
                        </p>
                        {distanceKm !== null && (
                          <span className="ai-distance-badge">
                            {copy.distance}: ~{formatDistance(distanceKm)}
                          </span>
                        )}
                        <div className="ai-doctor-card-actions">
                          <a
                            href={getMapSearchUrl(getDoctorMapQuery(doctor))}
                            target="_blank"
                            rel="noreferrer"
                            className="button button-secondary button-small"
                          >
                            {copy.viewMap}
                          </a>
                          <Link to={buildBookingLink(doctor.id)} className="button button-primary button-small">
                            {copy.bookDoctor}
                            <ArrowRightIcon />
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="ai-message ai-message-assistant">
              <div className="ai-message-avatar">
                <SparkIcon />
              </div>
              <div className="ai-message-bubble ai-typing">
                <span className="ai-typing-dot" />
                <span className="ai-typing-dot" />
                <span className="ai-typing-dot" />
                <span>{copy.thinking}</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {messages.length > 0 && (
          <div className="ai-suggested-row">
            <span>{copy.suggested}:</span>
            <div className="ai-prompt-row">
              {modePrompts.slice(0, 2).map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="ai-prompt-chip ai-prompt-chip-small"
                  onClick={() => void handleSend(prompt)}
                  disabled={isLoading}
                >
                  {prompt.length > 42 ? `${prompt.slice(0, 42)}…` : prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <form className="ai-chat-input-row" onSubmit={onSubmit}>
          <textarea
            ref={inputRef}
            rows={compact ? 2 : 2}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={activeModeCopy.placeholder}
            disabled={isLoading}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend(input);
              }
            }}
          />
          <button type="submit" className="button button-primary" disabled={isLoading || !input.trim()}>
            {copy.send}
            <ArrowRightIcon />
          </button>
        </form>

        <p className="ai-disclaimer ai-disclaimer-inline">{copy.disclaimer}</p>
      </div>
    </div>
  );
};

export default AiChatWidget;
