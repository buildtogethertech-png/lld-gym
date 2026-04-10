"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ClassNode from "./ClassNode";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// ── Edge types ────────────────────────────────────────────────────────────────

function InheritanceEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd }: EdgeProps) {
  const [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return <BaseEdge id={id} path={path} markerEnd={markerEnd} style={{ stroke: "#9ca3af", strokeWidth: 1.5 }} />;
}

function AssociationEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd }: EdgeProps) {
  const [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return <BaseEdge id={id} path={path} markerEnd={markerEnd} style={{ stroke: "#6b7280", strokeWidth: 1.5 }} />;
}

function AggregationEdge({ id, sourceX, sourceY, targetX, targetY }: EdgeProps) {
  const [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  return (
    <>
      <BaseEdge id={id} path={path} style={{ stroke: "#6b7280", strokeWidth: 1.5 }} />
      <EdgeLabelRenderer>
        <div style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${midX}px,${midY}px)`, fontSize: 18, pointerEvents: "none", color: "#9ca3af" }}>◇</div>
      </EdgeLabelRenderer>
    </>
  );
}

function CompositionEdge({ id, sourceX, sourceY, targetX, targetY }: EdgeProps) {
  const [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  return (
    <>
      <BaseEdge id={id} path={path} style={{ stroke: "#6b7280", strokeWidth: 1.5 }} />
      <EdgeLabelRenderer>
        <div style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${midX}px,${midY}px)`, fontSize: 18, pointerEvents: "none", color: "#f59e0b" }}>◆</div>
      </EdgeLabelRenderer>
    </>
  );
}

const nodeTypes: NodeTypes = { classNode: ClassNode };

const edgeTypes: EdgeTypes = {
  inheritance: InheritanceEdge,
  association: AssociationEdge,
  aggregation: AggregationEdge,
  composition: CompositionEdge,
};

const EDGE_OPTIONS = [
  { value: "association", label: "Association", hint: "—" },
  { value: "inheritance", label: "Inheritance", hint: "△" },
  { value: "aggregation", label: "Aggregation", hint: "◇" },
  { value: "composition", label: "Composition", hint: "◆" },
];

let nodeId = 1;

const SAMPLE_NODES = [
  {
    id: "sample-1",
    type: "classNode",
    position: { x: 320, y: 60 },
    data: {
      kind: "interface",
      name: "IPayable",
      attributes: [],
      methods: ["+ pay(amount: double): void", "+ refund(amount: double): void"],
    },
  },
  {
    id: "sample-2",
    type: "classNode",
    position: { x: 80, y: 260 },
    data: {
      kind: "class",
      name: "Order",
      attributes: ["- id: String", "- total: double", "- status: Status"],
      methods: ["+ addItem(item: Item): void", "+ getTotal(): double"],
    },
  },
  {
    id: "sample-3",
    type: "classNode",
    position: { x: 520, y: 260 },
    data: {
      kind: "class",
      name: "Payment",
      attributes: ["- amount: double", "- method: String"],
      methods: ["+ pay(amount: double): void", "+ refund(amount: double): void"],
    },
  },
  {
    id: "sample-4",
    type: "classNode",
    position: { x: 80, y: 500 },
    data: {
      kind: "class",
      name: "Item",
      attributes: ["- name: String", "- price: double", "- qty: int"],
      methods: ["+ getSubtotal(): double"],
    },
  },
];

const SAMPLE_EDGES = [
  {
    id: "se-1",
    source: "sample-3",
    target: "sample-1",
    type: "inheritance",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#9ca3af" },
  },
  {
    id: "se-2",
    source: "sample-2",
    target: "sample-3",
    type: "association",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#9ca3af" },
  },
  {
    id: "se-3",
    source: "sample-2",
    target: "sample-4",
    type: "composition",
  },
];

interface Props {
  diagramId?: string;
  initialTitle?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialNodes?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialEdges?: any[];
  /** When true: fills parent container, no negative margins, no title/save UI */
  embedded?: boolean;
}

export default function UMLEditor({ diagramId, initialTitle, initialNodes, initialEdges, embedded = false }: Props) {
  const { data: session } = useSession();
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nodes, setNodes, onNodesChange] = useNodesState<any>(initialNodes ?? (!embedded ? SAMPLE_NODES : []));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>(initialEdges ?? (!embedded ? SAMPLE_EDGES : []));
  const [relType, setRelType] = useState("association");
  const [title, setTitle] = useState(initialTitle ?? "Untitled Diagram");
  const [editingTitle, setEditingTitle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error" | "limit">("idle");
  const [diagramCount, setDiagramCount] = useState<number | null>(null);
  const [diagramLimit, setDiagramLimit] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<string | null>(diagramId ?? null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load usage count on mount
  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/diagrams").then(r => r.json()).then((list: { id: string }[]) => {
      setDiagramCount(list.length);
    });
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((u: { umlDiagrams?: number; isPaid?: boolean }) => {
        setDiagramLimit(typeof u.umlDiagrams === "number" ? u.umlDiagrams : u.isPaid ? 100 : 2);
      });
  }, [session?.user]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = {
        ...connection,
        id: `e-${Date.now()}`,
        type: relType,
        markerEnd: relType === "inheritance" || relType === "association"
          ? { type: MarkerType.ArrowClosed, color: "#9ca3af" }
          : undefined,
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [relType, setEdges]
  );

  function addNode(type: "class" | "interface") {
    const id = `node-${nodeId++}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "classNode",
        position: { x: 120 + Math.random() * 300, y: 80 + Math.random() * 200 },
        data: {
          kind: type,
          name: type === "interface" ? "INewInterface" : "NewClass",
          attributes: type === "class" ? ["+ attribute: Type"] : [],
          methods: ["+ method(): void"],
        },
      },
    ]);
  }

  function deleteSelected() {
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
  }

  function clearAll() {
    if (confirm("Clear the entire canvas?")) {
      setNodes([]);
      setEdges([]);
    }
  }

  async function saveDiagram() {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    setSaving(true);
    setSaveStatus("idle");

    try {
      let res: Response;
      if (savedId) {
        // Update existing
        res = await fetch(`/api/diagrams/${savedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, nodes, edges }),
        });
      } else {
        // Create new
        res = await fetch("/api/diagrams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, nodes, edges }),
        });
      }

      if (res.status === 422) {
        setSaveStatus("limit");
        return;
      }
      if (!res.ok) throw new Error();

      const data = await res.json();
      if (!savedId) {
        setSavedId(data.id);
        router.replace(`/uml-practice/${data.id}`);
        setDiagramCount((c) => (c ?? 0) + 1);
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  const atLimit = diagramLimit !== null && diagramCount !== null && diagramCount >= diagramLimit && !savedId;

  return (
    <div className={embedded ? "flex flex-col h-full w-full" : "flex flex-col h-[calc(100vh-56px)] -mx-5 sm:-mx-8 md:-mx-10 lg:-mx-12 -my-6 sm:-my-8"}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap px-3 py-1.5 border-b border-gray-800 bg-[#0f0f0f] shrink-0">
        {/* Back + title + save — hidden in embedded mode */}
        {!embedded && (
          <>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/uml-practice/my-diagrams" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                My Diagrams
              </Link>
            </div>
            <div className="w-px h-4 bg-gray-800" />
            {editingTitle ? (
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
                data-testid="uml-title-input"
                className="text-sm font-semibold text-gray-200 bg-gray-800 border border-gray-600 rounded px-2 py-0.5 outline-none w-44"
              />
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                data-testid="uml-title-display"
                className="text-sm font-semibold text-gray-300 hover:text-white transition-colors truncate max-w-[160px]"
                title="Click to rename"
              >
                {title}
              </button>
            )}
            <div className="w-px h-4 bg-gray-800" />
          </>
        )}

        {/* Node buttons */}
        <button onClick={() => addNode("class")} className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 px-3 py-1.5 rounded-lg transition-colors">
          <span className="text-yellow-400 font-bold">+</span> Class
        </button>
        <button onClick={() => addNode("interface")} className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 px-3 py-1.5 rounded-lg transition-colors">
          <span className="text-blue-400 font-bold">+</span> Interface
        </button>

        <div className="w-px h-4 bg-gray-800" />

        {/* Relationship selector */}
        <div className="flex items-center gap-1">
          {EDGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRelType(opt.value)}
              title={opt.label}
              className={`text-xs px-2 py-1.5 rounded-lg border transition-colors ${
                relType === opt.value
                  ? "bg-yellow-400/15 border-yellow-400/40 text-yellow-300"
                  : "bg-gray-800/50 border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700"
              }`}
            >
              {opt.hint} {opt.label}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-gray-800" />

        <button onClick={deleteSelected} className="flex items-center gap-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition-colors">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
        <button onClick={clearAll} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
          Clear
        </button>

        {/* Save — hidden in embedded mode */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Usage counter */}
          {diagramCount !== null && diagramLimit !== null && (
            <span className={`text-xs hidden sm:block ${atLimit ? "text-red-400" : "text-gray-600"}`}>
              {diagramCount}/{diagramLimit} saved
            </span>
          )}

          {saveStatus === "saved" && <span className="text-xs text-green-400">Saved ✓</span>}
          {saveStatus === "error" && <span className="text-xs text-red-400">Save failed</span>}
          {saveStatus === "limit" && (
            <span className="text-xs text-red-400">
              Limit reached —{" "}
              <Link href="/pricing" className="underline hover:text-yellow-400 transition-colors">upgrade</Link>
            </span>
          )}

          <button
            onClick={saveDiagram}
            disabled={saving}
            data-testid="uml-save-button"
            className="flex items-center gap-1.5 text-xs bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 min-h-0 bg-[#0a0a0a] relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          deleteKeyCode="Delete"
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1f2937" gap={24} size={1} />
          <Controls className="!bg-gray-900 !border-gray-800 !rounded-xl overflow-hidden" />
          <MiniMap
            className="!bg-gray-900 !border-gray-800 !rounded-xl"
            nodeColor="#374151"
            maskColor="rgba(0,0,0,0.6)"
          />
        </ReactFlow>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <p className="text-4xl mb-4">📐</p>
            <p className="text-sm font-medium text-gray-500">Start building your class diagram</p>
            <p className="text-xs text-gray-700 mt-1">
              Click <span className="text-gray-500">+ Class</span> or <span className="text-gray-500">+ Interface</span> in the toolbar
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-14 left-3 bg-[#111] border border-gray-800 rounded-xl px-3 py-2.5 text-xs space-y-1.5 pointer-events-none select-none shadow-lg">
          <p className="text-gray-600 font-semibold uppercase tracking-wider text-[10px] mb-1">Relationships</p>
          <div className="flex items-center gap-2 text-gray-400">
            <svg width="32" height="10" className="shrink-0"><line x1="0" y1="5" x2="24" y2="5" stroke="#6b7280" strokeWidth="1.5"/><polygon points="24,2 32,5 24,8" fill="#6b7280"/></svg>
            <span>Association — uses</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <svg width="32" height="10" className="shrink-0"><line x1="0" y1="5" x2="24" y2="5" stroke="#9ca3af" strokeWidth="1.5"/><polygon points="24,1 32,5 24,9" fill="none" stroke="#9ca3af" strokeWidth="1.5"/></svg>
            <span>Inheritance — extends / implements</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <svg width="32" height="10" className="shrink-0"><line x1="8" y1="5" x2="32" y2="5" stroke="#6b7280" strokeWidth="1.5"/><polygon points="0,5 8,2 16,5 8,8" fill="none" stroke="#9ca3af" strokeWidth="1.5"/></svg>
            <span>Aggregation — has (weak)</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <svg width="32" height="10" className="shrink-0"><line x1="8" y1="5" x2="32" y2="5" stroke="#6b7280" strokeWidth="1.5"/><polygon points="0,5 8,2 16,5 8,8" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"/></svg>
            <span>Composition — owns (strong)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
