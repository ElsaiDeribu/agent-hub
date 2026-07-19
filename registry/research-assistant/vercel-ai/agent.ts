import { openai } from "@ai-sdk/openai";
import { generateText, tool, CoreMessage } from "ai";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Tools
// Replace web_search execute body with a real search provider:
//   - Tavily:  https://tavily.com  (free tier available)
//   - Serper:  https://serper.dev
//   - Brave:   https://api.search.brave.com
// ---------------------------------------------------------------------------
const tools = {
  web_search: tool({
    description:
      "Search the web for recent information about a topic. Returns results with titles, URLs, and snippets.",
    parameters: z.object({
      query: z.string().describe("The search query"),
      maxResults: z
        .number()
        .int()
        .min(1)
        .max(10)
        .default(5)
        .describe("Maximum number of results to return"),
    }),
    execute: async ({ query }) => {
      // Example: Tavily search
      // const res = await fetch("https://api.tavily.com/search", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query, max_results: maxResults }),
      // });
      // return res.json();

      // Placeholder: replace with real search API
      return [
        {
          title: `Search result for: ${query}`,
          url: "https://example.com",
          snippet:
            "Replace this with a real search API (Tavily, Serper, or Brave Search).",
        },
      ];
    },
  }),

  read_page: tool({
    description:
      "Fetch and read the text content of a web page by URL for more detail.",
    parameters: z.object({
      url: z.string().url().describe("The full URL of the page to read"),
    }),
    execute: async ({ url }) => {
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "research-assistant-bot/1.0" },
        });
        const html = await res.text();
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s{2,}/g, " ")
          .trim()
          .slice(0, 4000);
        return { content: text };
      } catch (err) {
        return {
          error: `Failed to fetch: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    },
  }),
};

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a rigorous research assistant. Your job is to investigate topics thoroughly and present findings clearly.

Process:
1. Search the web for the most relevant and recent information
2. Read key pages for more depth when needed
3. Synthesize findings into a well-structured response

Output format:
- Start with a brief executive summary (2-3 sentences)
- Use headers and bullet points for clarity
- Cite sources with URLs where possible
- Flag conflicting information or areas of uncertainty
- End with "Further reading" links if relevant

Always search before answering; do not rely solely on training data for factual questions.`;

// ---------------------------------------------------------------------------
// Run helper: call this from your API route or server
// ---------------------------------------------------------------------------
export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function runAgent(
  input: string,
  chatHistory: ChatMessage[] = []
): Promise<string> {
  const messages: CoreMessage[] = [
    ...chatHistory,
    { role: "user", content: input },
  ];

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: SYSTEM_PROMPT,
    messages,
    tools,
    maxSteps: 8,
  });

  return text;
}

// ---------------------------------------------------------------------------
// Streaming variant: for real-time output in Next.js / Hono
// ---------------------------------------------------------------------------
export { streamText } from "ai";
export { tools, SYSTEM_PROMPT };
