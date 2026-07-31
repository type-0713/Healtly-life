import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import {
  generateAiReply,
  type AiMode,
  type HistoryMessage,
} from "./src/lib/aiCore";

const devChatApiPlugin = (geminiKey: string, openAiKey: string): Plugin => ({
  name: "dev-chat-api",
  configureServer(server) {
    server.middlewares.use("/api/chat", async (req, res, next) => {
      if (req.method !== "POST") {
        next();
        return;
      }

      if (!geminiKey && !openAiKey) {
        res.statusCode = 503;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "GEMINI_API_KEY yoki OPENAI_API_KEY sozlanmagan" }));
        return;
      }

      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", async () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString()) as {
            history?: HistoryMessage[];
            userMessage?: string;
            doctors?: Array<{
              name: string;
              specialty: string;
              region: string;
              clinic: string;
              address: string;
              rating: number;
            }>;
            language?: string;
            mode?: AiMode;
          };

          const {
            history = [],
            userMessage = "",
            doctors = [],
            language = "uz",
            mode = "symptoms",
          } = body;

          const { reply, provider } = await generateAiReply({
            mode,
            history,
            userMessage,
            doctors,
            language,
            geminiKey: geminiKey || undefined,
            openAiKey: openAiKey || undefined,
          });

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ reply, provider }));
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
  const geminiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || "";
  const openAiKey = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY || "";

  return {
    base: "./",
    plugins: [react(), devChatApiPlugin(geminiKey, openAiKey)],
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
