const canvas = document.querySelector("#signalCanvas");
const ctx = canvas.getContext("2d");
const messagesEl = document.querySelector("#messages");
const form = document.querySelector("#chatForm");
const input = document.querySelector("#messageInput");
const resetButton = document.querySelector("#resetChat");
const promptButtons = document.querySelectorAll("[data-prompt]");

const storeKey = "fireside-ai-chat-state";
let state = loadState();
let points = [];

function loadState() {
  const fallback = { messages: [] };

  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(storeKey)) };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(storeKey, JSON.stringify(state));
}

function addMessage(role, text, persist = true) {
  const message = document.createElement("article");
  message.className = `message ${role}`;

  const name = document.createElement("span");
  name.className = "name";
  name.textContent = role === "ai" ? "Fireside AI" : "You";

  message.append(name, document.createTextNode(text));
  messagesEl.append(message);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  if (persist) {
    state.messages.push({ role, text });
    saveState();
  }
}

function renderMessages() {
  messagesEl.innerHTML = "";

  if (state.messages.length === 0) {
    addMessage(
      "ai",
      "Welcome to Fireside AI. Ask a question, request writing help, brainstorm an idea, or make a plan.",
      false,
    );
    return;
  }

  state.messages.forEach((message) => addMessage(message.role, message.text, false));
}

async function makeReply(prompt) {
  const liveReply = await fetchLiveAIReply(prompt);
  if (liveReply) return liveReply;

  const text = prompt.trim();
  const lower = text.toLowerCase();
  const mathAnswer = solveMath(text);
  const directAnswer = answerCommonQuestion(lower);

  if (isGreeting(lower)) {
    return "Hi. I am Fireside AI. Ask me a question, give me a topic, request a draft, or tell me what you are trying to figure out.";
  }

  if (mathAnswer) {
    return mathAnswer;
  }

  if (directAnswer) {
    return directAnswer;
  }

  if (lower.includes("time") || lower.includes("date") || lower.includes("today")) {
    const now = new Date();
    return `Right now it is ${now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} on ${now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.`;
  }

  if (lower.includes("who are you") || lower.includes("what can you do")) {
    return "I am Fireside AI, a free demo AI assistant for answering questions, writing drafts, brainstorming ideas, making plans, explaining topics, and helping with school or coding basics.";
  }

  if (lower.includes("explain") || lower.includes("what is") || lower.includes("how does") || lower.includes("how do")) {
    const topic = topicFrom(text);
    return `Here is the simple version:\n\n${topic} means you should look at the main idea first, then the details.\n\n1. What it is: the basic concept or process.\n2. Why it matters: the problem it helps solve.\n3. How it works: the steps, rules, or patterns behind it.\n\nIf you want, ask me to explain "${topic}" like you are 10, like a teacher, or with examples.`;
  }

  if (lower.startsWith("why") || lower.includes(" why ")) {
    return `A good way to answer that is to look for the cause.\n\nFor "${text}", the likely answer depends on context, but usually there are three parts:\n\n1. The direct reason something happens.\n2. The conditions that make it possible.\n3. The result or consequence.\n\nGive me a little more detail and I can make the answer more specific.`;
  }

  if (lower.includes("email")) {
    return "Here is a polished email draft:\n\nSubject: Quick request\n\nHi,\n\nI hope you are doing well. I wanted to reach out because I could use your help with something I am working on. Would you be available to take a quick look and share your thoughts?\n\nThank you,\n[Your Name]";
  }

  if (lower.includes("write") || lower.includes("paragraph") || lower.includes("essay")) {
    const topic = topicFrom(text);
    return `Here is a strong starting draft:\n\n${capitalize(topic)} is an important topic because it affects how people think, work, and solve problems. To understand it clearly, it helps to look at the main idea, the reason it matters, and a real example. With those pieces in place, the topic becomes easier to explain and use in everyday life.`;
  }

  if (lower.includes("summarize") || lower.includes("summary")) {
    const possibleText = text.replace(/summarize|summary of|make a summary of/gi, "").trim();
    if (possibleText.length > 30) {
      return `Short summary:\n\n${possibleText.split(/[.!?]/).filter(Boolean).slice(0, 2).join(". ").trim()}.\n\nMain point: this text is about the most important idea in what you shared.`;
    }
    return "Send me the text you want summarized, and I will turn it into a short version with the main points and next steps.";
  }

  if (lower.includes("idea") || lower.includes("brainstorm") || lower.includes("app")) {
    return "Here are five ideas:\n\n1. A homework planner that turns assignments into daily steps.\n2. A recipe helper that builds meals from ingredients you already have.\n3. A local event finder with personalized recommendations.\n4. A study buddy that quizzes you from your notes.\n5. A budget tracker that explains spending in plain language.";
  }

  if (lower.includes("plan") || lower.includes("study") || lower.includes("learn")) {
    return "Here is a simple plan:\n\n1. Pick one clear goal.\n2. Spend 20 minutes learning the basics.\n3. Practice with one small example.\n4. Save what confused you.\n5. Repeat tomorrow with a slightly harder challenge.";
  }

  if (lower.includes("code") || lower.includes("javascript") || lower.includes("html") || lower.includes("css")) {
    return "I can help with coding basics. A good coding answer usually needs three things:\n\n1. What you want the code to do.\n2. What language you are using.\n3. What error or problem you are seeing.\n\nFor a website, HTML is the structure, CSS is the style, and JavaScript makes it interactive.";
  }

  if (lower.includes("school") || lower.includes("homework") || lower.includes("test")) {
    return "I can help you study without just dumping an answer. Try this:\n\n1. Tell me the subject.\n2. Paste the question.\n3. Tell me what part is confusing.\n\nThen I can explain it step by step and help you check your work.";
  }

  if (lower.includes("chatgpt") || lower.includes("real ai") || lower.includes("everybody")) {
    return "Fireside AI can be made public as a website, but real live AI responses need a model behind it. This demo runs free in the browser. To make it work like ChatGPT for everyone, connect the chat box to an AI API or an open-source model hosted on a server.";
  }

  if (isQuestion(lower)) {
    return `The short answer is: I need a little more detail to answer that accurately.\n\nWhat I can do right now is help with common questions, basic facts, math, writing, coding basics, summaries, ideas, and plans. Try asking it more directly, like "What color is the sky?" or "Why is the sky blue?"`;
  }

  return `I can help with that. Tell me what kind of answer you want: a quick answer, a list, a plan, a rewrite, or an explanation.`;
}

function topicFrom(text) {
  return text
    .replace(/^(explain|what is|how does|how do|tell me about|write|write about|paragraph about|essay about)\s+/i, "")
    .replace(/[?.!]+$/g, "")
    .trim() || "This topic";
}

async function fetchLiveAIReply(text) {
  try {
    const response = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        history: state.messages.slice(-8),
      }),
    });

    if (!response.ok) return "";

    const data = await response.json();
    return data.reply || "";
  } catch {
    return "";
  }
}

function isGreeting(text) {
  return /^(hi|hello|hey|yo|sup|good morning|good afternoon|good evening)\b/.test(text);
}

function isQuestion(text) {
  return /^(what|why|how|when|where|who|which|can|could|is|are|do|does|did)\b/.test(text) || text.includes("?");
}

function answerCommonQuestion(text) {
  const answers = [
    {
      patterns: ["what color is the sky", "color of the sky", "what colour is the sky"],
      answer: "The sky is usually blue during the day. It can look orange, pink, red, or purple during sunrise and sunset, and dark at night.",
    },
    {
      patterns: ["why is the sky blue"],
      answer: "The sky looks blue because Earth's atmosphere scatters blue light from the Sun more than most other colors. This is called Rayleigh scattering.",
    },
    {
      patterns: ["what color is grass", "color of grass"],
      answer: "Grass is usually green because it contains chlorophyll, which helps plants use sunlight for energy.",
    },
    {
      patterns: ["what is ai", "what is artificial intelligence"],
      answer: "AI, or artificial intelligence, is technology that lets computers do tasks that normally need human thinking, like answering questions, recognizing patterns, writing text, or making recommendations.",
    },
    {
      patterns: ["what is the sun"],
      answer: "The Sun is a star at the center of our solar system. It gives Earth light and heat.",
    },
    {
      patterns: ["what is the moon"],
      answer: "The Moon is Earth's natural satellite. It orbits Earth and reflects light from the Sun.",
    },
    {
      patterns: ["how many days are in a year"],
      answer: "A normal year has 365 days. A leap year has 366 days.",
    },
    {
      patterns: ["how many months are in a year"],
      answer: "There are 12 months in a year.",
    },
    {
      patterns: ["how many states are in the united states", "how many states are in america"],
      answer: "There are 50 states in the United States.",
    },
    {
      patterns: ["what is the capital of the united states", "capital of the united states", "capital of america"],
      answer: "The capital of the United States is Washington, D.C.",
    },
    {
      patterns: ["what is water"],
      answer: "Water is a clear liquid made of hydrogen and oxygen. Its chemical formula is H2O.",
    },
    {
      patterns: ["is fire hot"],
      answer: "Yes. Fire is hot because it releases heat and light during combustion.",
    },
  ];

  const match = answers.find((item) => item.patterns.some((pattern) => text.includes(pattern)));
  if (match) return match.answer;

  const colorMatch = text.match(/^what colou?r is (.+?)[?.!]*$/);
  if (colorMatch) {
    const thing = colorMatch[1].trim();
    return `The color of ${thing} depends on the specific object, lighting, and material. If you mean the common version, tell me the exact thing and I can give a clearer answer.`;
  }

  return "";
}

function capitalize(text) {
  const clean = text.trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function solveMath(text) {
  const normalized = text
    .toLowerCase()
    .replace(/what is|calculate|solve|equals|equal to|plus/g, "+")
    .replace(/minus|subtract/g, "-")
    .replace(/times|multiplied by|x/g, "*")
    .replace(/divided by|over/g, "/")
    .replace(/[?=]/g, "")
    .trim();

  if (!/^[\d\s+\-*/().]+$/.test(normalized) || !/[+\-*/]/.test(normalized)) {
    return "";
  }

  try {
    const answer = Function(`"use strict"; return (${normalized});`)();
    if (!Number.isFinite(answer)) return "";
    return `The answer is ${Number.isInteger(answer) ? answer : Number(answer.toFixed(6))}.`;
  } catch {
    return "";
  }
}

function handleSubmit(event) {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";

  window.setTimeout(async () => {
    addMessage("ai", await makeReply(text));
  }, 420);
}

function resetChat() {
  state.messages = [];
  saveState();
  renderMessages();
  input.focus();
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  points = Array.from({ length: Math.min(82, Math.floor(window.innerWidth / 16)) }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.34,
    vy: (Math.random() - 0.5) * 0.34,
  }));
}

function animate() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  points.forEach((point) => {
    point.x += point.vx;
    point.y += point.vy;
    if (point.x < 0 || point.x > window.innerWidth) point.vx *= -1;
    if (point.y < 0 || point.y > window.innerHeight) point.vy *= -1;
  });

  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const a = points[i];
      const b = points[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance < 130) {
        ctx.strokeStyle = `rgba(99, 215, 176, ${0.14 * (1 - distance / 130)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  points.forEach((point) => {
    ctx.fillStyle = "rgba(138, 168, 255, 0.56)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 1.45, 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(animate);
}

form.addEventListener("submit", handleSubmit);
resetButton.addEventListener("click", resetChat);
promptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.prompt;
    input.focus();
  });
});
window.addEventListener("resize", resizeCanvas);

renderMessages();
resizeCanvas();
animate();
