import { useState } from 'react';
import { cn } from '@/lib/utils';
import { paths } from '@/routes/paths';
import { Badge } from '@/components/ui/badge';
import { ChevronDownIcon } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { CodeViewer } from '@/sections/docs/agents/code-viewer';
import { ChatPreview } from '@/sections/docs/agents/chat-preview/index';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { REGISTRY_ITEMS, CATEGORY_COLORS, FRAMEWORK_COLORS } from '@/data/registry';
import { CliCommand, buildHarnessCommands } from '@/sections/docs/agents/install-command';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function DocsAgentDetailPage() {
  const { name } = useParams<{ name: string }>();
  const agent = REGISTRY_ITEMS.find((a) => a.name === name);
  const [tabByAgent, setTabByAgent] = useState<Record<string, string>>({});
  const [frameworkByAgent, setFrameworkByAgent] = useState<Record<string, string>>({});
  const [activeFileByKey, setActiveFileByKey] = useState<Record<string, string>>({});

  if (!agent) return <Navigate to={paths.page404} replace />;

  const activeTab = tabByAgent[agent.name] ?? 'preview';
  const activeFramework = frameworkByAgent[agent.name] ?? agent.frameworks[0];
  const categoryColor = CATEGORY_COLORS[agent.category] ?? '';
  const currentFiles = agent.frameworkFiles[activeFramework] ?? [];
  const fileSelectionKey = `${agent.name}:${activeFramework}`;
  const savedFile = activeFileByKey[fileSelectionKey];
  const activeFile =
    (savedFile && currentFiles.some((f) => f.target === savedFile) ? savedFile : undefined) ??
    currentFiles[0]?.target ??
    '';

  return (
    <>
      {/* ── Agent meta ───────────────────────────────────────────────────── */}
      <div>
        <div className="pb-5">
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
      <main className="flex-1 overflow-auto py-6">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setTabByAgent((prev) => ({ ...prev, [agent.name]: value }))}
          className="flex flex-col h-full gap-4"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <TabsList>
                <TabsTrigger value="preview" className="gap-1.5 cursor-pointer">
                  Preview
                </TabsTrigger>
                <TabsTrigger value="code" className="gap-1.5 cursor-pointer">
                  Code
                </TabsTrigger>
              </TabsList>

              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium transition-all cursor-pointer',
                    FRAMEWORK_COLORS[activeFramework] ?? FRAMEWORK_COLORS.generic
                  )}
                >
                  {activeFramework}
                  <ChevronDownIcon className="size-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {agent.frameworks.map((fw) => (
                    <DropdownMenuItem
                      key={fw}
                      onClick={() => setFrameworkByAgent((prev) => ({ ...prev, [agent.name]: fw }))}
                      className={cn(
                        'text-xs cursor-pointer',
                        fw === activeFramework && 'font-medium'
                      )}
                    >
                      {fw}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <CliCommand
              commands={buildHarnessCommands(
                `add ${agent.name}${activeFramework ? ` --framework ${activeFramework}` : ''}`
              )}
            />
          </div>

          {/* forceMount + hide inactive: keep Preview/Code state (file selection, chat) */}
          <TabsContent
            value="preview"
            forceMount
            className="flex-1 mt-0 data-[state=inactive]:hidden"
          >
            <ChatPreview
              agentName={agent.name}
              framework={activeFramework}
              welcomeMessage={agent.preview.welcomeMessage}
              starterMessages={agent.preview.starterMessages}
              requiredEnv={agent.preview.requiredEnv ?? []}
              sandboxPreview={agent.sandboxPreview !== false}
              className="h-full"
            />
          </TabsContent>

          <TabsContent value="code" forceMount className="flex-1 mt-0 data-[state=inactive]:hidden">
            <CodeViewer
              files={currentFiles}
              framework={activeFramework}
              activeFile={activeFile}
              onActiveFileChange={(path) =>
                setActiveFileByKey((prev) => ({ ...prev, [fileSelectionKey]: path }))
              }
              className="h-[70vh]"
            />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
