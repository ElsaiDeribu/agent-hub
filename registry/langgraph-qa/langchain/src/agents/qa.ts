import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { SYSTEM_PROMPT } from "../prompts/system.js";
import { tools } from "../tools/index.js";

const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
});

export const qaAgent = createAgent({
  model: llm,
  tools,
  systemPrompt: SYSTEM_PROMPT,
});

export type ChatMessage = { role: "human" | "ai"; content: string };

export async function runAgent(
  input: string,
  chatHistory: ChatMessage[] = [],
): Promise<string> {
  const history: BaseMessage[] = chatHistory.map((m) =>
    m.role === "human" ? new HumanMessage(m.content) : new AIMessage(m.content),
  );

  const result = await qaAgent.invoke({
    messages: [...history, new HumanMessage(input)],
  });

  const last = result.messages[result.messages.length - 1];
  const content =
    typeof last?.content === "string" ? last.content : String(last?.content ?? "");
  return content;
}
