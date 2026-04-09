import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { TOPIC_MAP, ALL_TOPICS } from "@/lib/topics";
import { FOUNDATION_PROBLEMS } from "@/lib/foundation-problems";
import { PROBLEMS } from "@/lib/problems";
import type { Problem } from "@/lib/types";
import NoteEditor from "@/components/NoteEditor";

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

  return (
    <div className="max-w-3xl">
      {/* Back */}
      <div className="mb-6">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Learn
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{topic.emoji}</span>
          <div>
            <h1 className="text-2xl font-bold">{topic.title}</h1>
            <p className="text-gray-400 text-sm">{topic.subtitle}</p>
          </div>
        </div>
      </div>

      {/* ── Section 1: Video ── */}
      <section className="mb-10">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          🎥 Watch
        </h2>
        {topic.videoUrl ? (
          <div className="relative w-full rounded-xl overflow-hidden border border-gray-800 bg-black" style={{ paddingBottom: "56.25%" }}>
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
            <p className="text-xs text-gray-600">Continue to the notes and practice below</p>
          </div>
        )}

        <p className="mt-3 text-xs text-gray-500 italic text-center">
          Watching builds intuition. Solving builds skill. Don't stop here.
        </p>
      </section>

      {/* ── Section 2: Key Concepts ── */}
      <section className="mb-10">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          📘 Key Concepts
        </h2>
        <div className="space-y-3">
          {topic.concepts.map((concept, i) => (
            <div key={i} className="bg-[#161616] border border-gray-800 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-200 mb-1">{concept.title}</p>
              <p className="text-sm text-gray-400 leading-relaxed">{concept.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: My Notes ── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            📝 My Notes
          </h2>
          <Link href="/learn/notes" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
            View all notes →
          </Link>
        </div>
        <NoteEditor topicId={topic.id} />
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
