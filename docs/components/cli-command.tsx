"use client";

import { useState } from "react";
import { TerminalIcon } from "lucide-react";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/ui/code-block";
import { cn } from "@/lib/utils";

const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn", "bun"] as const;

export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

export type CliCommands = Partial<Record<PackageManager, string>>;

/** Build per-package-manager harness commands from args (e.g. "list"). */
export function buildHarnessCommands(
  args: string,
): Record<PackageManager, string> {
  return {
    pnpm: `pnpm dlx agent-hub-harness ${args}`,
    npm: `npx agent-hub-harness ${args}`,
    yarn: `yarn dlx agent-hub-harness ${args}`,
    bun: `bunx --bun agent-hub-harness ${args}`,
  };
}

const INSTALL_BUILDERS: Record<PackageManager, (pkgs: string[]) => string> = {
  pnpm: (pkgs) => `pnpm add ${pkgs.join(" ")}`,
  npm: (pkgs) => `npm install ${pkgs.join(" ")}`,
  yarn: (pkgs) => `yarn add ${pkgs.join(" ")}`,
  bun: (pkgs) => `bun add ${pkgs.join(" ")}`,
};

interface CliCommandProps {
  /** Harness args, e.g. `list` or `add customer-support --framework langchain`. */
  args?: string;
  /** Explicit per-manager commands (overrides `args`). */
  commands?: CliCommands;
  /** Optional packages to render a secondary install command block. */
  packages?: string[];
  /** When false, shows a compact single-line npx command with a copy button. */
  showPackageManagers?: boolean;
  className?: string;
}

export function CliCommand({
  args,
  commands,
  packages,
  showPackageManagers = true,
  className,
}: CliCommandProps) {
  const resolved = commands ?? (args ? buildHarnessCommands(args) : {});
  const availablePMs = PACKAGE_MANAGERS.filter((pm) => resolved[pm]);
  const [manager, setManager] = useState<PackageManager>(
    availablePMs[0] ?? "npm",
  );

  const code =
    resolved[manager] ??
    resolved.npm ??
    Object.values(resolved)[0] ??
    "";

  const installCode = packages?.length
    ? (INSTALL_BUILDERS[manager]?.(packages) ?? null)
    : null;

  if (!code) return null;

  const pmTabs = (
    <div className="flex items-center gap-0.5">
      {availablePMs.map((pm) => (
        <button
          key={pm}
          type="button"
          onClick={() => setManager(pm)}
          className={cn(
            "cursor-pointer rounded-md px-2 py-1 font-mono text-xs transition-colors",
            manager === pm
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {pm}
        </button>
      ))}
    </div>
  );

  if (!showPackageManagers) {
    return (
      <div className={cn('space-y-2', className)}>
        <CodeBlock
          code={resolved.npm ?? code}
          language="bash"
          style={{ containIntrinsicSize: undefined, contentVisibility: undefined }}
          className={cn(
            "relative w-fit max-w-full rounded-lg",
            "[&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:py-2.5 [&_pre]:pr-11 [&_pre]:pl-10",
            "[&_code]:text-sm [&_code]:leading-none",
          )}
        >
          <TerminalIcon className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <CodeBlockCopyButton className="absolute top-1/2 right-1.5 z-10 size-7 -translate-y-1/2 text-muted-foreground" />
        </CodeBlock>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <CodeBlock code={code} language="bash" className="w-full">
        <CodeBlockHeader className="gap-3 bg-transparent py-1.5">
          <CodeBlockTitle className="min-w-0 flex-1 gap-2.5">
            <TerminalIcon className="size-3.5 shrink-0 text-muted-foreground" />
            {pmTabs}
          </CodeBlockTitle>
          <CodeBlockActions>
            <CodeBlockCopyButton className="size-7 text-muted-foreground" />
          </CodeBlockActions>
        </CodeBlockHeader>
      </CodeBlock>

      {installCode ? (
        <CodeBlock code={installCode} language="bash" className="w-full">
          <CodeBlockHeader className="gap-3 bg-transparent py-1.5">
            <CodeBlockTitle className="min-w-0 flex-1 gap-2.5">
              <TerminalIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Install dependencies
              </span>
            </CodeBlockTitle>
            <CodeBlockActions>
              <CodeBlockCopyButton className="size-7 text-muted-foreground" />
            </CodeBlockActions>
          </CodeBlockHeader>
        </CodeBlock>
      ) : null}
    </div>
  );
}
