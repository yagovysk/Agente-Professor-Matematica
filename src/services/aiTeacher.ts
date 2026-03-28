import OpenAI from "openai";
import { ChatMessage } from "../types";

export interface TeacherService {
  ask(question: string, history: ChatMessage[]): Promise<string>;
}

const SYSTEM_PROMPT = [
  "Voce e um professor de matematica paciente para alunos brasileiros.",
  "Sempre responda em portugues (pt-BR).",
  "Explique de forma didatica, passo a passo, com exemplos curtos quando ajudar.",
  "Para Bhaskara, apresente a formula correta, calcule delta e interprete as raizes.",
  "Se a pergunta estiver incompleta, faca uma pergunta objetiva para esclarecer.",
  "Mantenha tom respeitoso e linguagem simples.",
].join(" ");

export class OpenAITeacherService implements TeacherService {
  private readonly client?: OpenAI;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  async ask(question: string, history: ChatMessage[]): Promise<string> {
    if (!this.client) {
      throw new Error("OPENAI_API_KEY_NAO_CONFIGURADA");
    }

    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...history.map((item) => ({ role: item.role, content: item.content })),
      { role: "user" as const, content: question },
    ];

    const response = await this.client.responses.create({
      model: "gpt-4.1-mini",
      input: messages,
      temperature: 0.3,
      max_output_tokens: 500,
    });

    const text = response.output_text?.trim();

    if (!text) {
      throw new Error("RESPOSTA_VAZIA_DA_IA");
    }

    return text;
  }
}
