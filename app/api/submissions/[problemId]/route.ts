import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";



export async function GET(
  req: NextRequest,
  { params }: { params: { problemId: string } }
) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const submission = await prisma.submission.findUnique({
    where: { userId_problemId: { userId: uid, problemId: params.problemId } },
  });

  return NextResponse.json(submission ?? null);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { problemId: string } }
) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { answer, completed, score, feedback } = await req.json();

  const submission = await prisma.submission.upsert({
    where: { userId_problemId: { userId: uid, problemId: params.problemId } },
    update: { answer, completed, score: score ?? null, feedback: feedback ?? null },
    create: { userId: uid, problemId: params.problemId, answer, completed, score: score ?? null, feedback: feedback ?? null },
  });

  return NextResponse.json(submission);
}
