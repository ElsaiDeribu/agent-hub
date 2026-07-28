import type { RefObject } from 'react';

import { cn } from '@/lib/utils';
import { Markdown } from '@/components/markdown';

import type { Message } from './types';

interface ChatMessagesProps {
  messages: Message[];
  starterMessages: string[];
  startersUsed: boolean;
  isTyping: boolean;
  sessionReady: boolean;
  bottomRef: RefObject<HTMLDivElement | null>;
  onStarter: (msg: string) => void;
}

export function ChatMessages({
  messages,
  starterMessages,
  startersUsed,
  isTyping,
  sessionReady,
  bottomRef,
  onStarter,
}: ChatMessagesProps) {
  return (
    <div className="space-y-4">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
        >
          <div
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium',
              msg.role === 'assistant'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            {msg.role === 'assistant' ? 'AI' : 'You'}
          </div>

          <div
            className={cn(
              'rounded-2xl px-3.5 py-2.5 max-w-[80%]',
              msg.role === 'assistant'
                ? 'bg-muted text-foreground rounded-tl-sm'
                : 'bg-primary text-primary-foreground rounded-tr-sm'
            )}
          >
            {msg.role === 'assistant' ? (
              msg.content ? (
                <Markdown>{msg.content}</Markdown>
              ) : (
                <span className="text-muted-foreground text-sm">…</span>
              )
            ) : (
              <p className="text-sm">{msg.content}</p>
            )}
          </div>
        </div>
      ))}

      {!startersUsed && starterMessages.length > 0 && !isTyping && sessionReady && (
        <div className="flex flex-wrap gap-2 pt-2">
          {starterMessages.map((msg) => (
            <button
              key={msg}
              onClick={() => onStarter(msg)}
              className="rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors text-left"
            >
              {msg}
            </button>
          ))}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
