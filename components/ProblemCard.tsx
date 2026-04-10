"use client";

import Link from "next/link";
import { Problem } from "@/lib/types";

const DIFFICULTY_COLORS: Record<number, string> = {
  1: "text-green-400 bg-green-400/10",
  2: "text-green-400 bg-green-400/10",
  3: "text-yellow-400 bg-yellow-400/10",
  4: "text-yellow-400 bg-yellow-400/10",
  5: "text-orange-400 bg-orange-400/10",
  6: "text-orange-400 bg-orange-400/10",
  7: "text-red-400 bg-red-400/10",
  8: "text-red-400 bg-red-400/10",
  9: "text-purple-400 bg-purple-400/10",
  10: "text-purple-400 bg-purple-400/10",
};

const DIFFICULTY_LABEL: Record<number, string> = {
  1: "Easy",
  2: "Easy",
  3: "Medium",
  4: "Medium",
  5: "Intermediate",
  6: "Intermediate",
  7: "Hard",
  8: "Hard",
  9: "Expert",
  10: "Expert",
};

interface Props {
  problem: Problem;
  completed: boolean;
  score?: number | null;
  index: number;
  isPaid: boolean;
}

export default function ProblemCard({ problem, completed, score, index, isPaid }: Props) {
  const diffColor = DIFFICULTY_COLORS[problem.difficulty] ?? "text-gray-400 bg-gray-400/10";
  const diffLabel = DIFFICULTY_LABEL[problem.difficulty] ?? "Unknown";
  const isLocked = !problem.free && !isPaid;

  return (
    <Link href={`/problem/${problem.id}`}>
      <div
        className={`group flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer
          ${isLocked
            ? "border-gray-800/50 bg-gray-900/30 opacity-60 hover:opacity-80"
            : completed
              ? "border-green-800/50 bg-green-900/10 hover:border-green-700"
              : "border-gray-800 bg-gray-900/50 hover:border-gray-600"
          }`}
      >
        {/* Index */}
        <span className="text-gray-600 text-sm w-6 text-center shrink-0 font-mono">{index + 1}</span>

        {/* Status dot */}
        <div className="shrink-0">
          {isLocked ? (
            <div className="w-6 h-6 rounded-full border border-gray-700 flex items-center justify-center">
              <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          ) : completed ? (
            <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border border-gray-700 group-hover:border-gray-500 transition-colors" />
          )}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className={`font-medium truncate ${completed ? "text-gray-300" : "text-gray-100"}`}>
            {problem.title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{problem.description.slice(0, 80)}…</p>
        </div>

        {/* Score badge (if evaluated) */}
        {score != null && !completed && (
          <span className="text-xs font-mono font-medium px-2 py-1 rounded-full shrink-0 text-yellow-400 bg-yellow-400/10">
            {score}%
          </span>
        )}

        {/* Difficulty badge */}
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${diffColor}`}>
          L{problem.difficulty} · {diffLabel}
        </span>

        {/* Arrow */}
        <svg
          className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors shrink-0"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
