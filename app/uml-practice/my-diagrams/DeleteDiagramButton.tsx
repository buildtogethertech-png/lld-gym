"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteDiagramButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/diagrams/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {deleting ? "…" : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-gray-600 hover:text-gray-400 px-2 py-1.5 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-gray-700 hover:text-red-400 transition-colors border border-gray-800 hover:border-red-500/20 px-2 py-1.5 rounded-lg"
      title="Delete diagram"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}
