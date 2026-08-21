"use client";

import type { FormEvent } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, KeyRound } from "lucide-react";

interface ApiKeyFormProps {
  requiredEnv: string[];
  values: Record<string, string>;
  showSecrets: boolean;
  onChange: (key: string, value: string) => void;
  onToggleSecrets: () => void;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
}

function envLabel(key: string): string {
  if (key === "OPENAI_API_KEY") return "OpenAI API key";
  return key.replace(/_/g, " ");
}

export function ApiKeyForm({
  requiredEnv,
  values,
  showSecrets,
  onChange,
  onToggleSecrets,
  onSubmit,
  onBack,
}: ApiKeyFormProps) {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center">
      <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-sm font-medium">
            <KeyRound className="size-4" />
            Connect your API key
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your key stays in browser memory for this tab only — it is not saved to disk or
            localStorage. It is forwarded once to your local backend/sandbox for the eval run.
          </p>
        </div>

        {requiredEnv.map((key) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`eval-env-${key}`}>{envLabel(key)}</Label>
            <div className="relative">
              <Input
                id={`eval-env-${key}`}
                type={showSecrets ? "text" : "password"}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                name={`secret-${key}`}
                placeholder={key === "OPENAI_API_KEY" ? "sk-..." : key}
                value={values[key] ?? ""}
                onChange={(e) => onChange(key, e.target.value)}
                className="pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={onToggleSecrets}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showSecrets ? "Hide key" : "Show key"}
              >
                {showSecrets ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2">
          <Button type="submit" className="flex-1">
            Start eval run
          </Button>
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
        </div>
      </form>
    </div>
  );
}
