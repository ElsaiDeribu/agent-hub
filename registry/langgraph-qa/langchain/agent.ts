import { z } from "zod";
import { createAgent } from "langchain";
import { tool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------
const getCurrentTime = tool(
  async () => new Date().toISOString(),
  {
    name: "get_current_time",
    description: "Returns the current UTC timestamp as an ISO-8601 string.",
    schema: z.object({
      reason: z
        .string()
        .optional()
        .describe("Optional note about why the current time is needed."),
    }),
  },
);

// ---------------------------------------------------------------------------
// Model + LangGraph-backed agent
// ---------------------------------------------------------------------------
const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
});

export const langgraphQaAgent = createAgent({
  model: llm,
  tools: [getCurrentTime],
  systemPrompt:
    "You are a helpful Q&A assistant. Answer clearly and concisely. " +
    "Use get_current_time when the user asks about the current time or date.",
});

// ---------------------------------------------------------------------------
// Run helper: call this from your API route or server
// ---------------------------------------------------------------------------
export type ChatMessage = { role: "human" | "ai"; content: string };

export async function runAgent(
  input: string,
  chatHistory: ChatMessage[] = [],
): Promise<string> {
  const history: BaseMessage[] = chatHistory.map((m) =>
    m.role === "human" ? new HumanMessage(m.content) : new AIMessage(m.content),
  );

  const result = await langgraphQaAgent.invoke({
    messages: [...history, new HumanMessage(input)],
  });

  const last = result.messages[result.messages.length - 1];
  const content = typeof last?.content === "string" ? last.content : String(last?.content ?? "");
  return content;
}
