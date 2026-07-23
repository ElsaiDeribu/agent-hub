/**
 * Live LangGraph-backed Q&A agent for sandbox preview.
 * Requires OPENAI_API_KEY in the process environment (passed from the docs UI).
 */

import { z } from "zod";
import { createAgent } from "langchain";
import { tool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  AIMessage,
  BaseMessage,
  isAIMessageChunk,
} from "@langchain/core/messages";

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

function buildAgent() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing. Provide it when starting the preview session.",
    );
  }

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
    apiKey,
    streaming: true,
  });

  return createAgent({
    model: llm,
    tools: [getCurrentTime],
    systemPrompt:
      "You are a helpful Q&A assistant running inside a sandbox preview. " +
      "Answer clearly and concisely. Use get_current_time when the user asks " +
      "about the current time or date.",
  });
}

function toHistoryMessages(
  history: { role: string; content: string }[] = [],
): BaseMessage[] {
  const out: BaseMessage[] = [];
  for (const m of history) {
    // Skip the synthetic welcome bubble from the docs UI.
    if (m.role === "assistant" && out.length === 0) continue;
    if (m.role === "user" || m.role === "human") {
      out.push(new HumanMessage(m.content));
    } else if (m.role === "assistant" || m.role === "ai") {
      out.push(new AIMessage(m.content));
    }
  }
  return out;
}

function chunkText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part) {
        return String((part as { text?: unknown }).text ?? "");
      }
      return "";
    })
    .join("");
}

export const agent = {
  async *stream(
    message: string,
    opts: { history?: { role: string; content: string }[] } = {},
  ) {
    const graph = buildAgent();
    const messages = [...toHistoryMessages(opts.history), new HumanMessage(message)];

    for await (const event of graph.streamEvents(
      { messages },
      { version: "v2", recursionLimit: 10 },
    )) {
      if (event.event !== "on_chat_model_stream") continue;
      const chunk = event.data?.chunk;
      if (!chunk || !isAIMessageChunk(chunk)) continue;
      const text = chunkText(chunk.content);
      if (text) {
        yield { type: "token" as const, content: text };
      }
    }

    yield { type: "done" as const };
  },
};
