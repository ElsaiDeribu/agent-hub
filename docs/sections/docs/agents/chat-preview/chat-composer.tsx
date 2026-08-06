"use client";

import type { FormEvent } from "react";

import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import type { Phase } from "./types";

interface ChatComposerProps {
  input: string;
  phase: Phase;
  sessionReady: boolean;
  busy: boolean;
  sessionError: string | null;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export function ChatComposer({
  input,
  phase,
  sessionReady,
  busy,
  sessionError,
  onChange,
  onSubmit,
}: ChatComposerProps) {
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2 border-t bg-background px-3 py-3">
      <Input
        value={input}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          sessionReady
            ? "Type a message..."
            : phase === "starting"
              ? "Starting sandbox..."
              : "Click Try to start the sandbox"
        }
        disabled={busy || !!sessionError}
        className="flex-1 border-0 bg-muted/50 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <Button
        type="submit"
        size="icon"
        disabled={!input.trim() || busy || !!sessionError}
        className="shrink-0"
      >
        <Send className="size-4" />
      </Button>
    </form>
  );
}
