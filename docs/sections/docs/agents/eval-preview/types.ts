export type EvalPhase = "idle" | "awaitingKeys" | "loading" | "running" | "completed" | "error";

export type ScoreKind = "quality" | "metric";

export interface EvalScoreResult {
  evaluator: string;
  passed: boolean;
  score: number;
  reason: string;
  details?: Record<string, unknown> | null;
  kind?: ScoreKind;
}

export interface CaseExpected {
  output?: string;
  contains?: string[];
  pattern?: string;
  criteria?: string;
  [key: string]: unknown;
}

export interface EvalCaseResult {
  case_id: string;
  case_name: string;
  passed: boolean;
  score: number;
  input?: Record<string, unknown> | null;
  output?: string | null;
  expected?: CaseExpected | null;
  transcript?: Array<{ role: string; content: string }> | null;
  latency_ms?: number | null;
  error?: string | null;
  scores: EvalScoreResult[];
}

export interface EvalCase {
  id: string;
  name: string;
  input: Record<string, unknown>;
  expected: CaseExpected;
  tags: string[];
}

export interface EvaluatorConfig {
  type: string;
  weight: number;
  config?: Record<string, unknown>;
}

export type { EvalSuite } from "@/lib/eval-schema";

export interface EvalRunSummary {
  total_cases: number;
  passed: number;
  failed: number;
  avg_score: number;
  elapsed_ms?: number;
}

export type EvalStreamEvent =
  | { type: "case_start"; data: { case_id: string; case_name: string; index: number } }
  | { type: "case_result"; data: EvalCaseResult }
  | { type: "suite_complete"; data: EvalRunSummary }
  | { type: "error"; data: { message: string; [k: string]: unknown } };

export interface EvalPreviewProps {
  agentName: string;
  framework: string;
  requiredEnv?: string[];
  sandboxPreview?: boolean;
  className?: string;
}
