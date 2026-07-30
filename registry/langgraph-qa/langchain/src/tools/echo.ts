import { z } from "zod";
import { tool } from "@langchain/core/tools";

export const echo = tool(
  async ({ text }) => text,
  {
    name: "echo",
    description:
      "Echo text back unchanged. Useful for verifying tool calling and debugging.",
    schema: z.object({
      text: z.string().describe("The text to echo back"),
    }),
  },
);
