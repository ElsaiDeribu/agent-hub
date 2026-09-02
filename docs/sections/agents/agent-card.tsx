"use client";

import type { RegistryItem } from "@/types/registry";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_COLORS, FRAMEWORK_COLORS } from "@/data/registry-shared";
import {
  Card,
  CardTitle,
  CardHeader,
  CardFooter,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

interface AgentCardProps {
  agent: RegistryItem;
  className?: string;
}

export function AgentCard({ agent, className }: AgentCardProps) {
  const categoryColor = CATEGORY_COLORS[agent.category] ?? CATEGORY_COLORS.example;

  return (
    <Card
      className={cn(
        "group flex h-full flex-col gap-0 overflow-hidden py-0 transition-all duration-200",
        "hover:border-zinc-300 hover:shadow-md hover:bg-zinc-50",
        "dark:bg-zinc-900/50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/90 dark:hover:shadow-none",
        className,
      )}
    >
      <Link
        href={paths.docs.agents.detail(agent.name)}
        className="flex h-full min-h-0 flex-1 flex-col"
      >
        <CardHeader className="shrink-0 pb-2 pt-4">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-base">{agent.title}</CardTitle>
            <Badge className={cn("text-xs border", categoryColor)}>{agent.category}</Badge>
          </div>

          <div className="mt-3 space-y-1">
            <CardDescription className="line-clamp-2 text-sm leading-relaxed">
              {agent.description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 px-5 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {agent.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </CardContent>

        <CardFooter className="mt-auto shrink-0 px-5 pb-4">
          <div className="flex w-full flex-wrap border-t pt-4 gap-1.5">
            {agent.frameworks.map((fw) => (
              <span
                key={fw}
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                  FRAMEWORK_COLORS[fw] ?? FRAMEWORK_COLORS.generic,
                )}
              >
                {fw}
              </span>
            ))}
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
