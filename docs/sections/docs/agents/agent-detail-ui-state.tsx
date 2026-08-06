"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type AgentDetailUiState = {
  tabByAgent: Record<string, string>;
  setTabByAgent: Dispatch<SetStateAction<Record<string, string>>>;
  frameworkByAgent: Record<string, string>;
  setFrameworkByAgent: Dispatch<SetStateAction<Record<string, string>>>;
  activeFileByKey: Record<string, string>;
  setActiveFileByKey: Dispatch<SetStateAction<Record<string, string>>>;
};

const AgentDetailUiStateContext = createContext<AgentDetailUiState | null>(null);

/** Survives Next.js remounts when navigating between /docs/agents/:name. */
export function AgentDetailUiStateProvider({ children }: { children: ReactNode }) {
  const [tabByAgent, setTabByAgent] = useState<Record<string, string>>({});
  const [frameworkByAgent, setFrameworkByAgent] = useState<Record<string, string>>({});
  const [activeFileByKey, setActiveFileByKey] = useState<Record<string, string>>({});

  return (
    <AgentDetailUiStateContext.Provider
      value={{
        tabByAgent,
        setTabByAgent,
        frameworkByAgent,
        setFrameworkByAgent,
        activeFileByKey,
        setActiveFileByKey,
      }}
    >
      {children}
    </AgentDetailUiStateContext.Provider>
  );
}

export function useAgentDetailUiState() {
  const ctx = useContext(AgentDetailUiStateContext);
  if (!ctx) {
    throw new Error("useAgentDetailUiState must be used within AgentDetailUiStateProvider");
  }
  return ctx;
}
