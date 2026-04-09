import Link from "next/link";
import type { Metadata } from "next";
import { TOPIC_GROUPS, ALL_TOPICS } from "@/lib/topics";
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

const totalVideos = ALL_TOPICS.filter((t) => t.videoUrl).length;
const totalProblems = ALL_PROBLEMS.length;

export default function LearnPage() {
  return (
    <div className="max-w-[1200px]">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-8"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_268px] gap-10 items-start">

        {/* ── Left: main content ── */}
        <div>
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                Learn <span className="text-yellow-400">→</span> Practice
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                Each topic has a video, key concepts, and practice problems — all in one place.
              </p>
            </div>
            <Link
              href="/learn/notes"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors shrink-0 mt-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              My Notes
            </Link>
          </div>

          {/* Topic groups */}
          <div className="space-y-10">
            {TOPIC_GROUPS.map((group) => (
              <section key={group.id} id={group.id} className="scroll-mt-20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{group.emoji}</span>
                  <h2 className="text-lg font-bold">{group.label}</h2>
                  <span className="text-xs text-gray-700 ml-1">{group.topics.length} topics</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{group.description}</p>

                <div className="space-y-2">
                  {group.topics.map((topic) => {
                    const count = problemCountForTags(topic.matchTags);
                    return (
                      <Link key={topic.id} href={`/learn/${topic.id}`}>
                        <div className="group flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-900/40 hover:border-gray-700 hover:bg-gray-900/70 transition-all cursor-pointer">
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
                            <p className="text-xs text-gray-600">{topic.subtitle}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {count > 0 && (
                              <span className="text-xs text-gray-600">
                                {count} problem{count !== 1 ? "s" : ""}
                              </span>
                            )}
                            <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

        {/* ── Right: sticky sidebar ── */}
        <aside className="sticky top-20 space-y-3 hidden lg:block">

          {/* Learning Path — clickable, scrolls to section */}
          <div className="rounded-xl border border-gray-800 bg-[#161616] p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Learning Path</p>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-3.5 top-4 bottom-4 w-px bg-gray-800" />
              <div className="space-y-1">
                {TOPIC_GROUPS.map((group, i) => (
                  <a
                    key={group.id}
                    href={`#${group.id}`}
                    className="flex items-center gap-3 py-2 group/item rounded-lg hover:bg-gray-800/50 px-1 transition-colors"
                  >
                    {/* Step circle */}
                    <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 group-hover/item:border-yellow-400/50 group-hover/item:bg-yellow-400/10 flex items-center justify-center text-xs font-bold text-gray-500 group-hover/item:text-yellow-400 transition-all shrink-0 z-10">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-400 group-hover/item:text-gray-200 transition-colors truncate">
                        {group.label}
                      </p>
                      <p className="text-xs text-gray-700">{group.topics.length} topics</p>
                    </div>
                    <span className="text-base shrink-0">{group.emoji}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-xl border border-gray-800 bg-[#161616] p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">How it works</p>
            <div className="space-y-3">
              {[
                { icon: "🎥", label: "Watch", desc: "Short focused video" },
                { icon: "📘", label: "Read", desc: "Key concepts, no fluff" },
                { icon: "🧠", label: "Practice", desc: "Solve linked problems" },
              ].map((step) => (
                <div key={step.label} className="flex items-start gap-3">
                  <span className="text-base mt-0.5">{step.icon}</span>
                  <div>
                    <p className="text-xs font-medium text-gray-300">{step.label}</p>
                    <p className="text-xs text-gray-600">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-xl border border-gray-800 bg-[#161616] p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">At a Glance</p>
            <div className="space-y-2">
              {[
                { label: "Topics", value: ALL_TOPICS.length },
                { label: "With video", value: totalVideos },
                { label: "Practice problems", value: totalProblems },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{s.label}</span>
                  <span className="text-sm font-semibold text-gray-200">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <Link href="/learn/notes">
            <div className="rounded-xl border border-gray-800 hover:border-gray-700 bg-[#161616] p-4 transition-all group cursor-pointer">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-yellow-400/60 group-hover:text-yellow-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <p className="text-xs font-semibold text-gray-400 group-hover:text-gray-200 transition-colors">My Notes</p>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Every topic has a notes section. Writing it down is half the battle.
              </p>
            </div>
          </Link>

        </aside>
      </div>
    </div>
  );
}
