import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    console.error("[payment/create-order] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing");
    return NextResponse.json({ error: "Payment gateway misconfigured" }, { status: 500 });
  }

  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan: planSlugRaw = "plan_twelvemonth" } = await req.json().catch(() => ({}));

  // Normalise: accept bare id ("twelvemonth") or full slug ("plan_twelvemonth")
  const planSlug = planSlugRaw.startsWith("plan_") ? planSlugRaw : `plan_${planSlugRaw}`;

  // All plan config (price, months, name) comes from the DB — no hardcoded values
  const planConfig = await prisma.planConfig.findUnique({ where: { slug: planSlug } });
  if (!planConfig || !planConfig.active) {
    return NextResponse.json({ error: "Invalid or inactive plan" }, { status: 400 });
  }
  if (!planConfig.priceInr) {
    return NextResponse.json({ error: "Plan has no price configured" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { email: true },
  });

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  const amountPaise = planConfig.priceInr * 100;
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: `lld_${uid.slice(0, 8)}_${Date.now()}`,
    notes: { userId: uid, email: user?.email ?? "", plan: planSlug },
  });

  await prisma.razorpayOrder.create({
    data: {
      razorpayId: order.id,
      userId: uid,
      planSlug,
      amountInr: planConfig.priceInr,
    },
  });

  return NextResponse.json({
    orderId:  order.id,
    amount:   amountPaise,
    currency: "INR",
    plan:     planSlug,
    planName: planConfig.name,
    keyId,
  });
}
