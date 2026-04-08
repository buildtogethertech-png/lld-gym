"use client";

import type { EvalResult, EvalCategory } from "@/app/api/evaluate/route";
import { AUTO_COMPLETE_MIN_SCORE } from "@/lib/eval-completion";

const VERDICT_CONFIG = {
  poor: {
    label: "Not enough — rethink the design",
    icon: "❌",
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/20",
  },
  warning: {
    label: "Good but missing depth",
    icon: "⚠️",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 border-yellow-400/20",
  },
  strong: {
    label: "Strong — interview-ready",
    icon: "✅",
    color: "text-green-400",
    bg: "bg-green-400/10 border-green-400/20",
  },
  excellent: {
    label: "Excellent — top-tier LLD thinking",
    icon: "🔥",
    color: "text-orange-400",
    bg: "bg-orange-400/10 border-orange-400/20",
  },
};

function ScoreRing({ score, max }: { score: number; max: number }) {
  const pct = Math.round((score / max) * 100);
  const color =
    pct >= 85 ? "#4ade80" : pct >= 60 ? "#facc15" : "#f87171";
  return (
    <div className="flex flex-col items-center">
      <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
        <circle cx="24" cy="24" r="20" fill="none" stroke="#1f2937" strokeWidth="4" />
        <circle
          cx="24" cy="24" r="20" fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${2 * Math.PI * 20}`}
          strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct / 100)}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className="text-xs font-mono mt-0.5" style={{ color }}>
        {score}/{max}
      </span>
    </div>
  );
}

function CategoryRow({ cat }: { cat: EvalCategory }) {
  const pct = Math.round((cat.score / cat.max) * 100);
  const barColor = pct >= 85 ? "bg-green-400" : pct >= 60 ? "bg-yellow-400" : "bg-red-400";

  return (
    <div className="py-3 border-b border-gray-800 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{cat.name}</span>
        <span className="text-sm font-mono text-gray-400">
          {cat.score}/{cat.max}
        </span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5 mb-2 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="space-y-1">
        {cat.good && (
          <p className="text-xs text-green-400/80 flex items-start gap-1.5">
            <span className="shrink-0 mt-0.5">✓</span> {cat.good}
          </p>
        )}
        {cat.bad && (
          <p className="text-xs text-red-400/80 flex items-start gap-1.5">
            <span className="shrink-0 mt-0.5">✗</span> {cat.bad}
          </p>
        )}
      </div>
    </div>
  );
}

interface Props {
  result: EvalResult;
  onClose: () => void;
}

export default function EvaluationPanel({ result, onClose }: Props) {
  const verdict = VERDICT_CONFIG[result.verdict] ?? VERDICT_CONFIG.poor;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div>
          <h3 className="font-semibold text-sm">AI Evaluation</h3>
          {result.modelUsed && (
            <p className="text-xs text-gray-500 font-mono mt-0.5">via {result.modelUsed}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-gray-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Score + verdict */}
      <div className={`mx-5 mt-5 mb-4 px-4 py-3 rounded-xl border flex items-center gap-4 ${verdict.bg}`}>
        <div className="text-center shrink-0">
          <p className={`text-4xl font-bold ${verdict.color}`}>{result.total}</p>
          <p className="text-xs text-gray-500 mt-0.5">/ 100</p>
        </div>
        <div>
          <p className="text-sm font-medium">
            {verdict.icon} {verdict.label}
          </p>
          {result.total >= AUTO_COMPLETE_MIN_SCORE && (
            <p className="text-xs text-green-400 mt-0.5">Problem marked as completed!</p>
          )}
          {result.total < AUTO_COMPLETE_MIN_SCORE && (
            <p className="text-xs text-gray-500 mt-0.5">
              Need {AUTO_COMPLETE_MIN_SCORE - result.total} more points to complete this problem
            </p>
          )}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="px-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Breakdown
        </p>
        <div>
          {result.categories.map((cat) => (
            <CategoryRow key={cat.name} cat={cat} />
          ))}
        </div>
      </div>

      {/* Improvements */}
      {result.improvements?.length > 0 && (
        <div className="px-5 py-4 border-t border-gray-800 mt-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Top improvements to hit 90%+
          </p>
          <ol className="space-y-2">
            {result.improvements.map((imp, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="shrink-0 w-5 h-5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 flex items-center justify-center text-xs font-bold mt-0.5">
                  {i + 1}
                </span>
                {imp}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
