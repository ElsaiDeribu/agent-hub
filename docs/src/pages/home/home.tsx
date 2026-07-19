import { useState } from 'react';
import { cn } from '@/lib/utils';
import { paths } from '@/routes/paths';
import { Link } from 'react-router-dom';
import { GitHub } from '@/assets/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CATEGORIES, REGISTRY_ITEMS } from '@/data/registry';
import { AgentCard } from '@/sections/docs/agents/agent-card';
import { ThemeToggleIcon } from '@/theme/components/theme-toggle';
import { Zap, Search, LayoutGrid, ArrowRight } from 'lucide-react';
import { CliCommand, buildHarnessCommands } from '@/sections/docs/agents/install-command';


export default function HomePage() {
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
    <div className="min-h-screen bg-background">
      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold text-sm">
            <div className="flex size-6 items-center justify-center rounded bg-primary">
              <Zap className="size-3.5 text-primary-foreground" />
            </div>
            agent-hub
          </Link>

          <nav className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <a
                href="https://github.com/ElsaiDeribu/agent-hub"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5"
              >
                <GitHub className="size-4 fill-current" />
                GitHub

              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to={paths.docs.root}>Docs</Link>
            </Button>
            <ThemeToggleIcon />
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground mb-6">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            TypeScript agents — install in seconds
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            Build. Test.{' '}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Ship AI Agents.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground text-lg sm:text-xl leading-relaxed">
            Browse production-ready agent templates, preview them live, and add them to your
            project with one command — like shadcn, but for AI agents.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <CliCommand commands={buildHarnessCommands('add customer-support')} showPackageManagers={false} />
            <Button asChild>
              <a
                href="https://github.com/ElsaiDeribu/agent-hub"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5"
              >
                <GitHub className="size-5 fill-current" />
                View on GitHub

              </a>
            </Button>
          </div>

          {/* Stats row */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <LayoutGrid className="size-4" />
              {REGISTRY_ITEMS.length} agents
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

      {/* ── Catalog ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
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

          {/* Search */}
          <div className="relative sm:ml-auto sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents..."
              className="pl-9"
            />
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

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t mt-16">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Built with ❤️ — agent-hub</p>
          <div className="flex gap-4">
            <a
              href="https://github.com/ElsaiDeribu/agent-hub"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <Link to={paths.docs.root} className="hover:text-foreground transition-colors">
              Docs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
