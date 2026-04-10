import { NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/plan-config";

export async function GET(_req: Request, { params }: { params: { topicId: string } }) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ content: "" });

  const note = await prisma.topicNote.findUnique({
    where: { userId_topicId: { userId: uid, topicId: params.topicId } },
    select: { content: true, updatedAt: true },
  });

  return NextResponse.json(note ?? { content: "" });
}

export async function PUT(req: Request, { params }: { params: { topicId: string } }) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (typeof content !== "string") return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: uid }, select: { isPaid: true, planId: true, planExpiry: true } });
  const plan = await getEffectivePlan({ planId: user?.planId ?? null, planExpiry: user?.planExpiry ?? null, isPaid: user?.isPaid ?? false });
  const trimmed = content.slice(0, plan.noteMaxLength);

  const note = await prisma.topicNote.upsert({
    where: { userId_topicId: { userId: uid, topicId: params.topicId } },
    create: { userId: uid, topicId: params.topicId, content: trimmed },
    update: { content: trimmed },
  });

  return NextResponse.json({ content: note.content, updatedAt: note.updatedAt });
}
