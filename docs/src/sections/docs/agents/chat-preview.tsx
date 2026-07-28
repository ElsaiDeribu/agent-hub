import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/components/markdown';
import { useRef, useState, useEffect } from 'react';
import { streamChat, createSession, deleteSession } from '@/lib/sandbox-api';
import { Zap, Eye, Send, Play, EyeOff, Shield, KeyRound, AlertCircle } from 'lucide-react';

function envLabel(key: string): string {
  if (key === 'OPENAI_API_KEY') return 'OpenAI API key';
  return key.replace(/_/g, ' ');
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Message = { role: 'user' | 'assistant'; content: string };
type Phase = 'idle' | 'awaitingKeys' | 'starting' | 'ready';

interface ChatPreviewProps {
  agentName: string;
  starterMessages: string[];
  requiredEnv?: string[];
  sandboxPreview?: boolean;
  className?: string;
}

function getInitialMessage(agentName: string): string {
  const map: Record<string, string> = {
    hello: "Hello! I'm the hello-world sandbox agent. Send a message to verify streaming.",
    'simple-qa':
      "Hi! I'm a sandbox demo agent. Ask me something — replies are generated locally (no API keys).",
    'langgraph-qa':
      "Hi! I'm a live LangGraph agent. Ask me anything — replies come from OpenAI inside the sandbox.",
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
  requiredEnv = [],
  sandboxPreview = true,
  className,
}: ChatPreviewProps) {
  const needsKeys = requiredEnv.length > 0;
  const requiredEnvKey = requiredEnv.join('|');
  const [phase, setPhase] = useState<Phase>('idle');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: getInitialMessage(agentName) },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [startersUsed, setStartersUsed] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  // Kept only in React state — never written to localStorage / sessionStorage.
  const [envValues, setEnvValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startGenerationRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Reset on agent change; never auto-create a sandbox.
  useEffect(() => {
    abortRef.current?.abort();
    const sid = sessionIdRef.current;
    if (sid) {
      deleteSession(sid).catch(() => undefined);
    }
    sessionIdRef.current = null;
    startGenerationRef.current += 1;

    setPhase('idle');
    setMessages([{ role: 'assistant', content: getInitialMessage(agentName) }]);
    setStartersUsed(false);
    setInput('');
    setIsTyping(false);
    setSessionError(sandboxPreview ? null : 'This agent does not have a sandbox preview yet.');
    setSessionId(null);
    setEnvValues({});
    setShowSecrets(false);

    return () => {
      abortRef.current?.abort();
      const current = sessionIdRef.current;
      if (current) {
        deleteSession(current).catch(() => undefined);
      }
      sessionIdRef.current = null;
    };
  }, [agentName, sandboxPreview, requiredEnvKey]);

  const startSandbox = async (env: Record<string, string> = {}) => {
    const generation = ++startGenerationRef.current;
    setPhase('starting');
    setSessionError(null);

    try {
      const created = await createSession(agentName, env);
      if (generation !== startGenerationRef.current) {
        await deleteSession(created.session_id).catch(() => undefined);
        return;
      }
      sessionIdRef.current = created.session_id;
      setSessionId(created.session_id);
      setSessionReadyState();
      setEnvValues({});
    } catch (err) {
      if (generation !== startGenerationRef.current) return;
      const msg = err instanceof Error ? err.message : String(err);
      setSessionError(
        `Could not start sandbox session. Is the backend running on VITE_HOST_API? (${msg})`
      );
      setPhase(needsKeys ? 'awaitingKeys' : 'idle');
      setSessionId(null);
      sessionIdRef.current = null;
    }
  };

  const setSessionReadyState = () => {
    setPhase('ready');
  };

  const handleTry = () => {
    if (!sandboxPreview || phase === 'starting') return;
    setSessionError(null);
    if (needsKeys) {
      setPhase('awaitingKeys');
      return;
    }
    void startSandbox({});
  };

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    for (const key of requiredEnv) {
      const value = (envValues[key] ?? '').trim();
      if (!value) {
        setSessionError(`${envLabel(key)} is required.`);
        return;
      }
      next[key] = value;
    }
    void startSandbox(next);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping || !sessionId || phase !== 'ready') return;

    const userText = text.trim();
    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setInput('');
    setStartersUsed(true);
    setIsTyping(true);
    setSessionError(null);

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

  const sessionReady = phase === 'ready';
  const busy = isTyping || phase === 'starting' || !sessionReady;
  const livePreview = needsKeys && sessionReady;

  const bannerText = () => {
    if (sessionError) return sessionError;
    if (phase === 'starting') return 'Starting sandbox session…';
    if (phase === 'awaitingKeys') {
      return 'API key required — entered in-memory only, sent to your local backend/sandbox';
    }
    if (phase === 'idle') {
      return needsKeys
        ? 'Sandbox starts on demand — click Try, then enter your API key'
        : 'Sandbox starts on demand — click Try to launch a preview session';
    }
    if (livePreview) {
      return (
        <>
          Live sandbox preview — real LLM calls
          {sessionId ? (
            <span className="text-muted-foreground"> · session {sessionId.slice(0, 8)}</span>
          ) : null}
        </>
      );
    }
    return (
      <>
        Live sandbox preview — mock agent, <strong>no API keys</strong>
        {sessionId ? (
          <span className="text-muted-foreground"> · session {sessionId.slice(0, 8)}</span>
        ) : null}
      </>
    );
  };

  return (
    <div className={cn('flex flex-col rounded-xl border overflow-hidden', className)}>
      {/* Banner */}
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
        <span>{bannerText()}</span>
      </div>

      {/* Messages / idle Try / key form */}
      <div className="flex-1 overflow-y-auto p-4 min-h-[280px] max-h-[420px]">
        {phase === 'idle' || phase === 'starting' ? (
          <div className="flex h-full min-h-[240px] items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center px-4">
              <Button
                type="button"
                size="lg"
                onClick={handleTry}
                disabled={!sandboxPreview || phase === 'starting'}
                className="gap-2"
              >
                <Play className="size-4" />
                {phase === 'starting' ? 'Starting sandbox…' : sessionError ? 'Retry' : 'Try'}
              </Button>
              <p className="text-xs text-muted-foreground max-w-[220px]">
                {needsKeys
                  ? 'Launches an isolated sandbox. You’ll be asked for an API key next.'
                  : 'Launches an isolated sandbox and opens the chat.'}
              </p>
            </div>
          </div>
        ) : phase === 'awaitingKeys' ? (
          <div className="flex h-full min-h-[240px] items-center justify-center">
            <form onSubmit={handleKeySubmit} className="flex w-full max-w-sm flex-col gap-4">
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm font-medium">
                  <KeyRound className="size-4" />
                  Connect your API key
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your key stays in browser memory for this tab only — it is not saved to disk or
                  localStorage. It is forwarded once to your local preview backend.
                </p>
              </div>

              {requiredEnv.map((key) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={`env-${key}`}>{envLabel(key)}</Label>
                  <div className="relative">
                    <Input
                      id={`env-${key}`}
                      type={showSecrets ? 'text' : 'password'}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      name={`secret-${key}`}
                      placeholder={key === 'OPENAI_API_KEY' ? 'sk-...' : key}
                      value={envValues[key] ?? ''}
                      onChange={(e) => setEnvValues((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecrets((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showSecrets ? 'Hide key' : 'Show key'}
                    >
                      {showSecrets ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2">
                <Button type="submit" className="flex-1">
                  Start live preview
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setPhase('idle');
                    setSessionError(null);
                    setEnvValues({});
                  }}
                >
                  Back
                </Button>
              </div>
            </form>
          </div>
        ) : (
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
        )}
      </div>

      {/* Input — always present so layout stays stable */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t bg-background px-3 py-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            sessionReady
              ? 'Type a message...'
              : phase === 'starting'
                ? 'Starting sandbox...'
                : 'Click Try to start the sandbox'
          }
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
