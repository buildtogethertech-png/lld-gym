"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { PROBLEMS } from "@/lib/problems";
import { FOUNDATION_PROBLEMS, FOUNDATION_GROUPS } from "@/lib/foundation-problems";
import ProblemCard from "@/components/ProblemCard";

const DIFFICULTY_GROUPS = [
  { label: "Beginner", range: [1, 3], emoji: "🌱" },
  { label: "Intermediate", range: [4, 6], emoji: "🔥" },
  { label: "Advanced", range: [7, 10], emoji: "⚡" },
];

type SubmissionMap = Record<string, { completed: boolean; score?: number | null }>;

export default function HomePage() {
  const { data: session, status } = useSession();
  const [submissions, setSubmissions] = useState<SubmissionMap>({});
  const [isPaid, setIsPaid] = useState(false);

  const ALL_PROBLEMS = [...FOUNDATION_PROBLEMS, ...PROBLEMS];

  const loadSubmissions = useCallback(async () => {
    if (session) {
      const res = await fetch("/api/submissions");
      if (res.ok) {
        const list: { problemId: string; completed: boolean; score: number | null }[] =
          await res.json();
        const map: SubmissionMap = {};
        list.forEach((s) => (map[s.problemId] = { completed: s.completed, score: s.score }));
        setSubmissions(map);
      }
    } else {
      const map: SubmissionMap = {};
      ALL_PROBLEMS.forEach((p) => {
        try {
          const raw = localStorage.getItem(`lld_sub_${p.id}`);
          if (raw) map[p.id] = JSON.parse(raw);
        } catch {}
      });
      setSubmissions(map);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (status !== "loading") loadSubmissions();
  }, [status, loadSubmissions]);

  useEffect(() => {
    if (session) {
      fetch("/api/user/me", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setIsPaid(d.isPaid ?? false));
    }
  }, [session]);

  useEffect(() => {
    const refresh = () => loadSubmissions();
    window.addEventListener("lld:progress", refresh);
    return () => window.removeEventListener("lld:progress", refresh);
  }, [loadSubmissions]);

  const foundationCompleted = FOUNDATION_PROBLEMS.filter(p => submissions[p.id]?.completed).length;
  const lldCompleted = PROBLEMS.filter(p => submissions[p.id]?.completed).length;
  const totalCompleted = foundationCompleted + lldCompleted;
  const totalProblems = ALL_PROBLEMS.length;
  const pct = totalProblems > 0 ? Math.round((totalCompleted / totalProblems) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          LLD Hub <span className="text-yellow-400">⚡</span>
        </h1>
        <p className="text-gray-400 max-w-xl">
          {session
            ? `Welcome back, ${session.user?.name ?? session.user?.email?.split("@")[0]}. Keep pushing.`
            : "OOP → SOLID → Patterns → LLD. Build your design foundation from scratch."}
        </p>
        <p className="mt-3 text-sm">
          <Link href="/learn" className="text-yellow-400 hover:text-yellow-300 transition-colors">
            Why LLD matters + OOP and patterns (free reading) →
          </Link>
        </p>
      </div>

      {/* Progress + Path — single compact bar */}
      <div className="border border-gray-800 rounded-xl overflow-hidden mb-10">
        {/* Top row: progress */}
        <div className="flex items-center gap-4 px-4 py-3 bg-gray-900/60">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-semibold text-yellow-400">{pct}%</span>
            <span className="text-xs text-gray-500">{totalCompleted}/{totalProblems} done</span>
          </div>
          <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-yellow-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 shrink-0 hidden sm:block">
            {foundationCompleted}/{FOUNDATION_PROBLEMS.length} foundations · {lldCompleted}/{PROBLEMS.length} LLD
          </span>
        </div>

        {/* Bottom row: path stages */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-t border-gray-800/60 flex-wrap">
          {[
            { label: "OOP", emoji: "🧱", anchor: "#oop", done: FOUNDATION_PROBLEMS.filter(p => p.topic === "OOP" && submissions[p.id]?.completed).length, total: FOUNDATION_PROBLEMS.filter(p => p.topic === "OOP").length },
            { label: "SOLID", emoji: "⚖️", anchor: "#solid", done: FOUNDATION_PROBLEMS.filter(p => p.topic === "SOLID" && submissions[p.id]?.completed).length, total: FOUNDATION_PROBLEMS.filter(p => p.topic === "SOLID").length },
            { label: "Patterns", emoji: "🔮", anchor: "#patterns", done: FOUNDATION_PROBLEMS.filter(p => p.topic === "Design Patterns" && submissions[p.id]?.completed).length, total: FOUNDATION_PROBLEMS.filter(p => p.topic === "Design Patterns").length },
            { label: "Beginner", emoji: "🌱", anchor: "#beginner", done: PROBLEMS.filter(p => p.difficulty <= 3 && submissions[p.id]?.completed).length, total: PROBLEMS.filter(p => p.difficulty <= 3).length },
            { label: "Intermediate", emoji: "🔥", anchor: "#intermediate", done: PROBLEMS.filter(p => p.difficulty >= 4 && p.difficulty <= 6 && submissions[p.id]?.completed).length, total: PROBLEMS.filter(p => p.difficulty >= 4 && p.difficulty <= 6).length },
            { label: "Advanced", emoji: "⚡", anchor: "#advanced", done: PROBLEMS.filter(p => p.difficulty >= 7 && submissions[p.id]?.completed).length, total: PROBLEMS.filter(p => p.difficulty >= 7).length },
          ].map((step, i) => {
            const complete = step.done === step.total && step.total > 0;
            return (
              <div key={step.label} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-gray-800 text-xs">→</span>}
                <a href={step.anchor} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border transition-opacity hover:opacity-80 ${
                  complete
                    ? "border-green-500/30 bg-green-500/10 text-green-400"
                    : step.done > 0
                    ? "border-yellow-400/20 bg-yellow-400/5 text-yellow-300"
                    : "border-gray-800 text-gray-600 hover:border-gray-700 hover:text-gray-400"
                }`}>
                  <span>{step.emoji}</span>
                  <span>{step.label}</span>
                  <span className="opacity-50">{step.done}/{step.total}</span>
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FOUNDATION TRACK ────────────────────────────── */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold">Foundation Track</h2>
            <p className="text-xs text-gray-500 mt-0.5">Start here — build the mental models before tackling full LLD systems</p>
          </div>
          <span className="ml-auto text-xs text-gray-500 bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-full">
            {foundationCompleted}/{FOUNDATION_PROBLEMS.length} done
          </span>
        </div>

        <div className="space-y-8">
          {FOUNDATION_GROUPS.map((group) => {
            const groupProblems = FOUNDATION_PROBLEMS.filter(p => p.topic === group.topic);
            const groupDone = groupProblems.filter(p => submissions[p.id]?.completed).length;

            return (
              <section key={group.id} id={group.id} className="scroll-mt-20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <span>{group.emoji}</span>
                      <span>{group.label}</span>
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5 ml-7">{group.description}</p>
                  </div>
                  <span className="text-sm text-gray-500 shrink-0 ml-4">
                    {groupDone}/{groupProblems.length} done
                  </span>
                </div>
                <div className="space-y-2">
                  {groupProblems.map((problem) => (
                    <ProblemCard
                      key={problem.id}
                      problem={problem}
                      completed={!!submissions[problem.id]?.completed}
                      score={submissions[problem.id]?.score ?? null}
                      index={FOUNDATION_PROBLEMS.indexOf(problem)}
                      isPaid={isPaid}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-10">
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-xs text-gray-600 font-medium tracking-widest uppercase">LLD Problems</span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>

      {/* ── LLD PROBLEMS ────────────────────────────────── */}
      <div className="space-y-10">
        {DIFFICULTY_GROUPS.map((group) => {
          const groupProblems = PROBLEMS.filter(
            (p) => p.difficulty >= group.range[0] && p.difficulty <= group.range[1]
          );
          const groupCompleted = groupProblems.filter((p) => submissions[p.id]?.completed).length;

          return (
            <section key={group.label} id={group.label.toLowerCase()} className="scroll-mt-20">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span>{group.emoji}</span>
                  <span>{group.label}</span>
                  <span className="text-sm text-gray-500 font-normal">
                    L{group.range[0]}–L{group.range[1]}
                  </span>
                </h2>
                <span className="text-sm text-gray-500">
                  {groupCompleted}/{groupProblems.length} done
                </span>
              </div>
              <div className="space-y-2">
                {groupProblems.map((problem) => (
                  <ProblemCard
                    key={problem.id}
                    problem={problem}
                    completed={!!submissions[problem.id]?.completed}
                    score={submissions[problem.id]?.score ?? null}
                    index={PROBLEMS.indexOf(problem)}
                    isPaid={isPaid}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-12 text-center text-xs text-gray-700">
        Built for engineers who want to think, not memorize.
      </p>
    </div>
  );
}
