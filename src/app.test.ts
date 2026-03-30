import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app";

describe("POST /api/chat", () => {
  it("retorna resposta quando payload e valido", async () => {
    const app = createApp({
      ask: vi.fn().mockResolvedValue("Resposta do professor"),
    });

    const response = await request(app)
      .post("/api/chat")
      .send({ question: "Me explique Bhaskara" });

    expect(response.status).toBe(200);
    expect(response.body.answer).toContain("Resposta do professor");
  });

  it("retorna 400 para payload invalido", async () => {
    const app = createApp({
      ask: vi.fn().mockResolvedValue("nao importa"),
    });

    const response = await request(app)
      .post("/api/chat")
      .send({ question: "" });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Payload invalido");
  });

  it("aceita preferencias de ensino no payload", async () => {
    const askMock = vi.fn().mockResolvedValue("Resposta avancada");
    const app = createApp({
      ask: askMock,
    });

    const response = await request(app)
      .post("/api/chat")
      .send({
        question: "Resolva integral por partes",
        preferences: {
          level: "graduacao",
          rigor: "alto",
          includeExercises: true,
        },
      });

    expect(response.status).toBe(200);
    expect(askMock).toHaveBeenCalledTimes(1);
    expect(response.body.answer).toContain("Resposta avancada");
  });

  it("aceita modo simulado com configuracao de lista", async () => {
    const askMock = vi.fn().mockResolvedValue("Simulado gerado");
    const app = createApp({
      ask: askMock,
    });

    const response = await request(app)
      .post("/api/chat")
      .send({
        question: "Gere simulado de calculo",
        preferences: {
          studyMode: "simulado",
          simulator: {
            topic: "Calculo diferencial",
            difficulty: "dificil",
            questionCount: 8,
            withAnswers: true,
          },
        },
      });

    expect(response.status).toBe(200);
    expect(askMock).toHaveBeenCalledTimes(1);
    expect(response.body.answer).toContain("Simulado gerado");
  });

  it("retorna 400 para simulado com quantidade invalida", async () => {
    const app = createApp({
      ask: vi.fn().mockResolvedValue("nao importa"),
    });

    const response = await request(app)
      .post("/api/chat")
      .send({
        question: "Gere lista",
        preferences: {
          studyMode: "simulado",
          simulator: {
            questionCount: 30,
          },
        },
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Payload invalido");
  });

  it("retorna 502 quando o servico falha", async () => {
    const app = createApp({
      ask: vi.fn().mockRejectedValue(new Error("timeout")),
    });

    const response = await request(app)
      .post("/api/chat")
      .send({ question: "x^2 + 3x + 2" });

    expect(response.status).toBe(502);
    expect(response.body.error).toContain("Nao consegui responder");
  });
});
