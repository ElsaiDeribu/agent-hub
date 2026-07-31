import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { SYSTEM_PROMPT } from "./prompts/system.js";
import { tools } from "./tools/index.js";

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------
const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.2,
  apiKey: process.env.OPENAI_API_KEY,
});

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------
const prompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------
const agent = createToolCallingAgent({ llm, tools, prompt });

export const researchAssistant = new AgentExecutor({
  agent,
  tools,
  verbose: false,
  maxIterations: 8,
});

// ---------------------------------------------------------------------------
// Run helper: call this from your API route or server
// ---------------------------------------------------------------------------
export type ChatMessage = { role: "human" | "ai"; content: string };

export async function runAgent(
  input: string,
  chatHistory: ChatMessage[] = []
): Promise<string> {
  const messages = chatHistory.map((m) =>
    m.role === "human"
      ? new HumanMessage(m.content)
      : new AIMessage(m.content)
  );

  const result = await researchAssistant.invoke({
    input,
    chat_history: messages,
  });

  return result.output as string;
}

function historyToChat(
  history: { role: string; content: string }[] = [],
): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const m of history) {
    if (m.role === "assistant" && out.length === 0) continue;
    if (m.role === "user" || m.role === "human") {
      out.push({ role: "human", content: m.content });
    } else if (m.role === "assistant" || m.role === "ai") {
      out.push({ role: "ai", content: m.content });
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
