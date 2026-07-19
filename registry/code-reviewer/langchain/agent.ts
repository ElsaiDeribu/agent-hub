import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Structured output schema
// ---------------------------------------------------------------------------
const ReviewSchema = z.object({
  summary: z.string().describe("One-sentence overall assessment"),
  severity: z
    .enum(["ok", "minor", "major", "critical"])
    .describe("Overall severity of the issues found"),
  issues: z
    .array(
      z.object({
        type: z
          .enum(["bug", "security", "performance", "style", "logic"])
          .describe("Category of the issue"),
        line: z
          .string()
          .optional()
          .describe("Line number or code snippet where issue occurs"),
        description: z.string().describe("Clear explanation of the issue"),
        suggestion: z.string().describe("Concrete fix or improvement"),
      })
    )
    .describe("List of specific issues found"),
  positives: z
    .array(z.string())
    .describe("Things done well in the code"),
});

export type CodeReview = z.infer<typeof ReviewSchema>;

// ---------------------------------------------------------------------------
// Model with structured output
// ---------------------------------------------------------------------------
const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
}).withStructuredOutput(ReviewSchema);

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert code reviewer. Analyze code snippets for:
- Bugs and logical errors
- Security vulnerabilities (injection, XSS, auth bypasses, etc.)
- Performance issues (N+1 queries, unnecessary loops, memory leaks)
- Style and readability (naming, complexity, duplication)

Be specific: point to the exact line or construct causing each issue.
Be constructive: always provide a concrete fix, not just a complaint.
Be balanced: acknowledge what is done well.`,
  ],
  [
    "human",
    `Review the following code:

Language: {language}

\`\`\`
{code}
\`\`\``,
  ],
]);

// ---------------------------------------------------------------------------
// Run helper: call this from your API route or server
// ---------------------------------------------------------------------------
export async function reviewCode(
  code: string,
  language = "typescript"
): Promise<CodeReview> {
  const chain = prompt.pipe(llm);
  return chain.invoke({ code, language });
}

// ---------------------------------------------------------------------------
// Conversational wrapper: accepts free-form input and extracts code
// ---------------------------------------------------------------------------
const conversationalLlm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
});

const conversationalPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert code reviewer. When the user shares code (inline or in a code block),
review it thoroughly for bugs, security issues, performance problems, and style.
Format your response with clear sections: Summary, Issues (grouped by severity), and Positives.
If no code is shared, ask the user to paste the code they want reviewed.`,
  ],
  ["human", "{input}"],
]);

export async function runAgent(input: string): Promise<string> {
  const chain = conversationalPrompt.pipe(conversationalLlm);
  const result = await chain.invoke({ input });
  return result.content as string;
}
