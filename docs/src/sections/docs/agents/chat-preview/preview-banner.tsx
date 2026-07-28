import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Zap, Shield, AlertCircle } from 'lucide-react';

import type { Phase } from './types';

interface PreviewBannerProps {
  phase: Phase;
  sessionError: string | null;
  livePreview: boolean;
  children: ReactNode;
}

export function PreviewBanner({ phase, sessionError, livePreview, children }: PreviewBannerProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 border-b px-4 py-2 text-xs',
        sessionError
          ? 'bg-destructive/5 text-destructive'
          : livePreview || phase === 'awaitingKeys'
            ? 'bg-amber-500/5 text-amber-800 dark:text-amber-300'
            : 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
      )}
    >
      {sessionError ? (
        <AlertCircle className="size-3 shrink-0" />
      ) : livePreview || phase === 'awaitingKeys' ? (
        <Shield className="size-3 shrink-0" />
      ) : (
        <Zap className="size-3 shrink-0" />
      )}
      <span>{children}</span>
    </div>
  );
}
