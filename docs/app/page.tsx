import type { Metadata } from "next";
import { REGISTRY_ITEMS } from "@/data/registry";
import { Navbar } from "@/sections/layout/navbar";
import { HomePage } from "@/sections/home/view";

export const metadata: Metadata = {
  title: "AgentHub",
  description:
    "Browse production-ready, open source AI agents, preview them live, and add them to your project with one command.",
};

export default function Home() {
  return (
    <>
      <Navbar />
      <HomePage agentCount={REGISTRY_ITEMS.length} />
    </>
  );
}
