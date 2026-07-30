import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const escalateToHumanTool = tool(
  async ({ reason, priority, customerId }) => {
    // Replace with your ticketing system integration
    // e.g. await zendesk.tickets.create({ subject: reason, priority, requester_id: customerId });
    console.log(
      `[ESCALATION] Customer ${customerId} | Priority: ${priority} | Reason: ${reason}`
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
