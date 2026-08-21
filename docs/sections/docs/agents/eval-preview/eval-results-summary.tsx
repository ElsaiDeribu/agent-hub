"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, TrendingUp } from "lucide-react";

import type { EvalRunSummary } from "./types";

interface EvalResultsSummaryProps {
  summary: EvalRunSummary;
}

export function EvalResultsSummary({ summary }: EvalResultsSummaryProps) {
  const passRate = summary.total_cases > 0
    ? Math.round((summary.passed / summary.total_cases) * 100)
    : 0;

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp className="size-4" />}
          label="Quality"
          value={`${Math.round(summary.avg_score * 100)}%`}
          variant={summary.avg_score >= 0.7 ? "success" : summary.avg_score >= 0.4 ? "warning" : "danger"}
        />
        <StatCard
          icon={<CheckCircle2 className="size-4" />}
          label="Passed"
          value={`${summary.passed}/${summary.total_cases}`}
          variant="success"
        />
        <StatCard
          icon={<XCircle className="size-4" />}
          label="Failed"
          value={`${summary.failed}/${summary.total_cases}`}
          variant={summary.failed > 0 ? "danger" : "muted"}
        />
        <StatCard
          icon={<Clock className="size-4" />}
          label="Duration"
          value={summary.elapsed_ms ? `${(summary.elapsed_ms / 1000).toFixed(1)}s` : "-"}
          variant="muted"
        />
      </div>

      <div className="mt-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span>Pass rate: {passRate}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              passRate === 100
                ? "bg-emerald-500"
                : passRate >= 50
                  ? "bg-amber-500"
                  : "bg-destructive",
            )}
            style={{ width: `${passRate}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  variant: "success" | "danger" | "warning" | "muted";
}) {
  return (
    <div className="text-center">
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-md p-1.5 mb-1",
          variant === "success" && "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
          variant === "danger" && "text-destructive bg-red-100 dark:bg-red-900/30 dark:text-red-400",
          variant === "warning" && "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
          variant === "muted" && "text-muted-foreground bg-muted",
        )}
      >
        {icon}
      </div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}
