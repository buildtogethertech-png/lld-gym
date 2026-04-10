"use client";

import dynamic from "next/dynamic";
import { useRef, useState, useCallback, useEffect } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-950 flex items-center justify-center text-gray-600 text-sm">
      Loading editor…
    </div>
  ),
});

interface Props {
  value: string;
  onChange: (value: string) => void;
  initialHeight?: number;
  fillHeight?: boolean;  // fills parent flex container — no fixed px height, no resize handle
  language?: string;
  autoSuggest?: boolean;
}

export default function CodeEditor({
  value,
  onChange,
  initialHeight = 500,
  fillHeight = false,
  language = "typescript",
  autoSuggest = true,
}: Props) {
  const editorRef = useRef<unknown>(null);
  const [editorHeight, setEditorHeight] = useState(initialHeight);

  useEffect(() => {
    if (!fillHeight) setEditorHeight(initialHeight);
  }, [initialHeight, fillHeight]);

  // ── Resize drag ──────────────────────────────────────────────────────────
  const isResizing = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);
  const moveHandler = useRef<((e: MouseEvent) => void) | null>(null);
  const upHandler = useRef<(() => void) | null>(null);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      startY.current = e.clientY;
      startH.current = editorHeight;

      moveHandler.current = (ev: MouseEvent) => {
        const delta = ev.clientY - startY.current;
        const next = Math.max(200, Math.min(1200, startH.current + delta));
        setEditorHeight(next);
      };

      upHandler.current = () => {
        isResizing.current = false;
        if (moveHandler.current) document.removeEventListener("mousemove", moveHandler.current);
        if (upHandler.current) document.removeEventListener("mouseup", upHandler.current);
      };

      document.addEventListener("mousemove", moveHandler.current);
      document.addEventListener("mouseup", upHandler.current);
    },
    [editorHeight]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (moveHandler.current) document.removeEventListener("mousemove", moveHandler.current);
      if (upHandler.current) document.removeEventListener("mouseup", upHandler.current);
    };
  }, []);

  function handleMount(editor: unknown) {
    editorRef.current = editor;
  }

  if (fillHeight) {
    return (
      <div className="w-full h-full" data-testid="monaco-code-editor">
        <MonacoEditor
          height="100%"
          language={language}
          value={value}
          onChange={(v) => onChange(v ?? "")}
          onMount={handleMount}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            wordWrap: "on",
            tabSize: 2,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: "line",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            bracketPairColorization: { enabled: true },
            quickSuggestions: autoSuggest ? { other: true, comments: false, strings: false } : false,
            suggestOnTriggerCharacters: autoSuggest,
            acceptSuggestionOnEnter: autoSuggest ? "on" : "off",
            parameterHints: { enabled: autoSuggest },
            wordBasedSuggestions: autoSuggest ? "currentDocument" : "off",
          }}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-800 flex flex-col select-none" data-testid="monaco-code-editor">
      {/* Monaco */}
      <div style={{ height: editorHeight }}>
        <MonacoEditor
          height={editorHeight}
          language={language}
          value={value}
          onChange={(v) => onChange(v ?? "")}
          onMount={handleMount}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            wordWrap: "on",
            tabSize: 2,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: "line",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            bracketPairColorization: { enabled: true },
            // Autosuggestion controls
            quickSuggestions: autoSuggest ? { other: true, comments: false, strings: false } : false,
            suggestOnTriggerCharacters: autoSuggest,
            acceptSuggestionOnEnter: autoSuggest ? "on" : "off",
            parameterHints: { enabled: autoSuggest },
            wordBasedSuggestions: autoSuggest ? "currentDocument" : "off",
          }}
        />
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className="h-2.5 flex items-center justify-center bg-gray-900 border-t border-gray-800 cursor-ns-resize group hover:bg-gray-800 transition-colors"
        title="Drag to resize"
      >
        <div className="w-8 h-0.5 rounded-full bg-gray-700 group-hover:bg-gray-500 transition-colors" />
      </div>
    </div>
  );
}
