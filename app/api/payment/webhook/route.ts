import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLAN_MAP, getPlanExpiry } from "@/lib/plans";
import { invalidatePlanCache } from "@/lib/plan-config";
import { notifyPurchaseReceipt } from "@/lib/purchase-receipt-email";
import { paymentInvoiceId } from "@/lib/payment-invoice-id";
import crypto from "crypto";

/** Prisma + Node crypto; avoid Edge. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Razorpay / browsers may probe the URL; 200 helps dashboard “reachable” checks. */
export async function GET() {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? "";
  return NextResponse.json({
    ok: true,
    service: "razorpay-webhook",
    postTo: "/api/payment/webhook",
    secretConfigured: secret.length > 0,
    hint:
      "Register the full HTTPS URL in Razorpay → Webhooks (enable payment.captured). Local dev needs ngrok/cloudflared — Razorpay cannot POST to localhost.",
  });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? "";

  console.info("[webhook] POST", rawBody.length, "bytes", { hasSignature: Boolean(signature) });

  // Verify signature (raw body must match what Razorpay signed)
  const expectedHex = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const sigValid = secret.length > 0 && expectedHex === signature;

  let payload: Record<string, unknown> = {};
  let event: string | undefined;
  try {
    payload = JSON.parse(rawBody);
    event = payload.event as string | undefined;
  } catch {
    // malformed body — still log it
  }

  try {
    await prisma.webhookLog.create({
      data: { event: event ?? null, payload: rawBody, sigValid },
    });
  } catch (e) {
    console.error("[webhook] WebhookLog insert failed — run migrations on this DATABASE_URL?", e);
    return NextResponse.json({ received: false, error: "log_persist_failed" }, { status: 500 });
  }

  if (!sigValid) {
    console.warn("[webhook] invalid signature — logged but not processed (check RAZORPAY_WEBHOOK_SECRET vs dashboard)");
    return NextResponse.json({ received: true, processed: false });
  }

  if (event === "payment.captured") {
    try {
      const paymentEntity = (payload.payload as Record<string, unknown>)?.payment as Record<string, unknown> | undefined;
      const entity = paymentEntity?.entity as Record<string, unknown> | undefined;

      const razorpayPaymentId = entity?.id as string | undefined;
      const razorpayOrderId = entity?.order_id as string | undefined;

      if (!razorpayOrderId || !razorpayPaymentId) {
        console.error("[webhook] payment.captured missing order_id or payment id");
        return NextResponse.json({ received: true, processed: false });
      }

      const existing = await prisma.payment.findUnique({ where: { razorpayPaymentId } });
      if (existing) {
        return NextResponse.json({ received: true, processed: false, reason: "already processed" });
      }

      const order = await prisma.razorpayOrder.findUnique({ where: { razorpayId: razorpayOrderId } });
      if (!order) {
        console.error("[webhook] RazorpayOrder not found for", razorpayOrderId);
        return NextResponse.json({ received: true, processed: false, reason: "order not found" });
      }

      const planConfig =
        (await prisma.planConfig.findUnique({ where: { slug: order.planSlug } })) ??
        (await prisma.planConfig.findUnique({ where: { slug: "paid" } }));
      if (!planConfig) {
        console.error("[webhook] PlanConfig not found for slug", order.planSlug);
        return NextResponse.json({ received: true, processed: false });
      }

      const planKey = order.planSlug.replace("plan_", "");
      const plan = PLAN_MAP[planKey];
      const planExpiry = plan ? getPlanExpiry(plan) : null;

      invalidatePlanCache();

      await prisma.user.update({
        where: { id: order.userId },
        data: { isPaid: true, planExpiry, planId: planConfig.id },
      });

      const invoiceId = paymentInvoiceId(razorpayPaymentId);
      await prisma.payment.create({
        data: {
          userId: order.userId,
          planConfigId: planConfig.id,
          razorpayOrderId,
          razorpayPaymentId,
          invoiceId,
          amountInr: order.amountInr,
        },
      });

      void notifyPurchaseReceipt({
        userId: order.userId,
        planName: planConfig.name,
        amountInr: order.amountInr,
        invoiceId,
        razorpayOrderId,
        razorpayPaymentId,
      });

      console.log("[webhook] payment.captured processed for user", order.userId);
    } catch (e) {
      console.error("[webhook] error processing payment.captured", e);
      return NextResponse.json({ received: true, processed: false }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true, processed: true });
}
