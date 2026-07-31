import { useRef, useState, useEffect, type FormEvent } from 'react';
import { streamChat, createSession, deleteSession } from '@/lib/sandbox-api';

import { envLabel, DEFAULT_WELCOME_MESSAGE } from './copy';

import type { Phase, Message } from './types';

interface UseSandboxChatOptions {
  agentName: string;
  framework: string;
  welcomeMessage?: string;
  requiredEnv: string[];
  sandboxPreview: boolean;
}

export function useSandboxChat({
  agentName,
  framework,
  welcomeMessage,
  requiredEnv,
  sandboxPreview,
}: UseSandboxChatOptions) {
  const needsKeys = requiredEnv.length > 0;
  const requiredEnvKey = requiredEnv.join('|');
  const initialMessage = welcomeMessage?.trim() || DEFAULT_WELCOME_MESSAGE;

  const [phase, setPhase] = useState<Phase>('idle');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: initialMessage },
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
    setMessages([{ role: 'assistant', content: initialMessage }]);
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
  }, [agentName, framework, initialMessage, sandboxPreview, requiredEnvKey]);

  const startSandbox = async (env: Record<string, string> = {}) => {
    const generation = ++startGenerationRef.current;
    setPhase('starting');
    setSessionError(null);

    try {
      const created = await createSession(agentName, framework, env);
      if (generation !== startGenerationRef.current) {
        await deleteSession(created.session_id).catch(() => undefined);
        return;
      }
      sessionIdRef.current = created.session_id;
      setSessionId(created.session_id);
      setPhase('ready');
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

  const handleTry = () => {
    if (!sandboxPreview || phase === 'starting') return;
    setSessionError(null);
    if (needsKeys) {
      setPhase('awaitingKeys');
      return;
    }
    void startSandbox({});
  };

  const handleKeySubmit = (e: FormEvent) => {
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

  const handleKeyBack = () => {
    setPhase('idle');
    setSessionError(null);
    setEnvValues({});
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const sessionReady = phase === 'ready';
  const busy = isTyping || phase === 'starting' || !sessionReady;
  const livePreview = needsKeys && sessionReady;

  return {
    phase,
    messages,
    input,
    setInput,
    isTyping,
    startersUsed,
    sessionId,
    sessionError,
    envValues,
    setEnvValues,
    showSecrets,
    setShowSecrets,
    bottomRef,
    needsKeys,
    sessionReady,
    busy,
    livePreview,
    handleTry,
    handleKeySubmit,
    handleKeyBack,
    handleSubmit,
    sendMessage,
  };
}
