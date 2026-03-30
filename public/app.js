const form = document.getElementById("chat-form");
const questionInput = document.getElementById("question");
const chatEl = document.getElementById("chat");
const sendBtn = document.getElementById("send-btn");
const suggestionsEl = document.getElementById("suggestions");
const levelInput = document.getElementById("level");
const rigorInput = document.getElementById("rigor");
const includeExercisesInput = document.getElementById("include-exercises");
const studyModeInput = document.getElementById("study-mode");
const simTopicInput = document.getElementById("sim-topic");
const simDifficultyInput = document.getElementById("sim-difficulty");
const simCountInput = document.getElementById("sim-count");
const simWithAnswersInput = document.getElementById("sim-with-answers");
const generateSimuladoBtn = document.getElementById("generate-simulado");

const history = [];
const MAX_HISTORY_ITEMS = 8;
const MAX_HISTORY_MESSAGE_LENGTH = 3600;
const MAX_RICH_RENDER_LENGTH = 6500;

const quickQuestions = [
  "Me explique a formula de Bhaskara.",
  "Resolva x^2 - 5x + 6 = 0 passo a passo.",
  "Quando o delta e negativo, o que significa?",
  "Me explique produtos notaveis com exemplos.",
  "Como resolver inequacao do 2 grau?",
];

function renderSuggestions() {
  quickQuestions.forEach((text) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = text;
    btn.addEventListener("click", () => {
      questionInput.value = text;
      questionInput.focus();
    });
    suggestionsEl.appendChild(btn);
  });
}

function appendMessage(kind, text) {
  const div = document.createElement("div");
  div.className = `msg ${kind}`;

  if (kind === "bot") {
    safeRenderBotMessage(div, text);
  } else {
    div.textContent = text;
  }

  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;

  return div;
}

function safeRenderBotMessage(container, text) {
  const source = String(text || "");
  const content = document.createElement("div");
  content.className = "msg-content";

  try {
    if (source.length > MAX_RICH_RENDER_LENGTH) {
      content.classList.add("msg-content-plain");
      content.textContent = source;
      container.appendChild(content);
      return;
    }

    content.innerHTML = renderBotHtml(source);
    container.appendChild(content);
    renderMath(content);
  } catch {
    content.classList.add("msg-content-plain");
    content.textContent = source;
    container.appendChild(content);
  }
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderBotHtml(text) {
  const source = String(text || "");

  if (!window.marked || !window.DOMPurify) {
    return `<p>${escapeHtml(source)}</p>`;
  }

  const markdownHtml = window.marked.parse(source, {
    breaks: true,
    gfm: true,
  });

  return window.DOMPurify.sanitize(markdownHtml);
}

function renderMath(element) {
  if (!window.renderMathInElement) {
    return;
  }

  window.renderMathInElement(element, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\[", right: "\\]", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false },
    ],
    throwOnError: false,
  });
}

function estimateSeconds(question, preferences) {
  const isSimulado = preferences.studyMode === "simulado";
  const isDetailed =
    /passo a passo|completo|detalhad|demonstre|com exemplo/i.test(question);

  if (isSimulado) {
    const count = Number(preferences.simulator?.questionCount) || 5;
    return Math.min(90, 14 + count * 6);
  }

  return isDetailed ? 24 : 10;
}

function createLoadingMessage(question, preferences) {
  const div = document.createElement("div");
  div.className = "msg bot loading";
  const eta = estimateSeconds(question, preferences);
  let elapsed = 0;
  div.textContent = `Professor analisando... tempo estimado: ~${eta}s`;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;

  const intervalId = setInterval(() => {
    elapsed += 1;
    const remaining = Math.max(0, eta - elapsed);
    if (remaining > 0) {
      div.textContent = `Professor analisando... tempo estimado restante: ~${remaining}s`;
    } else {
      div.textContent = "Professor analisando... quase pronto.";
    }
    chatEl.scrollTop = chatEl.scrollHeight;
  }, 1000);

  return {
    remove() {
      clearInterval(intervalId);
      div.remove();
    },
  };
}

function buildPreferences() {
  return {
    level: levelInput.value,
    rigor: rigorInput.value,
    includeExercises: includeExercisesInput.checked,
    studyMode: studyModeInput.value,
    simulator: {
      topic: simTopicInput.value.trim() || "Matematica geral",
      difficulty: simDifficultyInput.value,
      questionCount: Number(simCountInput.value) || 5,
      withAnswers: simWithAnswersInput.checked,
    },
  };
}

function sanitizeHistory(items) {
  return items.slice(-MAX_HISTORY_ITEMS).map((item) => ({
    role: item.role,
    content: String(item.content || "")
      .trim()
      .slice(0, MAX_HISTORY_MESSAGE_LENGTH),
  }));
}

async function sendQuestion(question) {
  appendMessage("user", question);
  history.push({ role: "user", content: question });

  sendBtn.disabled = true;
  generateSimuladoBtn.disabled = true;
  sendBtn.textContent = "CARREGANDO...";
  const preferences = buildPreferences();
  const loading = createLoadingMessage(question, preferences);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        preferences,
        history: sanitizeHistory(history),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro inesperado");
    }

    loading.remove();
    appendMessage("bot", data.answer);
    history.push({ role: "assistant", content: data.answer });
  } catch (error) {
    loading.remove();
    const message =
      error instanceof Error ? error.message : "Falha ao obter resposta";
    appendMessage("bot", `Erro: ${message}`);
  } finally {
    sendBtn.disabled = false;
    generateSimuladoBtn.disabled = false;
    sendBtn.textContent = "PERGUNTAR";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = questionInput.value.trim();

  if (!question) {
    return;
  }

  questionInput.value = "";
  await sendQuestion(question);
});

generateSimuladoBtn.addEventListener("click", async () => {
  studyModeInput.value = "simulado";
  const topic = simTopicInput.value.trim() || "calculo diferencial e integral";
  const difficulty = simDifficultyInput.value;
  const count = Number(simCountInput.value) || 5;
  const question = `Gere um simulado de ${count} questoes sobre ${topic}, dificuldade ${difficulty}.`;
  await sendQuestion(question);
});

appendMessage(
  "bot",
  "Sistema ativo em modo universitario. Voce pode estudar por tutoria ou gerar simulados dificeis personalizados.",
);
renderSuggestions();
