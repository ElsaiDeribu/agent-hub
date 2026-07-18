import type React from 'react';
import type { RegistryItem } from '@/types/registry';

import { cn } from '@/lib/utils';
import { paths } from '@/routes/paths';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CATEGORY_COLORS, FRAMEWORK_COLORS } from '@/data/registry';
import { Code2, Search, Sparkles, ArrowRight, Headphones } from 'lucide-react';
import { Card, CardTitle, CardHeader, CardContent, CardDescription } from '@/components/ui/card';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  support: Headphones,
  'dev-tools': Code2,
  research: Search,
  example: Sparkles,
};

interface AgentCardProps {
  agent: RegistryItem;
  className?: string;
}

export function AgentCard({ agent, className }: AgentCardProps) {
  const Icon = CATEGORY_ICONS[agent.category] ?? Sparkles;
  const categoryColor = CATEGORY_COLORS[agent.category] ?? CATEGORY_COLORS.example;

  return (
    <Card
      className={cn(
        'group flex flex-col gap-0 py-0 overflow-hidden transition-all duration-200',
        'hover:border-foreground/20 hover:shadow-md',
        className
      )}
    >
      <CardHeader className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg border',
              categoryColor
            )}
          >
            <Icon className="size-5" />
          </div>
          <Badge className={cn('text-xs border', categoryColor)}>
            {agent.category}
          </Badge>
        </div>

        <div className="mt-3 space-y-1">
          <CardTitle className="text-base">{agent.title}</CardTitle>
          <CardDescription className="line-clamp-2 text-sm leading-relaxed">
            {agent.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pb-4 px-5 flex flex-col flex-1 gap-4">
        {/* Framework pills */}
        <div className="flex flex-wrap gap-1.5">
          {agent.frameworks.map((fw) => (
            <span
              key={fw}
              className={cn(
                'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
                FRAMEWORK_COLORS[fw] ?? FRAMEWORK_COLORS.generic
              )}
            >
              {fw}
            </span>
          ))}
        </div>

        {/* Tags */}
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

        {/* CTA */}
        <div className="mt-auto pt-1">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
          >
            <Link to={paths.dashboard.agents.detail(agent.name)} className="flex items-center gap-1.5">
              Try it
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
