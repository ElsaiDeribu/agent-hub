import type { BundledLanguage } from 'shiki';
import type { RegistryFile } from '@/types/registry';

import { cn } from '@/lib/utils';
import { getFileUrl } from '@/data/registry';
import { Skeleton } from '@/components/ui/skeleton';
import { File, Folder, Loader2, FileCode2, ChevronRight } from 'lucide-react';
import { useMemo, useState, useEffect, useCallback, type CSSProperties } from 'react';
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
  Sidebar,
  SidebarMenu,
  SidebarGroup,
  SidebarContent,
  SidebarMenuSub,
  SidebarProvider,
  SidebarMenuItem,
  SidebarMenuButton,
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

type FileTree = {
  name: string;
  path?: string;
  children?: FileTree[];
};

function createFileTree(files: RegistryFile[]): FileTree[] {
  const root: FileTree[] = [];

  for (const file of files) {
    const path = file.target;
    const parts = path.split('/');
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const existingNode = currentLevel.find((node) => node.name === part);

      if (existingNode) {
        if (isFile) {
          existingNode.path = path;
        } else {
          currentLevel = existingNode.children!;
        }
      } else {
        const newNode: FileTree = isFile ? { name: part, path } : { name: part, children: [] };

        currentLevel.push(newNode);

        if (!isFile) {
          currentLevel = newNode.children!;
        }
      }
    }
  }

  return root;
}

const SKELETON_WIDTHS = [72, 55, 88, 61, 45, 79, 53, 92, 66, 48, 83, 57, 70, 41];

const TREE_ITEM_CLASS =
  'rounded-none pl-(--index) whitespace-nowrap hover:bg-muted-foreground/15 focus:bg-muted-foreground/15 focus-visible:bg-muted-foreground/15 active:bg-muted-foreground/15 data-[active=true]:bg-muted-foreground/15';

function Tree({
  item,
  index,
  activeFile,
  onSelect,
}: {
  item: FileTree;
  index: number;
  activeFile: string;
  onSelect: (path: string) => void;
}) {
  if (!item.children) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={item.path === activeFile}
          onClick={() => item.path && onSelect(item.path)}
          className={TREE_ITEM_CLASS}
          data-index={index}
          style={
            {
              '--index': `${index * (index === 2 ? 1.2 : 1.3)}rem`,
            } as CSSProperties
          }
        >
          <ChevronRight className="invisible" />
          <File className="h-4 w-4" />
          {item.name}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className={TREE_ITEM_CLASS}
            style={
              {
                '--index': `${index * (index === 1 ? 1 : 1.2)}rem`,
              } as CSSProperties
            }
          >
            <ChevronRight className="transition-transform" />
            <Folder />
            {item.name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="m-0 w-full translate-x-0 border-none p-0">
            {item.children.map((subItem) => (
              <Tree
                key={subItem.path ?? subItem.name}
                item={subItem}
                index={index + 1}
                activeFile={activeFile}
                onSelect={onSelect}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

function FileTreeSidebar({
  tree,
  activeFile,
  onSelect,
}: {
  tree: FileTree[];
  activeFile: string;
  onSelect: (path: string) => void;
}) {
  return (
    <SidebarProvider className="flex h-full min-h-0! flex-col border-r">
      <Sidebar collapsible="none" className="w-full flex-1 bg-background">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-4 text-muted-foreground text-xs">
          <Folder className="size-4 opacity-70" />
          <span className="font-mono">Files</span>
        </div>
        <SidebarContent className="min-h-0 overflow-y-auto">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="translate-x-0 gap-1.5">
                {tree.map((file) => (
                  <Tree
                    key={file.path ?? file.name}
                    item={file}
                    index={1}
                    activeFile={activeFile}
                    onSelect={onSelect}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
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

  const handleSelect = useCallback((path: string) => {
    setActiveFile(path);
  }, []);

  const tree = useMemo(() => createFileTree(files), [files]);

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

  return (
    <div
      className={cn(
        'flex overflow-hidden rounded-xl border bg-background thin-scrollbar',
        className
      )}
    >
      <div className="flex h-full w-72 shrink-0 flex-col overflow-hidden">
        <FileTreeSidebar tree={tree} activeFile={activeFile} onSelect={handleSelect} />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {loading ? (
          <>
            <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-4 text-muted-foreground text-xs">
              <FileCode2 className="size-4 opacity-70" />
              <span className="font-mono">{activeFile}</span>
              <Loader2 className="ml-auto size-3.5 animate-spin" />
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
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
            className="flex h-full flex-col rounded-none border-0 overflow-hidden"
          >
            <CodeBlockHeader className="h-12 shrink-0 border-border bg-background px-4">
              <CodeBlockTitle>
                <FileCode2 className="size-4 opacity-70" />
                <CodeBlockFilename>{activeFile}</CodeBlockFilename>
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
