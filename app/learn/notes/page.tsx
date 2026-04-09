import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";
import { TOPIC_MAP } from "@/lib/topics";
import { renderTopicNoteHtml } from "@/lib/render-topic-note";

export const metadata: Metadata = {
  title: "My Notes — LLD Hub",
  description: "Your topic notes in one place.",
};

export default async function MyNotesPage() {
  const uid = await getUid();
  if (!uid) redirect("/login");

  const notes = await prisma.topicNote.findMany({
    where: { userId: uid, NOT: { content: "" } },
    orderBy: { updatedAt: "desc" },
  });

  const notesWithTopic = notes
    .map((n) => ({ ...n, topic: TOPIC_MAP[n.topicId] }))
    .filter((n) => n.topic);

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Learn
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mb-1">My Notes</h1>
        <p className="text-sm text-gray-500">
          {notesWithTopic.length === 0
            ? "No notes yet. Start learning and jot down your thoughts."
            : `${notesWithTopic.length} topic${notesWithTopic.length !== 1 ? "s" : ""} with notes`}
        </p>
      </div>

      {notesWithTopic.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-800 bg-gray-900/30 py-16 text-center">
          <p className="text-3xl mb-3">📝</p>
          <p className="text-sm text-gray-400 mb-4">You haven't written any notes yet.</p>
          <Link
            href="/learn"
            className="inline-block text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            Start learning →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {notesWithTopic.map(({ topic, content, topicId, updatedAt }) => (
            <div key={topicId} className="rounded-xl border border-gray-800 bg-[#161616] overflow-hidden">
              {/* Topic header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/40">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{topic.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{topic.title}</p>
                    <p className="text-xs text-gray-600">{topic.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-700">
                    {new Date(updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                  <Link
                    href={`/learn/${topicId}`}
                    className="text-xs text-yellow-400/70 hover:text-yellow-400 transition-colors"
                  >
                    Edit →
                  </Link>
                </div>
              </div>

              {/* Note content */}
              <div
                className="px-4 py-3 text-sm text-gray-400 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderTopicNoteHtml(content) }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
