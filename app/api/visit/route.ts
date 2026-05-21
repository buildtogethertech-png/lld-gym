import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUid } from "@/lib/get-uid";

export async function POST(req: NextRequest) {
  try {
    const { utmSource, utmMedium, utmCampaign, landingPage } = await req.json();

    // Only log if there's at least a utm_source — skip anonymous organic visits
    if (!utmSource) return NextResponse.json({ ok: true });

    const userId = await getUid().catch(() => null);

    await prisma.visitLog.create({
      data: {
        utmSource,
        utmMedium: utmMedium ?? null,
        utmCampaign: utmCampaign ?? null,
        landingPage: landingPage ?? null,
        userId: userId ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // never fail the page load
  }
}
