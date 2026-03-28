import cors from "cors";
import express from "express";
import path from "node:path";
import { z } from "zod";
import { TeacherService } from "./services/aiTeacher";

const MAX_MESSAGE_LENGTH = 800;
const MAX_HISTORY_ITEMS = 8;

const chatPayloadSchema = z.object({
  question: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
      }),
    )
    .max(MAX_HISTORY_ITEMS)
    .optional(),
});

export function createApp(teacherService: TeacherService) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "50kb" }));
  app.use(express.static(path.resolve(process.cwd(), "public")));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/chat", async (req, res) => {
    const parsed = chatPayloadSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Payload invalido. Envie { question, history? }.",
      });
      return;
    }

    try {
      const answer = await teacherService.ask(
        parsed.data.question,
        parsed.data.history ?? [],
      );

      res.json({ answer });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "OPENAI_API_KEY_NAO_CONFIGURADA"
      ) {
        res.status(503).json({
          error:
            "Servico de IA nao configurado. Defina OPENAI_API_KEY no arquivo .env.",
        });
        return;
      }

      res.status(502).json({
        error:
          "Nao consegui responder agora. Tente novamente em alguns segundos.",
      });
    }
  });

  return app;
}
