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
