interface Props {
  title?: string;
  code: string;
}

/** Dark code panel — no runtime highlighter to keep the learn page light. */
export default function CodeBlock({ title, code }: Props) {
  return (
    <div className="rounded-xl border border-gray-800 bg-[#0a0a0c] overflow-hidden shadow-lg shadow-black/20">
      {title && (
        <div className="px-3 py-2 border-b border-gray-800/80 bg-gray-900/50 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{title}</span>
          <span className="text-[10px] text-gray-600 font-mono">TypeScript</span>
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-gray-300 m-0">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}
