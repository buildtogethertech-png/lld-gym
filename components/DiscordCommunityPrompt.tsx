"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const DISCORD_URL = "https://discord.gg/eGfYx8YHy";
const SKIP_PATHS = ["/login", "/register", "/unsubscribe"];
const BLOG_PROMPT_DELAY_MS = 45_000;

export default function DiscordCommunityPrompt() {
  const { status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const checkPrompt = useCallback(async () => {
    if (status !== "authenticated") return;
    if (SKIP_PATHS.some((path) => pathname.startsWith(path))) return;

    try {
      const response = await fetch("/api/user/discord-community", { cache: "no-store" });
      const data = response.ok ? await response.json() : null;
      setOpen(Boolean(data?.shouldShow));
    } catch {
      setOpen(false);
    }
  }, [pathname, status]);

  useEffect(() => {
    if (pathname.startsWith("/blog/")) {
      const timer = window.setTimeout(() => void checkPrompt(), BLOG_PROMPT_DELAY_MS);
      return () => window.clearTimeout(timer);
    }

    void checkPrompt();
  }, [checkPrompt, pathname]);

  useEffect(() => {
    window.addEventListener("phone-saved", checkPrompt);
    return () => window.removeEventListener("phone-saved", checkPrompt);
  }, [checkPrompt]);

  async function respond(action: "joined" | "not_joined") {
    setSaving(true);
    try {
      const response = await fetch("/api/user/discord-community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (response.ok) setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#05070d]/80 p-4 backdrop-blur-md sm:items-center">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-[#5865f2]/25 bg-[#11131d] shadow-[0_32px_100px_rgba(0,0,0,0.65)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(88,101,242,0.34),transparent_70%)]" />
        <div className="relative px-6 pb-6 pt-7 sm:px-8 sm:pb-8 sm:pt-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5865f2] shadow-[0_12px_30px_rgba(88,101,242,0.4)]">
            <svg aria-hidden="true" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.54 4.54A16.45 16.45 0 0 0 15.5 3.3l-.5 1a15.25 15.25 0 0 0-6 0l-.5-1a16.36 16.36 0 0 0-4.05 1.25C1.9 8.35 1.2 12.06 1.55 15.72a16.59 16.59 0 0 0 4.97 2.5l1.2-1.62a9.55 9.55 0 0 1-1.88-.9l.45-.35c3.63 1.67 7.77 1.67 11.36 0l.45.35c-.6.35-1.23.65-1.88.9l1.2 1.62a16.46 16.46 0 0 0 4.98-2.5c.42-4.24-.72-7.92-2.86-11.18ZM8.85 13.47c-1.1 0-2-1-2-2.24s.88-2.24 2-2.24c1.12 0 2.02 1 2 2.24 0 1.24-.88 2.24-2 2.24Zm6.3 0c-1.1 0-2-1-2-2.24s.88-2.24 2-2.24c1.12 0 2.02 1 2 2.24 0 1.24-.88 2.24-2 2.24Z" />
            </svg>
          </div>

          <div className="mx-auto mt-5 max-w-sm text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9da6ff]">LLDHub Community</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-[28px]">
              Don&apos;t prepare for interviews alone.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#a6a9b8]">
              Meet software engineers who are solving the same LLD problems, sharing approaches, and helping each other get interview-ready.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2.5 text-center">
            {[
              ["💬", "Discuss", "designs together"],
              ["🔍", "Get feedback", "on your approach"],
              ["🎯", "Practice", "for interviews"],
            ].map(([icon, title, detail]) => (
              <div key={title} className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-2 py-3">
                <div className="text-base">{icon}</div>
                <p className="mt-1.5 text-xs font-semibold text-[#e6e7ec]">{title}</p>
                <p className="mt-0.5 text-[10px] leading-4 text-[#7f8495]">{detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2.5">
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => void respond("joined")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865f2] py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(88,101,242,0.28)] transition-all hover:-translate-y-px hover:bg-[#6874f5]"
          >
            Join the Discord community
            <span aria-hidden="true">↗</span>
          </a>
          <button
            onClick={() => void respond("not_joined")}
            disabled={saving}
            className="w-full py-2 text-xs font-medium text-[#858a9d] transition-colors hover:text-white disabled:opacity-50"
          >
            Not now — remind me tomorrow
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
