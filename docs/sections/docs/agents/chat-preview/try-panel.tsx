"use client";

import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { Phase } from "./types";

interface TryPanelProps {
  phase: Phase;
  needsKeys: boolean;
  sandboxPreview: boolean;
  sessionError: string | null;
  onTry: () => void;
}

export function TryPanel({ phase, needsKeys, sandboxPreview, sessionError, onTry }: TryPanelProps) {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center px-4">
        <Button
          type="button"
          size="lg"
          onClick={onTry}
          disabled={!sandboxPreview || phase === "starting"}
          className="gap-2"
        >
          <Play className="size-4" />
          {phase === "starting" ? "Starting sandbox…" : sessionError ? "Retry" : "Try"}
        </Button>
        <p className="text-xs text-muted-foreground max-w-[220px]">
          {needsKeys
            ? "Launches an isolated sandbox. You’ll be asked for an API key next."
            : "Launches an isolated sandbox and opens the chat."}
        </p>
      </div>
    </div>
  );
}
