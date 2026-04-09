"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const TYPES = [
  { id: "bug",     label: "🐛 Bug Report" },
  { id: "feature", label: "✨ Feature Request" },
  { id: "other",   label: "💬 Other" },
];

const MAX = 2000;

export default function FeedbackButton() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("feature");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (pathname.startsWith("/problem/")) return null;

  async function submit() {
    if (!message.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
        setMessage("");
        setType("feature");
      }, 2000);
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-200 hover:text-white text-xs font-medium px-3.5 py-2 rounded-full shadow-lg transition-all"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        Feedback
      </button>

      {/* Modal backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-md bg-[#161616] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div>
                <p className="font-semibold text-gray-100 text-sm">Send Feedback</p>
                {session?.user && (
                  <p className="text-xs text-gray-600 mt-0.5">
                    as {session.user.name ?? session.user.email}
                  </p>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-600 hover:text-gray-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Type selector */}
              <div className="flex gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className={`flex-1 text-xs py-2 px-1 rounded-lg border transition-colors ${
                      type === t.id
                        ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-300"
                        : "border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-400"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Message */}
              <div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
                  placeholder={
                    type === "bug"
                      ? "Describe what happened and how to reproduce it…"
                      : type === "feature"
                      ? "What would you like to see built?"
                      : "What's on your mind?"
                  }
                  rows={5}
                  className="w-full bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-300 placeholder-gray-700 resize-none outline-none focus:border-gray-700 transition-colors leading-relaxed"
                />
                <p className={`text-xs mt-1 text-right ${message.length >= MAX ? "text-red-400" : "text-gray-700"}`}>
                  {message.length}/{MAX}
                </p>
              </div>

              {/* Status messages */}
              {status === "error" && (
                <p className="text-xs text-red-400">Something went wrong. Try again.</p>
              )}
              {status === "sent" && (
                <p className="text-xs text-green-400">Thanks! We'll look into it.</p>
              )}

              {/* Submit */}
              <button
                onClick={submit}
                disabled={!message.trim() || status === "sending" || status === "sent"}
                className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-sm py-2.5 rounded-xl transition-colors"
              >
                {status === "sending" ? "Sending…" : status === "sent" ? "Sent ✓" : "Send Feedback"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
