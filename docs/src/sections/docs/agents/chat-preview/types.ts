export type Message = { role: 'user' | 'assistant'; content: string };
export type Phase = 'idle' | 'awaitingKeys' | 'starting' | 'ready';

export interface ChatPreviewProps {
  agentName: string;
  framework: string;
  welcomeMessage?: string;
  starterMessages: string[];
  requiredEnv?: string[];
  sandboxPreview?: boolean;
  className?: string;
}
