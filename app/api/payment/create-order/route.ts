import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";
import { PLAN_MAP } from "@/lib/plans";
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

  const { plan: planId = "twelvemonth" } = await req.json().catch(() => ({}));
  const plan = PLAN_MAP[planId];
  if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { email: true },
  });

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  const order = await razorpay.orders.create({
    amount: plan.amountPaise,
    currency: "INR",
    receipt: `lld_${uid.slice(0, 8)}_${Date.now()}`,
    notes: { userId: uid, email: user?.email ?? "", plan: planId },
  });

  await prisma.razorpayOrder.create({
    data: {
      razorpayId: order.id,
      userId: uid,
      planSlug: `plan_${planId}`,
      amountInr: plan.price,
    },
  });

  return NextResponse.json({
    orderId: order.id,
    amount: plan.amountPaise,
    currency: "INR",
    plan: planId,
    keyId,
  });
}
