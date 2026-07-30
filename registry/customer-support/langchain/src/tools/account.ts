import { tool } from "@langchain/core/tools";
import { z } from "zod";

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
