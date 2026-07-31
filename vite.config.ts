import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import {
  generateAiReply,
  type AiMode,
  type HistoryMessage,
} from "./src/lib/aiCore";

const devChatApiPlugin = (groqKey: string): Plugin => ({
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
        res.end(JSON.stringify({ error: "Groq API kaliti sozlanmagan. VITE_GROQ_API_KEY ni qo'shing." }));
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
            groqKey: groqKey || undefined,
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
  const groqKey = env.GROQ_API_KEY || env.VITE_GROQ_API_KEY || "";

  return {
    base: "./",
    plugins: [react(), devChatApiPlugin(groqKey)],
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
