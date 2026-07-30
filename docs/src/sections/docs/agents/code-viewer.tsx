import type { BundledLanguage } from 'shiki';
import type { RegistryFile } from '@/types/registry';

import { cn } from '@/lib/utils';
import { getFileUrl } from '@/data/registry';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { File, Folder, Loader2, FileCode2, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  CodeBlock,
  CodeBlockTitle,
  CodeBlockHeader,
  CodeBlockActions,
  CodeBlockFilename,
  CodeBlockCopyButton,
} from '@/components/ui/code-block';
import {
  SidebarMenu,
  SidebarMenuSub,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';

function getLanguage(filename: string): BundledLanguage {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const langMap: Record<string, BundledLanguage> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    py: 'python',
    go: 'go',
    rs: 'rust',
    json: 'json',
    css: 'css',
    html: 'html',
    md: 'markdown',
    mdx: 'mdx',
    sh: 'bash',
    bash: 'bash',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
  };
  return (langMap[ext] ?? 'text') as BundledLanguage;
}

interface TreeNode {
  name: string;
  path: string;
  isFile: boolean;
  children: TreeNode[];
  file?: RegistryFile;
}

function buildFileTree(files: RegistryFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.target.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const existing = current.find((n) => n.name === part);

      if (existing) {
        current = existing.children;
      } else {
        const node: TreeNode = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          isFile,
          children: [],
          file: isFile ? file : undefined,
        };
        current.push(node);
        current = node.children;
      }
    }
  }

  return root;
}

const SKELETON_WIDTHS = [72, 55, 88, 61, 45, 79, 53, 92, 66, 48, 83, 57, 70, 41];

function Tree({
  node,
  activeFile,
  onSelect,
}: {
  node: TreeNode;
  activeFile: string;
  onSelect: (target: string) => void;
}) {
  if (node.isFile) {
    return (
      <SidebarMenuButton
        isActive={activeFile === node.file!.target}
        onClick={() => onSelect(node.file!.target)}
        size="sm"
        className="font-mono"
      >
        <File />
        {node.name}
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton size="sm" className="font-mono">
            <ChevronRight className="transition-transform" />
            <Folder />
            {node.name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {node.children.map((child) => (
              <Tree key={child.path} node={child} activeFile={activeFile} onSelect={onSelect} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

interface CodeViewerProps {
  files: RegistryFile[];
  framework: string;
  className?: string;
}

export function CodeViewer({ files, framework, className }: CodeViewerProps) {
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeFile, setActiveFile] = useState(files[0]?.target ?? '');

  useEffect(() => {
    if (files.length === 0) return;

    setLoading(true);
    setActiveFile(files[0].target);
    setFileContents({});

    const fetchAll = async () => {
      const results: Record<string, string> = {};
      await Promise.all(
        files.map(async (file) => {
          try {
            const res = await fetch(getFileUrl(file.path));
            results[file.target] = res.ok
              ? await res.text()
              : `// This file hasn't been pushed to GitHub yet.\n// Run: git push origin main\n//\n// Expected path: ${file.path}`;
          } catch {
            results[file.target] =
              `// Could not load ${file.path}\n// Push to GitHub to preview code.`;
          }
        })
      );
      setFileContents(results);
      setLoading(false);
    };

    fetchAll();
  }, [files, framework]);

  const handleSelect = useCallback((target: string) => {
    setActiveFile(target);
  }, []);

  const tree = useMemo(() => buildFileTree(files), [files]);

  if (files.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-48 text-muted-foreground text-sm',
          className
        )}
      >
        No files for this framework.
      </div>
    );
  }

  const activeContent = fileContents[activeFile] ?? '';
  const language = getLanguage(activeFile);
  const filename = activeFile.split('/').pop() ?? activeFile;

  return (
    <div
      className={cn(
        'flex rounded-xl border border-border bg-background overflow-hidden thin-scrollbar',
        className
      )}
    >
      {/* Left sidebar: file tree */}
      <div className="w-52 shrink-0 border-r border-border flex flex-col overflow-y-auto">
        <SidebarGroupLabel className="h-auto rounded-none border-b border-border px-3 py-[14.5px]">
          Files
        </SidebarGroupLabel>
        <SidebarGroupContent className="flex-1 overflow-y-auto py-1">
          <SidebarMenu>
            {tree.map((node) => (
              <Tree key={node.path} node={node} activeFile={activeFile} onSelect={handleSelect} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </div>

      {/* Right panel: code editor */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {loading ? (
          <>
            <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <FileCode2 className="size-3 text-sky-400" />
                <span className="text-xs font-mono text-muted-foreground">{filename}</span>
              </div>
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            </div>
            <div className="space-y-2 p-4">
              {SKELETON_WIDTHS.map((w, i) => (
                <Skeleton key={i} className="h-4 bg-muted" style={{ width: `${w}%` }} />
              ))}
            </div>
          </>
        ) : (
          <CodeBlock
            code={activeContent}
            language={language}
            showLineNumbers
            className="rounded-none border-0 flex-1 overflow-hidden [&_pre]:max-h-[480px] [&_pre]:overflow-auto"
          >
            <CodeBlockHeader className="border-border bg-background">
              <CodeBlockTitle>
                <FileCode2 className="size-3 text-sky-400" />
                <CodeBlockFilename>{filename}</CodeBlockFilename>
              </CodeBlockTitle>
              <CodeBlockActions>
                <CodeBlockCopyButton />
              </CodeBlockActions>
            </CodeBlockHeader>
          </CodeBlock>
        )}
      </div>
    </div>
  );
}
