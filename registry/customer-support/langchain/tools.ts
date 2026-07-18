import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const lookupOrderTool = tool(
  async ({ orderId }) => {
    // Replace with your actual database or API call
    // e.g. const order = await db.orders.findById(orderId);
    return JSON.stringify({
      orderId,
      status: "Shipped",
      eta: "2025-01-20",
      carrier: "FedEx",
      trackingNumber: "FX123456789",
    });
  },
  {
    name: "lookup_order",
    description:
      "Look up the current status and tracking info of a customer order by its order ID.",
    schema: z.object({
      orderId: z.string().describe("The order ID to look up, e.g. #12345"),
    }),
  }
);

export const lookupAccountTool = tool(
  async ({ email }) => {
    // Replace with your actual user lookup logic
    // e.g. const user = await db.users.findByEmail(email);
    return JSON.stringify({
      email,
      accountStatus: "active",
      lastLogin: "2025-01-15",
      openTickets: 0,
    });
  },
  {
    name: "lookup_account",
    description: "Look up a customer account by email address.",
    schema: z.object({
      email: z.string().email().describe("The customer email address"),
    }),
  }
);

export const createRefundTool = tool(
  async ({ orderId, reason }) => {
    // Replace with your refund processing logic
    // e.g. await stripe.refunds.create({ payment_intent: order.paymentIntentId });
    return JSON.stringify({
      refundId: `REF-${Date.now()}`,
      orderId,
      status: "initiated",
      processingTime: "3-5 business days",
    });
  },
  {
    name: "create_refund",
    description: "Initiate a refund for a customer order.",
    schema: z.object({
      orderId: z.string().describe("The order ID to refund"),
      reason: z
        .enum(["damaged", "not_received", "wrong_item", "changed_mind", "other"])
        .describe("The reason for the refund"),
    }),
  }
);

export const escalateToHumanTool = tool(
  async ({ reason, priority, customerId }) => {
    // Replace with your ticketing system integration
    // e.g. await zendesk.tickets.create({ subject: reason, priority, requester_id: customerId });
    console.log(
      `[ESCALATION] Customer ${customerId} — Priority: ${priority} — Reason: ${reason}`
    );
    return JSON.stringify({
      ticketId: `TKT-${Date.now()}`,
      priority,
      estimatedResponseTime:
        priority === "urgent" ? "30 minutes" : "2 business hours",
      message:
        "A human agent will reach out to you via email shortly.",
    });
  },
  {
    name: "escalate_to_human",
    description:
      "Escalate a complex or unresolvable issue to a human support agent and create a support ticket.",
    schema: z.object({
      reason: z
        .string()
        .describe("Brief description of the issue requiring human attention"),
      priority: z
        .enum(["normal", "urgent"])
        .describe("Ticket priority level"),
      customerId: z
        .string()
        .describe("Customer identifier (email or account ID)"),
    }),
  }
);

export const tools = [
  lookupOrderTool,
  lookupAccountTool,
  createRefundTool,
  escalateToHumanTool,
];
