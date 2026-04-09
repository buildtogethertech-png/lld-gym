import { NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";

// GET — load single diagram
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const diagram = await prisma.diagram.findFirst({
    where: { id: params.id, userId: uid },
  });

  if (!diagram) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: diagram.id,
    title: diagram.title,
    nodes: JSON.parse(diagram.nodes),
    edges: JSON.parse(diagram.edges),
    updatedAt: diagram.updatedAt,
  });
}

// PUT — update diagram
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.diagram.findFirst({ where: { id: params.id, userId: uid } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, nodes, edges } = await req.json();

  const diagram = await prisma.diagram.update({
    where: { id: params.id },
    data: {
      title: (title?.trim() || "Untitled Diagram").slice(0, 100),
      nodes: JSON.stringify(nodes ?? []),
      edges: JSON.stringify(edges ?? []),
    },
  });

  return NextResponse.json({ id: diagram.id, title: diagram.title, updatedAt: diagram.updatedAt });
}

// DELETE — remove diagram
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.diagram.findFirst({ where: { id: params.id, userId: uid } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.diagram.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
