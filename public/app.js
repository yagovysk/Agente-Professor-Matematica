const form = document.getElementById("chat-form");
const questionInput = document.getElementById("question");
const chatEl = document.getElementById("chat");
const sendBtn = document.getElementById("send-btn");
const suggestionsEl = document.getElementById("suggestions");

const history = [];

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
  div.textContent = text;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

async function sendQuestion(question) {
  appendMessage("user", question);
  history.push({ role: "user", content: question });

  sendBtn.disabled = true;
  sendBtn.textContent = "Respondendo...";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, history: history.slice(-8) }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro inesperado");
    }

    appendMessage("bot", data.answer);
    history.push({ role: "assistant", content: data.answer });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao obter resposta";
    appendMessage("bot", `Erro: ${message}`);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Perguntar";
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

appendMessage(
  "bot",
  "Oi! Eu sou seu professor de matematica. Pergunte sobre Bhaskara ou qualquer outro tema.",
);
renderSuggestions();
