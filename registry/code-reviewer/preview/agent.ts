/**
 * Code-reviewer sandbox preview — deterministic review text, no LLM.
 */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function replyFor(message: string): string {
  const msg = message.toLowerCase();
  const hasCode =
    msg.includes("```") ||
    msg.includes("function") ||
    msg.includes("const ") ||
    msg.includes("let ") ||
    msg.includes("for ") ||
    msg.includes("select ") ||
    msg.includes("eval(");

  if (hasCode || msg.length > 30) {
    return [
      "**Code Review**",
      "",
      "**Overall:** Minor issues found",
      "",
      "**Issues:**",
      "1. **Security:** Potential injection vulnerability",
      "   `eval(userInput)` / string-interpolated SQL is dangerous; never execute or interpolate user-supplied strings unchecked.",
      "   *Fix:* Use parameterized queries or a safe alternative; validate/sanitize inputs.",
      "",
      "2. **Bug:** Off-by-one error risk",
      "   `i <= arr.length` should be `i < arr.length` (arrays are 0-indexed).",
      "   *Fix:* Change `<=` to `<`.",
      "",
      "**Positives:**",
      "- Code is readable and well-structured",
      "- Logic flow is clear",
      "",
      "*Sandbox preview uses a mock reviewer — no model API key required.*",
    ].join("\n");
  }

  return [
    "Please paste the code you'd like me to review. You can use:",
    "```typescript",
    "// your code here",
    "```",
    "Or just paste it inline. I'll check for bugs, security issues, performance problems, and style.",
  ].join("\n");
}

export const agent = {
  async *stream(
    message: string,
    _opts: { history?: { role: string; content: string }[] } = {},
  ) {
    const reply = replyFor(message);
    for (const word of reply.split(/(\s+)/)) {
      if (!word) continue;
      await sleep(30 + Math.floor(Math.random() * 50));
      yield { type: "token", content: word };
    }
    yield { type: "done" };
  },
};
