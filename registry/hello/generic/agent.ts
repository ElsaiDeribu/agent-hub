/**
 * Minimal hello preview — deterministic stream, no LLM.
 */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function replyFor(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("what can you do") || lower.includes("help")) {
    return "I'm a hello-world sandbox agent. I stream a short greeting so you can verify deploy + SSE without any API keys.";
  }
  return `Hello from the sandbox! You said: "${message.trim()}". Preview is working.`;
}

export const agent = {
  async *stream(
    message: string,
    _opts: { history?: { role: string; content: string }[] } = {},
  ) {
    const reply = replyFor(message);
    for (const word of reply.split(/(\s+)/)) {
      if (!word) continue;
      await sleep(35 + Math.floor(Math.random() * 60));
      yield { type: "token", content: word };
    }
    yield { type: "done" };
  },
};
