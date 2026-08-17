"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { paths } from "@/routes/paths";
import { Button } from "@/components/ui/button";

import type { Phase } from "./types";

interface TryPanelProps {
  phase: Phase;
  needsKeys: boolean;
  sandboxPreview: boolean;
  sessionError: string | null;
  authenticated: boolean;
  authLoading: boolean;
  onTry: () => void;
}

export function TryPanel({
  phase,
  needsKeys,
  sandboxPreview,
  sessionError,
  authenticated,
  authLoading,
  onTry
}: TryPanelProps) {
  const needsSignIn = !authLoading && !authenticated;

  return (
    <div className="flex h-full min-h-[240px] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center px-4">
        {needsSignIn && sandboxPreview ? (
          <Button type="button" size="lg" asChild className="gap-2">
            <Link href={paths.auth.signIn}>
              <Play className="size-4" />
              Try
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            onClick={onTry}
            disabled={!sandboxPreview || phase === "starting" || authLoading}
            className="gap-2"
          >
            <Play className="size-4" />
            {phase === "starting"
              ? "Starting sandbox…"
              : sessionError
                ? "Retry"
                : "Try"}
          </Button>
        )}
        <p className="text-xs text-muted-foreground max-w-[220px]">
          {needsSignIn && sandboxPreview
            ? "Sign in to launch an isolated sandbox."
            : needsKeys
              ? "Launches an isolated sandbox. You’ll be asked for an API key next."
              : "Launches an isolated sandbox and opens the chat."}
        </p>
      </div>
    </div>
  );
}
