import { AgentDetailUiStateProvider } from "@/sections/docs/agents/agent-detail-ui-state";
import type { ReactNode } from "react";

export default function DocsAgentsLayout({
  children
}: {
  children: ReactNode;
}) {
  return <AgentDetailUiStateProvider>{children}</AgentDetailUiStateProvider>;
}
