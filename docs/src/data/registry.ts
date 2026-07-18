import type { RegistryItem } from '@/types/registry';

export const REGISTRY_ITEMS: RegistryItem[] = [
  {
    name: 'customer-support',
    title: 'Customer Support Agent',
    description:
      'Multi-turn customer support agent with order lookup, account lookup, refund initiation, and human escalation tools.',
    category: 'support',
    tags: ['multi-turn', 'tools', 'memory', 'escalation'],
    languages: ['ts'],
    frameworks: ['langchain', 'mastra', 'vercel-ai'],
    preview: {
      starterMessages: [
        "I can't log in to my account",
        'Where is my order #12345?',
        'I need a refund for my last purchase',
        'My product arrived damaged',
      ],
    },
    frameworkFiles: {
      langchain: [
        { path: 'registry/customer-support/langchain/agent.ts', target: 'agent.ts' },
        { path: 'registry/customer-support/langchain/tools.ts', target: 'tools.ts' },
      ],
      mastra: [{ path: 'registry/customer-support/mastra/agent.ts', target: 'agent.ts' }],
      'vercel-ai': [{ path: 'registry/customer-support/vercel-ai/agent.ts', target: 'agent.ts' }],
    },
    dependencies: {
      langchain: ['@langchain/core', '@langchain/openai', 'langchain', 'zod'],
      mastra: ['@mastra/core', '@ai-sdk/openai', 'zod'],
      'vercel-ai': ['ai', '@ai-sdk/openai', 'zod'],
    },
  },
  {
    name: 'code-reviewer',
    title: 'Code Reviewer Agent',
    description:
      'Reviews code snippets for bugs, security vulnerabilities, performance issues, and style improvements with structured output.',
    category: 'dev-tools',
    tags: ['code', 'review', 'structured-output', 'security'],
    languages: ['ts'],
    frameworks: ['langchain', 'mastra'],
    preview: {
      starterMessages: [
        'Review this: for (let i = 0; i <= arr.length; i++) {}',
        'Check for SQL injection: `SELECT * FROM users WHERE id = ${userId}`',
        'Is this safe? eval(userInput)',
      ],
    },
    frameworkFiles: {
      langchain: [{ path: 'registry/code-reviewer/langchain/agent.ts', target: 'agent.ts' }],
      mastra: [{ path: 'registry/code-reviewer/mastra/agent.ts', target: 'agent.ts' }],
    },
    dependencies: {
      langchain: ['@langchain/core', '@langchain/openai', 'langchain', 'zod'],
      mastra: ['@mastra/core', '@ai-sdk/openai', 'zod'],
    },
  },
  {
    name: 'research-assistant',
    title: 'Research Assistant Agent',
    description:
      'Searches the web, reads pages, and synthesizes findings into structured research summaries with cited sources.',
    category: 'research',
    tags: ['web-search', 'rag', 'summarization', 'tools'],
    languages: ['ts'],
    frameworks: ['langchain', 'vercel-ai'],
    preview: {
      starterMessages: [
        'Research the latest trends in AI agents',
        'Compare LangChain vs LlamaIndex vs Mastra',
        'Summarize recent news about OpenAI',
      ],
    },
    frameworkFiles: {
      langchain: [
        { path: 'registry/research-assistant/langchain/agent.ts', target: 'agent.ts' },
        { path: 'registry/research-assistant/langchain/tools.ts', target: 'tools.ts' },
      ],
      'vercel-ai': [
        { path: 'registry/research-assistant/vercel-ai/agent.ts', target: 'agent.ts' },
      ],
    },
    dependencies: {
      langchain: [
        '@langchain/core',
        '@langchain/openai',
        '@langchain/community',
        'langchain',
        'zod',
      ],
      'vercel-ai': ['ai', '@ai-sdk/openai', 'zod'],
    },
  },
];

export const CATEGORIES = [
  { value: 'all', label: 'All Agents' },
  { value: 'support', label: 'Support' },
  { value: 'dev-tools', label: 'Dev Tools' },
  { value: 'research', label: 'Research' },
] as const;

export const FRAMEWORK_COLORS: Record<string, string> = {
  langchain: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  mastra: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  'vercel-ai': 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
  generic: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
};

export const CATEGORY_COLORS: Record<string, string> = {
  support: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  'dev-tools': 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  research: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  example: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
};

const GITHUB_RAW = 'https://raw.githubusercontent.com/ElsaiDeribu/agent-hub/main';

export function getFileUrl(filePath: string): string {
  return `${GITHUB_RAW}/${filePath}`;
}

export function getGitHubUrl(agentName: string): string {
  return `https://github.com/ElsaiDeribu/agent-hub/tree/main/registry/${agentName}`;
}
