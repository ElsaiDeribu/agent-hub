import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRef, useState, useEffect } from 'react';
import { Zap, Send, AlertCircle } from 'lucide-react';
import { streamChat, createSession, deleteSession } from '@/lib/sandbox-api';

// ---------------------------------------------------------------------------
// Markdown renderer (minimal: handles **bold**, \n, and lists)
// ---------------------------------------------------------------------------
function MarkdownText({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-muted-foreground mt-0.5">•</span>
              <span dangerouslySetInnerHTML={{ __html: renderInline(line.slice(2)) }} />
            </div>
          );
        }
        if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
          return (
            <p
              key={i}
              className="font-semibold"
              dangerouslySetInnerHTML={{ __html: renderInline(line) }}
            />
          );
        }
        if (line.startsWith('#')) {
          const text = line.replace(/^#+\s/, '');
          return (
            <p
              key={i}
              className="font-semibold"
              dangerouslySetInnerHTML={{ __html: renderInline(text) }}
            />
          );
        }
        if (line.startsWith('|') && line.endsWith('|')) {
          return null;
        }
        if (line.match(/^\|-+/)) return null;
        if (line === '') return <div key={i} className="h-1" />;
        return <p key={i} dangerouslySetInnerHTML={{ __html: renderInline(line) }} />;
      })}
    </div>
  );
}

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1 py-0.5 font-mono text-xs">$1</code>')
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" target="_blank" rel="noopener" class="text-primary underline-offset-2 hover:underline">$1</a>'
    );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Message = { role: 'user' | 'assistant'; content: string };

interface ChatPreviewProps {
  agentName: string;
  starterMessages: string[];
  sandboxPreview?: boolean;
  className?: string;
}

function getInitialMessage(agentName: string): string {
  const map: Record<string, string> = {
    hello: "Hello! I'm the hello-world sandbox agent. Send a message to verify streaming.",
    'simple-qa':
      "Hi! I'm a sandbox demo agent. Ask me something — replies are generated locally (no API keys).",
    'customer-support':
      "Hi! I'm your customer support agent.\nI can help with orders, account access, refunds, and more. What can I assist you with today?",
    'code-reviewer':
      "Hello! I'm your code reviewer.\nPaste a code snippet or describe what you'd like me to review.",
    'research-assistant':
      "Hi! I'm your research assistant.\nGive me a topic and I'll synthesize findings for you.",
  };
  return map[agentName] ?? 'Hello! How can I help you today?';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ChatPreview({
  agentName,
  starterMessages,
  sandboxPreview = true,
  className,
}: ChatPreviewProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: getInitialMessage(agentName) },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [startersUsed, setStartersUsed] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [starting, setStarting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Create / tear down sandbox session when the agent changes.
  useEffect(() => {
    let cancelled = false;

    setMessages([{ role: 'assistant', content: getInitialMessage(agentName) }]);
    setStartersUsed(false);
    setInput('');
    setIsTyping(false);
    setSessionError(null);
    setSessionReady(false);
    setSessionId(null);
    sessionIdRef.current = null;
    abortRef.current?.abort();

    if (!sandboxPreview) {
      setSessionError('This agent does not have a sandbox preview yet.');
      return undefined;
    }

    setStarting(true);
    (async () => {
      try {
        const created = await createSession(agentName);
        if (cancelled) {
          await deleteSession(created.session_id).catch(() => undefined);
          return;
        }
        sessionIdRef.current = created.session_id;
        setSessionId(created.session_id);
        setSessionReady(true);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setSessionError(
          `Could not start sandbox session. Is the backend running on VITE_HOST_API? (${msg})`
        );
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
      const sid = sessionIdRef.current;
      if (sid) {
        deleteSession(sid).catch(() => undefined);
      }
    };
  }, [agentName, sandboxPreview]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping || !sessionId) return;

    const userText = text.trim();
    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setInput('');
    setStartersUsed(true);
    setIsTyping(true);
    setSessionError(null);

    // Placeholder assistant message that tokens append into.
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat(
        sessionId,
        userText,
        history,
        (event) => {
          if (event.type === 'token') {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === 'assistant') {
                next[next.length - 1] = {
                  ...last,
                  content: last.content + (event.content ?? ''),
                };
              }
              return next;
            });
          } else if (event.type === 'error') {
            setSessionError(event.content || 'Agent error');
          }
        },
        controller.signal
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : String(err);
      setSessionError(msg);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'assistant' && !last.content) {
          next.pop();
        }
        return next;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const busy = isTyping || starting || !sessionReady;

  return (
    <div className={cn('flex flex-col rounded-xl border overflow-hidden', className)}>
      {/* Banner */}
      <div
        className={cn(
          'flex items-center gap-2 border-b px-4 py-2 text-xs',
          sessionError
            ? 'bg-destructive/5 text-destructive'
            : 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
        )}
      >
        {sessionError ? (
          <AlertCircle className="size-3 shrink-0" />
        ) : (
          <Zap className="size-3 shrink-0" />
        )}
        <span>
          {sessionError ? (
            sessionError
          ) : starting ? (
            'Starting sandbox session…'
          ) : (
            <>
              Live sandbox preview — mock agent, <strong>no API keys</strong>
              {sessionId ? (
                <span className="text-muted-foreground"> · session {sessionId.slice(0, 8)}</span>
              ) : null}
            </>
          )}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 max-h-[420px]">
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
                  <MarkdownText content={msg.content} />
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
                onClick={() => sendMessage(msg)}
                className="rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors text-left"
              >
                {msg}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t bg-background px-3 py-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={sessionReady ? 'Type a message...' : 'Waiting for sandbox...'}
          disabled={busy || !!sessionError}
          className="flex-1 border-0 bg-muted/50 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || busy || !!sessionError}
          className="shrink-0"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
