import type { ReactNode } from "react";

import type { Phase } from "./types";

export const DEFAULT_WELCOME_MESSAGE = "Hello! How can I help you today?";

export function envLabel(key: string): string {
  if (key === "OPENAI_API_KEY") return "OpenAI API key";
  return key.replace(/_/g, " ");
}

export function getBannerText(options: {
  phase: Phase;
  sessionError: string | null;
  needsKeys: boolean;
  livePreview: boolean;
  sessionId: string | null;
}): ReactNode {
  const { phase, sessionError, needsKeys, livePreview, sessionId } = options;

  if (sessionError) return sessionError;
  if (phase === "starting") return "Starting sandbox session…";
  if (phase === "awaitingKeys") {
    return "API key required — entered in-memory only, sent to your local backend/sandbox";
  }
  if (phase === "idle") {
    return needsKeys
      ? "Sandbox starts on demand — click Try, then enter your API key"
      : "Sandbox starts on demand — click Try to launch a preview session";
  }
  if (livePreview) {
    return (
      <>
        Live sandbox preview — real LLM calls
        {sessionId ? (
          <span className="text-muted-foreground"> · session {sessionId.slice(0, 8)}</span>
        ) : null}
      </>
    );
  }
  return (
    <>
      Live sandbox preview — mock agent, <strong>no API keys</strong>
      {sessionId ? (
        <span className="text-muted-foreground"> · session {sessionId.slice(0, 8)}</span>
      ) : null}
    </>
  );
}
