"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { PROBLEMS } from "@/lib/problems";
import { FOUNDATION_PROBLEMS } from "@/lib/foundation-problems";
import { AUTO_COMPLETE_MIN_SCORE } from "@/lib/eval-completion";

const ALL_PROBLEMS = [...FOUNDATION_PROBLEMS, ...PROBLEMS];

type EvalLog = {
  id: string;
  problemId: string;
  code: string;
  language: string;
  score: number;
  feedback: string;
  modelUsed: string | null;
  createdAt: string;
};

function problemTitle(problemId: string) {
  return ALL_PROBLEMS.find((p) => p.id === problemId)?.title ?? problemId;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function SubmissionsPage() {
  const { data: session, status } = useSession();
  const [logs, setLogs] = useState<EvalLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await fetch("/api/evaluation-logs");
    if (res.ok) {
      const data = (await res.json()) as EvalLog[];
      setLogs(Array.isArray(data) ? data : []);
    } else {
      setLogs([]);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (status !== "loading") void load();
  }, [status, load]);

  useEffect(() => {
    const onProgress = () => void load();
    window.addEventListener("lld:progress", onProgress);
    return () => window.removeEventListener("lld:progress", onProgress);
  }, [load]);

  if (status === "loading") {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-gray-500 text-sm">Loading…</div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="text-4xl mb-4">📋</div>
        <h1 className="text-xl font-bold mb-2">Sign in to see your submissions</h1>
        <p className="text-gray-400 text-sm mb-6">
          All AI evaluations across problems show up here so you can revise in one place.
        </p>
        <Link
          href="/login"
          className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Problems
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">My submissions</h1>
        <p className="text-gray-400 text-sm mt-1">
          Every AI evaluation, newest first — open a problem to iterate on your design.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 py-12 text-center">Loading submissions…</p>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 border border-gray-800 rounded-xl bg-gray-900/40">
          <div className="text-3xl mb-3">✨</div>
          <p className="text-gray-400 text-sm">No evaluations yet.</p>
          <p className="text-gray-600 text-xs mt-1 mb-5">Run <span className="text-gray-500">Evaluate with AI</span> on any problem.</p>
          <Link href="/" className="text-yellow-400 hover:text-yellow-300 text-sm font-medium">
            Browse problems →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {logs.map((log) => {
            const fb = (() => {
              try {
                return JSON.parse(log.feedback) as {
                  improvements?: string[];
                  categories?: { name: string; score: number; max: number }[];
                } | null;
              } catch {
                return null;
              }
            })();
            const scoreColor =
              log.score >= 95
                ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20"
                : log.score >= AUTO_COMPLETE_MIN_SCORE
                  ? "text-green-400 bg-green-400/10 border-green-400/20"
                  : log.score >= 60
                    ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
                    : "text-red-400 bg-red-400/10 border-red-400/20";
            const expanded = expandedId === log.id;

            return (
              <li key={log.id} className="bg-[#161616] border border-gray-800 rounded-xl overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className={`text-sm font-bold px-2 py-0.5 rounded border shrink-0 ${scoreColor}`}>
                      {log.score}/100
                    </span>
                    <Link
                      href={`/problem/${log.problemId}`}
                      className="text-sm font-medium text-gray-200 hover:text-yellow-400 transition-colors truncate"
                    >
                      {problemTitle(log.problemId)}
                    </Link>
                    <span className="text-xs text-gray-500">{timeAgo(log.createdAt)}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 font-mono">
                      {log.language ?? "java"}
                    </span>
                    {log.modelUsed && (
                      <span className="text-xs text-gray-600 truncate max-w-[120px]" title={log.modelUsed}>
                        {log.modelUsed.split("-").slice(0, 2).join("-")}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : log.id)}
                    className="sm:ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 shrink-0"
                  >
                    {expanded ? "Hide" : "View"} code
                    <svg
                      className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {fb?.improvements && fb.improvements.length > 0 && (
                  <div className="px-4 pb-3 space-y-1 border-t border-gray-800/60 pt-2">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">To improve</p>
                    {fb.improvements.slice(0, 3).map((imp, i) => (
                      <p key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                        <span className="text-red-500 mt-0.5 shrink-0">→</span>
                        {imp}
                      </p>
                    ))}
                  </div>
                )}

                {fb?.categories && (
                  <div className="px-4 pb-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-gray-800/40 pt-2">
                    {fb.categories.map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 truncate">{cat.name}</span>
                        <span
                          className={
                            cat.score >= cat.max * 0.85
                              ? "text-green-400"
                              : cat.score >= cat.max * 0.6
                                ? "text-yellow-400"
                                : "text-red-400"
                          }
                        >
                          {cat.score}/{cat.max}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {expanded && (
                  <div className="border-t border-gray-800">
                    <pre className="text-xs text-gray-300 font-mono p-4 overflow-x-auto whitespace-pre-wrap max-h-80 overflow-y-auto bg-[#0f0f0f]">
                      {log.code}
                    </pre>
                    <div className="px-4 py-2 border-t border-gray-800 bg-[#141414]">
                      <Link
                        href={`/problem/${log.problemId}`}
                        className="text-xs text-yellow-400 hover:text-yellow-300 font-medium"
                      >
                        Open problem to revise →
                      </Link>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
