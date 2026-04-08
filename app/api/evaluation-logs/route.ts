import { NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";

const MAX_ROWS = 200;

/** All AI evaluation logs for the current user (newest first), for cross-problem revision. */
export async function GET() {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await prisma.evaluationLog.findMany({
    where: { userId: uid },
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    select: {
      id: true,
      problemId: true,
      code: true,
      language: true,
      score: true,
      feedback: true,
      modelUsed: true,
      createdAt: true,
    },
  });

  return NextResponse.json(logs);
}
