import { getRegistryItem, REGISTRY_ITEMS } from "@/data/registry";
import { AgentDetail } from "@/sections/docs/agents/view";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return REGISTRY_ITEMS.map((agent) => ({ name: agent.name }));
}

export async function generateMetadata(props: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await props.params;
  const agent = getRegistryItem(name);
  if (!agent) return { title: "Agent not found" };

  return {
    title: agent.title,
    description: agent.description
  };
}

export default async function AgentDetailPage(props: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await props.params;
  const agent = getRegistryItem(name);
  if (!agent) notFound();

  return <AgentDetail agent={agent} />;
}
