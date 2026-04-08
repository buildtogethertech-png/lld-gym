import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { problemId: string } }
) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await prisma.evaluationLog.findMany({
    where: { userId: uid, problemId: params.problemId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
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
