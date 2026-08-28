"use client";

import { useRegistryItems } from "@/data/use-registry-items";
import { AgentDetailUiStateProvider } from "@/sections/docs/agents/agent-detail-ui-state";
import { AgentDetail } from "@/sections/docs/agents/view";

export function AgentPlayground({ name }: { name: string }) {
  const { items, error } = useRegistryItems();
  const agent = items?.find((item) => item.name === name);

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (!items) {
    return <p className="text-sm text-muted-foreground">Loading agent…</p>;
  }
  if (!agent) {
    return <p className="text-sm text-destructive">Unknown agent: {name}</p>;
  }

  return (
    <AgentDetailUiStateProvider>
      <AgentDetail agent={agent} />
    </AgentDetailUiStateProvider>
  );
}
