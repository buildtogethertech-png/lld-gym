import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";

const UNLOCK_SCORE = 80;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if this user has scored 80+ on this problem
  const mySubmission = await prisma.submission.findUnique({
    where: { userId_problemId: { userId: uid, problemId: params.id } },
    select: { score: true },
  });

  if (!mySubmission || (mySubmission.score ?? 0) < UNLOCK_SCORE) {
    return NextResponse.json({ locked: true, requiredScore: UNLOCK_SCORE });
  }

  // Fetch all submissions >= 80 for this problem, excluding current user
  const solutions = await prisma.submission.findMany({
    where: {
      problemId: params.id,
      score: { gte: UNLOCK_SCORE },
      userId: { not: uid },
    },
    select: {
      id: true,
      score: true,
      answer: true,
      feedback: true,
      updatedAt: true,
      user: { select: { name: true } },
    },
    orderBy: { score: "desc" },
    take: 50,
  });

  return NextResponse.json({ locked: false, solutions });
}
