import { prisma } from "./prisma";
import type { PlanConfig } from "@prisma/client";

// ── Defaults if DB rows are missing ───────────────────────────────────────────
const FREE_FALLBACK: Omit<PlanConfig, "id" | "updatedAt"> = {
  slug: "free",
  name: "Free",
  evalTotal: 2,
  evalHourly: null,
  evalDaily: null,
  evalMonthly: null,
  umlDiagrams: 2,
  noteMaxLength: 8000,
  problemsCount: 5,
  features: [],
  badge: "FREE",
  priceInr: null,
  months: null,
  tag: null,
  active: true,
};

const PAID_FALLBACK: Omit<PlanConfig, "id" | "updatedAt"> = {
  slug: "paid",
  name: "Pro",
  evalTotal: null,
  evalHourly: 2,
  evalDaily: 20,
  evalMonthly: 100,
  umlDiagrams: 100,
  noteMaxLength: 8000,
  problemsCount: null,
  features: [],
  badge: "PRO",
  priceInr: 499,
  months: 3,
  tag: "RECOMMENDED",
  active: true,
};

let _free: PlanConfig | null = null;
let _paid: PlanConfig | null = null;

export async function getFreePlan(): Promise<PlanConfig> {
  if (!_free) {
    _free = await prisma.planConfig.findUnique({ where: { slug: "free" } });
  }
  return _free ?? ({ id: "free-fallback", updatedAt: new Date(), ...FREE_FALLBACK } as PlanConfig);
}

export async function getPaidPlan(): Promise<PlanConfig> {
  if (!_paid) {
    _paid = await prisma.planConfig.findUnique({ where: { slug: "paid" } });
  }
  return _paid ?? ({ id: "paid-fallback", updatedAt: new Date(), ...PAID_FALLBACK } as PlanConfig);
}

/**
 * Effective plan for a user. If paid access has expired, treat as free.
 */
export async function getEffectivePlan(user: {
  planId: string | null;
  planExpiry: Date | null;
  isPaid: boolean;
}): Promise<PlanConfig> {
  const isPlanActive =
    user.isPaid &&
    user.planId !== null &&
    (user.planExpiry === null || user.planExpiry > new Date());

  if (!isPlanActive) return getFreePlan();

  const plan = await prisma.planConfig.findUnique({ where: { id: user.planId! } });
  if (plan) return plan;

  return getPaidPlan();
}

export function invalidatePlanCache() {
  _free = null;
  _paid = null;
}
