"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { FlaskConical, AlertCircle, Loader2 } from "lucide-react";

import type { EvalPhase } from "./types";

interface EvalBannerProps {
  phase: EvalPhase;
  error: string | null;
  children: ReactNode;
}

export function EvalBanner({ phase, error, children }: EvalBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b px-4 py-2 text-xs",
        error
          ? "bg-destructive/5 text-destructive"
          : phase === "running"
            ? "bg-blue-500/5 text-blue-700 dark:text-blue-400"
            : phase === "completed"
              ? "bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
              : phase === "awaitingKeys"
                ? "bg-amber-500/5 text-amber-800 dark:text-amber-300"
                : "bg-muted/50 text-muted-foreground",
      )}
    >
      {error ? (
        <AlertCircle className="size-3 shrink-0" />
      ) : phase === "running" ? (
        <Loader2 className="size-3 shrink-0 animate-spin" />
      ) : (
        <FlaskConical className="size-3 shrink-0" />
      )}
      <span>{children}</span>
    </div>
  );
}
