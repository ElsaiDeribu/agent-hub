import { getFileUrl } from "@/data/registry-shared";
import { HOST_API } from "@/lib/config";
import { evalSuiteSchema, type EvalSuite } from "@/lib/eval-schema";

import type { EvalStreamEvent } from "@/sections/docs/agents/eval-preview/types";

const SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function safeSlug(value: string, label: string): string {
  if (!SLUG_RE.test(value)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
  return value;
}

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: string | { msg?: string }[] };
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((d) => d.msg ?? JSON.stringify(d)).join("; ");
    }
    return res.statusText || `HTTP ${res.status}`;
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

async function fetchRegistryJson(path: string): Promise<unknown | null> {
  const res = await fetch(getFileUrl(path));
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchEvalSuite(
  agentId: string,
  framework: string,
): Promise<EvalSuite> {
  const agent = safeSlug(agentId, "agent id");
  const fw = safeSlug(framework, "framework");

  const candidates = [
    `registry/${agent}/${fw}/eval.json`,
    `registry/${agent}/eval.json`,
  ];

  let data: unknown | null = null;
  for (const path of candidates) {
    data = await fetchRegistryJson(path);
    if (data !== null) break;
  }

  if (data === null) {
    throw new Error(
      `No eval.json found for agent '${agent}' (tried ${candidates.join(" and ")})`,
    );
  }

  const parsed = evalSuiteSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid eval.json: ${parsed.error.message}`);
  }

  return parsed.data;
}

export async function streamEvalRun(
  agentId: string,
  framework: string,
  suite: EvalSuite,
  env: Record<string, string> = {},
  onEvent: (event: EvalStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(
    `${HOST_API}/evals/${encodeURIComponent(agentId)}/${encodeURIComponent(framework)}/run`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ suite, env }),
      signal,
    },
  );

  if (!res.ok) throw new Error(await readError(res));
  if (!res.body) throw new Error("No response body from eval endpoint");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      for (const line of part.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload) continue;
        try {
          const event = JSON.parse(payload) as EvalStreamEvent;
          onEvent(event);
        } catch {
          // ignore malformed frames
        }
      }
    }
  }
}
