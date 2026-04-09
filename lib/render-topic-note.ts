/**
 * Simple note → HTML for preview and /learn/notes.
 * Plain text is escaped first; then **bold**, ==highlight==, and line breaks.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderTopicNoteHtml(text: string): string {
  if (!text.trim()) return "";
  const e = escapeHtml(text);
  return e
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(
      /==(.+?)==/g,
      '<mark class="bg-yellow-400/30 text-yellow-200 rounded px-0.5">$1</mark>'
    )
    .replace(/\n/g, "<br />");
}
