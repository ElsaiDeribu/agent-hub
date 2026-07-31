import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------
const parseCodeBlockTool = createTool({
  id: "parse_code_block",
  description:
    "Extract code language and content from a markdown code block or raw snippet.",
  inputSchema: z.object({
    rawInput: z.string().describe("The raw user input possibly containing code"),
  }),
  execute: async ({ context }) => {
    const fencedMatch = context.rawInput.match(
      /```(\w+)?\n([\s\S]*?)```/
    );
    if (fencedMatch) {
      return { language: fencedMatch[1] ?? "unknown", code: fencedMatch[2].trim() };
    }
    return { language: "unknown", code: context.rawInput.trim() };
  },
});

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------
export const codeReviewerAgent = new Agent({
  name: "Code Reviewer Agent",
  instructions: `You are an expert code reviewer.

When the user shares code, analyze it thoroughly for:
- **Bugs:** logic errors, off-by-one errors, null/undefined issues
- **Security:** SQL injection, XSS, insecure deserialization, hardcoded secrets
- **Performance:** unnecessary re-renders, N+1 queries, memory leaks, blocking calls
- **Style:** naming conventions, function complexity, code duplication

Format every review with these sections:
1. **Summary:** one sentence overall assessment
2. **Issues:** each with: type, location, problem, and fix
3. **Positives:** what is done well

If no code is provided, ask the user to paste the code they want reviewed.
Always provide concrete, actionable fixes, not just descriptions of problems.`,
  model: openai("gpt-4o-mini"),
  tools: {
    parse_code_block: parseCodeBlockTool,
  },
});

// ---------------------------------------------------------------------------
// Run helper: call this from your API route or server
// ---------------------------------------------------------------------------
export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function runAgent(
  input: string,
  chatHistory: ChatMessage[] = []
): Promise<string> {
  const response = await codeReviewerAgent.generate([
    ...chatHistory,
    { role: "user", content: input },
  ]);
  return response.text;
}

function historyToChat(
  history: { role: string; content: string }[] = [],
): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const m of history) {
    if (m.role === "assistant" && out.length === 0) continue;
    if (m.role === "user" || m.role === "human") {
      out.push({ role: "user", content: m.content });
    } else if (m.role === "assistant" || m.role === "ai") {
      out.push({ role: "assistant", content: m.content });
    }
  }
  return out;
}

/** Sandbox / docs preview surface — same module the code viewer shows. */
export const agent = {
  async *stream(
    message: string,
    opts: { history?: { role: string; content: string }[] } = {},
  ) {
    const text = await runAgent(message, historyToChat(opts.history));
    for (const word of text.split(/(\s+)/)) {
      if (!word) continue;
      yield { type: "token" as const, content: word };
    }
    yield { type: "done" as const };
  },
};
