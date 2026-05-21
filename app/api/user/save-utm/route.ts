import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { utmSource, utmMedium, utmCampaign } = await req.json();

  // Only save if not already set (preserve first-touch attribution)
  const user = await prisma.user.findUnique({ where: { id: uid }, select: { utmSource: true } });
  if (user?.utmSource) return NextResponse.json({ ok: true }); // already attributed

  await prisma.user.update({
    where: { id: uid },
    data: {
      utmSource: utmSource ?? null,
      utmMedium: utmMedium ?? null,
      utmCampaign: utmCampaign ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
