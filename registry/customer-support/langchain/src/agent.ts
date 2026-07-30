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
  model: "gpt-4o-mini",  // swap for gpt-4o for better reasoning
  temperature: 0,
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

export const customerSupportAgent = new AgentExecutor({
  agent,
  tools,
  verbose: false,
  maxIterations: 5,
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

  const result = await customerSupportAgent.invoke({
    input,
    chat_history: messages,
  });

  return result.output as string;
}
