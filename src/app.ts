import cors from "cors";
import express from "express";
import path from "node:path";
import { z } from "zod";
import { TeacherService } from "./services/aiTeacher";

const MAX_QUESTION_LENGTH = 800;
const MAX_HISTORY_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_ITEMS = 8;

const chatPayloadSchema = z.object({
  question: z.string().trim().min(1).max(MAX_QUESTION_LENGTH),
  preferences: z
    .object({
      level: z
        .enum(["escolar", "vestibular", "graduacao", "pos-graduacao"])
        .optional(),
      rigor: z.enum(["normal", "alto"]).optional(),
      includeExercises: z.boolean().optional(),
      studyMode: z.enum(["tutoria", "simulado"]).optional(),
      simulator: z
        .object({
          topic: z.string().trim().min(1).max(120).optional(),
          difficulty: z
            .enum(["facil", "medio", "dificil", "olimpiada"])
            .optional(),
          questionCount: z.number().int().min(1).max(20).optional(),
          withAnswers: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(MAX_HISTORY_MESSAGE_LENGTH),
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
        error: "Payload invalido. Envie { question, preferences?, history? }.",
      });
      return;
    }

    try {
      const answer = await teacherService.ask(
        parsed.data.question,
        parsed.data.history ?? [],
        parsed.data.preferences,
      );

      res.json({ answer });
    } catch (error) {
      res.status(502).json({
        error:
          "Nao consegui responder agora. Tente novamente em alguns segundos.",
      });
    }
  });

  return app;
}
