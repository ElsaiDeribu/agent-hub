import { CATEGORIES, REGISTRY_ITEMS } from "@/data/registry";
import { AgentsCatalog } from "@/sections/agents/view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agents",
  description: "Browse and install production-ready AI agent templates"
};

export default function AgentsPage() {
  return <AgentsCatalog items={REGISTRY_ITEMS} categories={CATEGORIES} />;
}
