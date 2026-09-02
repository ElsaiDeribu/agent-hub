import { z } from "zod";
import { tool } from "@langchain/core/tools";

export const getCurrentTime = tool(
  async () => {
    const now = new Date();
    return `Current UTC time: ${now.toISOString()} (${now.toUTCString()})`;
  },
  {
    name: "get_current_time",
    description:
      "Returns the current UTC date and time. Use for any question about the current time, date, day, year, or 'right now'. Do not guess the time yourself.",
    schema: z.object({
      reason: z
        .string()
        .optional()
        .describe("Optional note about why the current time is needed."),
    }),
  },
);
