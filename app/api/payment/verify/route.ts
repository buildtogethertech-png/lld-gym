import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";
import { PLAN_MAP, getPlanExpiry } from "@/lib/plans";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const uid = await getUid();
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized — sign in again, then pay." }, { status: 401 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!secret) {
      console.error("[payment/verify] RAZORPAY_KEY_SECRET is missing");
      return NextResponse.json(
        { error: "Server missing Razorpay secret — verification cannot run." },
        { status: 500 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const razorpay_order_id = body.razorpay_order_id as string | undefined;
    const razorpay_payment_id = body.razorpay_payment_id as string | undefined;
    const razorpay_signature = body.razorpay_signature as string | undefined;
    const planId = (body.plan as string | undefined) ?? "twelvemonth";

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing Razorpay fields (order id, payment id, or signature)." },
        { status: 400 }
      );
    }

    const sigPayload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedHex = crypto.createHmac("sha256", secret).update(sigPayload).digest("hex");
    const receivedHex = String(razorpay_signature).trim().toLowerCase();
    const sigOk = expectedHex.length === receivedHex.length && expectedHex === receivedHex;

    if (!sigOk) {
      console.error(
        "[payment/verify] HMAC mismatch — RAZORPAY_KEY_SECRET must match the same Mode (test/live) and key as RAZORPAY_KEY_ID / NEXT_PUBLIC_RAZORPAY_KEY_ID"
      );
      return NextResponse.json(
        {
          error:
            "Payment signature failed on our server. Razorpay may show the charge, but access is not updated until this passes. Fix: use the Key Secret from the same Razorpay app and mode (test vs live) as your Key ID in .env.",
        },
        { status: 400 }
      );
    }

    const plan = PLAN_MAP[planId];
    if (!plan) return NextResponse.json({ error: "Invalid plan id." }, { status: 400 });

    const planExpiry = getPlanExpiry(plan);

    await prisma.user.update({
      where: { id: uid },
      data: {
        isPaid: true,
        planType: planId,
        planExpiry,
        paidAt: new Date(),
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[payment/verify] unexpected", e);
    return NextResponse.json({ error: "Database or server error while saving your plan." }, { status: 500 });
  }
}
