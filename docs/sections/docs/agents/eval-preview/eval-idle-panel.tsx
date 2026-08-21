"use client";

import Link from "next/link";
import { FlaskConical, Loader2 } from "lucide-react";
import { paths } from "@/routes/paths";
import { Button } from "@/components/ui/button";

import type { EvalPhase, EvalSuite } from "./types";

interface EvalIdlePanelProps {
  phase: EvalPhase;
  suite: EvalSuite | null;
  needsKeys: boolean;
  sandboxPreview: boolean;
  suiteError: string | null;
  authenticated: boolean;
  authLoading: boolean;
  onRun: () => void;
}

export function EvalIdlePanel({
  phase,
  suite,
  needsKeys,
  sandboxPreview,
  suiteError,
  authenticated,
  authLoading,
  onRun,
}: EvalIdlePanelProps) {
  const needsSignIn = !authLoading && !authenticated;
  const isLoading = phase === "loading";
  const caseCount = suite?.cases.length ?? 0;

  return (
    <div className="flex h-full min-h-[240px] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center px-4">
        {needsSignIn && sandboxPreview ? (
          <Button type="button" size="lg" asChild className="gap-2">
            <Link href={paths.auth.signIn}>
              <FlaskConical className="size-4" />
              Run Eval
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            onClick={onRun}
            disabled={!sandboxPreview || isLoading || !suite || phase === "running"}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FlaskConical className="size-4" />
            )}
            {isLoading
              ? "Loading eval suite..."
              : suiteError
                ? "Retry"
                : `Run Eval${caseCount > 0 ? ` (${caseCount} cases)` : ""}`}
          </Button>
        )}
        <p className="text-xs text-muted-foreground max-w-[280px]">
          {needsSignIn && sandboxPreview
            ? "Sign in to run evals in an isolated sandbox."
            : isLoading
              ? "Loading eval suite definition..."
              : needsKeys
                ? "Spins up a sandbox and runs the eval suite. You'll provide an API key next."
                : `Launches an isolated sandbox and runs ${caseCount} eval case${caseCount !== 1 ? "s" : ""} against this agent.`}
        </p>
      </div>
    </div>
  );
}
