import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";
import { needsPhone, normalizePhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function GET() {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { phone: true },
  });

  return NextResponse.json({
    phone: user?.phone ?? null,
    needsPhone: needsPhone(user),
    communityUrl: process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL?.trim() || null,
  });
}

export async function POST(req: NextRequest) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const phone = typeof body.phone === "string" ? normalizePhone(body.phone) : null;
  if (!phone) {
    return NextResponse.json(
      { error: "Enter a valid 10-digit Indian mobile number" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: uid },
    data: { phone },
  });

  return NextResponse.json({
    ok: true,
    phone,
    communityUrl: process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL?.trim() || null,
  });
}
