"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

type Offer = { name: string; discountPct: number; endsAt: string };

export default function FreeUserOfferBanner() {
  const { status } = useSession();
  const pathname = usePathname();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (status !== "authenticated" || pathname === "/pricing") {
      setOffer(null);
      return;
    }

    let cancelled = false;
    setOffer(null);
    Promise.all([
      fetch("/api/user/me", { cache: "no-store" }).then((response) => response.ok ? response.json() : null),
      fetch("/api/offers/active", { cache: "no-store" }).then((response) => response.ok ? response.json() : null),
    ]).then(([user, offerData]) => {
      if (!cancelled && user && !user.isPaid) setOffer(offerData?.offer ?? null);
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [pathname, status]);

  useEffect(() => {
    if (!offer) return;

    const update = () => setRemainingMs(Math.max(0, new Date(offer.endsAt).getTime() - Date.now()));
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, [offer]);

  if (!offer) return null;

  const totalSeconds = Math.floor(remainingMs / 1_000);
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const timeLeft = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="sticky top-14 z-[9] border-b border-yellow-400/25 bg-[linear-gradient(90deg,#15130b_0%,#28210b_50%,#15130b_100%)] px-3 py-1.5 shadow-[0_6px_16px_rgba(0,0,0,0.28)]">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs sm:text-sm">
        <span className="rounded-full border border-yellow-400/25 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-yellow-300">Live sale</span>
        <span className="font-bold text-gray-100">🔥 {offer.name}</span>
        <span className="font-extrabold text-yellow-300">{offer.discountPct}% OFF</span>
        <span className="hidden text-yellow-100/25 sm:inline">|</span>
        <span className="text-gray-400">Ends in</span>
        <span className="rounded-md border border-yellow-400/20 bg-black/30 px-1.5 py-0.5 font-mono text-xs font-bold tracking-wide text-yellow-100">{timeLeft}</span>
        <Link href="/pricing" className="ml-1 rounded-md bg-yellow-400 px-2 py-1 text-[11px] font-extrabold text-black transition-colors hover:bg-yellow-300">
          Claim offer →
        </Link>
      </div>
    </div>
  );
}
