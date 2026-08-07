"use client";

import Link from "next/link";
import { Zap, ArrowRight, LayoutGrid } from "lucide-react";
import { paths } from "@/routes/paths";
import { Button } from "@/components/ui/button";
import {
  CliCommand,
  buildHarnessCommands,
} from "@/components/docs/cli-command";

interface HomePageProps {
  agentCount: number;
}

export default function HomePage({ agentCount }: HomePageProps) {
  return (
    <main className="flex-1">
      <section className="bg-gradient-to-b from-muted/30 to-background">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            TypeScript agents you can install in seconds
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Build. Test.{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Ship AI Agents.
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Browse production-ready, open source AI agents, preview them live,
            and add them to your project with one command.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <CliCommand
              commands={buildHarnessCommands("")}
              showPackageManagers={false}
            />
            <Button asChild variant="default">
              <Link href={paths.agents} className="flex items-center gap-1.5">
                Explore Agents
              </Link>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <LayoutGrid className="size-4" />
              {agentCount} agents
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="size-4" />3 frameworks
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowRight className="size-4" />
              TypeScript first
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
