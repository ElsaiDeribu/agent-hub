/**
 * Demo agent that streams fake tokens — no OpenAI / network needed.
 * Use this to verify sandbox deploy + SSE proxy end-to-end.
 */

const RESPONSES = [
  "Hello! This is a simulated agent response from inside the microsandbox.",
  "The capital of France is Paris. (This answer was generated locally, not by an LLM.)",
  "Sandbox preview is working. Tokens are streamed over SSE from the agent server.",
  "You can later swap this file for a real LangChain agent that calls OpenAI.",
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("france") || lower.includes("capital")) {
    return RESPONSES[1];
  }
  if (lower.includes("sandbox") || lower.includes("preview")) {
    return RESPONSES[2];
  }
  // Pseudo-random pick based on message length so it feels varied.
  return RESPONSES[message.length % RESPONSES.length];
}

export const agent = {
  async *stream(
    message: string,
    _opts: { history?: { role: string; content: string }[] } = {},
  ) {
    const reply = pickResponse(message);
    const words = reply.split(/(\s+)/); // keep spaces as separate chunks

    for (const word of words) {
      if (!word) continue;
      await sleep(40 + Math.floor(Math.random() * 80));
      yield { type: "token", content: word };
    }

    yield { type: "done" };
  },
};
