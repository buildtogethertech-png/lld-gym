"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { NOTE_MAX_LENGTH } from "@/lib/note-limits";
import { renderTopicNoteHtml } from "@/lib/render-topic-note";

interface Props {
  topicId: string;
  /** Fill parent height (e.g. notes beside video on learn topic pages). */
  fillHeight?: boolean;
}

export default function NoteEditor({ topicId, fillHeight = false }: Props) {
  const { data: session, status } = useSession();
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    fetch(`/api/notes/${topicId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.content) setContent(d.content);
      });
  }, [topicId, session?.user]);

  const save = useCallback(
    async (text: string) => {
      setSaving(true);
      await fetch(`/api/notes/${topicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      setSaving(false);
      setSaved(true);
    },
    [topicId]
  );

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value.slice(0, NOTE_MAX_LENGTH);
    setContent(val);
    setSaved(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(val), 1200);
  }

  function wrap(before: string, after: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const newContent = content.slice(0, start) + before + selected + after + content.slice(end);
    if (newContent.length > NOTE_MAX_LENGTH) return;
    setContent(newContent);
    setSaved(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(newContent), 1200);
    const innerStart = start + before.length;
    const innerEnd = innerStart + selected.length;
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(innerStart, innerEnd);
    }, 0);
  }

  if (status === "loading") return null;

  if (!session) {
    return (
      <div
        className={`rounded-xl border border-dashed border-gray-800 bg-gray-900/30 py-8 text-center ${
          fillHeight ? "h-full min-h-[200px] flex flex-col items-center justify-center" : ""
        }`}
      >
        <p className="text-sm text-gray-500 mb-3">Sign in to take notes while you watch</p>
        <Link href="/login" className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors">
          Sign in →
        </Link>
      </div>
    );
  }

  const shell = fillHeight
    ? "h-full min-h-0 flex flex-col rounded-xl border border-gray-800 bg-[#161616] overflow-hidden"
    : "rounded-xl border border-gray-800 bg-[#161616] overflow-hidden";

  const previewHtml = renderTopicNoteHtml(content);

  return (
    <div className={shell}>
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-800 bg-gray-900/50 shrink-0">
        <button
          type="button"
          onClick={() => wrap("**", "**")}
          className="px-2.5 py-1 text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
          title="Bold **text**"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => wrap("==", "==")}
          className="px-2.5 py-1 text-xs font-semibold text-yellow-400 hover:text-yellow-300 hover:bg-gray-800 rounded transition-colors"
          title="Highlight ==text=="
        >
          H
        </button>
        <div className="w-px h-4 bg-gray-800 mx-1" />
        <button
          type="button"
          onClick={() => setPreview((v) => !v)}
          className={`px-2.5 py-1 text-xs rounded transition-colors ${
            preview
              ? "bg-gray-700 text-gray-200"
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
          }`}
        >
          {preview ? "Edit" : "Preview"}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className={`text-xs ${content.length >= NOTE_MAX_LENGTH ? "text-red-400" : "text-gray-600"}`}>
            {content.length}/{NOTE_MAX_LENGTH}
          </span>
          {saving && <span className="text-xs text-gray-600">saving…</span>}
          {!saving && saved && content.length > 0 && (
            <span className="text-xs text-green-500/70">saved</span>
          )}
        </div>
      </div>

      <div className={fillHeight ? "flex-1 min-h-0 flex flex-col" : ""}>
        {preview ? (
          <div
            className={`px-4 py-3 text-sm text-gray-300 leading-relaxed overflow-y-auto ${
              fillHeight ? "flex-1 min-h-[120px]" : "min-h-[140px]"
            }`}
            dangerouslySetInnerHTML={{
              __html:
                previewHtml ||
                '<span class="text-gray-600">Nothing to preview yet.</span>',
            }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            placeholder="Simple notes — **bold**, ==highlight==. Blank lines stay. Auto-saves."
            className={`w-full bg-transparent px-4 py-3 text-sm text-gray-300 placeholder-gray-600 resize-none outline-none leading-relaxed ${
              fillHeight ? "flex-1 min-h-[220px]" : "min-h-[140px]"
            }`}
            maxLength={NOTE_MAX_LENGTH}
            spellCheck
          />
        )}
      </div>
    </div>
  );
}
