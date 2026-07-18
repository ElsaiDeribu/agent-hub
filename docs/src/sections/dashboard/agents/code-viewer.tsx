import type { RegistryFile } from '@/types/registry';

import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { getFileUrl } from '@/data/registry';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Check, Loader2, FileCode2 } from 'lucide-react';

interface CodeViewerProps {
  files: RegistryFile[];
  framework: string;
  className?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-all',
        'text-zinc-400 hover:text-zinc-100 hover:bg-white/10',
        copied && 'text-emerald-400'
      )}
    >
      {copied ? (
        <>
          <Check className="size-3" /> Copied
        </>
      ) : (
        <>
          <Copy className="size-3" /> Copy
        </>
      )}
    </button>
  );
}

function CodeBlock({ content, loading }: { content: string; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4 bg-zinc-800"
            style={{ width: `${40 + Math.random() * 55}%` }}
          />
        ))}
      </div>
    );
  }

  return (
    <pre className="overflow-auto p-4 text-sm leading-relaxed text-zinc-200 font-mono">
      <code>{content}</code>
    </pre>
  );
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
            results[file.target] = `// Could not load ${file.path}\n// Push to GitHub to preview code.`;
          }
        })
      );
      setFileContents(results);
      setLoading(false);
    };

    fetchAll();
  }, [files, framework]);

  if (files.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-48 text-muted-foreground text-sm', className)}>
        No files for this framework.
      </div>
    );
  }

  const activeContent = fileContents[activeFile] ?? '';

  return (
    <div className={cn('flex flex-col rounded-xl border bg-zinc-950 overflow-hidden', className)}>
      {/* File tabs + copy button */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2 gap-2">
        <div className="flex gap-1 overflow-x-auto">
          {files.map((file) => (
            <button
              key={file.target}
              onClick={() => setActiveFile(file.target)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono transition-all whitespace-nowrap',
                activeFile === file.target
                  ? 'bg-white/10 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <FileCode2 className="size-3 shrink-0" />
              {file.target}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {loading ? (
            <Loader2 className="size-3.5 animate-spin text-zinc-500" />
          ) : (
            <CopyButton text={activeContent} />
          )}
        </div>
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto max-h-[480px]">
        <CodeBlock content={activeContent} loading={loading} />
      </div>
    </div>
  );
}
