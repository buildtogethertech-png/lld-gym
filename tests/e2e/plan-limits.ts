import type { APIRequestContext } from "@playwright/test";

export type MePlanLimits = {
  planSlug: string;
  umlDiagrams: number;
  /** Free-plan lifetime eval cap; null on paid tiers */
  evalTotal: number | null;
};

function parsePositiveEnvInt(name: string): number | null {
  const v = process.env[name];
  if (v === undefined || v === "") return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Reads effective plan limits for the logged-in session (same source as product UI).
 */
export async function fetchMePlanLimits(request: APIRequestContext): Promise<MePlanLimits> {
  const res = await request.get("/api/user/me");
  if (!res.ok()) {
    throw new Error(`/api/user/me failed: ${res.status()} ${await res.text()}`);
  }
  const j = (await res.json()) as Record<string, unknown>;
  if (typeof j.planSlug !== "string") throw new Error("planSlug missing from /api/user/me");
  const uml = j.umlDiagrams;
  const umlDiagrams = typeof uml === "number" && uml > 0 ? uml : 2;
  const et = j.evalTotal;
  const evalTotal = et === null || et === undefined ? null : typeof et === "number" ? et : null;
  return { planSlug: j.planSlug, umlDiagrams, evalTotal };
}

/**
 * How many times the free-tier journey should click "Evaluate with AI".
 * - Default **1** so CI/dev do not burn the whole free lifetime quota.
 * - Set `E2E_FREE_EVAL_UI_CLICKS=5` to exercise multiple clicks; still **capped** by `evalTotal` from DB.
 */
export function resolveFreeEvalUiClickCount(limits: MePlanLimits): number {
  const envWant = parsePositiveEnvInt("E2E_FREE_EVAL_UI_CLICKS");
  const desired = envWant ?? 1;
  if (limits.planSlug !== "free") return 1;
  const cap =
    limits.evalTotal != null && limits.evalTotal > 0 ? limits.evalTotal : 1;
  return Math.min(desired, cap);
}

/** Paid journey: single evaluate smoke (hourly/daily/monthly limits are separate). */
export function resolvePaidEvalUiClickCount(): number {
  const n = parsePositiveEnvInt("E2E_PAID_EVAL_UI_CLICKS");
  return n ?? 1;
}
