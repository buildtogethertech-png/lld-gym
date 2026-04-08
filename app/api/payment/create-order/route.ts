import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";
import { PLAN_MAP } from "@/lib/plans";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan: planId = "twelvemonth" } = await req.json().catch(() => ({}));
  const plan = PLAN_MAP[planId];
  if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { email: true },
  });

  const order = await razorpay.orders.create({
    amount: plan.amountPaise,
    currency: "INR",
    receipt: `lld_${uid.slice(0, 8)}_${Date.now()}`,
    notes: { userId: uid, email: user?.email ?? "", plan: planId },
  });

  return NextResponse.json({ orderId: order.id, amount: plan.amountPaise, currency: "INR", plan: planId });
}
