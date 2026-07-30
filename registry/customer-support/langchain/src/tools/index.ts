import { lookupAccountTool } from "./account.js";
import { escalateToHumanTool } from "./escalation.js";
import { createRefundTool, lookupOrderTool } from "./orders.js";

export {
  lookupOrderTool,
  createRefundTool,
  lookupAccountTool,
  escalateToHumanTool,
};

export const tools = [
  lookupOrderTool,
  lookupAccountTool,
  createRefundTool,
  escalateToHumanTool,
];
