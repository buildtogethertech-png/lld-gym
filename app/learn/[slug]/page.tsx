import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { TOPIC_MAP, ALL_TOPICS } from "@/lib/topics";
import { FOUNDATION_PROBLEMS } from "@/lib/foundation-problems";
import { PROBLEMS } from "@/lib/problems";
import type { Problem } from "@/lib/types";
import NoteEditor from "@/components/NoteEditor";
import CodeBlock from "@/components/learn/CodeBlock";
import { getTopicSideContent } from "@/lib/topic-side-content";

const ALL_PROBLEMS = [...FOUNDATION_PROBLEMS, ...PROBLEMS];

export function generateStaticParams() {
  return ALL_TOPICS.map((t) => ({ slug: t.id }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const topic = TOPIC_MAP[params.slug];
  if (!topic) return {};
  return {
    title: `${topic.title} — Learn — LLD Hub`,
    description: topic.subtitle,
  };
}

function getTopicProblems(matchTags: string[]): Problem[] {
  return ALL_PROBLEMS.filter(
    (p) => p.tags && p.tags.some((t) => matchTags.includes(t))
  );
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

export default function TopicPage({ params }: { params: { slug: string } }) {
  const topic = TOPIC_MAP[params.slug];
  if (!topic) notFound();

  const problems = getTopicProblems(topic.matchTags);
  const side = getTopicSideContent(topic);

  return (
    <div className="w-full max-w-none">
      {/* Compact top: back + title + one-line takeaways */}
      <header className="mb-5 sm:mb-6">
        <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
          <Link
            href="/learn"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors shrink-0 mt-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Learn
          </Link>
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <span className="text-2xl leading-none shrink-0" aria-hidden>
              {topic.emoji}
            </span>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-100">
                {topic.title}
                <span className="font-normal text-gray-500"> — {topic.subtitle}</span>
              </h1>
              <p className="mt-1.5 text-xs text-gray-500 leading-snug line-clamp-2 sm:line-clamp-none">
                {side.takeaways.join(" · ")}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Video (left) + notes (right) — same row on xl */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,420px)] gap-6 xl:gap-8 2xl:gap-10 xl:items-stretch mb-12">
        <section className="min-w-0 flex flex-col">
          <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Watch
          </h2>
          {topic.videoUrl ? (
            <div className="relative w-full rounded-xl overflow-hidden border border-gray-800 bg-black shadow-xl shadow-black/40" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={topic.videoUrl}
                title={topic.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-800 bg-gray-900/30 py-12 text-center">
              <span className="text-3xl">🎬</span>
              <p className="text-sm font-medium text-gray-400">Video coming soon</p>
              <p className="text-xs text-gray-600">Use the notes panel to capture ideas anyway</p>
            </div>
          )}

          <p className="mt-2 text-[11px] text-gray-600 text-center xl:text-left shrink-0">
            Watch, then scroll down for code and practice.
          </p>
        </section>

        <aside className="min-w-0 flex flex-col xl:h-full xl:min-h-0">
          <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
            <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              My notes
            </h2>
            <Link href="/learn/notes" className="text-xs text-gray-600 hover:text-gray-400 transition-colors whitespace-nowrap">
              All notes →
            </Link>
          </div>
          <div className="flex-1 min-h-[280px] xl:min-h-0 flex flex-col">
            <NoteEditor topicId={topic.id} fillHeight />
          </div>
        </aside>
      </div>

      {/* In code + Key ideas — bottom */}
      <section className="mb-12 space-y-10">
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            In code
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xl:gap-6">
            {side.examples.map((ex, i) => (
              <CodeBlock key={i} title={ex.title} code={ex.code} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            📘 Key ideas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {topic.concepts.map((concept, i) => (
              <div
                key={i}
                className="bg-[#161616] border border-gray-800 rounded-xl p-4 hover:border-gray-700/90 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-200 mb-1.5">{concept.title}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{concept.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Practice Problems ── */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          🧠 Practice — Apply What You Learned
        </h2>

        {problems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-800 bg-gray-900/30 py-10 text-center">
            <p className="text-sm text-gray-500">No practice problems linked yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {problems.map((problem) => {
              const diff = DIFFICULTY_LABEL[problem.difficulty] ?? { label: "Unknown", color: "text-gray-400 bg-gray-400/10 border-gray-400/20" };
              return (
                <Link key={problem.id} href={`/problem/${problem.id}`}>
                  <div className="group flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-900/40 hover:border-yellow-400/40 hover:bg-gray-900/70 transition-all cursor-pointer">
                    {/* Status circle */}
                    <div className="w-6 h-6 rounded-full border border-gray-700 group-hover:border-yellow-400/50 transition-colors shrink-0" />

                    {/* Title + description */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-100 truncate">{problem.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{problem.description.slice(0, 90)}…</p>
                    </div>

                    {/* Free badge */}
                    {problem.free && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 shrink-0">
                        Free
                      </span>
                    )}

                    {/* Difficulty */}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 border ${diff.color}`}>
                      L{problem.difficulty} · {diff.label}
                    </span>

                    <svg className="w-4 h-4 text-gray-700 group-hover:text-yellow-400/60 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* CTA after problems */}
        {problems.length > 0 && (
          <div className="mt-6 rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-5 text-center">
            <p className="text-sm font-semibold text-yellow-300 mb-1">🚀 Now apply what you learned</p>
            <p className="text-xs text-gray-400 mb-4">
              Pick a problem above, write your solution, and get AI feedback on your design.
            </p>
            <Link
              href={`/problem/${problems[0].id}`}
              className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-5 py-2 rounded-xl text-sm transition-colors"
            >
              Start Practice →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
