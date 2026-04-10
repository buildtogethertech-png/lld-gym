"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import UpgradeButton from "@/components/UpgradeButton";
import { PLANS } from "@/lib/plans";
import { PRICING_REVEALING_SOON } from "@/lib/pricing-visibility";

const FREE_LIMIT = parseInt(process.env.NEXT_PUBLIC_FREE_PROBLEM_LIMIT ?? "5");

export default function PricingPage() {
  const { data: session } = useSession();
  const [isPaid, setIsPaid] = useState(false);
  const [planExpired, setPlanExpired] = useState(false);
  const [planName, setPlanName] = useState<string | null>(null);
  const [planExpiry, setPlanExpiry] = useState<string | null>(null);

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
    } else {
      setPlanExpired(false);
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Unlock LLD Hub</h1>
        <p className="text-gray-400">AI-powered evaluation. Real interview feedback. All problems.</p>
        {PRICING_REVEALING_SOON && (
          <div className="mt-5 mx-auto max-w-lg rounded-xl border border-yellow-400/30 bg-yellow-400/5 px-4 py-3 text-sm text-yellow-100/90">
            Paid plan prices are <span className="font-semibold text-yellow-300">revealing soon</span> — we&apos;re finalizing tiers. Free problems stay available; check back shortly for checkout.
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

      {/* Free + paid plans side by side */}
      <div className="grid grid-cols-4 gap-3 mb-8">

        {/* Free tier */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-1">Free</p>
          <p className="text-2xl font-bold mb-0.5">₹0</p>
          <p className="text-xs text-gray-600 mb-4">forever</p>
          <ul className="space-y-1.5 text-xs text-gray-500 mb-5">
            <li className="flex items-center gap-1.5"><span className="text-green-400">✓</span>{FREE_LIMIT} problems</li>
            <li className="flex items-center gap-1.5"><span className="text-red-500">✗</span>AI evaluation</li>
            <li className="flex items-center gap-1.5"><span className="text-red-500">✗</span>All problems</li>
            <li className="flex items-center gap-1.5"><span className="text-red-500">✗</span>Score history</li>
          </ul>
          <div className="w-full text-center text-xs text-gray-600 py-2 border border-gray-800 rounded-lg">
            Current plan
          </div>
        </div>

        {/* Paid plans — driven by PLANS config */}
        {PLANS.map((plan) => {
          const isRecommended = !!plan.tag;
          return (
            <div
              key={plan.id}
              className={`rounded-xl p-4 relative flex flex-col ${
                isRecommended
                  ? "bg-yellow-400/5 border-2 border-yellow-400"
                  : "bg-[#161616] border border-gray-700"
              }`}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  {plan.tag}
                </div>
              )}
              <p className={`text-xs font-semibold mb-1 ${isRecommended ? "text-yellow-400" : "text-gray-300"}`}>
                {plan.label}
              </p>
              {PRICING_REVEALING_SOON ? (
                <>
                  <p className="text-xl font-bold mb-0.5 text-gray-200 tracking-tight">Revealing soon</p>
                  <p className="text-xs text-gray-500 mb-4">Price coming shortly</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold mb-0.5">₹{plan.price}</p>
                  <p className="text-xs text-gray-500 mb-4">{plan.perMonth}</p>
                </>
              )}
              <ul className="space-y-1.5 text-xs text-gray-300 mb-5 flex-1">
                <li className="flex items-center gap-1.5"><span className="text-green-400">✓</span>All problems</li>
                <li className="flex items-center gap-1.5"><span className="text-green-400">✓</span>AI evaluation</li>
                <li className="flex items-center gap-1.5"><span className="text-green-400">✓</span>Score history</li>
                <li className="flex items-center gap-1.5"><span className="text-green-400">✓</span>{plan.months}-month access</li>
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
              ) : (
                <UpgradeButton
                  planId={plan.id}
                  label={`Get ${plan.label}`}
                  className={`w-full font-bold py-2 rounded-xl text-xs transition-all disabled:opacity-50 ${
                    isRecommended
                      ? "bg-yellow-400 hover:bg-yellow-300 text-black"
                      : "bg-gray-700 hover:bg-gray-600 text-white"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-600 mb-10">
        Secure payment via Razorpay · UPI, cards, net banking, wallets, EMI and pay later (where enabled on your account)
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
