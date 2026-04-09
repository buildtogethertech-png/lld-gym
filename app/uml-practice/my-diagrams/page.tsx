import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";
import { getUmlLimit, UML_LIMITS } from "@/lib/uml-limits";
import DeleteDiagramButton from "./DeleteDiagramButton";

export const metadata: Metadata = {
  title: "My Diagrams — LLD Hub",
};

export default async function MyDiagramsPage() {
  const uid = await getUid();
  if (!uid) redirect("/login");

  const [diagrams, user] = await Promise.all([
    prisma.diagram.findMany({
      where: { userId: uid },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true, createdAt: true, nodes: true },
    }),
    prisma.user.findUnique({ where: { id: uid }, select: { isPaid: true } }),
  ]);

  const limit = getUmlLimit(user?.isPaid ?? false);
  const count = diagrams.length;
  const atLimit = count >= limit;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">My Diagrams</h1>
            <p className="text-sm text-gray-500">
              {count === 0
                ? "No diagrams yet. Start drawing."
                : `${count} of ${limit} diagrams used${!user?.isPaid ? ` (free tier — upgrade for ${UML_LIMITS.paid})` : ""}`}
            </p>
          </div>
          {atLimit ? (
            <Link
              href="/pricing"
              className="shrink-0 text-xs bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Upgrade for more →
            </Link>
          ) : (
            <Link
              href="/uml-practice/new"
              className="shrink-0 flex items-center gap-1.5 text-xs bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Diagram
            </Link>
          )}
        </div>
      </div>

      {/* Usage bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-600">{count}/{limit} diagrams</span>
          {!user?.isPaid && (
            <Link href="/pricing" className="text-xs text-yellow-400/70 hover:text-yellow-400 transition-colors">
              Upgrade for {UML_LIMITS.paid} →
            </Link>
          )}
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
          <div
            className={`h-1 rounded-full transition-all ${atLimit ? "bg-red-400" : "bg-yellow-400"}`}
            style={{ width: `${Math.min((count / limit) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* List */}
      {count === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-800 bg-gray-900/30 py-16 text-center">
          <p className="text-3xl mb-3">📐</p>
          <p className="text-sm text-gray-400 mb-4">No diagrams saved yet.</p>
          <Link href="/uml-practice/new" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
            Start drawing →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {diagrams.map((d) => {
            const nodeCount = (() => { try { return JSON.parse(d.nodes).length; } catch { return 0; } })();
            return (
              <div key={d.id} className="group flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-900/40 hover:border-gray-700 hover:bg-gray-900/70 transition-all">
                {/* Icon */}
                <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center text-lg shrink-0">
                  📐
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-100 truncate">{d.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {nodeCount} class{nodeCount !== 1 ? "es" : ""} · Updated {new Date(d.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/uml-practice/${d.id}`}
                    className="text-xs text-gray-500 hover:text-yellow-400 transition-colors border border-gray-800 hover:border-yellow-400/40 px-3 py-1.5 rounded-lg"
                  >
                    Open →
                  </Link>
                  <DeleteDiagramButton id={d.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
