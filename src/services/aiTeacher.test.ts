import { describe, expect, it } from "vitest";
import { OllamaTeacherService } from "./aiTeacher";

describe("OllamaTeacherService fallback", () => {
  it("retorna resposta offline quando Ollama nao esta disponivel", async () => {
    const service = new OllamaTeacherService("http://127.0.0.1:1", "qwen2.5:3b", 300);

    const answer = await service.ask("Me explique Bhaskara", []);

    expect(answer).toContain("Resumo de Bhaskara");
    expect(answer.toLowerCase()).toContain("bhaskara");
  });

  it("gera simulado offline quando studyMode=simulado", async () => {
    const service = new OllamaTeacherService("http://127.0.0.1:1", "qwen2.5:3b", 300);

    const answer = await service.ask("Gere um simulado", [], {
      studyMode: "simulado",
      simulator: {
        topic: "Calculo diferencial",
        difficulty: "dificil",
        questionCount: 3,
        withAnswers: true,
      },
    });

    expect(answer).toContain("## Simulado");
    expect(answer).toContain("Quantidade: 3");
    expect(answer).toContain("## Gabarito");
  });
});
