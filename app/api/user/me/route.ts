import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";
import { hasActivePaidPlan } from "@/lib/eval-limits-config";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { isPaid: true, planType: true, planExpiry: true, paidAt: true, email: true, name: true },
  });

  if (!user) {
    return NextResponse.json(
      { isPaid: false, planExpired: false },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  }

  const planAccessActive = hasActivePaidPlan(user);
  const planExpired = user.isPaid && !planAccessActive;

  return NextResponse.json(
    {
      email: user.email,
      name: user.name,
      paidAt: user.paidAt,
      planType: user.planType,
      planExpiry: user.planExpiry,
      /** True only while subscription is valid (respects planExpiry). */
      isPaid: planAccessActive,
      /** Had a paid row but planExpiry is in the past — show renew UI. */
      planExpired,
    },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } }
  );
}
