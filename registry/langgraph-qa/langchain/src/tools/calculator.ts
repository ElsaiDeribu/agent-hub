import { z } from "zod";
import { tool } from "@langchain/core/tools";

export const calculator = tool(
  async ({ expression }) => {
    // Safe subset: numbers, whitespace, and + - * / ( ) . only
    if (!/^[\d\s+\-*/().]+$/.test(expression)) {
      return "Error: expression may only contain numbers and + - * / ( ).";
    }
    try {
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${expression})`)();
      if (typeof result !== "number" || !Number.isFinite(result)) {
        return "Error: expression did not evaluate to a finite number.";
      }
      return String(result);
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
  {
    name: "calculator",
    description:
      "Evaluate a basic arithmetic expression. Supports +, -, *, /, and parentheses.",
    schema: z.object({
      expression: z
        .string()
        .describe("The arithmetic expression to evaluate, e.g. '(12 + 3) * 2'"),
    }),
  },
);
