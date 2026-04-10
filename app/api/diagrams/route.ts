import { NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/plan-config";

// GET — list user's diagrams
export async function GET() {
  const uid = await getUid();
  if (!uid) return NextResponse.json([], { status: 200 });

  const diagrams = await prisma.diagram.findMany({
    where: { userId: uid },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true, createdAt: true },
  });

  return NextResponse.json(diagrams);
}

// POST — create new diagram
export async function POST(req: Request) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, nodes, edges } = await req.json();

  // Check limit
  const user = await prisma.user.findUnique({ where: { id: uid }, select: { isPaid: true, planId: true, planExpiry: true } });
  const plan = await getEffectivePlan({ planId: user?.planId ?? null, planExpiry: user?.planExpiry ?? null, isPaid: user?.isPaid ?? false });
  const limit = plan.umlDiagrams;
  const count = await prisma.diagram.count({ where: { userId: uid } });

  if (count >= limit) {
    return NextResponse.json(
      { error: "LIMIT_REACHED", limit, count },
      { status: 422 }
    );
  }

  const diagram = await prisma.diagram.create({
    data: {
      userId: uid,
      title: (title?.trim() || "Untitled Diagram").slice(0, 100),
      nodes: JSON.stringify(nodes ?? []),
      edges: JSON.stringify(edges ?? []),
    },
  });

  return NextResponse.json({ id: diagram.id, title: diagram.title });
}
