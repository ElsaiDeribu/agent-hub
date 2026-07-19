import { openai } from "@ai-sdk/openai";
import { generateText, tool, CoreMessage } from "ai";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------
const tools = {
  lookup_order: tool({
    description:
      "Look up the current status and tracking info of a customer order by its order ID.",
    parameters: z.object({
      orderId: z.string().describe("The order ID to look up, e.g. #12345"),
    }),
    execute: async ({ orderId }) => {
      // Replace with your actual database or API call
      return {
        orderId,
        status: "Shipped",
        eta: "2025-01-20",
        carrier: "FedEx",
        trackingNumber: "FX123456789",
      };
    },
  }),

  lookup_account: tool({
    description: "Look up a customer account by email address.",
    parameters: z.object({
      email: z.string().email().describe("The customer email address"),
    }),
    execute: async ({ email }) => {
      // Replace with your actual user lookup logic
      return {
        email,
        accountStatus: "active",
        lastLogin: "2025-01-15",
        openTickets: 0,
      };
    },
  }),

  create_refund: tool({
    description: "Initiate a refund for a customer order.",
    parameters: z.object({
      orderId: z.string().describe("The order ID to refund"),
      reason: z
        .enum([
          "damaged",
          "not_received",
          "wrong_item",
          "changed_mind",
          "other",
        ])
        .describe("The reason for the refund"),
    }),
    execute: async ({ orderId, reason }) => {
      // Replace with your refund processing logic (e.g. Stripe)
      return {
        refundId: `REF-${Date.now()}`,
        orderId,
        reason,
        status: "initiated",
        processingTime: "3-5 business days",
      };
    },
  }),

  escalate_to_human: tool({
    description:
      "Escalate a complex or unresolvable issue to a human support agent.",
    parameters: z.object({
      reason: z
        .string()
        .describe("Brief description of the issue requiring human attention"),
      priority: z.enum(["normal", "urgent"]).describe("Ticket priority level"),
      customerId: z
        .string()
        .describe("Customer identifier (email or account ID)"),
    }),
    execute: async ({ priority }) => {
      // Replace with your ticketing system integration (e.g. Zendesk)
      return {
        ticketId: `TKT-${Date.now()}`,
        priority,
        estimatedResponseTime:
          priority === "urgent" ? "30 minutes" : "2 business hours",
        message: "A human agent will reach out to you via email shortly.",
      };
    },
  }),
};

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a friendly and efficient customer support agent.

You help customers with:
- Order status, tracking, and delivery issues
- Account access and profile questions
- Refunds, returns, and exchanges
- Product questions and troubleshooting

Guidelines:
- Always be empathetic and professional
- Ask for an order ID or email when needed to look up details
- Use tools to fetch real data before responding
- If you cannot resolve the issue after two attempts, escalate to a human agent
- Keep responses concise and action-oriented`;

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
    maxSteps: 5,
  });

  return text;
}

// ---------------------------------------------------------------------------
// Streaming variant: use this with Next.js App Router or Hono streaming
// ---------------------------------------------------------------------------
export { streamText } from "ai";
export { tools, SYSTEM_PROMPT };
