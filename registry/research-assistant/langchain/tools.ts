import { tool } from "@langchain/core/tools";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Web Search Tool
// Replace the execute body with your preferred search provider:
//   - Tavily:  import { TavilySearchResults } from "@langchain/community/tools/tavily_search"
//   - Serper:  POST https://google.serper.dev/search
//   - Brave:   POST https://api.search.brave.com/res/v1/web/search
// ---------------------------------------------------------------------------
export const webSearchTool = tool(
  async ({ query, maxResults }) => {
    // Example using Tavily (recommended: uncomment and install @langchain/community)
    // const tavily = new TavilySearchResults({ maxResults, apiKey: process.env.TAVILY_API_KEY });
    // return JSON.stringify(await tavily.invoke(query));

    // Placeholder: replace with real search API
    return JSON.stringify([
      {
        title: `Search result for: ${query}`,
        url: "https://example.com",
        snippet:
          "Replace this with a real search API (Tavily, Serper, or Brave Search).",
      },
    ]);
  },
  {
    name: "web_search",
    description:
      "Search the web for recent information about a topic. Returns a list of results with titles, URLs, and snippets.",
    schema: z.object({
      query: z.string().describe("The search query"),
      maxResults: z
        .number()
        .int()
        .min(1)
        .max(10)
        .default(5)
        .describe("Maximum number of results to return"),
    }),
  }
);

// ---------------------------------------------------------------------------
// Read Page Tool
// Fetches and extracts text content from a URL.
// ---------------------------------------------------------------------------
export const readPageTool = tool(
  async ({ url }) => {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "research-assistant-bot/1.0" },
      });
      const html = await res.text();
      // Strip HTML tags; for production use cheerio or @mozilla/readability
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim()
        .slice(0, 4000); // truncate to avoid token overflow
      return text;
    } catch (err) {
      return `Failed to fetch page: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
  {
    name: "read_page",
    description:
      "Fetch and read the text content of a web page by URL. Useful for getting more detail from a search result.",
    schema: z.object({
      url: z.string().url().describe("The full URL of the page to read"),
    }),
  }
);

export const tools = [webSearchTool, readPageTool];
