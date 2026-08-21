"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RotateCcw, Square } from "lucide-react";

import { EvalBanner } from "./eval-banner";
import { EvalIdlePanel } from "./eval-idle-panel";
import { EvalSuiteViewer } from "./eval-suite-viewer";
import { EvalResultsSummary } from "./eval-results-summary";
import { EvalProgress } from "./eval-progress";
import { ApiKeyForm } from "./eval-key-form";
import { useEvalRunner } from "./use-eval-runner";

import type { EvalPreviewProps } from "./types";

export type { EvalPreviewProps } from "./types";

function getBannerText(options: {
  phase: string;
  suiteError: string | null;
  authenticated: boolean;
  completedCount: number;
  totalCases: number;
}): string {
  const { phase, suiteError, authenticated, completedCount, totalCases } = options;

  if (suiteError) return suiteError;
  if (phase === "loading") return "Loading eval suite...";
  if (phase === "running") return `Running eval — ${completedCount}/${totalCases} cases completed`;
  if (phase === "completed") return "Eval run completed";
  if (phase === "awaitingKeys") return "API key required — entered in-memory only, sent to your local backend/sandbox";
  if (!authenticated) return "Sign in to run evals";
  return `Eval suite — ${totalCases} case${totalCases !== 1 ? "s" : ""} ready to run`;
}

export function EvalPreview({
  agentName,
  framework,
  requiredEnv = [],
  sandboxPreview = true,
  className,
}: EvalPreviewProps) {
  const eval_ = useEvalRunner({
    agentName,
    framework,
    requiredEnv,
    sandboxPreview,
  });

  const totalCases = eval_.suite?.cases.length ?? 0;

  return (
    <div className={cn("flex flex-col rounded-xl border overflow-hidden", className)}>
      <EvalBanner phase={eval_.phase} error={eval_.suiteError}>
        {getBannerText({
          phase: eval_.phase,
          suiteError: eval_.suiteError,
          authenticated: eval_.authenticated,
          completedCount: eval_.completedCount,
          totalCases,
        })}
      </EvalBanner>

      <div className="flex-1 overflow-y-auto p-4 min-h-[280px] max-h-[520px]">
        {(eval_.phase === "idle" || eval_.phase === "loading" || eval_.phase === "error") && !eval_.results.length ? (
          <EvalIdlePanel
            phase={eval_.phase}
            suite={eval_.suite}
            needsKeys={eval_.needsKeys}
            sandboxPreview={sandboxPreview}
            suiteError={eval_.suiteError}
            authenticated={eval_.authenticated}
            authLoading={eval_.authLoading}
            onRun={eval_.handleRun}
          />
        ) : eval_.phase === "awaitingKeys" ? (
          <ApiKeyForm
            requiredEnv={requiredEnv}
            values={eval_.envValues}
            showSecrets={eval_.showSecrets}
            onChange={(key, value) => eval_.setEnvValues((prev) => ({ ...prev, [key]: value }))}
            onToggleSecrets={() => eval_.setShowSecrets((v) => !v)}
            onSubmit={eval_.handleKeySubmit}
            onBack={eval_.handleKeyBack}
          />
        ) : (
          <div className="space-y-4">
            {eval_.phase === "running" && (
              <EvalProgress
                completed={eval_.completedCount}
                total={totalCases}
                runningCaseName={
                  eval_.runningCaseId
                    ? eval_.suite?.cases.find((c) => c.id === eval_.runningCaseId)?.name
                    : undefined
                }
              />
            )}

            {eval_.runSummary && eval_.phase === "completed" && (
              <EvalResultsSummary summary={eval_.runSummary} />
            )}

            {eval_.suite && (
              <EvalSuiteViewer
                cases={eval_.suite.cases}
                results={eval_.results}
                runningCaseId={eval_.runningCaseId}
              />
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t bg-background px-3 py-2.5">
        <div className="text-xs text-muted-foreground">
          {eval_.suite && (
            <span>
              {eval_.suite.evaluators.map((e) => e.type).join(", ")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {eval_.phase === "running" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={eval_.handleCancel}
              className="gap-1.5 text-xs"
            >
              <Square className="size-3" />
              Cancel
            </Button>
          )}
          {eval_.phase === "completed" && (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={eval_.handleReset}
                className="gap-1.5 text-xs"
              >
                <RotateCcw className="size-3" />
                Reset
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={eval_.handleRun}
                className="gap-1.5 text-xs"
              >
                Re-run
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
