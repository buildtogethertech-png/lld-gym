"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

const MAX = 1500;

function renderNote(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/==(.+?)==/g, '<mark class="bg-yellow-400/30 text-yellow-200 rounded px-0.5">$1</mark>')
    .replace(/\n/g, "<br />");
}

interface Props {
  topicId: string;
}

export default function NoteEditor({ topicId }: Props) {
  const { data: session, status } = useSession();
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load note
  useEffect(() => {
    if (!session?.user) return;
    fetch(`/api/notes/${topicId}`)
      .then((r) => r.json())
      .then((d) => { if (d.content) setContent(d.content); });
  }, [topicId, session?.user]);

  // Auto-save with debounce
  const save = useCallback(async (text: string) => {
    setSaving(true);
    await fetch(`/api/notes/${topicId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    setSaving(false);
    setSaved(true);
  }, [topicId]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value.slice(0, MAX);
    setContent(val);
    setSaved(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(val), 1200);
  }

  // Toolbar: wrap selected text
  function wrap(before: string, after: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const newContent = content.slice(0, start) + before + selected + after + content.slice(end);
    if (newContent.length > MAX) return;
    setContent(newContent);
    setSaved(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(newContent), 1200);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  }

  if (status === "loading") return null;

  if (!session) {
    return (
      <div className="rounded-xl border border-dashed border-gray-800 bg-gray-900/30 py-8 text-center">
        <p className="text-sm text-gray-500 mb-3">Sign in to take notes on this topic</p>
        <Link href="/login" className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors">
          Sign in →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-[#161616] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-800 bg-gray-900/50">
        <button
          onClick={() => wrap("**", "**")}
          className="px-2.5 py-1 text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
          title="Bold (select text first)"
        >
          B
        </button>
        <button
          onClick={() => wrap("==", "==")}
          className="px-2.5 py-1 text-xs font-semibold text-yellow-400 hover:text-yellow-300 hover:bg-gray-800 rounded transition-colors"
          title="Highlight (select text first)"
        >
          H
        </button>
        <div className="w-px h-4 bg-gray-800 mx-1" />
        <button
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
          <span className={`text-xs ${content.length >= MAX ? "text-red-400" : "text-gray-600"}`}>
            {content.length}/{MAX}
          </span>
          {saving && <span className="text-xs text-gray-600">saving…</span>}
          {!saving && saved && content.length > 0 && (
            <span className="text-xs text-green-500/70">saved</span>
          )}
        </div>
      </div>

      {/* Editor / Preview */}
      {preview ? (
        <div
          className="min-h-[140px] px-4 py-3 text-sm text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderNote(content) || '<span class="text-gray-600">Nothing to preview yet.</span>' }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          placeholder="Write your notes here… Select text and press B or H to format."
          className="w-full min-h-[140px] bg-transparent px-4 py-3 text-sm text-gray-300 placeholder-gray-700 resize-none outline-none leading-relaxed"
          maxLength={MAX}
        />
      )}
    </div>
  );
}
