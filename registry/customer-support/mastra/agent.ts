import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------
const lookupOrderTool = createTool({
  id: "lookup_order",
  description:
    "Look up the current status and tracking info of a customer order by its order ID.",
  inputSchema: z.object({
    orderId: z.string().describe("The order ID to look up, e.g. #12345"),
  }),
  execute: async ({ context }) => {
    // Replace with your actual database or API call
    return {
      orderId: context.orderId,
      status: "Shipped",
      eta: "2025-01-20",
      carrier: "FedEx",
      trackingNumber: "FX123456789",
    };
  },
});

const lookupAccountTool = createTool({
  id: "lookup_account",
  description: "Look up a customer account by email address.",
  inputSchema: z.object({
    email: z.string().email().describe("The customer email address"),
  }),
  execute: async ({ context }) => {
    // Replace with your actual user lookup logic
    return {
      email: context.email,
      accountStatus: "active",
      lastLogin: "2025-01-15",
      openTickets: 0,
    };
  },
});

const createRefundTool = createTool({
  id: "create_refund",
  description: "Initiate a refund for a customer order.",
  inputSchema: z.object({
    orderId: z.string().describe("The order ID to refund"),
    reason: z
      .enum(["damaged", "not_received", "wrong_item", "changed_mind", "other"])
      .describe("The reason for the refund"),
  }),
  execute: async ({ context }) => {
    // Replace with your refund processing logic (e.g. Stripe)
    return {
      refundId: `REF-${Date.now()}`,
      orderId: context.orderId,
      status: "initiated",
      processingTime: "3-5 business days",
    };
  },
});

const escalateToHumanTool = createTool({
  id: "escalate_to_human",
  description:
    "Escalate a complex or unresolvable issue to a human support agent and create a support ticket.",
  inputSchema: z.object({
    reason: z
      .string()
      .describe("Brief description of the issue requiring human attention"),
    priority: z.enum(["normal", "urgent"]).describe("Ticket priority level"),
    customerId: z
      .string()
      .describe("Customer identifier (email or account ID)"),
  }),
  execute: async ({ context }) => {
    // Replace with your ticketing system integration (e.g. Zendesk, Linear)
    return {
      ticketId: `TKT-${Date.now()}`,
      priority: context.priority,
      estimatedResponseTime:
        context.priority === "urgent" ? "30 minutes" : "2 business hours",
      message: "A human agent will reach out to you via email shortly.",
    };
  },
});

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------
export const customerSupportAgent = new Agent({
  name: "Customer Support Agent",
  instructions: `You are a friendly and efficient customer support agent.

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
- Keep responses concise and action-oriented`,
  model: openai("gpt-4o-mini"),
  tools: {
    lookup_order: lookupOrderTool,
    lookup_account: lookupAccountTool,
    create_refund: createRefundTool,
    escalate_to_human: escalateToHumanTool,
  },
});

// ---------------------------------------------------------------------------
// Run helper — call this from your API route or server
// ---------------------------------------------------------------------------
export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function runAgent(
  input: string,
  chatHistory: ChatMessage[] = []
): Promise<string> {
  const response = await customerSupportAgent.generate(
    [...chatHistory, { role: "user", content: input }]
  );
  return response.text;
}
