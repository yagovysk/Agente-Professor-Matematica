import { ChatMessage } from "../types";

export type TeachingLevel =
  | "escolar"
  | "vestibular"
  | "graduacao"
  | "pos-graduacao";

export type StudyMode = "tutoria" | "simulado";

export type SimulatorDifficulty = "facil" | "medio" | "dificil" | "olimpiada";

export type SimulatorPreferences = {
  topic?: string;
  difficulty?: SimulatorDifficulty;
  questionCount?: number;
  withAnswers?: boolean;
};

export type TeachingPreferences = {
  level?: TeachingLevel;
  rigor?: "normal" | "alto";
  includeExercises?: boolean;
  studyMode?: StudyMode;
  simulator?: SimulatorPreferences;
};

export interface TeacherService {
  ask(
    question: string,
    history: ChatMessage[],
    preferences?: TeachingPreferences,
  ): Promise<string>;
}

type OllamaChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OllamaChatResponse = {
  message?: {
    content?: string;
  };
  done_reason?: string;
};

const SYSTEM_PROMPT = [
  "Voce e um professor de matematica universitario para alunos brasileiros.",
  "Sempre responda em portugues (pt-BR).",
  "Explique com didatica e rigor: use definicoes, hipoteses e notacao matematica clara.",
  "Quando relevante, organize em secoes: Intuicao, Teoria, Resolucao, Verificacao e Conclusao.",
  "Para Bhaskara, apresente formula correta, calcule delta e interprete as raizes no contexto.",
  "Para calculo e problemas avancados, detalhe regras usadas (produto, cadeia, substituicao, integracao por partes etc.).",
  "Sempre valide o resultado final (substituicao, derivacao reversa ou checagem dimensional quando fizer sentido).",
  "Se houver ambiguidade no enunciado, declare suposicoes explicitamente antes de resolver.",
  "Se identificar possivel erro no enunciado, aponte com cuidado e ofereca uma versao corrigida.",
  "Se a pergunta estiver incompleta, faca uma pergunta objetiva para esclarecer.",
  "Mantenha tom respeitoso, sem simplificar em excesso o conteudo tecnico.",
].join(" ");

function buildOfflineSimulado(preferences?: TeachingPreferences): string {
  const sim = preferences?.simulator;
  const count = sim?.questionCount ?? 5;
  const topic = sim?.topic?.trim() || "matematica geral";
  const difficulty = sim?.difficulty || "dificil";
  const withAnswers = sim?.withAnswers ?? true;
  const normalizedTopic = topic.toLowerCase();
  const isCalculus =
    normalizedTopic.includes("calculo") ||
    normalizedTopic.includes("integral") ||
    normalizedTopic.includes("derivad");

  const calculusBank = [
    {
      statement:
        "Considere f(x) = x^3 - 6x^2 + 9x + 4. Calcule f'(2) e classifique x=2 como maximo local, minimo local ou nenhum.",
      answer:
        "f'(x)=3x^2-12x+9, f'(2)=-3. Como f''(x)=6x-12 e f''(2)=0, o teste de segunda derivada e inconclusivo em x=2.",
      criteria:
        "Aplicar regra da potencia corretamente, substituir x=2 sem erro e justificar a classificacao com derivadas.",
    },
    {
      statement:
        "Resolva: integral de (2x^3 - 5x + 1) dx e verifique derivando o resultado.",
      answer: "F(x)=x^4-(5/2)x^2+x+C. Derivando: F'(x)=2x^3-5x+1.",
      criteria:
        "Integrar termo a termo, incluir constante C e validar com derivacao final.",
    },
    {
      statement:
        "Calcule o limite lim_{x->0} (sin(3x)/x) e justifique usando limite fundamental.",
      answer: "lim_{x->0} sin(3x)/x = 3.",
      criteria:
        "Usar limite fundamental com substituicao adequada e justificar o fator 3.",
    },
    {
      statement:
        "Dada f(x)=ln(x^2+3x-4), determine o dominio e os pontos onde f'(x) nao existe.",
      answer:
        "Dominio: x<-4 ou x>1. f'(x)=(2x+3)/(x^2+3x-4), nao existe em x=-4 e x=1 (fora do dominio por log).",
      criteria:
        "Identificar restricao do logaritmo, fatorar o trinomio e discutir pontos excluidos.",
    },
    {
      statement: "Calcule integral definida de 0 a 1 de (2x - 3x^2 + e^x) dx.",
      answer: "Resultado: [x^2 - x^3 + e^x]_0^1 = (1-1+e)-(0-0+1)=e-1.",
      criteria:
        "Integrar corretamente cada termo e aplicar limites sem erro algébrico.",
    },
    {
      statement:
        "Use regra do produto para derivar h(x)=x^2*e^x e simplifique.",
      answer: "h'(x)=2x*e^x + x^2*e^x = e^x(x^2+2x).",
      criteria:
        "Aplicar regra do produto e apresentar fatoracao final simplificada.",
    },
    {
      statement:
        "Determine os pontos criticos de p(x)=x^4-4x^2 e classifique-os.",
      answer:
        "p'(x)=4x^3-8x=4x(x^2-2). Criticos: x=0, +-sqrt(2). p''(x)=12x^2-8. x=0 max local, x=+-sqrt(2) mins locais.",
      criteria:
        "Encontrar zeros de p'(x), testar com p''(x) e concluir classificacao de cada ponto.",
    },
  ];

  const genericBank = Array.from({ length: 10 }, (_, idx) => ({
    statement: `Questao ${idx + 1} sobre ${topic} (${difficulty}): resolva com justificativa matematica completa.`,
    answer:
      "Resultado esperado: solucao coerente, passos claros e verificacao final.",
    criteria:
      "Definir metodo, desenvolver passos essenciais e concluir com verificacao.",
  }));

  const bank = isCalculus ? calculusBank : genericBank;
  const selected = Array.from(
    { length: count },
    (_, idx) => bank[idx % bank.length],
  );

  const questions = selected
    .map(
      (item, idx) =>
        `### Questao ${idx + 1}\n\nEnunciado: ${item.statement}\n\nObjetivo: obter a resposta final com justificativa matematica consistente.\n\nCriterios de resposta esperada: ${item.criteria}`,
    )
    .join("\n\n---\n\n");

  const answers = withAnswers
    ? [
        "## Gabarito",
        ...selected.map((item, idx) => `${idx + 1}. ${item.answer}`),
      ].join("\n")
    : "";

  return [
    `## Simulado - ${topic}`,
    `Dificuldade: ${difficulty} | Quantidade: ${count}`,
    "",
    questions,
    withAnswers ? `\n\n---\n\n${answers}` : "",
  ].join("\n");
}

function buildOfflineTutor(
  question: string,
  preferences?: TeachingPreferences,
): string {
  const normalized = question.toLowerCase();

  if (normalized.includes("bhaskara") || normalized.includes("delta")) {
    const extraExercise = preferences?.includeExercises
      ? "\n\nExercicio sugerido:\nResolva: x^2 - 7x + 12 = 0.\nGabarito curto: x1 = 3, x2 = 4."
      : "";

    return [
      "Resumo de Bhaskara:",
      "1) Equacao do 2 grau: ax^2 + bx + c = 0, com a != 0.",
      "2) Delta: D = b^2 - 4ac.",
      "3) Raizes: x = (-b +- sqrt(D)) / (2a).",
      "",
      "Interpretacao:",
      "- Se D > 0: duas raizes reais distintas.",
      "- Se D = 0: uma raiz real dupla.",
      "- Se D < 0: nao ha raiz real.",
      "",
      "Exemplo rapido: x^2 - 5x + 6 = 0",
      "- a=1, b=-5, c=6",
      "- D = (-5)^2 - 4*1*6 = 25 - 24 = 1",
      "- x1 = (5 + 1)/2 = 3, x2 = (5 - 1)/2 = 2",
      extraExercise,
    ].join("\n");
  }

  const level = preferences?.level ?? "graduacao";
  const rigor = preferences?.rigor ?? "alto";
  const includeExercises = preferences?.includeExercises ?? true;

  return [
    "Recebi sua pergunta e vou te orientar com um roteiro de resolucao universitario:",
    `- Nivel selecionado: ${level}`,
    `- Rigor selecionado: ${rigor}`,
    "",
    "Roteiro:",
    "1) Liste dados e hipoteses do problema.",
    "2) Identifique a teoria aplicavel (definicoes, teoremas, formulas).",
    "3) Resolva passo a passo, justificando cada transformacao nao-trivial.",
    "4) Verifique o resultado (substituicao, consistencia e dominio).",
    "5) Escreva conclusao objetiva.",
    includeExercises
      ? "\nExercicio sugerido: monte uma variacao da pergunta trocando coeficientes/condicoes e resolva usando o mesmo roteiro."
      : "",
    "",
    `Pergunta recebida: \"${question}\"`,
  ].join("\n");
}

function buildOfflineFallback(
  question: string,
  preferences?: TeachingPreferences,
): string {
  if (preferences?.studyMode === "simulado") {
    return buildOfflineSimulado(preferences);
  }

  return buildOfflineTutor(question, preferences);
}

function buildPreferencePrompt(preferences?: TeachingPreferences): string {
  const level = preferences?.level ?? "graduacao";
  const rigor = preferences?.rigor ?? "alto";
  const includeExercises = preferences?.includeExercises ?? true;
  const studyMode = preferences?.studyMode ?? "tutoria";
  const simulator = preferences?.simulator;

  const levelDirective: Record<TeachingLevel, string> = {
    escolar:
      "Nivel escolar: use linguagem acessivel, mas ainda com estrutura de passos e checagem.",
    vestibular:
      "Nivel vestibular: destaque tecnicas de prova e pontos que costumam cair em exame.",
    graduacao:
      "Nivel graduacao: use formalismo moderado, justificativas matematicas e notacao correta.",
    "pos-graduacao":
      "Nivel pos-graduacao: use rigor formal alto, observacoes teoricas e discussao de condicoes de validade.",
  };

  const rigorDirective =
    rigor === "alto"
      ? "Aplique rigor alto: justifique cada transformacao nao-trivial e evite saltos logicos."
      : "Aplique rigor normal: resolucao clara e objetiva, sem excesso de formalismo.";

  const exerciseDirective = includeExercises
    ? "Ao final, proponha 1 exercicio semelhante com gabarito curto."
    : "Nao inclua exercicio adicional, apenas a solucao da pergunta.";

  const modeDirective =
    studyMode === "simulado"
      ? [
          "Modo simulado ativo: gere uma lista de questoes no formato de prova.",
          `Tema alvo: ${simulator?.topic?.trim() || "matematica geral"}.`,
          `Dificuldade: ${simulator?.difficulty || "dificil"}.`,
          `Quantidade de questoes: ${simulator?.questionCount || 5}.`,
          simulator?.withAnswers
            ? "Inclua gabarito objetivo ao final, separado da lista de questoes."
            : "Nao inclua gabarito agora; somente as questoes.",
          "Nao use graficos, imagens ou desenhos; foque em texto matematico claro.",
          "Nao resolva passo a passo cada questao no modo simulado.",
          "Formato obrigatorio em cada item: Enunciado, Objetivo e Criterios de resposta esperada.",
          "Use secoes 'Questao 1', 'Questao 2' ... ate completar a quantidade solicitada.",
          "Se incluir gabarito, use secao unica 'Gabarito' no final com respostas curtas por numero.",
          "Nao interrompa a resposta antes de completar todas as questoes solicitadas.",
          "Evite repeticoes e varie os tipos de problema.",
        ].join(" ")
      : "Modo tutoria ativo: responda e ensine passo a passo a pergunta enviada.";

  return [
    levelDirective[level],
    rigorDirective,
    exerciseDirective,
    modeDirective,
  ].join(" ");
}

function shouldReturnDetailedAnswer(
  question: string,
  preferences?: TeachingPreferences,
): boolean {
  if (preferences?.studyMode === "simulado") {
    return true;
  }

  const normalized = question.toLowerCase();
  const detailHints = [
    "passo a passo",
    "completo",
    "detalhado",
    "aprofund",
    "demonstre",
    "prova",
    "rigor",
    "com exemplo",
  ];

  return detailHints.some((hint) => normalized.includes(hint));
}

function toConciseAnswer(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  const sentences = compact.match(/[^.!?]+[.!?]+/g) || [compact];
  const selected: string[] = [];
  let totalLength = 0;

  for (const sentence of sentences) {
    const chunk = sentence.trim();
    if (!chunk) {
      continue;
    }

    if (selected.length >= 4) {
      break;
    }

    if (totalLength + chunk.length > 680) {
      break;
    }

    selected.push(chunk);
    totalLength += chunk.length + 1;
  }

  if (!selected.length) {
    return compact.slice(0, 680).trim();
  }

  return selected.join(" ");
}

function removeAdjacentDuplicateLines(text: string): string {
  const lines = text.split("\n");
  const cleaned: string[] = [];

  for (const line of lines) {
    const normalized = line.trim();
    const prev = cleaned.length ? cleaned[cleaned.length - 1].trim() : "";

    if (normalized && normalized === prev) {
      continue;
    }

    cleaned.push(line);
  }

  return cleaned.join("\n").trim();
}

function isCorruptedResponse(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    normalized.includes("mathmath") ||
    normalized.includes("desculpe pela confusao anterior") ||
    normalized.includes("questas")
  );
}

function hasCompleteSimuladoStructure(
  text: string,
  expectedCount: number,
  withAnswers: boolean,
): boolean {
  const questionMatches = text.match(/quest[aã]o\s*\d+/gi) || [];
  const hasAllQuestions = questionMatches.length >= expectedCount;
  const hasAnswerSection = withAnswers ? /gabarito/i.test(text) : true;

  return hasAllQuestions && hasAnswerSection;
}

export class OllamaTeacherService implements TeacherService {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(baseUrl?: string, model?: string, timeoutMs = 15000) {
    this.baseUrl = (baseUrl || "http://127.0.0.1:11434").replace(/\/$/, "");
    this.model = model || "qwen2.5:3b";
    this.timeoutMs = timeoutMs;
  }

  private async requestOllama(
    messages: OllamaChatMessage[],
    numPredict: number,
    timeoutMs: number,
  ): Promise<{ text: string; doneReason?: string } | null> {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          options: {
            temperature: 0.2,
            num_predict: numPredict,
          },
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as OllamaChatResponse;
      const text = data.message?.content?.trim();

      if (!text) {
        return null;
      }

      return { text, doneReason: data.done_reason };
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  async ask(
    question: string,
    history: ChatMessage[],
    preferences?: TeachingPreferences,
  ): Promise<string> {
    const preferencePrompt = buildPreferencePrompt(preferences);
    const isSimulado = preferences?.studyMode === "simulado";
    const wantsDetailedAnswer = shouldReturnDetailedAnswer(
      question,
      preferences,
    );
    const requestTimeoutMs = isSimulado
      ? 90000
      : wantsDetailedAnswer
        ? 50000
        : this.timeoutMs;
    const brevityPrompt = wantsDetailedAnswer
      ? "O aluno pediu profundidade: entregue resposta completa, organizada e com verificacao final."
      : "Se a pergunta nao pedir profundidade, responda de forma objetiva e didatica em no maximo 8 linhas, sem perder precisao matematica.";
    const estimatedOutputTokens = isSimulado
      ? 2200
      : wantsDetailedAnswer
        ? 1200
        : 500;

    const messages: OllamaChatMessage[] = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      { role: "system" as const, content: preferencePrompt },
      { role: "system" as const, content: brevityPrompt },
      ...history.map((item) => ({ role: item.role, content: item.content })),
      { role: "user" as const, content: question },
    ];

    try {
      const firstChunk = await this.requestOllama(
        messages,
        estimatedOutputTokens,
        requestTimeoutMs,
      );

      if (!firstChunk) {
        return buildOfflineFallback(question, preferences);
      }

      let combinedText = firstChunk.text;
      let doneReason = firstChunk.doneReason;

      if (doneReason === "length" && (wantsDetailedAnswer || isSimulado)) {
        let continuationMessages: OllamaChatMessage[] = [
          ...messages,
          { role: "assistant", content: combinedText },
        ];

        for (
          let attempt = 0;
          attempt < 3 && doneReason === "length";
          attempt += 1
        ) {
          const continuationPrompt: OllamaChatMessage = {
            role: "user",
            content:
              "Continue exatamente de onde parou, sem repetir, ate concluir toda a resposta pendente.",
          };

          const continuationChunk = await this.requestOllama(
            [...continuationMessages, continuationPrompt],
            Math.floor(estimatedOutputTokens * 0.75),
            requestTimeoutMs,
          );

          if (!continuationChunk) {
            break;
          }

          combinedText = `${combinedText}\n\n${continuationChunk.text}`.trim();
          doneReason = continuationChunk.doneReason;
          continuationMessages = [
            ...continuationMessages,
            continuationPrompt,
            { role: "assistant", content: continuationChunk.text },
          ];
        }

        combinedText = removeAdjacentDuplicateLines(combinedText);
      }

      if (!wantsDetailedAnswer && !isSimulado) {
        return toConciseAnswer(combinedText);
      }

      if (isSimulado) {
        const expectedCount = preferences?.simulator?.questionCount ?? 5;
        const withAnswers = preferences?.simulator?.withAnswers ?? true;
        const cleanedOutput = removeAdjacentDuplicateLines(combinedText);

        if (
          isCorruptedResponse(cleanedOutput) ||
          !hasCompleteSimuladoStructure(
            cleanedOutput,
            expectedCount,
            withAnswers,
          )
        ) {
          return buildOfflineSimulado(preferences);
        }

        return cleanedOutput;
      }

      return combinedText;
    } catch {
      return buildOfflineFallback(question, preferences);
    }
  }
}
