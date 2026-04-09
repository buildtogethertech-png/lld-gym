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

const PATH_STAGES = TOPIC_GROUPS.map((g) => ({
  emoji: g.emoji,
  label: g.label,
  count: g.topics.length,
  id: g.id,
}));

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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-10 items-start">

        {/* ── Left: main content ── */}
        <div>
          {/* Header */}
          <div className="mb-8">
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
            <p className="text-gray-500 text-sm leading-relaxed">
              Each topic has a video, key concepts, and practice problems — all in one place.
            </p>
          </div>

          {/* Topic groups */}
          <div className="space-y-10">
            {TOPIC_GROUPS.map((group) => (
              <section key={group.id}>
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
        <aside className="sticky top-20 space-y-4 hidden lg:block">

          {/* Learning Path */}
          <div className="rounded-xl border border-gray-800 bg-[#161616] p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Your Path</p>
            <div className="space-y-1">
              {PATH_STAGES.map((stage, i) => (
                <div key={stage.id}>
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center text-base shrink-0">
                      {stage.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-300 truncate">{stage.label}</p>
                      <p className="text-xs text-gray-700">{stage.count} topics</p>
                    </div>
                    <span className="text-xs text-gray-700 font-mono">{i + 1}</span>
                  </div>
                  {i < PATH_STAGES.length - 1 && (
                    <div className="ml-3.5 w-px h-3 bg-gray-800" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-xl border border-gray-800 bg-[#161616] p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">At a Glance</p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Topics</span>
                <span className="text-sm font-semibold text-gray-200">{ALL_TOPICS.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">With video</span>
                <span className="text-sm font-semibold text-gray-200">{totalVideos}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Practice problems</span>
                <span className="text-sm font-semibold text-gray-200">{totalProblems}</span>
              </div>
            </div>
          </div>

          {/* Notes CTA */}
          <Link href="/learn/notes">
            <div className="rounded-xl border border-gray-800 hover:border-gray-700 bg-[#161616] hover:bg-gray-900/70 p-4 transition-all group cursor-pointer">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-yellow-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <p className="text-xs font-semibold text-gray-300 group-hover:text-white transition-colors">My Notes</p>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Every topic has a notes section. Writing it down makes it stick.
              </p>
            </div>
          </Link>

          {/* Tip */}
          <div className="rounded-xl border border-dashed border-gray-800 p-4">
            <p className="text-xs text-gray-600 italic leading-relaxed">
              &ldquo;You don&apos;t rise to the level of your goals, you fall to the level of your systems.&rdquo;
            </p>
            <p className="text-xs text-gray-700 mt-2">— James Clear</p>
          </div>
        </aside>

      </div>
    </div>
  );
}
