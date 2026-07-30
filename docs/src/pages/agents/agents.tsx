import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, LayoutGrid } from 'lucide-react';
import { Navbar, Footer } from '@/sections/layout';
import { CATEGORIES, REGISTRY_ITEMS } from '@/data/registry';
import { AgentCard } from '@/sections/docs/agents/agent-card';

export default function AgentsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = REGISTRY_ITEMS.filter((item) => {
    const matchCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchSearch =
      search.trim() === '' ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.includes(search.toLowerCase()));
    return matchCategory && matchSearch;
  });

  return (
    <div className="flex min-h-screen flex-col bg-background thin-scrollbar">
      <Navbar />

      <main className="flex-1">
        {/* ── Page Header ──────────────────────────────────────────────────── */}
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
                <span className="font-medium">{REGISTRY_ITEMS.length}</span>
                <span>agents available</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Catalog ──────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row items-between justify-between gap-3 mb-8">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search agents..."
                className="pl-9"
              />
            </div>
            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={cn(
                    'inline-flex shrink-0 items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                    activeCategory === cat.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/30'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
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
                  setActiveCategory('all');
                  setSearch('');
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
