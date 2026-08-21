"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

import type { EvalCase, EvalCaseResult } from "./types";

interface EvalSuiteViewerProps {
  cases: EvalCase[];
  results: EvalCaseResult[];
  runningCaseId: string | null;
}

function getResultForCase(
  results: EvalCaseResult[],
  caseId: string,
): EvalCaseResult | undefined {
  return results.find((r) => r.case_id === caseId);
}

export function EvalSuiteViewer({ cases, results, runningCaseId }: EvalSuiteViewerProps) {
  if (cases.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground py-8">
        No eval cases defined for this agent.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {cases.map((evalCase) => {
        const result = getResultForCase(results, evalCase.id);
        const isRunning = runningCaseId === evalCase.id;

        return (
          <div
            key={evalCase.id}
            className={cn(
              "rounded-lg border p-3 transition-colors",
              isRunning && "border-blue-500/50 bg-blue-500/5",
              result?.passed === true && "border-emerald-500/30 bg-emerald-500/5",
              result?.passed === false && "border-destructive/30 bg-destructive/5",
              !result && !isRunning && "bg-background",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <StatusIndicator
                  isRunning={isRunning}
                  result={result}
                />
                <span className="text-sm font-medium truncate">{evalCase.name}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {evalCase.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                    {tag}
                  </Badge>
                ))}
                {result && (
                  <span className={cn(
                    "text-xs font-mono tabular-nums",
                    result.passed ? "text-emerald-600" : "text-destructive",
                  )}>
                    {Math.round(result.score * 100)}%
                  </span>
                )}
              </div>
            </div>

            {result && (
              <EvalCaseDetail result={result} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusIndicator({
  isRunning,
  result,
}: {
  isRunning: boolean;
  result?: EvalCaseResult;
}) {
  if (isRunning) {
    return (
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
        <span className="relative inline-flex size-2.5 rounded-full bg-blue-500" />
      </span>
    );
  }

  if (result?.passed === true) {
    return <span className="size-2.5 rounded-full bg-emerald-500" />;
  }

  if (result?.passed === false) {
    return <span className="size-2.5 rounded-full bg-destructive" />;
  }

  return <span className="size-2.5 rounded-full bg-muted-foreground/30" />;
}

function EvalCaseDetail({ result }: { result: EvalCaseResult }) {
  return (
    <div className="mt-2 space-y-1.5">
      {result.error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2">
          <p className="text-xs font-medium text-destructive mb-1">Error</p>
          <p className="text-xs text-destructive/90">{result.error}</p>
        </div>
      )}

      {result.scores.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {result.scores.map((score, i) => (
            <span
              key={i}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px]",
                scoreChipClass(score.kind, score.passed),
              )}
              title={score.reason}
            >
              {score.evaluator}: {score.kind === "metric" ? score.reason : `${Math.round(score.score * 100)}%`}
            </span>
          ))}
        </div>
      )}

      <details className="group border rounded-md">
        <summary className="text-xs font-medium cursor-pointer hover:bg-muted/50 px-2 py-1.5 select-none">
          View Details
        </summary>
        <div className="border-t p-2 space-y-3">
          {result.input && (
            <DetailSection title="Input" data={result.input} />
          )}

          {result.transcript && result.transcript.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Transcript
              </p>
              <pre className="rounded bg-muted p-2 text-xs overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                {result.transcript
                  .map((turn) => `${turn.role}: ${turn.content}`)
                  .join("\n")}
              </pre>
            </div>
          )}

          {result.output && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Agent Output
              </p>
              <pre className="rounded bg-muted p-2 text-xs overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                {result.output}
              </pre>
            </div>
          )}

          {result.expected && Object.keys(result.expected).length > 0 && (
            <DetailSection title="Expected" data={result.expected} />
          )}

          {result.scores.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                Evaluator Results
              </p>
              <div className="space-y-2">
                {result.scores.map((score, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded border p-2 text-xs",
                      score.kind === "metric"
                        ? score.passed
                          ? "border-muted bg-muted/40"
                          : "border-amber-500/30 bg-amber-500/5"
                        : score.passed
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-destructive/30 bg-destructive/5"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">
                        {score.evaluator}
                        {score.kind === "metric" ? " (metric)" : ""}
                      </span>
                      <span className={cn(
                        "font-mono tabular-nums",
                        score.kind === "metric"
                          ? score.passed ? "text-muted-foreground" : "text-amber-600"
                          : score.passed ? "text-emerald-600" : "text-destructive"
                      )}>
                        {score.kind === "metric" ? score.reason : `${Math.round(score.score * 100)}%`}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[11px]">{score.reason}</p>
                    {score.details && (
                      <pre className="mt-1.5 rounded bg-background/50 p-1.5 text-[10px] overflow-x-auto">
                        {JSON.stringify(score.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

function scoreChipClass(kind: string | undefined, passed: boolean): string {
  if (kind === "metric") {
    return passed
      ? "bg-muted text-muted-foreground"
      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
  }
  return passed
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
}

function DetailSection({ title, data }: { title: string; data: Record<string, unknown> }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
        {title}
      </p>
      <pre className="rounded bg-muted p-2 text-xs overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
