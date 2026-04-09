import Link from "next/link";
import type { Metadata } from "next";
import { TOPIC_GROUPS } from "@/lib/topics";
import { FOUNDATION_PROBLEMS } from "@/lib/foundation-problems";
import { PROBLEMS } from "@/lib/problems";

export const metadata: Metadata = {
  title: "Learn — LLD Hub",
  description: "Structured learning path: OOP → SOLID → Design Patterns → LLD Problems. Watch, read, then practice.",
};

const ALL_PROBLEMS = [...FOUNDATION_PROBLEMS, ...PROBLEMS];

function problemCountForTags(tags: string[]) {
  return ALL_PROBLEMS.filter(
    (p) => p.tags && p.tags.some((t) => tags.includes(t))
  ).length;
}

export default function LearnPage() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Learn <span className="text-yellow-400">→</span> Practice
          </h1>
          <Link
            href="/learn/notes"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            My Notes
          </Link>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">
          Each topic has key concepts and directly links to practice problems.
          Learn the idea, then immediately apply it — no external links.
        </p>
      </div>

      {/* Learning path banner */}
      <div className="mb-10 bg-yellow-400/5 border border-yellow-400/20 rounded-xl px-5 py-4">
        <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2">Recommended path</p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300">
          {["OOP Foundations", "SOLID Principles", "Design Patterns", "LLD Problems"].map((step, i, arr) => (
            <span key={step} className="flex items-center gap-2">
              <span>{step}</span>
              {i < arr.length - 1 && <span className="text-gray-600">→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Topic groups */}
      <div className="space-y-12">
        {TOPIC_GROUPS.map((group) => (
          <section key={group.id}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{group.emoji}</span>
              <h2 className="text-lg font-bold">{group.label}</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5">{group.description}</p>

            <div className="space-y-2">
              {group.topics.map((topic) => {
                const count = problemCountForTags(topic.matchTags);
                return (
                  <Link key={topic.id} href={`/learn/${topic.id}`}>
                    <div className="group flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-900/40 hover:border-gray-600 hover:bg-gray-900/70 transition-all cursor-pointer">
                      <span className="text-2xl shrink-0">{topic.emoji}</span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-gray-100">{topic.title}</p>
                          {topic.free && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/20">
                              Free
                            </span>
                          )}
                          {topic.videoUrl && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                              🎥 Video
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{topic.subtitle}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {count > 0 && (
                          <span className="text-xs text-gray-500">
                            {count} problem{count !== 1 ? "s" : ""}
                          </span>
                        )}
                        <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
