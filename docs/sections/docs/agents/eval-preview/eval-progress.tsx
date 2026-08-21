"use client";

import { Loader2 } from "lucide-react";

interface EvalProgressProps {
  completed: number;
  total: number;
  runningCaseName?: string;
}

export function EvalProgress({ completed, total, runningCaseName }: EvalProgressProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-2 py-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Loader2 className="size-3 animate-spin" />
          <span>
            Running eval {completed + 1} of {total}
            {runningCaseName && (
              <span className="text-foreground ml-1">— {runningCaseName}</span>
            )}
          </span>
        </div>
        <span className="tabular-nums">{percent}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
