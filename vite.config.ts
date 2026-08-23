import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import {
  buildSystemPrompt,
  callGroqApi,
  type AiMode,
  type DoctorContext,
  type HistoryMessage,
} from "./src/lib/aiCore";
import { GROQ_CHAT_MODEL } from "./src/lib/aiConfig";

const VALID_AI_MODES: AiMode[] = ["symptoms", "doctor", "drugs", "risk", "imaging"];

const devChatApiPlugin = (groqKey: string, groqModel: string): Plugin => ({
  name: "dev-chat-api",
  configureServer(server) {
    server.middlewares.use("/api/chat", async (req, res, next) => {
      if (req.method !== "POST") {
        next();
        return;
      }

      if (!groqKey) {
        res.statusCode = 503;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Groq API kaliti sozlanmagan. GROQ_API_KEY ni qo'shing." }));
        return;
      }

      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", async () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString()) as {
            history?: HistoryMessage[];
            userMessage?: string;
            doctors?: DoctorContext[];
            language?: string;
            mode?: AiMode;
          };

          const history = Array.isArray(body.history) ? body.history : [];
          const doctors = Array.isArray(body.doctors) ? body.doctors : [];
          const userMessage = typeof body.userMessage === "string" ? body.userMessage.trim() : "";
          const language = typeof body.language === "string" ? body.language : "uz";
          const mode = VALID_AI_MODES.includes(body.mode as AiMode) ? (body.mode as AiMode) : "symptoms";

          if (!userMessage) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "userMessage is required" }));
            return;
          }

          const reply = await callGroqApi(
            groqKey,
            buildSystemPrompt(mode, doctors, language),
            history,
            userMessage,
            2,
            groqModel,
          );

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ reply, provider: "groq" }));
        } catch (error) {
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "AI xatolik",
              details: error instanceof Error ? error.message : "Unknown error",
            }),
          );
        }
      });
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const groqKey = env.GROQ_API_KEY || "";
  const groqModel = env.GROQ_CHAT_MODEL?.trim() || GROQ_CHAT_MODEL;

  return {
    base: "./",
    plugins: [react(), devChatApiPlugin(groqKey, groqModel)],
    build: {
      chunkSizeWarningLimit: 750,
      rollupOptions: {
        output: {
          manualChunks: {
            router: ["react-router-dom"],
            firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          },
        },
      },
    },
  };
});
