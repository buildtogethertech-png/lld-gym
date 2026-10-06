import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";
import { getActiveOffer, priceWithOffer } from "@/lib/offers";

export async function POST(req: NextRequest) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan: planSlugRaw = "plan_twelvemonth" } = await req.json().catch(() => ({}));
  const planSlug = typeof planSlugRaw === "string" && planSlugRaw.startsWith("plan_")
    ? planSlugRaw
    : `plan_${planSlugRaw}`;

  const [user, planConfig, offer] = await Promise.all([
    prisma.user.findUnique({ where: { id: uid }, select: { name: true, email: true, phone: true } }),
    prisma.planConfig.findUnique({ where: { slug: planSlug } }),
    getActiveOffer(),
  ]);

  if (!user || !planConfig?.active) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const amountInr = priceWithOffer(planConfig.priceInr, offer);
  if (!amountInr) return NextResponse.json({ error: "Plan has no price configured" }, { status: 400 });

  await prisma.$executeRaw`
    INSERT INTO "purchase_intents"
      ("id", "userId", "name", "email", "phone", "planSlug", "amountInr", "offerName")
    VALUES
      (${randomUUID()}, ${uid}, ${user.name}, ${user.email}, ${user.phone}, ${planSlug}, ${amountInr}, ${offer?.name ?? null})
  `;

  return NextResponse.json({ ok: true });
}
