import type { RegistryItem, RegistryCatalog } from '@/types/registry';

import catalog from '@repo-registry';

const registry = catalog as RegistryCatalog;

export const REGISTRY_ITEMS: RegistryItem[] = registry.items.map((item) => ({
  ...item,
  title: item.title ?? item.name,
  description: item.description ?? '',
  category: item.category ?? 'example',
  tags: item.tags ?? [],
  languages: item.languages ?? ['ts'],
  frameworks: item.frameworks ?? ['generic'],
  sandboxPreview: item.sandboxPreview ?? false,
  preview: item.preview ?? { starterMessages: [] },
  frameworkFiles: item.frameworkFiles ?? {},
  dependencies: item.dependencies ?? {},
}));

export const CATEGORIES = [
  { value: 'all', label: 'All Agents' },
  { value: 'support', label: 'Support' },
  { value: 'dev-tools', label: 'Dev Tools' },
  { value: 'research', label: 'Research' },
  { value: 'example', label: 'Examples' },
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

export function getRegistryItem(name: string): RegistryItem | undefined {
  return REGISTRY_ITEMS.find((item) => item.name === name);
}
