/**
 * Research-assistant sandbox preview — deterministic summary, no LLM.
 */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function replyFor(message: string): string {
  const topic = message.trim() || "your topic";
  return [
    `**Research: ${topic}**`,
    "",
    "**Summary:** This is an active area of development with significant momentum in 2024-2025.",
    "",
    "**Key Findings:**",
    "- Multiple competing frameworks have emerged, each with distinct trade-offs",
    "- TypeScript-native approaches are gaining traction for type safety",
    "- Streaming and multi-step agent patterns are now standard",
    "",
    "**Notable Frameworks:**",
    "- LangChain.js — broad ecosystem, general purpose",
    "- Mastra — TypeScript-first DX",
    "- Vercel AI SDK — streaming-friendly for Next.js apps",
    "",
    "**Further Reading:**",
    "- https://js.langchain.com",
    "- https://mastra.ai",
    "- https://sdk.vercel.ai",
    "",
    "*Sandbox preview uses a mock researcher — no model API key required.*",
  ].join("\n");
}

export const agent = {
  async *stream(
    message: string,
    _opts: { history?: { role: string; content: string }[] } = {},
  ) {
    const reply = replyFor(message);
    for (const word of reply.split(/(\s+)/)) {
      if (!word) continue;
      await sleep(30 + Math.floor(Math.random() * 50));
      yield { type: "token", content: word };
    }
    yield { type: "done" };
  },
};
