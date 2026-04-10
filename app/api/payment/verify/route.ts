import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";
import { getPlanExpiry } from "@/lib/plans";
import { invalidatePlanCache } from "@/lib/plan-config";
import { notifyPurchaseReceipt } from "@/lib/purchase-receipt-email";
import { paymentInvoiceId } from "@/lib/payment-invoice-id";
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

    const razorpay_order_id   = body.razorpay_order_id   as string | undefined;
    const razorpay_payment_id = body.razorpay_payment_id as string | undefined;
    const razorpay_signature  = body.razorpay_signature  as string | undefined;
    const planSlugRaw         = (body.plan as string | undefined) ?? "plan_twelvemonth";
    const planSlug            = planSlugRaw.startsWith("plan_") ? planSlugRaw : `plan_${planSlugRaw}`;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing Razorpay fields (order id, payment id, or signature)." },
        { status: 400 }
      );
    }

    // Verify HMAC signature
    const sigPayload  = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedHex = crypto.createHmac("sha256", secret).update(sigPayload).digest("hex");
    const receivedHex = String(razorpay_signature).trim().toLowerCase();
    if (expectedHex !== receivedHex) {
      console.error("[payment/verify] HMAC mismatch");
      return NextResponse.json(
        { error: "Payment signature verification failed. Access not granted." },
        { status: 400 }
      );
    }

    // Same payment may be confirmed via webhook first — avoid duplicate row + duplicate email
    const already = await prisma.payment.findUnique({
      where: { razorpayPaymentId: razorpay_payment_id },
    });
    if (already) {
      return NextResponse.json({ ok: true, alreadyProcessed: true });
    }

    // All plan config comes from DB — no hardcoded PLAN_MAP
    const planConfig = await prisma.planConfig.findUnique({ where: { slug: planSlug } })
                    ?? await prisma.planConfig.findUnique({ where: { slug: "paid" } });
    if (!planConfig) return NextResponse.json({ error: "Plan config not found." }, { status: 500 });
    if (!planConfig.months) return NextResponse.json({ error: "Plan has no duration configured." }, { status: 500 });

    const planExpiry = getPlanExpiry(planConfig.months);
    const amountInr  = planConfig.priceInr ?? 0;

    invalidatePlanCache();

    await prisma.user.update({
      where: { id: uid },
      data: { isPaid: true, planExpiry, planId: planConfig.id },
    });

    const invoiceId = paymentInvoiceId(razorpay_payment_id);
    await prisma.payment.create({
      data: {
        userId:            uid,
        planConfigId:      planConfig.id,
        razorpayOrderId:   razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        invoiceId,
        amountInr,
      },
    });

    try {
      await prisma.webhookLog.create({
        data: {
          source:   "checkout_verify",
          event:    "payment.verified",
          sigValid: true,
          payload:  JSON.stringify({
            razorpay_order_id,
            razorpay_payment_id,
            invoiceId,
            planSlug,
            userId: uid,
            amountInr,
          }),
        },
      });
    } catch (logErr) {
      console.warn("[payment/verify] webhook_logs audit row failed (payment still saved)", logErr);
    }

    void notifyPurchaseReceipt({
      userId:            uid,
      planName:          planConfig.name,
      amountInr,
      invoiceId,
      razorpayOrderId:   razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[payment/verify] unexpected", e);
    return NextResponse.json({ error: "Database or server error while saving your plan." }, { status: 500 });
  }
}
