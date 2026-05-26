"use client";

import { useState, useEffect } from "react";
import type { EvalResult } from "@/app/api/evaluate/route";

interface Props {
  result: EvalResult;
  problemTitle: string;
  problemId: string;
  onClose: () => void;
}

function categoryLines(result: EvalResult): string {
  return result.categories
    .map((c) => {
      const pct = Math.round((c.score / c.max) * 100);
      const icon = pct >= 85 ? "✅" : pct >= 60 ? "⚠️" : "❌";
      return `${icon} ${c.name}: ${c.score}/${c.max}`;
    })
    .join("\n");
}

function twitterText(result: EvalResult, problemTitle: string, url: string): string {
  const verdict =
    result.verdict === "excellent" ? "nailed" :
    result.verdict === "strong"    ? "crushed" :
    result.verdict === "warning"   ? "scored" : "attempted";

  const lines = categoryLines(result);
  return `Just ${verdict} the ${problemTitle} LLD problem — ${result.total}/100 🎯\n\nThis exact problem gets asked at Amazon, Flipkart & Uber interviews.\n\nMy breakdown:\n${lines}\n\nPracticing at LLDHub — AI gives instant feedback on your design 👇\n${url}\n\n#LLD #SystemDesign #SoftwareEngineering #InterviewPrep`;
}

function linkedinText(result: EvalResult, problemTitle: string, url: string): string {
  const lines = categoryLines(result);
  const label =
    result.verdict === "excellent" ? "top-tier (95+ score)" :
    result.verdict === "strong"    ? "interview-ready (85+ score)" :
    result.verdict === "warning"   ? "a solid attempt" : "a first attempt";

  return `Scored ${result.total}/100 on the ${problemTitle} Low Level Design problem — ${label}.\n\nThis is a classic problem asked at Amazon, Flipkart, Uber, and Swiggy SDE interviews. It tests entity design, design patterns, and OOP thinking.\n\nMy breakdown:\n${lines}\n\nI've been using LLDHub.in to practice LLD — it has AI evaluation that scores your design across 5 dimensions and tells you exactly what to improve. Worth checking out if you're prepping for product-based company interviews.\n\n${url}\n\n#LLD #SystemDesign #SoftwareEngineering #InterviewPrep #SDEInterview`;
}

function whatsappText(result: EvalResult, problemTitle: string, url: string): string {
  const lines = categoryLines(result);
  const fire = result.total >= 85 ? "🔥" : result.total >= 60 ? "⚡" : "💪";
  return `${fire} Scored ${result.total}/100 on ${problemTitle} LLD!\n\nBreakdown:\n${lines}\n\nThis problem gets asked in Amazon & Flipkart SDE interviews. Been practicing at LLDHub — AI evaluates your design and tells you what to improve.\n\nFree to try 👇\n${url}`;
}

function copyText(result: EvalResult, problemTitle: string, url: string): string {
  return twitterText(result, problemTitle, url);
}

const PLATFORMS = [
  {
    id: "twitter",
    label: "X (Twitter)",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    ),
    bg: "bg-black hover:bg-zinc-800 border-zinc-700",
    build: (text: string, _url: string, _raw: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    bg: "bg-[#0A66C2] hover:bg-[#0958a8] border-[#0A66C2]",
    build: (_text: string, url: string, raw: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(raw)}`,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
      </svg>
    ),
    bg: "bg-[#25D366] hover:bg-[#1ebe5d] border-[#25D366]",
    build: (text: string, _url: string, _raw: string) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
  },
];

export default function ShareModal({ result, problemTitle, problemId, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [linkedinCopied, setLinkedinCopied] = useState(false);

  const url = `https://lldhub.in/problem/${problemId}`;
  const textByPlatform: Record<string, string> = {
    twitter:  twitterText(result, problemTitle, url),
    linkedin: linkedinText(result, problemTitle, url),
    whatsapp: whatsappText(result, problemTitle, url),
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function copyToClipboard() {
    navigator.clipboard.writeText(copyText(result, problemTitle, url)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const verdictColor =
    result.verdict === "excellent" ? "text-orange-400" :
    result.verdict === "strong"    ? "text-green-400" :
    result.verdict === "warning"   ? "text-yellow-400" : "text-red-400";

  const verdictEmoji =
    result.verdict === "excellent" ? "🔥" :
    result.verdict === "strong"    ? "✅" :
    result.verdict === "warning"   ? "⚡" : "💪";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Score card */}
        <div className="relative rounded-t-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-950 px-6 pt-8 pb-6 text-center border-b border-gray-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className={`text-5xl font-black ${verdictColor} mb-1 tracking-tight`}>
            {result.total}<span className="text-2xl text-gray-500 font-normal">/100</span>
          </div>
          <p className="text-gray-300 font-semibold text-sm mt-1">
            {verdictEmoji} {problemTitle}
          </p>
          <p className="text-gray-500 text-xs mt-1">on LLDHub.in</p>

          {/* Mini breakdown */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-left">
            {result.categories.map((c) => {
              const pct = Math.round((c.score / c.max) * 100);
              const color = pct >= 85 ? "text-green-400" : pct >= 60 ? "text-yellow-400" : "text-red-400";
              return (
                <div key={c.name} className="bg-gray-900/60 rounded-lg px-3 py-2">
                  <p className="text-gray-500 text-[10px] truncate">{c.name}</p>
                  <p className={`font-bold text-sm ${color}`}>{c.score}/{c.max}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Share section */}
        <div className="px-5 py-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-4">
            Share your score
          </p>

          <div className="flex flex-col gap-2">
            {PLATFORMS.map((p) => {
              if (p.id === "linkedin") {
                return (
                  <div key="linkedin" className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(textByPlatform.linkedin ?? "").then(() => {
                          setLinkedinCopied(true);
                          setTimeout(() => setLinkedinCopied(false), 4000);
                          window.open("https://www.linkedin.com/feed/?shareActive=true", "_blank", "noopener,noreferrer");
                        });
                      }}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-white text-sm font-medium transition-all w-full ${p.bg}`}
                    >
                      {p.icon}
                      Share on LinkedIn
                    </button>
                    {linkedinCopied && (
                      <p className="text-xs text-blue-400 text-center animate-in fade-in duration-200">
                        ✓ Text copied — just paste it in LinkedIn!
                      </p>
                    )}
                  </div>
                );
              }
              return (
                <a
                  key={p.id}
                  href={p.build(textByPlatform[p.id] ?? "", url, textByPlatform[p.id] ?? "")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-white text-sm font-medium transition-all ${p.bg}`}
                >
                  {p.icon}
                  Share on {p.label}
                </a>
              );
            })}

            {/* Copy text */}
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-700 bg-gray-900 hover:bg-gray-800 text-gray-300 text-sm font-medium transition-all"
            >
              {copied ? (
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              {copied ? "Copied!" : "Copy text"}
            </button>
          </div>

          <div className="mt-3 flex flex-col items-center gap-1.5">
            <button
              onClick={onClose}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors py-1"
            >
              No thanks
            </button>
            <button
              onClick={() => {
                localStorage.setItem("lldhub_share_dismissed", "1");
                onClose();
              }}
              className="text-xs text-gray-700 hover:text-gray-500 transition-colors py-0.5"
            >
              Don&apos;t show me again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
