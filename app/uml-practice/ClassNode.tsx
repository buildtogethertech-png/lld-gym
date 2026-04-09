"use client";

import { useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface ClassData {
  kind: "class" | "interface";
  name: string;
  attributes: string[];
  methods: string[];
  [key: string]: unknown;
}

export default function ClassNode({ data, selected, id }: NodeProps) {
  const d = data as ClassData;
  const [name, setName] = useState(d.name);
  const [attributes, setAttributes] = useState<string[]>(d.attributes);
  const [methods, setMethods] = useState<string[]>(d.methods);
  const [editingName, setEditingName] = useState(false);

  const isInterface = d.kind === "interface";

  const updateAttr = useCallback((i: number, val: string) => {
    setAttributes((prev) => prev.map((a, idx) => (idx === i ? val : a)));
  }, []);

  const updateMethod = useCallback((i: number, val: string) => {
    setMethods((prev) => prev.map((m, idx) => (idx === i ? val : m)));
  }, []);

  const removeAttr = (i: number) => setAttributes((prev) => prev.filter((_, idx) => idx !== i));
  const removeMethod = (i: number) => setMethods((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div
      className={`min-w-[180px] max-w-[260px] rounded-lg overflow-hidden shadow-lg border transition-all ${
        selected
          ? "border-yellow-400/60 shadow-yellow-400/10"
          : isInterface
          ? "border-blue-500/40"
          : "border-gray-600"
      } bg-[#1a1a1a]`}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-gray-600 !border-gray-500" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-gray-600 !border-gray-500" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-gray-600 !border-gray-500" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-gray-600 !border-gray-500" />

      {/* Header */}
      <div className={`px-3 py-2 text-center border-b ${isInterface ? "bg-blue-950/40 border-blue-500/20" : "bg-gray-800/60 border-gray-700"}`}>
        {isInterface && (
          <p className="text-[9px] text-blue-400 font-medium tracking-widest uppercase mb-0.5">«interface»</p>
        )}
        {editingName ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
            className="w-full bg-transparent text-center text-sm font-bold text-gray-100 outline-none border-b border-yellow-400/50"
          />
        ) : (
          <p
            className="text-sm font-bold text-gray-100 cursor-pointer hover:text-yellow-300 transition-colors"
            onDoubleClick={() => setEditingName(true)}
            title="Double-click to rename"
          >
            {name}
          </p>
        )}
      </div>

      {/* Attributes — only for classes */}
      {!isInterface && (
        <div className="border-b border-gray-700/60 px-2 py-1.5 min-h-[28px]">
          {attributes.map((attr, i) => (
            <div key={i} className="flex items-center gap-1 group/row">
              <input
                value={attr}
                onChange={(e) => updateAttr(i, e.target.value)}
                className="flex-1 bg-transparent text-xs text-gray-400 outline-none py-0.5 font-mono"
              />
              <button
                onClick={() => removeAttr(i)}
                className="opacity-0 group-hover/row:opacity-100 text-gray-600 hover:text-red-400 transition-all text-xs leading-none"
              >×</button>
            </div>
          ))}
          <button
            onClick={() => setAttributes((p) => [...p, "+ attr: Type"])}
            className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors mt-0.5"
          >
            + attribute
          </button>
        </div>
      )}

      {/* Methods */}
      <div className="px-2 py-1.5 min-h-[28px]">
        {methods.map((method, i) => (
          <div key={i} className="flex items-center gap-1 group/row">
            <input
              value={method}
              onChange={(e) => updateMethod(i, e.target.value)}
              className="flex-1 bg-transparent text-xs text-gray-400 outline-none py-0.5 font-mono"
            />
            <button
              onClick={() => removeMethod(i)}
              className="opacity-0 group-hover/row:opacity-100 text-gray-600 hover:text-red-400 transition-all text-xs leading-none"
            >×</button>
          </div>
        ))}
        <button
          onClick={() => setMethods((p) => [...p, "+ method(): void"])}
          className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors mt-0.5"
        >
          + method
        </button>
      </div>
    </div>
  );
}
