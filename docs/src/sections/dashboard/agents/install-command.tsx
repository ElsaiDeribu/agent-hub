import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { TerminalIcon } from 'lucide-react';
import {
  CodeBlock,
  CodeBlockTitle,
  CodeBlockHeader,
  CodeBlockActions,
  CodeBlockCopyButton,
} from '@/components/ui/code-block';

const PACKAGE_MANAGERS = ['pnpm', 'npm', 'yarn', 'bun'] as const;

type PackageManager = (typeof PACKAGE_MANAGERS)[number];

const COMMAND_BUILDERS: Record<
  PackageManager,
  (packageName: string, args: string) => string
> = {
  pnpm: (pkg, args) => `pnpm dlx ${pkg} ${args}`,
  npm: (pkg, args) => `npx ${pkg} ${args}`,
  yarn: (pkg, args) => `yarn dlx ${pkg} ${args}`,
  bun: (pkg, args) => `bunx --bun ${pkg} ${args}`,
};

interface InstallCommandProps {
  agentName: string;
  framework?: string;
  packageName?: string;
  /** When false, shows a compact single-line npx command with a copy button. */
  showPackageManagers?: boolean;
  className?: string;
}

export function InstallCommand({
  agentName,
  framework,
  packageName = '@elsaid7/agent-hub',
  showPackageManagers = true,
  className,
}: InstallCommandProps) {
  const [manager, setManager] = useState<PackageManager>('pnpm');

  const commands = useMemo(() => {
    const args = framework
      ? `add ${agentName} --framework ${framework}`
      : `add ${agentName}`;
    return Object.fromEntries(
      PACKAGE_MANAGERS.map((pm) => [pm, COMMAND_BUILDERS[pm](packageName, args)])
    ) as Record<PackageManager, string>;
  }, [agentName, framework, packageName]);

  const code = showPackageManagers ? commands[manager] : commands.npm;

  if (!showPackageManagers) {
    return (
      <CodeBlock
        code={code}
        language="bash"
        style={{ containIntrinsicSize: undefined, contentVisibility: undefined }}
        className={cn(
          'relative w-fit max-w-full rounded-lg',
          '[&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:py-2.5 [&_pre]:pl-10 [&_pre]:pr-11',
          '[&_code]:text-sm [&_code]:leading-none',
          className
        )}
      >
        <TerminalIcon className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <CodeBlockCopyButton className="absolute top-1/2 right-1.5 z-10 size-7 -translate-y-1/2 text-muted-foreground" />
      </CodeBlock>
    );
  }

  return (
    <CodeBlock
      code={code}
      language="bash"
      className={cn('w-fit max-w-full', className)}
    >
      <CodeBlockHeader className="gap-3 bg-transparent py-1.5">
        <CodeBlockTitle className="min-w-0 flex-1 gap-2.5">
          <TerminalIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <div className="flex items-center gap-0.5">
            {PACKAGE_MANAGERS.map((pm) => (
              <button
                key={pm}
                type="button"
                onClick={() => setManager(pm)}
                className={cn(
                  'rounded-md px-2 py-1 font-mono text-xs transition-colors',
                  manager === pm
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {pm}
              </button>
            ))}
          </div>
        </CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton className="size-7 text-muted-foreground" />
        </CodeBlockActions>
      </CodeBlockHeader>
    </CodeBlock>
  );
}
