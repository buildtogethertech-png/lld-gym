"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EvalResult, EvalCategory } from "@/app/api/evaluate/route";

interface Solution {
  id: string;
  score: number;
  answer: string;
  feedback: string | null;
  updatedAt: string;
  user: { name: string | null };
}

interface Props {
  problemId: string;
  myScore: number | null;
  onCopyToEditor: (code: string) => void;
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const colors = [
    "bg-violet-500", "bg-blue-500", "bg-green-500",
    "bg-orange-500", "bg-pink-500", "bg-teal-500",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
      {initials}
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 95 ? "text-orange-400 bg-orange-400/10 border-orange-400/20"
    : score >= 85 ? "text-green-400 bg-green-400/10 border-green-400/20"
    : "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {score}/100
    </span>
  );
}

function SolutionCard({ solution, onCopyToEditor }: { solution: Solution; onCopyToEditor: (code: string) => void }) {
  const [codeOpen, setCodeOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const name = solution.user.name ?? "Anonymous";
  let parsed: EvalResult | null = null;
  try { if (solution.feedback) parsed = JSON.parse(solution.feedback); } catch {}

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar name={name} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-200 truncate">{name}</p>
          {parsed && (
            <p className="text-xs text-gray-500 truncate">
              {parsed.categories.map((c: EvalCategory) => `${c.name}: ${c.score}/${c.max}`).join(" · ")}
            </p>
          )}
        </div>
        <ScoreBadge score={solution.score} />
      </div>

      {/* Actions */}
      <div className="flex border-t border-gray-800">
        <button
          onClick={() => { setCodeOpen(!codeOpen); setFeedbackOpen(false); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          {codeOpen ? "Hide code" : "View code"}
        </button>
        {parsed && (
          <button
            onClick={() => { setFeedbackOpen(!feedbackOpen); setCodeOpen(false); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors border-l border-gray-800"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {feedbackOpen ? "Hide feedback" : "AI feedback"}
          </button>
        )}
        <button
          onClick={() => {
            onCopyToEditor(solution.answer);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border-l border-gray-800 transition-colors text-yellow-400/80 hover:text-yellow-300 hover:bg-gray-800"
        >
          {copied ? (
            <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied!</>
          ) : (
            <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h5m4 0h3a2 2 0 012 2v4m-6 8l2 2 4-4" /></svg>Copy code to editor</>
          )}
        </button>
      </div>

      {/* Code panel */}
      {codeOpen && (
        <div className="border-t border-gray-800 bg-gray-950 overflow-auto max-h-80">
          <pre className="text-xs text-gray-300 p-4 font-mono leading-relaxed whitespace-pre-wrap break-words">
            {solution.answer}
          </pre>
        </div>
      )}

      {/* Feedback panel */}
      {feedbackOpen && parsed && (
        <div className="border-t border-gray-800 px-4 py-3 space-y-2">
          {parsed.categories.map((cat: EvalCategory) => {
            const pct = Math.round((cat.score / cat.max) * 100);
            const bar = pct >= 85 ? "bg-green-400" : pct >= 60 ? "bg-yellow-400" : "bg-red-400";
            return (
              <div key={cat.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{cat.name}</span>
                  <span className="text-gray-500 font-mono">{cat.score}/{cat.max}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
                  <div className={`h-1 rounded-full ${bar}`} style={{ width: `${pct}%` }} />
                </div>
                {cat.good && <p className="text-xs text-green-400/70 mt-1">✓ {cat.good}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CommunitySolutions({ problemId, myScore, onCopyToEditor }: Props) {
  const [data, setData] = useState<{ locked: boolean; solutions?: Solution[]; requiredScore?: number; myHidden?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/problems/${problemId}/community-solutions`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [problemId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <svg className="w-5 h-5 animate-spin text-gray-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!data) return null;

  // Locked state
  if (data.locked) {
    const needed = (data.requiredScore ?? 80) - (myScore ?? 0);
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-200 mb-1">Score 80+ to unlock</p>
        <p className="text-xs text-gray-500">
          {myScore
            ? `You scored ${myScore}/100 — need ${needed} more points to see community solutions`
            : "Submit your solution and score 80+ to see how others solved this problem"}
        </p>
      </div>
    );
  }

  if (!data.solutions?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <p className="text-sm font-semibold text-gray-200 mb-1">No solutions yet</p>
        <p className="text-xs text-gray-500">You're one of the first to score 80+ on this problem!</p>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 lg:px-5 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Community solutions
        </p>
        <span className="text-xs text-gray-600">{data.solutions.length} solution{data.solutions.length !== 1 ? "s" : ""}</span>
      </div>
      {data.solutions.map((s) => (
        <SolutionCard key={s.id} solution={s} onCopyToEditor={onCopyToEditor} />
      ))}

      <div className="pt-2 text-center">
        <Link
          href="/settings"
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          {data.myHidden ? "Your solution is hidden · change in settings" : "Don't want to show your solution? Settings →"}
        </Link>
      </div>
    </div>
  );
}
