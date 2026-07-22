/**
 * Customer-support sandbox preview — keyword mock replies, no LLM.
 */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function replyFor(message: string): string {
  const msg = message.toLowerCase();

  if (msg.includes("order") || msg.match(/#\d+/)) {
    return [
      "**Looking up your order...**",
      "",
      "I found your order details:",
      "- **Status:** Shipped",
      "- **Carrier:** FedEx",
      "- **Tracking:** FX123456789",
      "- **ETA:** 2 business days",
      "",
      "You can track it at fedex.com. Is there anything else I can help you with?",
    ].join("\n");
  }

  if (msg.includes("refund") || msg.includes("return")) {
    return [
      "I can help you with a refund. To get started, I'll need:",
      "1. Your **order number**",
      "2. The **reason** for the refund (damaged, wrong item, etc.)",
      "",
      "Once you provide those, I can initiate the refund process right away.",
    ].join("\n");
  }

  if (
    msg.includes("login") ||
    msg.includes("account") ||
    msg.includes("password") ||
    msg.includes("can't log")
  ) {
    return [
      "I'll help you regain access to your account.",
      "",
      "Could you provide the **email address** associated with your account? I'll look up the account and send you a secure reset link.",
    ].join("\n");
  }

  if (msg.includes("damaged") || msg.includes("broken") || msg.includes("defective")) {
    return [
      "I'm sorry to hear your item arrived damaged!",
      "",
      "I can help you with a **replacement** or **refund**. Please share your order number and I'll get this sorted for you right away. No need to return the damaged item.",
    ].join("\n");
  }

  return "I'd be happy to help! Could you provide more details? If your question is about a specific order, sharing the **order number** would help me assist you faster.";
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
