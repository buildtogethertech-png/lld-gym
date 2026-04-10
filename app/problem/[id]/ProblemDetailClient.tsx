"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { SHOW_USER_OWN_API_KEY_UI } from "@/lib/features";
import dynamic from "next/dynamic";
import { Problem } from "@/lib/types";
import type { EvalResult } from "@/app/api/evaluate/route";
import EvaluationPanel from "@/components/EvaluationPanel";
import UpgradeButton from "@/components/UpgradeButton";
import { generateStarterCode } from "@/lib/starter-code";
import { AUTO_COMPLETE_MIN_SCORE } from "@/lib/eval-completion";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), { ssr: false });
const UMLEditor = dynamic(() => import("@/app/uml-practice/UMLEditor"), { ssr: false });


const LANGUAGES = [
  { id: "typescript", label: "TypeScript" },
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
] as const;

type LangId = (typeof LANGUAGES)[number]["id"];

const EDITOR_LANGUAGE_KEY = "lld_editor_language";

const PAID_EVAL_RATE_LIMIT_CODES = new Set([
  "EVAL_HOURLY_LIMIT",
  "EVAL_DAILY_LIMIT",
  "EVAL_MONTHLY_LIMIT",
]);

function isPaidEvalRateLimit(code: string | null): boolean {
  return code != null && PAID_EVAL_RATE_LIMIT_CODES.has(code);
}

/** Quota-style errors: show only near Evaluate, not under the title (avoids duplicate + wrong "Attempted"). */
function showEvalErrorBesideTitle(code: string | null): boolean {
  if (code === "FREE_LIMIT_REACHED") return false;
  if (isPaidEvalRateLimit(code)) return false;
  return true;
}

function isLangId(v: string): v is LangId {
  return (LANGUAGES as readonly { id: string }[]).some((l) => l.id === v);
}

function readStoredEditorLanguage(): LangId {
  if (typeof window === "undefined") return "java";
  try {
    const v = localStorage.getItem(EDITOR_LANGUAGE_KEY);
    if (v && isLangId(v)) return v;
  } catch {
    /* ignore */
  }
  return "java";
}

const DIFFICULTY_LABEL: Record<number, { label: string; color: string }> = {
  1:  { label: "Easy",         color: "text-green-400 bg-green-400/10 border-green-400/20" },
  2:  { label: "Easy",         color: "text-green-400 bg-green-400/10 border-green-400/20" },
  3:  { label: "Medium",       color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  4:  { label: "Medium",       color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  5:  { label: "Intermediate", color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  6:  { label: "Intermediate", color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  7:  { label: "Hard",         color: "text-red-400 bg-red-400/10 border-red-400/20" },
  8:  { label: "Hard",         color: "text-red-400 bg-red-400/10 border-red-400/20" },
  9:  { label: "Expert",       color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  10: { label: "Expert",       color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
};

function attemptFeedbackLine(result: EvalResult | null): string {
  if (!result) return "";
  const first = result.improvements?.find((s) => s?.trim());
  if (first) return first;
  const map: Record<EvalResult["verdict"], string> = {
    poor: "Needs more work on entities, relationships, and design fundamentals.",
    warning: "Good start — deepen SOLID, patterns, and clarity.",
    strong: "Close to passing — polish edge cases and structure.",
    excellent: "",
  };
  return map[result.verdict] ?? (result.rawFeedback?.trim().slice(0, 220) ?? "");
}

export default function ProblemDetailClient({ problem, isLocked, isPaid }: { problem: Problem; isLocked: boolean; isPaid: boolean }) {
  const { data: session } = useSession();
  const [answer, setAnswer] = useState("");
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evalErrorCode, setEvalErrorCode] = useState<string | null>(null);
  const [language, setLanguage] = useState<LangId>("java");
  const [autoSuggest, setAutoSuggest] = useState(true);
  const [rightMode, setRightMode] = useState<"code" | "uml">("code");
  const [umlFullscreen, setUmlFullscreen] = useState(false);
  const [topBarHidden, setTopBarHidden] = useState(false);
  const [leftTab, setLeftTab] = useState<"description" | "submissions">("description");

  interface SubLog {
    id: string;
    code: string;
    language: string;
    score: number;
    feedback: string;
    modelUsed: string | null;
    createdAt: string;
  }
  const [subLogs, setSubLogs] = useState<SubLog[]>([]);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoggedIn = !!session;
  const diff = DIFFICULTY_LABEL[problem.difficulty] ?? { label: "Unknown", color: "text-gray-400 bg-gray-400/10 border-gray-400/20" };

  // ── Horizontal split resize ───────────────────────────────────────────────
  const [leftPct, setLeftPct] = useState(42); // % width of left panel
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragMoveRef = useRef<((e: MouseEvent) => void) | null>(null);
  const dragUpRef = useRef<(() => void) | null>(null);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    dragMoveRef.current = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.max(25, Math.min(70, pct)));
    };

    dragUpRef.current = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (dragMoveRef.current) document.removeEventListener("mousemove", dragMoveRef.current);
      if (dragUpRef.current) document.removeEventListener("mouseup", dragUpRef.current);
    };

    document.addEventListener("mousemove", dragMoveRef.current);
    document.addEventListener("mouseup", dragUpRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (dragMoveRef.current) document.removeEventListener("mousemove", dragMoveRef.current);
      if (dragUpRef.current) document.removeEventListener("mouseup", dragUpRef.current);
    };
  }, []);

  // ── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    setLanguage(readStoredEditorLanguage());
  }, []);


  const setLanguagePersist = useCallback((next: LangId) => {
    setLanguage(next);
    try {
      localStorage.setItem(EDITOR_LANGUAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      try {
        const raw = localStorage.getItem(`lld_sub_${problem.id}`);
        if (raw) { const s = JSON.parse(raw); setAnswer(s.answer ?? ""); setCompleted(s.completed ?? false); setScore(s.score ?? null); }
      } catch {}
      return;
    }
    fetch(`/api/submissions/${problem.id}`).then(r => r.json()).then(sub => {
      if (sub) {
        setAnswer(sub.answer ?? "");
        setCompleted(sub.completed ?? false);
        setScore(sub.score ?? null);
        if (sub.feedback) { try { setEvalResult(JSON.parse(sub.feedback)); } catch {} }
      }
    });
  }, [problem.id, isLoggedIn]);

  const saveAnswer = useCallback((value: string, comp: boolean, sc: number | null) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (isLoggedIn) {
        await fetch(`/api/submissions/${problem.id}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: value, completed: comp, score: sc }),
        });
      } else {
        localStorage.setItem(`lld_sub_${problem.id}`, JSON.stringify({ answer: value, completed: comp, score: sc }));
      }
      setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setTimeout(() => setSavedAt(null), 2000);
    }, 900);
  }, [problem.id, isLoggedIn]);

  const loadLogs = useCallback(() => {
    if (!isLoggedIn) return;
    fetch(`/api/evaluation-logs/${problem.id}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSubLogs(d); });
  }, [problem.id, isLoggedIn]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  function handleChange(value: string) { setAnswer(value); saveAnswer(value, completed, score); }

  async function handleEvaluate() {
    if (!isLoggedIn) { setEvalError("Sign in to use AI evaluation"); return; }
    setEvaluating(true); setEvalError(null); setEvalErrorCode(null); setEvalResult(null);
    const res = await fetch("/api/evaluate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemId: problem.id,
        answer,
        language,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    const data = await res.json();
    setEvaluating(false);
    if (!res.ok) { setEvalError(data.error ?? "Evaluation failed"); setEvalErrorCode(data.code ?? null); return; }
    setEvalResult(data as EvalResult);
    const total = (data as EvalResult).total;
    setScore(total);
    setCompleted(total >= AUTO_COMPLETE_MIN_SCORE);
    if (total >= AUTO_COMPLETE_MIN_SCORE) window.dispatchEvent(new Event("lld:progress"));
    loadLogs();
    setLeftTab("submissions");
  }

  // ── Paywall ───────────────────────────────────────────────────────────────
  if (isLocked) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold mb-2">This problem is locked</h2>
        <p className="text-gray-400 text-sm mb-6">
          Free plan includes select problems.<br />
          Unlock all problems with lifetime access.
        </p>
        <UpgradeButton planId="threemonth" />
        <Link href="/pricing" className="mt-3 block text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
          See what&apos;s included →
        </Link>
      </div>
    );
  }

  // ── Full-screen split layout ──────────────────────────────────────────────
  return (
    // Full viewport below navbar (h-14 = 56px)
    <div className="fixed inset-0 top-14 bg-[#0f0f0f] flex flex-col">

      {/* ── Top bar ── */}
      {topBarHidden ? (
        <div className="shrink-0 flex justify-center">
          <button
            onClick={() => setTopBarHidden(false)}
            title="Show problem info"
            className="flex items-center gap-1 text-xs text-gray-700 hover:text-gray-400 transition-colors py-0.5 px-3"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="h-10 border-b border-gray-800 flex items-center justify-between px-3 sm:px-4 lg:px-5 shrink-0 bg-[#161616]">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Problems
            </Link>
            <span className="text-gray-700">·</span>
            <span className="text-sm font-medium text-gray-200 truncate max-w-xs">{problem.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {problem.topic && (
              <span className="text-xs px-2 py-0.5 rounded-full border text-purple-400 bg-purple-400/10 border-purple-400/20">{problem.topic}</span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${diff.color}`}>
              L{problem.difficulty} · {diff.label}
            </span>
            <button
              onClick={() => setTopBarHidden(true)}
              title="Hide problem info"
              className="ml-1 flex items-center justify-center w-6 h-6 rounded text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Split panes ── */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">

        {/* LEFT — Problem description / Submissions */}
        <div className={`flex flex-col overflow-hidden ${umlFullscreen ? "hidden" : ""}`} style={{ width: `${leftPct}%` }}>

          {/* Tab bar */}
          <div className="shrink-0 flex border-b border-gray-800 bg-[#161616] pl-2 sm:pl-3 lg:pl-4">
            {(["description", "submissions"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                className={`px-3 sm:px-4 py-2.5 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
                  leftTab === tab
                    ? "border-yellow-400 text-yellow-400"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab === "submissions" ? `Submissions${subLogs.length > 0 ? ` (${subLogs.length})` : ""}` : "Description"}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">

            {/* ── Description tab ── */}
            {leftTab === "description" && (
              <div className="px-3 sm:px-4 lg:px-5 py-4 space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h1 className="text-xl font-bold text-gray-100 leading-tight">{problem.title}</h1>
                    <div className="shrink-0 text-right max-w-[min(100%,14rem)] sm:max-w-[18rem]">
                      {evalError && showEvalErrorBesideTitle(evalErrorCode) ? (
                        <div>
                          <div className="flex items-center justify-end gap-1 text-sm font-medium text-red-400">
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Attempted
                          </div>
                          <p className="text-xs text-red-400/90 mt-1 leading-snug break-words">{evalError}</p>
                        </div>
                      ) : score !== null && score >= AUTO_COMPLETE_MIN_SCORE ? (
                        <div className="flex items-center justify-end gap-1.5 text-sm font-medium text-green-400">
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Accepted</span>
                          <span className="text-green-400/80 font-mono">{score}%</span>
                        </div>
                      ) : score !== null ? (
                        <div>
                          <div className="flex items-center justify-end gap-1 text-sm font-medium text-red-400">
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>Attempted</span>
                            <span className="text-red-400/80 font-mono">{score}%</span>
                          </div>
                          {(() => {
                            const line = attemptFeedbackLine(evalResult);
                            return line ? (
                              <p className="text-xs text-red-400/85 mt-1 leading-snug break-words">{line}</p>
                            ) : null;
                          })()}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="bg-[#161616] border border-gray-800 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Problem</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{problem.description}</p>
                  </div>
                </div>

                <div className="bg-[#161616] border border-gray-800 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Requirements</p>
                  <ul className="space-y-2">
                    {problem.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-yellow-400 mt-0.5 shrink-0">▸</span>{req}
                      </li>
                    ))}
                  </ul>
                </div>

                {problem.constraints && problem.constraints.length > 0 && (
                  <div className="bg-[#161616] border border-gray-800 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Constraints</p>
                    <ul className="space-y-2">
                      {problem.constraints.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                          <span className="text-gray-600 mt-0.5 shrink-0">–</span>{c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {problem.hints && problem.hints.length > 0 && (
                  <div className="bg-[#161616] border border-gray-800 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setShowHints(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      <span className="font-medium">💡 Hints</span>
                      <svg className={`w-4 h-4 transition-transform ${showHints ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showHints && (
                      <div className="px-4 pb-4 space-y-2 border-t border-gray-800 pt-3">
                        {problem.hints.map((hint, i) => (
                          <p key={i} className="text-sm text-gray-400">{i + 1}. {hint}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {evalResult && (
                  <EvaluationPanel result={evalResult} onClose={() => setEvalResult(null)} />
                )}
              </div>
            )}

            {/* ── Submissions tab ── */}
            {leftTab === "submissions" && (
              <div className="px-3 sm:px-4 lg:px-5 py-3 space-y-3">
                {!isLoggedIn && (
                  <p className="text-sm text-gray-500 text-center py-8">Sign in to see your submission history.</p>
                )}
                {isLoggedIn && (
                  <div className="flex justify-end -mt-1 mb-1">
                    <Link
                      href="/submissions"
                      className="text-xs text-yellow-400/90 hover:text-yellow-300 transition-colors"
                    >
                      All submissions (all problems) →
                    </Link>
                  </div>
                )}
                {isLoggedIn && subLogs.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-3xl mb-3">📋</div>
                    <p className="text-sm text-gray-500">No submissions yet.</p>
                    <p className="text-xs text-gray-600 mt-1">Evaluate your code to see history here.</p>
                  </div>
                )}
                {subLogs.map((log) => {
                  const fb = (() => { try { return JSON.parse(log.feedback); } catch { return null; } })();
                  const scoreColor =
                    log.score >= 95 ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" :
                    log.score >= AUTO_COMPLETE_MIN_SCORE ? "text-green-400 bg-green-400/10 border-green-400/20" :
                    log.score >= 60 ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" :
                                      "text-red-400 bg-red-400/10 border-red-400/20";
                  const timeAgo = (() => {
                    const diff = Date.now() - new Date(log.createdAt).getTime();
                    const m = Math.floor(diff / 60000);
                    if (m < 1) return "just now";
                    if (m < 60) return `${m}m ago`;
                    const h = Math.floor(m / 60);
                    if (h < 24) return `${h}h ago`;
                    return `${Math.floor(h / 24)}d ago`;
                  })();
                  const isExpanded = expandedLog === log.id;

                  return (
                    <div key={log.id} className="bg-[#161616] border border-gray-800 rounded-xl overflow-hidden">
                      {/* Header row */}
                      <div className="flex items-center gap-2 px-4 py-3">
                        <span className={`text-sm font-bold px-2 py-0.5 rounded border ${scoreColor}`}>
                          {log.score}/100
                        </span>
                        <span className="text-xs text-gray-500">{timeAgo}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 font-mono">
                          {log.language ?? "java"}
                        </span>
                        {log.modelUsed && (
                          <span className="text-xs text-gray-600 truncate max-w-[100px]" title={log.modelUsed}>
                            {log.modelUsed.split("-").slice(0, 2).join("-")}
                          </span>
                        )}
                        <button
                          onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                          className="ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
                        >
                          {isExpanded ? "Hide" : "View"} code
                          <svg className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Mistakes */}
                      {fb?.improvements && fb.improvements.length > 0 && (
                        <div className="px-4 pb-3 space-y-1 border-t border-gray-800/60 pt-2">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">To improve</p>
                          {(fb.improvements as string[]).slice(0, 3).map((imp: string, i: number) => (
                            <p key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                              <span className="text-red-500 mt-0.5 shrink-0">→</span>{imp}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Category scores */}
                      {fb?.categories && (
                        <div className="px-4 pb-3 grid grid-cols-2 gap-x-4 gap-y-1">
                          {(fb.categories as { name: string; score: number; max: number }[]).map((cat) => (
                            <div key={cat.name} className="flex items-center justify-between text-xs">
                              <span className="text-gray-500 truncate">{cat.name}</span>
                              <span className={cat.score >= cat.max * 0.85 ? "text-green-400" : cat.score >= cat.max * 0.6 ? "text-yellow-400" : "text-red-400"}>
                                {cat.score}/{cat.max}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Expandable code */}
                      {isExpanded && (
                        <div className="border-t border-gray-800">
                          <pre className="text-xs text-gray-300 font-mono p-4 overflow-x-auto whitespace-pre-wrap max-h-72 overflow-y-auto bg-[#0f0f0f]">
                            {log.code}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Drag handle ── */}
        <div
          onMouseDown={handleDragStart}
          className={`w-1 bg-gray-800 hover:bg-yellow-400/50 active:bg-yellow-400 cursor-col-resize transition-colors shrink-0 relative group ${umlFullscreen ? "hidden" : ""}`}
        >
          {/* Visual grip dots */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-yellow-400" />
            ))}
          </div>
        </div>

        {/* RIGHT — Editor */}
        <div className="flex flex-col flex-1 overflow-hidden bg-[#1e1e1e]">

          {/* Editor toolbar */}
          <div className="h-11 flex items-center gap-3 px-3 sm:px-4 border-b border-gray-800 bg-[#161616] shrink-0">
            {/* LEFT: language + suggest (hidden in UML mode) */}
            <div className={`flex items-center gap-2 sm:gap-3 min-w-0 flex-1 ${rightMode === "uml" ? "invisible" : ""}`}>
              <div className="relative flex items-center">
                <label htmlFor="editor-language" className="sr-only">Language</label>
                <select
                  id="editor-language"
                  value={language}
                  onChange={(e) => setLanguagePersist(e.target.value as LangId)}
                  className="appearance-none h-8 min-w-[7.5rem] sm:min-w-[8.5rem] pl-3 pr-8 rounded-lg border border-gray-600 bg-[#1e1e1e] text-gray-100 text-xs font-medium shadow-sm cursor-pointer hover:border-gray-500 hover:bg-[#252525] focus:outline-none focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/60 transition-colors"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.id} value={l.id}>{l.label}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <button
                type="button"
                onClick={() => setAutoSuggest((v) => !v)}
                className={`flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg text-xs font-medium border transition-all shrink-0 ${
                  autoSuggest
                    ? "text-blue-300 bg-blue-500/15 border-blue-500/35 hover:bg-blue-500/20"
                    : "text-gray-500 border-transparent bg-transparent hover:text-gray-300 hover:bg-gray-800/80"
                }`}
                title={autoSuggest ? "Autocomplete ON" : "Autocomplete OFF"}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {autoSuggest ? "Suggest ON" : "Suggest OFF"}
              </button>
            </div>

            {/* RIGHT: saved indicator + Code/UML toggle */}
            <div className="flex items-center gap-3 shrink-0 ml-auto">
              <span className={`text-xs tabular-nums transition-opacity ${savedAt ? "opacity-100 text-green-400" : "opacity-0 pointer-events-none"}`}>
                ✓ Saved {savedAt}
              </span>
              <div className="flex items-center rounded-lg border border-gray-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setRightMode("code"); setUmlFullscreen(false); setTopBarHidden(false); }}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${rightMode === "code" ? "bg-gray-700 text-gray-100" : "text-gray-500 hover:text-gray-300"}`}
                >
                  Code
                </button>
                <button
                  type="button"
                  onClick={() => setRightMode("uml")}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${rightMode === "uml" ? "bg-gray-700 text-gray-100" : "text-gray-500 hover:text-gray-300"}`}
                >
                  📐 UML
                </button>
              </div>
              {rightMode === "uml" && (
                <button
                  type="button"
                  onClick={() => { setUmlFullscreen((v) => { setTopBarHidden(!v); return !v; }); }}
                  title={umlFullscreen ? "Exit fullscreen" : "Fullscreen UML"}
                  className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-700 text-gray-500 hover:text-gray-200 hover:border-gray-600 transition-colors"
                >
                  {umlFullscreen ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0h5m-5 0v5M15 9l5-5m0 0h-5m5 0v5M9 15l-5 5m0 0h5m-5 0v-5M15 15l5 5m0 0h-5m5 0v-5" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Monaco or UML canvas */}
          <div className="flex-1 overflow-hidden">
            {rightMode === "code" ? (
              <CodeEditor
                value={answer || generateStarterCode(problem, language)}
                onChange={handleChange}
                fillHeight
                language={language}
                autoSuggest={autoSuggest}
              />
            ) : (
              <div className="w-full h-full">
                <UMLEditor embedded initialTitle={problem.title} />
              </div>
            )}
          </div>

          {/* ── Bottom action bar (CTA right — same affordance as LeetCode Submit) ── */}
          <div className="shrink-0 border-t border-gray-800 bg-[#161616] px-3 sm:px-4 lg:px-5 py-2 flex items-center justify-between gap-3 min-h-[42px]">
            <div className="flex-1 min-w-0 flex items-center">
              {evalError && (
                <div className="flex items-baseline gap-2 sm:gap-3 text-xs flex-wrap min-w-0">
                  <span className="text-red-400/90 break-words min-w-0">{evalError}</span>
                  {evalErrorCode === "FREE_LIMIT_REACHED" && (
                    <>
                      <Link href="/pricing" className="text-yellow-400 hover:text-yellow-300 underline whitespace-nowrap shrink-0 font-medium">
                        Pricing
                      </Link>
                      {SHOW_USER_OWN_API_KEY_UI && (
                        <>
                          <span className="text-gray-600 shrink-0">·</span>
                          <Link href="/settings?tab=key" className="text-yellow-400 hover:text-yellow-300 underline whitespace-nowrap shrink-0">
                            API key
                          </Link>
                        </>
                      )}
                    </>
                  )}
                  {isPaidEvalRateLimit(evalErrorCode) && (
                    <Link
                      href="/submissions"
                      className="text-yellow-400 hover:text-yellow-300 underline whitespace-nowrap shrink-0 font-medium"
                    >
                      Submissions
                    </Link>
                  )}
                  {SHOW_USER_OWN_API_KEY_UI && evalError.includes("API key") && evalErrorCode !== "FREE_LIMIT_REACHED" && (
                    <Link href="/settings" className="text-yellow-400 hover:text-yellow-300 underline shrink-0">Add key →</Link>
                  )}
                  {evalErrorCode === "USER_NOT_FOUND" && (
                    <Link href="/login" className="text-yellow-400 hover:text-yellow-300 underline shrink-0">
                      Sign in again →
                    </Link>
                  )}
                  {evalError.includes("Sign in") && evalErrorCode !== "USER_NOT_FOUND" && (
                    <Link href="/login" className="text-yellow-400 hover:text-yellow-300 underline shrink-0">Sign in →</Link>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleEvaluate}
              disabled={evaluating}
              data-testid="evaluate-ai-button"
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161616] ${
                evaluating
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-yellow-400 hover:bg-yellow-300 text-black"
              }`}
            >
              {evaluating ? (
                <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Evaluating…</>
              ) : (
                <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>{isLoggedIn ? "Evaluate with AI" : "Sign in to Evaluate"}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
