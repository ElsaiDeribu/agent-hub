"use client";

import { CliCommand, buildHarnessCommands } from "@/components/cli-command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORY_COLORS } from "@/data/registry-shared";
import { cn } from "@/lib/utils";
import { useAgentDetailUiState } from "@/sections/docs/agents/agent-detail-ui-state";
import {
  ChatPreview,
  type ChatPreviewProps,
} from "@/sections/docs/agents/chat-preview";
import { EvalPreview, type EvalPreviewProps } from "@/sections/docs/agents/eval-preview";
import { CodeViewer } from "@/sections/docs/agents/code-viewer";
import type { RegistryItem } from "@/types/registry";

interface AgentDetailProps {
  agent: RegistryItem;
}

export default function AgentDetail({ agent }: AgentDetailProps) {
  const {
    tabByAgent,
    setTabByAgent,
    frameworkByAgent,
    setFrameworkByAgent,
    activeFileByKey,
    setActiveFileByKey
  } = useAgentDetailUiState();

  const activeTab = tabByAgent[agent.name] ?? "preview";
  const activeFramework = frameworkByAgent[agent.name] ?? agent.frameworks[0];
  const categoryColor = CATEGORY_COLORS[agent.category] ?? "";
  const currentFiles = agent.frameworkFiles[activeFramework] ?? [];
  const fileSelectionKey = `${agent.name}:${activeFramework}`;
  const savedFile = activeFileByKey[fileSelectionKey];
  const activeFile =
    (savedFile && currentFiles.some((f) => f.target === savedFile)
      ? savedFile
      : undefined) ??
    currentFiles[0]?.target ??
    "";

  const panelClassName =
    "absolute inset-0 mt-0 overflow-hidden data-[state=inactive]:hidden";

  return (
    <div className="pb-4">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge className={cn("border text-xs", categoryColor)}>
          {agent.category}
        </Badge>
        {agent.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      <h2
        id="live-demo"
        className="mt-0 scroll-m-20 pb-4 text-2xl font-semibold tracking-tight"
      >
        Live demo
      </h2>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setTabByAgent((prev) => ({ ...prev, [agent.name]: value }))
        }
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <TabsList>
              <TabsTrigger value="preview" className="gap-1.5 cursor-pointer">
                Preview
              </TabsTrigger>
              <TabsTrigger value="eval" className="gap-1.5 cursor-pointer">
                Eval
              </TabsTrigger>
              <TabsTrigger value="code" className="gap-1.5 cursor-pointer">
                Code
              </TabsTrigger>
            </TabsList>

            <ButtonGroup aria-label="Framework">
              {agent.frameworks.map((fw) => {
                const selected = fw === activeFramework;
                return (
                  <Button
                    key={fw}
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-pressed={selected}
                    onClick={() =>
                      setFrameworkByAgent((prev) => ({
                        ...prev,
                        [agent.name]: fw
                      }))
                    }
                    className={cn(
                      "cursor-pointer text-xs shadow-none",
                      selected
                        ? "bg-muted text-foreground hover:bg-muted hover:text-foreground dark:bg-muted dark:text-foreground"
                        : "bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground dark:bg-transparent"
                    )}
                  >
                    {fw}
                  </Button>
                );
              })}
            </ButtonGroup>
          </div>

          <CliCommand
            commands={buildHarnessCommands(
              `add ${agent.name}${activeFramework ? ` --framework ${activeFramework}` : ""}`
            )}
          />
        </div>

        <div className="relative h-[520px] overflow-hidden rounded-xl">
          <TabsContent value="preview" forceMount className={panelClassName}>
            <ChatPreview
              key={["try", agent.name, activeFramework].join("::")}
              {...({
                agentName: agent.name,
                framework: activeFramework,
                welcomeMessage: agent.preview.welcomeMessage,
                starterMessages: agent.preview.starterMessages ?? [],
                requiredEnv: agent.preview.requiredEnv ?? [],
                sandboxPreview: agent.sandboxPreview !== false,
                className: "h-full",
              } satisfies ChatPreviewProps)}
            />
          </TabsContent>

          <TabsContent value="eval" forceMount className={panelClassName}>
            <EvalPreview
              key={["eval", agent.name, activeFramework].join("::")}
              {...({
                agentName: agent.name,
                framework: activeFramework,
                requiredEnv: agent.preview.requiredEnv ?? [],
                sandboxPreview: agent.sandboxPreview !== false,
                className: "h-full",
              } satisfies EvalPreviewProps)}
            />
          </TabsContent>

          <TabsContent value="code" forceMount className={panelClassName}>
            <CodeViewer
              files={currentFiles}
              framework={activeFramework}
              activeFile={activeFile}
              onActiveFileChange={(path) =>
                setActiveFileByKey((prev) => ({
                  ...prev,
                  [fileSelectionKey]: path
                }))
              }
              className="h-full"
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
