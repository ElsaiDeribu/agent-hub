import { paths } from '@/routes/paths';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CliCommand, buildHarnessCommands } from '@/sections/docs/agents/install-command';
import {
  CodeBlock,
  CodeBlockTitle,
  CodeBlockHeader,
  CodeBlockActions,
  CodeBlockFilename,
  CodeBlockCopyButton,
} from '@/components/ui/code-block';

// ─── Step data ────────────────────────────────────────────────────────────────

const ENV_EXAMPLE = `OPENAI_API_KEY=sk-...
# or use Anthropic:
ANTHROPIC_API_KEY=sk-ant-...`;

interface Step {
  stepNumber: number;
  title: string;
  content: React.ReactNode;
}

const steps: Step[] = [
  {
    stepNumber: 1,
    title: 'Find an agent',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm leading-relaxed">
          Browse the{' '}
          <Link to={paths.agents} className="text-primary underline-offset-4 hover:underline">
            Agents
          </Link>{' '}
          page or list available agents from the CLI:
        </p>

        <CliCommand commands={buildHarnessCommands('list')} className="w-full" />
      </div>
    ),
  },
  {
    stepNumber: 2,
    title: 'Scaffold it',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm leading-relaxed">
          Run the <code className="bg-muted px-1 py-0.5 rounded text-xs">add</code> command with
          your chosen agent and framework:
        </p>

        <CliCommand
          commands={buildHarnessCommands('add customer-support --framework langchain')}
          className="w-full"
        />

        <p className="text-muted-foreground text-sm leading-relaxed">
          The agent source files are copied into{' '}
          <code className="bg-muted px-1 py-0.5 rounded text-xs">./customer-support/</code> and the
          required install commands are printed.
        </p>
      </div>
    ),
  },
  {
    stepNumber: 3,
    title: 'Set environment variables',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm leading-relaxed">
          Add the required API keys to a{' '}
          <code className="bg-muted px-1 py-0.5 rounded text-xs">.env</code> file in your project
          root. The exact keys are printed after scaffolding and listed on each agent&apos;s page.
        </p>

        <CodeBlock code={ENV_EXAMPLE} language="bash">
          <CodeBlockHeader>
            <CodeBlockTitle>
              <CodeBlockFilename>.env</CodeBlockFilename>
            </CodeBlockTitle>
            <CodeBlockActions>
              <CodeBlockCopyButton className="size-7 text-muted-foreground" />
            </CodeBlockActions>
          </CodeBlockHeader>
        </CodeBlock>

        <div className="rounded-lg border bg-amber-500/5 border-amber-500/20 p-3">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Never commit <code className="bg-muted px-1 py-0.5 rounded">.env</code> to version
            control. Add it to <code className="bg-muted px-1 py-0.5 rounded">.gitignore</code>.
          </p>
        </div>
      </div>
    ),
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocsInstallationPage() {
  return (
    <div className="py-10 max-w-4xl">
      {/* Hero */}
      <div className="mb-10">
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
          Getting Started
        </span>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Installation</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          No global install needed. Use{' '}
          <code className="bg-muted px-1.5 py-0.5 rounded text-base">npx agent-hub-harness</code>{' '}
          (or the equivalent for your package manager) to scaffold any agent directly into your
          project in seconds.
        </p>
      </div>

      <Separator className="mb-10" />

      {/* Numbered steps */}
      <div className="space-y-10">
        {steps.map(({ stepNumber, title, content }) => (
          <div key={stepNumber} className="flex gap-6">
            {/* Step indicator + connector */}
            <div className="flex flex-col items-center">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary text-primary font-bold text-sm">
                {stepNumber}
              </div>
              <div className="mt-2 w-px flex-1 bg-border" />
            </div>

            {/* Content */}
            <div className="pb-10 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold">{title}</h2>
              </div>
              {content}
            </div>
          </div>
        ))}
      </div>

      {/* Done banner */}
      <div className="rounded-xl border bg-primary/5 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
        <div>
          <p className="font-medium mb-1">All set!</p>
          <p className="text-sm text-muted-foreground">
            Your agent is scaffolded and ready. Browse the registry to discover more agents you can
            add to your project.
          </p>
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link to={paths.docs.root} className="flex items-center gap-1.5">
            Browse agents
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
