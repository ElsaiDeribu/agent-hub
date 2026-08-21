import { z } from "zod";

const evaluatorConfigSchema = z.object({
  type: z.string(),
  weight: z.number().min(0).default(1),
  config: z.record(z.string(), z.unknown()).optional().default({}),
});

const caseExpectedSchema = z
  .object({
    output: z.string().optional(),
    contains: z.array(z.string()).optional(),
    pattern: z.string().optional(),
    criteria: z.string().optional(),
  })
  .passthrough()
  .optional()
  .default({});

const evalCaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  input: z.record(z.string(), z.unknown()),
  expected: caseExpectedSchema,
  tags: z.array(z.string()).optional().default([]),
});

export const evalSuiteSchema = z.object({
  protocol: z.string().default("chat"),
  evalConfig: z.record(z.string(), z.unknown()).default({ timeoutMs: 30000 }),
  evaluators: z.array(evaluatorConfigSchema).default([]),
  cases: z.array(evalCaseSchema).default([]),
});

export type EvalSuite = z.infer<typeof evalSuiteSchema>;
