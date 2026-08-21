"use client";

import { useCallback, useRef, useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { paths } from "@/routes/paths";
import { useAuthContext } from "@/auth/hooks";
import { fetchEvalSuite, streamEvalRun } from "@/lib/eval-api";

import type {
  EvalPhase,
  EvalSuite,
  EvalCaseResult,
  EvalRunSummary,
  EvalStreamEvent,
} from "./types";

interface UseEvalRunnerOptions {
  agentName: string;
  framework: string;
  requiredEnv: string[];
  sandboxPreview: boolean;
}

export function useEvalRunner({
  agentName,
  framework,
  requiredEnv,
  sandboxPreview,
}: UseEvalRunnerOptions) {
  const router = useRouter();
  const { authenticated, loading: authLoading } = useAuthContext();
  const needsKeys = requiredEnv.length > 0;

  const [phase, setPhase] = useState<EvalPhase>("idle");
  const [suite, setSuite] = useState<EvalSuite | null>(null);
  const [suiteError, setSuiteError] = useState<string | null>(
    sandboxPreview ? null : "This agent does not have eval support yet.",
  );
  const [results, setResults] = useState<EvalCaseResult[]>([]);
  const [runSummary, setRunSummary] = useState<EvalRunSummary | null>(null);
  const [runningCaseId, setRunningCaseId] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [envValues, setEnvValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Load eval suite on mount
  useEffect(() => {
    if (!sandboxPreview) return;
    let cancelled = false;

    setPhase("loading");
    setSuiteError(null);

    fetchEvalSuite(agentName, framework)
      .then((data) => {
        if (cancelled) return;
        setSuite(data);
        setPhase("idle");
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setSuiteError(msg);
        setPhase("error");
      });

    return () => {
      cancelled = true;
    };
  }, [agentName, framework, sandboxPreview]);

  const requireAuth = useCallback(() => {
    if (authLoading) return false;
    if (authenticated) return true;
    router.push(paths.auth.signIn);
    return false;
  }, [authLoading, authenticated, router]);

  const runEval = useCallback(
    async (env: Record<string, string> = {}) => {
      if (!requireAuth()) return;
      if (!suite) return;

      setPhase("running");
      setSuiteError(null);
      setResults([]);
      setRunSummary(null);
      setCompletedCount(0);
      setRunningCaseId(null);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamEvalRun(
          agentName,
          framework,
          suite,
          env,
          (event: EvalStreamEvent) => {
            switch (event.type) {
              case "case_start":
                setRunningCaseId(event.data.case_id);
                break;
              case "case_result":
                setResults((prev) => [...prev, event.data]);
                setCompletedCount((prev) => prev + 1);
                setRunningCaseId(null);
                break;
              case "suite_complete":
                setRunSummary(event.data);
                setPhase("completed");
                break;
              case "error":
                setSuiteError(event.data.message);
                setPhase("error");
                break;
            }
          },
          controller.signal,
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const msg = err instanceof Error ? err.message : String(err);
        setSuiteError(msg);
        setPhase("error");
      }
    },
    [agentName, framework, suite, requireAuth],
  );

  const handleRun = useCallback(() => {
    if (!sandboxPreview || phase === "running") return;
    if (!requireAuth()) return;
    setSuiteError(null);
    if (needsKeys) {
      setPhase("awaitingKeys");
      return;
    }
    void runEval({});
  }, [sandboxPreview, phase, requireAuth, needsKeys, runEval]);

  const handleKeySubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const next: Record<string, string> = {};
      for (const key of requiredEnv) {
        const value = (envValues[key] ?? "").trim();
        if (!value) {
          setSuiteError(`${key} is required.`);
          return;
        }
        next[key] = value;
      }
      void runEval(next);
    },
    [requiredEnv, envValues, runEval],
  );

  const handleKeyBack = useCallback(() => {
    setPhase("idle");
    setSuiteError(null);
    setEnvValues({});
  }, []);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setPhase("idle");
    setRunningCaseId(null);
  }, []);

  const handleReset = useCallback(() => {
    setPhase("idle");
    setResults([]);
    setRunSummary(null);
    setRunningCaseId(null);
    setCompletedCount(0);
    setSuiteError(null);
  }, []);

  return {
    phase,
    suite,
    suiteError,
    results,
    runSummary,
    runningCaseId,
    completedCount,
    envValues,
    setEnvValues,
    showSecrets,
    setShowSecrets,
    needsKeys,
    authenticated,
    authLoading,
    handleRun,
    handleKeySubmit,
    handleKeyBack,
    handleCancel,
    handleReset,
  };
}
