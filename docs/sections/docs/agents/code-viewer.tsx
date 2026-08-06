"use client";

import type { BundledLanguage } from "shiki";
import type { RegistryFile } from "@/types/registry";

import { cn } from "@/lib/utils";
import { getFileUrl } from "@/data/registry-shared";
import { Skeleton } from "@/components/ui/skeleton";
import { File, Folder, Loader2, FileCode2, ChevronRight } from "lucide-react";
import { useMemo, useState, useEffect, useCallback, type CSSProperties } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  CodeBlock,
  CodeBlockTitle,
  CodeBlockHeader,
  CodeBlockActions,
  CodeBlockFilename,
  CodeBlockCopyButton,
} from "@/components/ui/code-block";

function getLanguage(filename: string): BundledLanguage {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const langMap: Record<string, BundledLanguage> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    py: "python",
    go: "go",
    rs: "rust",
    json: "json",
    css: "css",
    html: "html",
    md: "markdown",
    mdx: "mdx",
    sh: "bash",
    bash: "bash",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
  };
  return (langMap[ext] ?? "text") as BundledLanguage;
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
    const parts = path.split("/");
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
  "flex w-full items-center gap-2 rounded-none py-1.5 pr-2 text-sm whitespace-nowrap hover:bg-muted-foreground/15 focus-visible:bg-muted-foreground/15 focus-visible:outline-none";

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
  const paddingStyle = {
    paddingLeft: `${index * (index === 2 ? 1.2 : 1.3)}rem`,
  } as CSSProperties;

  if (!item.children) {
    return (
      <li>
        <button
          type="button"
          onClick={() => item.path && onSelect(item.path)}
          className={cn(
            TREE_ITEM_CLASS,
            item.path === activeFile && "bg-muted-foreground/15 font-medium",
          )}
          style={paddingStyle}
        >
          <ChevronRight className="invisible size-4 shrink-0" />
          <File className="size-4 shrink-0" />
          {item.name}
        </button>
      </li>
    );
  }

  return (
    <li>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen
      >
        <CollapsibleTrigger asChild>
          <button type="button" className={TREE_ITEM_CLASS} style={paddingStyle}>
            <ChevronRight className="size-4 shrink-0 transition-transform" />
            <Folder className="size-4 shrink-0" />
            {item.name}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="m-0 list-none p-0">
            {item.children.map((subItem) => (
              <Tree
                key={subItem.path ?? subItem.name}
                item={subItem}
                index={index + 1}
                activeFile={activeFile}
                onSelect={onSelect}
              />
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
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
    <div className="flex h-full min-h-0 flex-col border-r bg-background">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4 text-muted-foreground text-xs">
        <Folder className="size-4 opacity-70" />
        <span className="font-mono">Files</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ul className="m-0 list-none gap-1.5 p-0">
          {tree.map((file) => (
            <Tree
              key={file.path ?? file.name}
              item={file}
              index={1}
              activeFile={activeFile}
              onSelect={onSelect}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

interface CodeViewerProps {
  files: RegistryFile[];
  framework: string;
  activeFile: string;
  onActiveFileChange: (path: string) => void;
  className?: string;
}

export function CodeViewer({
  files,
  framework,
  activeFile,
  onActiveFileChange,
  className,
}: CodeViewerProps) {
  const filesIdentity = useMemo(
    () => `${framework}\0${files.map((f) => f.path).join("\0")}`,
    [files, framework],
  );

  const [cache, setCache] = useState<{
    identity: string;
    contents: Record<string, string>;
  }>({ identity: "", contents: {} });

  // Derive loading from whether cache matches the current files — avoids
  // synchronous setState at the top of the fetch effect.
  const loading = files.length > 0 && cache.identity !== filesIdentity;

  useEffect(() => {
    if (files.length === 0) return;

    let cancelled = false;

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
        }),
      );
      if (!cancelled) {
        setCache({ identity: filesIdentity, contents: results });
      }
    };

    void fetchAll();

    return () => {
      cancelled = true;
    };
  }, [files, filesIdentity]);

  const handleSelect = useCallback(
    (path: string) => {
      onActiveFileChange(path);
    },
    [onActiveFileChange],
  );

  const tree = useMemo(() => createFileTree(files), [files]);

  if (files.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-48 text-muted-foreground text-sm",
          className,
        )}
      >
        No files for this framework.
      </div>
    );
  }

  const activeContent = cache.contents[activeFile] ?? "";
  const language = getLanguage(activeFile);

  return (
    <div
      className={cn(
        "flex overflow-hidden rounded-xl border bg-background",
        className,
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
