"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import UpgradeButton from "@/components/UpgradeButton";
import { PRICING_REVEALING_SOON } from "@/lib/pricing-visibility";

interface PlanData {
  id: string;
  slug: string;
  name: string;
  priceInr: number | null;
  originalPriceInr: number | null;
  discountPct: number | null;
  offerName: string | null;
  offerEndsAt: string | null;
  months: number | null;
  tag: string | null;
  features: string[];
  featureLabels: string[];
}

interface PlansResponse {
  plans: PlanData[];
}

function OfferCountdown({ endsAt }: { endsAt: string }) {
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, new Date(endsAt).getTime() - Date.now()));

  useEffect(() => {
    const update = () => setRemainingMs(Math.max(0, new Date(endsAt).getTime() - Date.now()));
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  if (remainingMs <= 0) return null;

  const totalSeconds = Math.floor(remainingMs / 1_000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const units = days > 0
    ? [[days, "days"], [hours, "hrs"], [minutes, "min"]]
    : [[hours, "hrs"], [minutes, "min"], [seconds, "sec"]];

  return (
    <div className="flex items-center justify-center gap-1.5 text-xs font-bold tabular-nums text-white">
      <span className="text-rose-200/75">Ends in</span>
      {units.map(([value, label]) => (
        <span key={label} className="rounded-md border border-white/15 bg-black/25 px-1.5 py-1">
          {String(value).padStart(2, "0")}<span className="ml-0.5 text-[10px] font-medium text-rose-100/70">{label}</span>
        </span>
      ))}
    </div>
  );
}

export default function PricingPage() {
  const { data: session } = useSession();
  const [isPaid, setIsPaid] = useState(false);
  const [planExpired, setPlanExpired] = useState(false);
  const [planName, setPlanName] = useState<string | null>(null);
  const [planExpiry, setPlanExpiry] = useState<string | null>(null);
  const [plansData, setPlansData] = useState<PlansResponse | null>(null);

  // Fetch plan configs (features, prices) — no auth required
  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((d: PlansResponse) => setPlansData(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (session) {
      fetch("/api/user/me", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          setIsPaid(!!d.isPaid);
          setPlanExpired(!!d.planExpired);
          setPlanName(d.planName ?? null);
          setPlanExpiry(d.planExpiry ?? null);
        });
    }
  }, [session]);

  if (isPaid) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔥</div>
          <h1 className="text-2xl font-bold mb-2">You have full access!</h1>
          <p className="text-gray-400 mb-6">
            {planName ?? "Pro"} plan
            {planExpiry && ` · expires ${new Date(planExpiry).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
          </p>
          <Link href="/" className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-3 rounded-xl text-sm transition-colors">
            Start Solving
          </Link>
        </div>
      </div>
    );
  }

  const plans = plansData?.plans ?? [];
  const activeOffer = plans.find((plan) => plan.offerName);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-3">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      <div className="mb-6 text-center">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-yellow-400">Practice with confidence</p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Unlock your complete LLD prep.</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-5 text-gray-400">AI-powered evaluations, interview-style feedback, and every problem in one place.</p>
        {activeOffer && (
          <div className="relative mx-auto mt-4 max-w-2xl overflow-hidden rounded-2xl border border-amber-300/30 bg-[#21180a] p-1 shadow-[0_18px_60px_rgba(245,158,11,0.16)]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.24),transparent_55%)]" />
            <div className="relative grid items-center gap-2 rounded-xl bg-[#171207]/80 px-4 py-3 text-left sm:grid-cols-[1fr_auto] sm:px-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">Live offer</p>
                <p className="mt-0.5 text-base font-bold text-white">{activeOffer.offerName} <span className="text-amber-300">· {activeOffer.discountPct}% OFF</span></p>
                <p className="mt-0.5 text-[11px] text-amber-100/65">Applied automatically to every paid plan.</p>
              </div>
              {activeOffer.offerEndsAt && <OfferCountdown endsAt={activeOffer.offerEndsAt} />}
            </div>
          </div>
        )}
        {planExpired && planExpiry && (
          <div className="mt-5 mx-auto max-w-md rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
            Your access ended on{" "}
            {new Date(planExpiry).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            . Renew below to unlock every problem and AI evaluation again.
          </div>
        )}
      </div>

      <div className="grid items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-[0.82fr_1fr_1fr_1fr]">
        {plans.map((plan) => {
          const isRecommended = !!plan.tag;
          const isFreeTier = plan.slug === "free" || plan.priceInr == null;
          const savings = plan.originalPriceInr && plan.priceInr
            ? plan.originalPriceInr - plan.priceInr
            : null;
          const canShowPerMonth =
            typeof plan.priceInr === "number" &&
            typeof plan.months === "number" &&
            plan.months > 0;
          const perMonth = canShowPerMonth
            ? `₹${Math.round(plan.priceInr! / plan.months!)}/mo`
            : null;
          const paidSubtitle =
            perMonth ?? (plan.months != null && plan.months > 0 ? `${plan.months}-month access` : "One-time");

          return (
            <div
              key={plan.id}
              className={`relative flex min-h-[320px] flex-col overflow-hidden rounded-2xl border p-4 transition-transform duration-200 hover:-translate-y-1 ${
                isRecommended
                  ? "border-amber-300 bg-[linear-gradient(155deg,rgba(95,68,8,0.48),rgba(25,22,12,1)_46%)] shadow-[0_20px_45px_rgba(234,179,8,0.14)]"
                  : isFreeTier
                    ? "border-gray-700 bg-[#121316]"
                    : "border-gray-700/90 bg-[#15161a] hover:border-gray-600"
              }`}
            >
              {isRecommended && (
                <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b-lg bg-amber-300 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-black shadow-lg">
                  {plan.tag}
                </div>
              )}
              {!isFreeTier && (
                <p className={`mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${isRecommended ? "mt-2 text-amber-300" : "text-gray-400"}`}>
                  {plan.name}
                </p>
              )}
              {PRICING_REVEALING_SOON ? (
                <>
                  <p className="text-xl font-bold mb-0.5 text-gray-200 tracking-tight">Revealing soon</p>
                  <p className="text-xs text-gray-500 mb-5">Price coming shortly</p>
                </>
              ) : isFreeTier ? (
                <>
                  <p className="text-3xl font-bold tracking-tight text-white">Free</p>
                  <p className="mb-4 mt-0.5 text-xs text-gray-500">Forever · no card required</p>
                </>
              ) : (
                <>
                  <div className="mb-1 flex items-end gap-2">
                    <p className="text-3xl font-bold tracking-tight text-white">₹{plan.priceInr}</p>
                    {plan.originalPriceInr && <p className="mb-0.5 text-xs text-gray-500 line-through">₹{plan.originalPriceInr}</p>}
                  </div>
                  <div className="mb-4 flex items-center gap-2">
                    {plan.discountPct && <span className="rounded-md border border-emerald-400/25 bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">SAVE {plan.discountPct}%</span>}
                    {savings && <span className="text-[11px] font-medium text-emerald-400">You save ₹{savings}</span>}
                  </div>
                  <p className="-mt-3 mb-4 text-[11px] text-gray-500">{paidSubtitle} · one-time payment</p>
                </>
              )}
              <div className="mb-3 h-px bg-white/[0.07]" />
              <ul className="mb-4 flex-1 space-y-1.5 text-xs text-gray-300">
                {plan.featureLabels.map((label) => (
                  <li key={label} className="flex items-start gap-1.5">
                    <span className="text-green-400 mt-px shrink-0">✓</span>
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
              {PRICING_REVEALING_SOON ? (
                <button
                  type="button"
                  disabled
                  className={`w-full font-bold py-2 rounded-xl text-xs cursor-not-allowed opacity-60 ${
                    isRecommended
                      ? "bg-yellow-400/40 text-black/80 border border-yellow-400/50"
                      : "bg-gray-800 text-gray-500 border border-gray-700"
                  }`}
                >
                  Pay — revealing soon
                </button>
              ) : isFreeTier ? (
                <div className="w-full text-center text-xs font-semibold text-green-400 py-2 border border-green-500/30 bg-green-500/5 rounded-xl">
                  ✓ Active
                </div>
              ) : (
                <UpgradeButton
                  planId={plan.id}
                  label={`Get ${plan.name}`}
                  className={`w-full rounded-xl py-2 text-xs font-bold transition-all disabled:opacity-50 ${
                    isRecommended
                      ? "bg-amber-300 text-black shadow-[0_8px_18px_rgba(245,158,11,0.18)] hover:bg-amber-200"
                      : "bg-[#38445a] text-white hover:bg-[#46536b]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <p className="mb-8 mt-4 text-center text-xs text-gray-500">
        Secure checkout via Razorpay · UPI, cards, net banking, wallets, EMI and pay later
      </p>

      <div className="border-t border-gray-800 pt-8 space-y-4">
        {[
          { q: "Do plans auto-renew?", a: "No. These are one-time payments. Access is valid for the plan duration with no auto-renewal." },
          { q: "Can I upgrade to a longer plan?", a: "Yes — buy a longer plan at any time. The new expiry will be set from today." },
          { q: "Can I get a refund?", a: "Yes, within 7 days if you've solved fewer than 5 problems." },
        ].map((faq) => (
          <div key={faq.q}>
            <p className="text-sm font-medium text-gray-300">{faq.q}</p>
            <p className="text-sm text-gray-500 mt-1">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
