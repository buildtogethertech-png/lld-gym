"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PLAN_MAP } from "@/lib/plans";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  /** Enable payment rails (also turn on in Razorpay Dashboard → Payment methods). */
  method?: {
    upi?: boolean;
    card?: boolean;
    netbanking?: boolean;
    wallet?: boolean;
    emi?: boolean;
    paylater?: boolean;
  };
  config?: {
    display?: {
      blocks?: Record<string, unknown>;
      sequence?: string[];
      preferences?: { show_default_blocks?: boolean };
    };
  };
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}
interface RazorpayInstance { open(): void; }

interface Props {
  className?: string;
  label?: string;
  planId?: string;  // any key from PLAN_MAP e.g. "onemonth" | "threemonth" | "twelvemonth"
  onSuccess?: () => void;
}

export default function UpgradeButton({ className, label, planId = "twelvemonth", onSuccess }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const plan = PLAN_MAP[planId];
  const defaultLabel = plan ? `Get ${plan.label} — ₹${plan.price}` : "Unlock Access";

  async function handlePayment() {
    if (!session) { router.push("/login"); return; }
    setLoading(true);

    if (!window.Razorpay) {
      await new Promise<void>((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        document.body.appendChild(script);
      });
    }

    const orderRes = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId }),
    });
    if (!orderRes.ok) {
      const err = await orderRes.json();
      alert(err.error ?? "Failed to create order");
      setLoading(false);
      return;
    }
    const { orderId, amount, currency } = await orderRes.json();

    const rzp = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount,
      currency,
      name: "LLD Gym",
      description: plan?.label ?? "Access",
      order_id: orderId,
      prefill: { name: session.user?.name ?? "", email: session.user?.email ?? "" },
      theme: { color: "#FACC15" },
      // All Standard Checkout rails; actual options still depend on Dashboard + account approval.
      method: {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true,
        emi: true,
        paylater: true,
      },
      config: {
        display: {
          preferences: { show_default_blocks: true },
        },
      },
      handler: async (response) => {
        try {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ ...response, plan: planId }),
          });
          const data = (await verifyRes.json().catch(() => ({}))) as { error?: string };
          if (verifyRes.ok) {
            onSuccess?.();
            router.refresh();
            window.location.reload();
            return;
          }
          alert(
            data.error ??
              "Payment verification failed. If Razorpay shows success, your server keys may not match (test vs live, or wrong secret)."
          );
        } catch {
          alert("Could not reach the server to verify payment. Check your connection and try again.");
        }
      },
      modal: { ondismiss: () => setLoading(false) },
    });

    rzp.open();
    setLoading(false);
  }

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className={className ?? "w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold py-3 rounded-xl text-sm transition-all"}
    >
      {loading ? "Loading…" : (label ?? defaultLabel)}
    </button>
  );
}
