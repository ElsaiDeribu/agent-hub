import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { tools } from "./tools.js";

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
  [
    "system",
    `You are a rigorous research assistant. Your job is to investigate topics thoroughly and present findings clearly.

Process:
1. Search the web for the most relevant and recent information
2. Read key pages for more depth when needed
3. Synthesize findings into a well-structured response

Output format:
- Start with a brief executive summary (2-3 sentences)
- Use headers and bullet points for clarity
- Cite sources with URLs where possible
- Flag any conflicting information or areas of uncertainty
- End with "Further reading" links if relevant

Always search before answering — do not rely on your training data for factual questions.`,
  ],
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
// Run helper — call this from your API route or server
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
