/**
 * AI evaluation quotas (each successful evaluate creates one EvaluationLog row).
 * Override via environment variables (integers, 0 = disabled only if you patch logic; min 1 recommended).
 */

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function getEvalLimits() {
  return {
    /** Max total AI evaluations for unpaid users (lifetime). */
    freeMaxEvaluationsTotal: readInt("EVAL_FREE_MAX_TOTAL", 2),
    /** Paid users: max evaluations in the last rolling hour. */
    paidMaxPerHour: readInt("EVAL_PAID_MAX_HOURLY", 2),
    /** Paid users: max evaluations in the last rolling 24 hours. */
    paidMaxPerDay: readInt("EVAL_PAID_MAX_DAILY", 20),
    /** Paid users: max evaluations in the current UTC calendar month. */
    paidMaxPerMonth: readInt("EVAL_PAID_MAX_MONTHLY", 100),
  };
}

export function hasActivePaidPlan(user: {
  isPaid: boolean;
  planExpiry: Date | null;
}): boolean {
  if (!user.isPaid) return false;
  if (!user.planExpiry) return true;
  return user.planExpiry > new Date();
}

export function startOfUtcMonth(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

/** First instant of the next UTC calendar month (when monthly eval quota resets). */
export function startOfNextUtcMonth(d = new Date()): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  return new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0));
}

/** Default when the client sends no (or invalid) IANA timezone — most users are India. */
export const DEFAULT_EVAL_LIMIT_TIME_ZONE = "Asia/Kolkata";

/**
 * Validate client-provided IANA id (e.g. from Intl.DateTimeFormat().resolvedOptions().timeZone).
 * Falls back to India if missing or invalid.
 */
export function resolveEvalLimitTimeZone(clientTz: string | undefined | null): string {
  const raw = typeof clientTz === "string" ? clientTz.trim().slice(0, 120) : "";
  if (!raw) return DEFAULT_EVAL_LIMIT_TIME_ZONE;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: raw }).format(new Date());
    return raw;
  } catch {
    return DEFAULT_EVAL_LIMIT_TIME_ZONE;
  }
}

/** Human-readable UTC timestamp (fallback if formatting in a zone fails). */
export function formatEvalLimitRefreshUtc(d: Date): string {
  return (
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d) + " UTC"
  );
}

/** Limit-reset time in the user's zone (already resolved via resolveEvalLimitTimeZone). */
export function formatEvalLimitRefresh(d: Date, ianaTimeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: ianaTimeZone,
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    }).format(d);
  } catch {
    return formatEvalLimitRefreshUtc(d);
  }
}
