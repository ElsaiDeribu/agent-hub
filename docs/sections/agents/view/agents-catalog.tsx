"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, LayoutGrid } from "lucide-react";
import { AgentCard } from "@/sections/agents/agent-card";
import type { RegistryItem } from "@/types/registry";
import type { CATEGORIES } from "@/data/registry-shared";

type Category = (typeof CATEGORIES)[number];

interface AgentsCatalogProps {
  items: RegistryItem[];
  categories: readonly Category[];
}

export default function AgentsCatalog({ items, categories }: AgentsCatalogProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = items.filter((item) => {
    const matchCategory = activeCategory === "all" || item.category === activeCategory;
    const matchSearch =
      search.trim() === "" ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.includes(search.toLowerCase()));
    return matchCategory && matchSearch;
  });

  return (
    <main className="flex-1">
      <section className="border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Browse Agents</h1>
              <p className="mt-2 text-muted-foreground text-lg">
                Discover and install production-ready AI agent templates
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <LayoutGrid className="size-4" />
              <span className="font-medium">{items.length}</span>
              <span>agents available</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col sm:flex-row items-between justify-between gap-3 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setActiveCategory(cat.value)}
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
                  activeCategory === cat.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/30",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((agent) => (
              <AgentCard key={agent.name} agent={agent} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Search className="size-10 text-muted-foreground mb-4 opacity-40" />
            <p className="text-muted-foreground">No agents match your filters.</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => {
                setActiveCategory("all");
                setSearch("");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
