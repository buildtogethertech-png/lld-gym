// ── PLAN CONFIG ──────────────────────────────────────────────────────────────
// Change prices, durations, or labels here — everything else updates automatically.

export interface Plan {
  id: string;
  label: string;
  price: number;        // INR
  amountPaise: number;  // price * 100
  months: number;       // access duration; 0 = lifetime
  perMonth: string;     // display string e.g. "₹99/mo"
  tag?: string;         // ribbon text, e.g. "RECOMMENDED"
}

export const PLANS: Plan[] = [
  {
    id: "onemonth",
    label: "1 Month",
    price: 299,
    amountPaise: 29900,
    months: 1,
    perMonth: "₹299/mo",
  },
  {
    id: "threemonth",
    label: "3 Months",
    price: 499,
    amountPaise: 49900,
    months: 3,
    perMonth: "₹166/mo",
    tag: "RECOMMENDED",
  },
  {
    id: "twelvemonth",
    label: "12 Months",
    price: 999,
    amountPaise: 99900,
    months: 12,
    perMonth: "₹83/mo",
  },
];

export const PLAN_MAP = Object.fromEntries(PLANS.map((p) => [p.id, p]));

/** Returns expiry Date for a plan (null if lifetime) */
export function getPlanExpiry(plan: Plan): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + plan.months);
  return d;
}
