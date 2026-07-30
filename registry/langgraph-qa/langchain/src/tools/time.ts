import { z } from "zod";
import { tool } from "@langchain/core/tools";

export const getCurrentTime = tool(
  async () => new Date().toISOString(),
  {
    name: "get_current_time",
    description: "Returns the current UTC timestamp as an ISO-8601 string.",
    schema: z.object({
      reason: z
        .string()
        .optional()
        .describe("Optional note about why the current time is needed."),
    }),
  },
);
