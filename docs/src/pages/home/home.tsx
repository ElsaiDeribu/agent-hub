import { useState } from 'react';
import { paths } from '@/routes/paths';
import { Link } from 'react-router-dom';
import { GitHub } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { REGISTRY_ITEMS } from '@/data/registry';
import { Zap, LayoutGrid, ArrowRight } from 'lucide-react';
import { ThemeToggleIcon } from '@/theme/components/theme-toggle';
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
    <div className="min-h-screen bg-background thin-scrollbar">
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
              <Link to={paths.agents}>Agents</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to={paths.docs.root}>Docs</Link>
            </Button>
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

            <ThemeToggleIcon />
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-muted/30 to-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground mb-6">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            TypeScript agents you can install in seconds
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            Build. Test.{' '}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Ship AI Agents.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground text-lg sm:text-xl leading-relaxed">
            Browse production-ready agent templates, preview them live, and add them to your project
            with one command.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <CliCommand commands={buildHarnessCommands('')} showPackageManagers={false} />
            <Button asChild variant="default">
              <Link to={paths.agents} className="flex items-center gap-1.5">
                Explore Agents
              </Link>
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
    </div>
  );
}
