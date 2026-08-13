"use client";

import { cn } from "@/lib/utils";

import { getBannerText } from "./copy";
import { TryPanel } from "./try-panel";
import { ApiKeyForm } from "./api-key-form";
import { ChatMessages } from "./chat-messages";
import { ChatComposer } from "./chat-composer";
import { PreviewBanner } from "./preview-banner";
import { useSandboxChat } from "./use-sandbox-chat";

import type { ChatPreviewProps } from "./types";

export type { ChatPreviewProps } from "./types";

export function ChatPreview({
  agentName,
  framework,
  welcomeMessage,
  starterMessages,
  requiredEnv = [],
  sandboxPreview = true,
  className,
}: ChatPreviewProps) {
  const chat = useSandboxChat({
    agentName,
    framework,
    welcomeMessage,
    requiredEnv,
    sandboxPreview,
  });

  return (
    <div className={cn("flex flex-col rounded-xl border overflow-hidden", className)}>
      <PreviewBanner
        phase={chat.phase}
        sessionError={chat.sessionError}
        livePreview={chat.livePreview}
      >
        {getBannerText({
          phase: chat.phase,
          sessionError: chat.sessionError,
          needsKeys: chat.needsKeys,
          livePreview: chat.livePreview,
          sessionId: chat.sessionId,
          authenticated: chat.authenticated,
        })}
      </PreviewBanner>

      <div className="flex-1 overflow-y-auto p-4 min-h-[280px] max-h-[420px]">
        {chat.phase === "idle" || chat.phase === "starting" ? (
          <TryPanel
            phase={chat.phase}
            needsKeys={chat.needsKeys}
            sandboxPreview={sandboxPreview}
            sessionError={chat.sessionError}
            authenticated={chat.authenticated}
            authLoading={chat.authLoading}
            onTry={chat.handleTry}
          />
        ) : chat.phase === "awaitingKeys" ? (
          <ApiKeyForm
            requiredEnv={requiredEnv}
            values={chat.envValues}
            showSecrets={chat.showSecrets}
            onChange={(key, value) => chat.setEnvValues((prev) => ({ ...prev, [key]: value }))}
            onToggleSecrets={() => chat.setShowSecrets((v) => !v)}
            onSubmit={chat.handleKeySubmit}
            onBack={chat.handleKeyBack}
          />
        ) : (
          <ChatMessages
            messages={chat.messages}
            starterMessages={starterMessages}
            startersUsed={chat.startersUsed}
            isTyping={chat.isTyping}
            sessionReady={chat.sessionReady}
            bottomRef={chat.bottomRef}
            onStarter={(msg) => void chat.sendMessage(msg)}
          />
        )}
      </div>

      <ChatComposer
        input={chat.input}
        phase={chat.phase}
        sessionReady={chat.sessionReady}
        busy={chat.busy}
        sessionError={chat.sessionError}
        onChange={chat.setInput}
        onSubmit={chat.handleSubmit}
      />
    </div>
  );
}
