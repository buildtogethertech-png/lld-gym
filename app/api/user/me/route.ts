import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan, getFreePlan, getPaidPlan } from "@/lib/plan-config";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { isPaid: true, planExpiry: true, planId: true, email: true, name: true },
  });

  if (!user) {
    const free = await getFreePlan();
    const paidRef = await getPaidPlan();
    return NextResponse.json(
      {
        isPaid: false,
        planExpired: false,
        problemsCount: free.problemsCount ?? null,
        planSlug: free.slug,
        planName: free.name,
        umlDiagrams: free.umlDiagrams,
        paidUmlDiagrams: paidRef.umlDiagrams,
        evalTotal: free.evalTotal,
        evalHourly: free.evalHourly,
        evalDaily: free.evalDaily,
        evalMonthly: free.evalMonthly,
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  }

  const plan = await getEffectivePlan({
    planId:    user.planId,
    planExpiry: user.planExpiry,
    isPaid:    user.isPaid,
  });

  const paidRef = await getPaidPlan();

  const planAccessActive = plan.slug !== "free";
  const planExpired = user.isPaid && !planAccessActive;

  return NextResponse.json(
    {
      email:         user.email,
      name:          user.name,
      planExpiry:    user.planExpiry,
      planName:      plan.name,
      planSlug:      plan.slug,
      isPaid:        planAccessActive,
      planExpired,
      problemsCount: plan.problemsCount ?? null,  // null = unlimited
      umlDiagrams:   plan.umlDiagrams,
      paidUmlDiagrams: paidRef.umlDiagrams,
      evalTotal:     plan.evalTotal,
      evalHourly:    plan.evalHourly,
      evalDaily:     plan.evalDaily,
      evalMonthly:   plan.evalMonthly,
    },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } }
  );
}
