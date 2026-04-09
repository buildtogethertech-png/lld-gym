import { NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";

const MAX_LENGTH = 1500;

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

  const trimmed = content.slice(0, MAX_LENGTH);

  const note = await prisma.topicNote.upsert({
    where: { userId_topicId: { userId: uid, topicId: params.topicId } },
    create: { userId: uid, topicId: params.topicId, content: trimmed },
    update: { content: trimmed },
  });

  return NextResponse.json({ content: note.content, updatedAt: note.updatedAt });
}
