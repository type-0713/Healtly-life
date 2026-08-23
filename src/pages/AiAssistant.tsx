import { useSearchParams } from "react-router-dom";
import AiChatWidget from "../components/AiChatWidget";
import EmergencyCallButton from "../components/EmergencyCallButton";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
import { useI18n } from "../context/I18nContext";
import { aiAssistantCopy } from "../i18n/aiAssistantCopy";
import type { AiMode } from "../lib/aiCore";

const VALID_MODES: AiMode[] = ["symptoms", "doctor", "drugs", "risk", "imaging"];

const parseMode = (value: string | null): AiMode =>
  VALID_MODES.includes(value as AiMode) ? (value as AiMode) : "symptoms";

const AiAssistant = () => {
  const { language } = useI18n();
  const copy = aiAssistantCopy[language];
  const [searchParams] = useSearchParams();
  const initialMode = parseMode(searchParams.get("mode"));

  return (
    <div className="page-shell ai-page-shell">
      <Seo title={copy.title} description={copy.description} path="/ai-assistant" />

      <div className="site-orb site-orb-one" />
      <div className="site-orb site-orb-two" />

      <Navbar />

      <main className="ai-main container">
        <section className="ai-chat-panel glass-card">
          <AiChatWidget initialMode={initialMode} showModeSelector />
        </section>
      </main>

      <EmergencyCallButton />
    </div>
  );
};

export default AiAssistant;
