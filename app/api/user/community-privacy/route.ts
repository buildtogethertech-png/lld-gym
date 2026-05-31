import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { hideSolutionFromCommunity: true },
  });
  return NextResponse.json({ hideSolutionFromCommunity: user?.hideSolutionFromCommunity ?? false });
}

export async function POST(req: NextRequest) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { hideSolutionFromCommunity } = await req.json();
  await prisma.user.update({
    where: { id: uid },
    data: { hideSolutionFromCommunity: Boolean(hideSolutionFromCommunity) },
  });
  return NextResponse.json({ ok: true });
}
