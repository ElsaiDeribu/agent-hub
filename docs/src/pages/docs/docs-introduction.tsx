import { Badge } from '@/components/ui/badge';
import { REGISTRY_ITEMS } from '@/data/registry';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Bot,
  Zap,
  Globe,
  Layers,
} from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'Ready-to-use AI Agents',
    description:
      'A curated registry of production-ready TypeScript agents you can drop into any project in seconds — no boilerplate, no wiring from scratch.',
  },
  {
    icon: Layers,
    title: 'Multi-framework Support',
    description:
      'Each agent ships with implementations for LangChain, Mastra, and Vercel AI SDK so you can pick the stack you already use.',
  },
  {
    icon: Zap,
    title: 'One-command Scaffold',
    description:
      'Run a single npx command and the CLI pulls the agent source directly into your project directory, ready to run.',
  },
  {
    icon: Globe,
    title: 'Framework-agnostic Core',
    description:
      'Agents follow a shared interface so you can swap frameworks without rewriting any business logic.',
  },
];

export default function DocsIntroductionPage() {
  return (
    <div className="py-10 max-w-4xl">
      {/* Hero */}
      <div className="mb-10">
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
          Getting Started
        </span>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Introduction</h1>
        <p className="text-muted-foreground text-lg leading-relaxed mb-4">
          <strong>Agent-Hub</strong> is an open-source registry of reusable TypeScript AI agents.
          Browse, preview, and scaffold agents into your project. It works like a component library,
          but for AI agents. Instead of writing an agent from scratch every time you need one —
          handling prompts, tool calls, memory, and framework wiring — you pick from the registry,
          preview it live, and install it straight into your codebase with one command.
        </p>
        <p className="text-muted-foreground text-lg leading-relaxed mb-6">
          Every agent ships as real TypeScript source code (not a dependency). You own the files and
          can modify them freely. The registry currently includes{' '}
          <strong>{REGISTRY_ITEMS.length} production-ready agents</strong> across support, developer
          tooling, and research categories.
        </p>
      </div>

      {/* Key features */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-6">Key Features</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="py-0 gap-0 hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="font-medium mb-1">{title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Supported frameworks */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Supported Frameworks</h2>
        
        <div className="flex flex-wrap gap-3">
          {[
            {
              name: 'LangChain',
              color:
                'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
              desc: 'Battle-tested agent framework with a rich tool ecosystem',
            },
            {
              name: 'Mastra',
              color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
              desc: 'TypeScript-native agent framework with built-in memory',
            },
            {
              name: 'Vercel AI SDK',
              color: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20',
              desc: 'Lightweight streaming-first SDK ideal for Next.js apps',
            },
          ].map(({ name, color, desc }) => (
            <div
              key={name}
              className="flex items-start gap-3 rounded-lg border p-4 flex-1 min-w-[200px]"
            >
              <Badge className={color} variant="outline">
                {name}
              </Badge>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator className="mb-8" />

    </div>
  );
}
