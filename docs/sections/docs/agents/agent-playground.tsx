import { getRegistryItem } from "@/data/registry";
import { AgentDetailUiStateProvider } from "@/sections/docs/agents/agent-detail-ui-state";
import { AgentDetail } from "@/sections/docs/agents/view";

export function AgentPlayground({ name }: { name: string }) {
  const agent = getRegistryItem(name);
  if (!agent) {
    return <p className="text-sm text-destructive">Unknown agent: {name}</p>;
  }

  return (
    <AgentDetailUiStateProvider>
      <AgentDetail agent={agent} />
    </AgentDetailUiStateProvider>
  );
}
