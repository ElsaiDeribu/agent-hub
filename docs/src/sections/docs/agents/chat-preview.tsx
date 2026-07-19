import { cn } from '@/lib/utils';
import { Zap, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRef, useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Mock response logic
// ---------------------------------------------------------------------------
function getInitialMessage(agentName: string): string {
  const map: Record<string, string> = {
    'customer-support':
      "Hi! I'm your customer support agent 👋\nI can help with orders, account access, refunds, and more. What can I assist you with today?",
    'code-reviewer':
      "Hello! I'm your code reviewer 🔍\nPaste a code snippet or describe what you'd like me to review. I'll check for bugs, security issues, and performance problems.",
    'research-assistant':
      "Hi! I'm your research assistant 🔎\nGive me a topic and I'll search the web and synthesize findings for you. What would you like to research?",
  };
  return map[agentName] ?? 'Hello! How can I help you today?';
}

function getMockResponse(agentName: string, message: string): string {
  const msg = message.toLowerCase();

  if (agentName === 'customer-support') {
    if (msg.includes('order') || msg.match(/#\d+/)) {
      return '**Looking up your order...**\n\nI found your order details:\n- **Status:** Shipped ✅\n- **Carrier:** FedEx\n- **Tracking:** FX123456789\n- **ETA:** 2 business days\n\nYou can track it at fedex.com. Is there anything else I can help you with?';
    }
    if (msg.includes('refund') || msg.includes('return')) {
      return "I can help you with a refund. To get started, I'll need:\n1. Your **order number**\n2. The **reason** for the refund (damaged, wrong item, etc.)\n\nOnce you provide those, I can initiate the refund process right away.";
    }
    if (
      msg.includes('login') ||
      msg.includes('account') ||
      msg.includes('password') ||
      msg.includes("can't log")
    ) {
      return "I'll help you regain access to your account. \n\nCould you provide the **email address** associated with your account? I'll look up the account and send you a secure reset link.";
    }
    if (msg.includes('damaged') || msg.includes('broken') || msg.includes('defective')) {
      return "I'm sorry to hear your item arrived damaged! 😔\n\nI can help you with a **replacement** or **refund**. Please share your order number and I'll get this sorted for you right away. No need to return the damaged item.";
    }
    return "I'd be happy to help! Could you provide more details? If your question is about a specific order, sharing the **order number** would help me assist you faster.";
  }

  if (agentName === 'code-reviewer') {
    const hasCode =
      msg.includes('```') ||
      msg.includes('function') ||
      msg.includes('const ') ||
      msg.includes('let ') ||
      msg.includes('for ') ||
      msg.includes('select ') ||
      msg.includes('eval(');
    if (hasCode || msg.length > 30) {
      return '**Code Review** 🔍\n\n**Overall:** Minor issues found\n\n**Issues:**\n1. 🔴 **Security:** Potential injection vulnerability\n   `eval(userInput)` is dangerous; never execute user-supplied strings\n   *Fix:* Use a safe alternative or validate/sanitize the input strictly\n\n2. 🟡 **Bug:** Off-by-one error risk\n   `i <= arr.length` should be `i < arr.length` (array is 0-indexed)\n   *Fix:* Change `<=` to `<`\n\n**Positives:**\n✅ Code is readable and well-structured\n✅ Logic flow is clear\n\n*This is a simulated review. Connect the backend to run real analysis.*';
    }
    return "Please paste the code you'd like me to review. You can use:\n```typescript\n// your code here\n```\nOr just paste it inline. I'll check for bugs, security issues, performance problems, and style.";
  }

  if (agentName === 'research-assistant') {
    return `**Research: ${message}** 🔎\n\n**Summary:** This is an active area of development with significant momentum in 2024-2025.\n\n**Key Findings:**\n- Multiple competing frameworks have emerged, each with distinct trade-offs\n- TypeScript-native approaches are gaining traction for type safety\n- Streaming and multi-step agent patterns are now standard\n\n**Notable Frameworks Comparison:**\n| Framework | Strength | Best For |\n|-----------|----------|----------|\n| LangChain.js | Ecosystem | General purpose |\n| Mastra | TypeScript DX | TS-first projects |\n| Vercel AI SDK | Streaming | Next.js apps |\n\n**Further Reading:**\n- [LangChain docs](https://js.langchain.com)\n- [Mastra docs](https://mastra.ai)\n- [Vercel AI SDK](https://sdk.vercel.ai)\n\n*Simulated response. Connect a real search backend for live results.*`;
  }

  return 'This is a simulated response. Connect a backend API (Phase 3) to run live agent responses with real tool calls.';
}

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
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ChatPreview({ agentName, starterMessages, className }: ChatPreviewProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: getInitialMessage(agentName) },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [startersUsed, setStartersUsed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Reset chat when agent changes
  useEffect(() => {
    setMessages([{ role: 'assistant', content: getInitialMessage(agentName) }]);
    setStartersUsed(false);
    setInput('');
    setIsTyping(false);
  }, [agentName]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setStartersUsed(true);
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));

    const response = getMockResponse(agentName, text);
    setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    setIsTyping(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className={cn('flex flex-col rounded-xl border overflow-hidden', className)}>
      {/* Banner */}
      <div className="flex items-center gap-2 border-b bg-amber-500/5 px-4 py-2 text-xs text-amber-600 dark:text-amber-400">
        <Zap className="size-3 shrink-0" />
        <span>
          Live preview: responses are <strong>simulated</strong>. Connect a backend to run real
          agent calls.
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 max-h-[420px]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
          >
            {/* Avatar */}
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

            {/* Bubble */}
            <div
              className={cn(
                'rounded-2xl px-3.5 py-2.5 max-w-[80%]',
                msg.role === 'assistant'
                  ? 'bg-muted text-foreground rounded-tl-sm'
                  : 'bg-primary text-primary-foreground rounded-tr-sm'
              )}
            >
              {msg.role === 'assistant' ? (
                <MarkdownText content={msg.content} />
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
              AI
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-1.5 rounded-full bg-muted-foreground animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Starter message chips */}
        {!startersUsed && starterMessages.length > 0 && !isTyping && (
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
          placeholder="Type a message..."
          disabled={isTyping}
          className="flex-1 border-0 bg-muted/50 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button type="submit" size="icon" disabled={!input.trim() || isTyping} className="shrink-0">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
