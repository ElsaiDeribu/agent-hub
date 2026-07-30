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
