/**
 * Sandbox entry surface for the Customer Support package.
 * The HTTP harness (`_preview.ts`) and docs code viewer both use this tree.
 */
export { agent, qaAgent, runAgent } from "./src/agents/qa.js";
export type { ChatMessage } from "./src/agents/qa.js";
