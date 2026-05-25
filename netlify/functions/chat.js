exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (!process.env.OPENAI_API_KEY) {
    return json({ error: "Missing OPENAI_API_KEY" }, 500);
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const message = String(body.message || "").trim();
    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

    if (!message) {
      return json({ error: "Missing message" }, 400);
    }

    const input = [
      {
        role: "system",
        content:
          "You are Fireside AI, a clear, friendly AI assistant. Answer directly like ChatGPT. Be helpful, accurate, and concise. If a question is simple, give the simple answer first.",
      },
      ...history.map((item) => ({
        role: item.role === "ai" ? "assistant" : "user",
        content: String(item.text || ""),
      })),
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        input,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return json({ error: data.error?.message || "AI request failed" }, response.status);
    }

    return json({ reply: data.output_text || "I could not generate an answer." });
  } catch (error) {
    return json({ error: error.message || "Server error" }, 500);
  }
};

function json(payload, statusCode = 200) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };
}
