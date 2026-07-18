import { useState } from 'react';
import { cn } from '@/lib/utils';
import { paths } from '@/routes/paths';
import { Badge } from '@/components/ui/badge';
import { ChevronDownIcon } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { CodeViewer } from '@/sections/dashboard/agents/code-viewer';
import { ChatPreview } from '@/sections/dashboard/agents/chat-preview';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { REGISTRY_ITEMS, CATEGORY_COLORS, FRAMEWORK_COLORS } from '@/data/registry';
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function DashboardAgentDetailPage() {
  const { name } = useParams<{ name: string }>();
  const agent = REGISTRY_ITEMS.find((a) => a.name === name);
  const [framework, setFramework] = useState('');

  if (!agent) return <Navigate to={paths.page404} replace />;

  const activeFramework = framework || agent.frameworks[0];
  const categoryColor = CATEGORY_COLORS[agent.category] ?? '';
  const currentFiles = agent.frameworkFiles[activeFramework] ?? [];

  return (
    <>
      {/* ── Agent meta ───────────────────────────────────────────────────── */}
      <div className="border-b bg-muted/20">
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn('border text-xs', categoryColor)}>{agent.category}</Badge>
                {agent.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
                {agent.description}
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* ── Main panels ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto px-6 py-6">
        <Tabs defaultValue="preview" className="flex flex-col h-full gap-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="preview" className="gap-1.5 cursor-pointer">
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="gap-1.5 cursor-pointer">
                Code
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 shrink-0">
              {/* Framework dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className={cn('inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium transition-all', FRAMEWORK_COLORS[activeFramework] ?? FRAMEWORK_COLORS.generic)}>
                  {activeFramework}
                  <ChevronDownIcon className="size-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {agent.frameworks.map((fw) => (
                    <DropdownMenuItem
                      key={fw}
                      onClick={() => setFramework(fw)}
                      className={cn('text-xs', fw === activeFramework && 'font-medium')}
                    >
                      {fw}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <code className="hidden sm:block rounded-lg border bg-muted/50 px-3 py-1.5 font-mono text-xs text-muted-foreground">
                npx @elsaid7/agent-hub add {agent.name} --framework {activeFramework}
              </code>
            </div>
          </div>

          <TabsContent value="preview" className="flex-1 mt-0">
            <ChatPreview
              agentName={agent.name}
              starterMessages={agent.preview.starterMessages}
              className="h-full"
            />
          </TabsContent>

          <TabsContent value="code" className="flex-1 mt-0">
            <CodeViewer files={currentFiles} framework={activeFramework} className="h-full" />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
