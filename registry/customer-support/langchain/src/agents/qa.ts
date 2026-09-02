import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  AIMessage,
  BaseMessage,
  isAIMessageChunk,
} from "@langchain/core/messages";
import { SYSTEM_PROMPT } from "../prompts/system.js";
import { tools } from "../tools/index.js";

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
    tools,
    systemPrompt: SYSTEM_PROMPT,
  });
}

/** Lazy facade so install templates can call `.invoke` without constructing at import time. */
export const qaAgent = {
  invoke: (...args: Parameters<ReturnType<typeof buildAgent>["invoke"]>) =>
    buildAgent().invoke(...args),
  streamEvents: (...args: Parameters<ReturnType<typeof buildAgent>["streamEvents"]>) =>
    buildAgent().streamEvents(...args),
};

export type ChatMessage = { role: "human" | "ai"; content: string };

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

export async function runAgent(
  input: string,
  chatHistory: ChatMessage[] = [],
): Promise<string> {
  const history: BaseMessage[] = chatHistory.map((m) =>
    m.role === "human" ? new HumanMessage(m.content) : new AIMessage(m.content),
  );

  const result = await buildAgent().invoke({
    messages: [...history, new HumanMessage(input)],
  });

  const last = result.messages[result.messages.length - 1];
  const content =
    typeof last?.content === "string" ? last.content : String(last?.content ?? "");
  return content;
}

/** Sandbox / docs preview surface — same module the code viewer shows. */
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
