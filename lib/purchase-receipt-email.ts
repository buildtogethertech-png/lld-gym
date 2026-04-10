import { prisma } from "@/lib/prisma";
import { sendPurchaseReceiptEmail } from "@/lib/mailer";

/** Fire-and-forget welcome + HTML receipt after a Payment row is created. Logs on failure; never throws. */
export async function notifyPurchaseReceipt(params: {
  userId: string;
  planName: string;
  amountInr: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  /** Must match `Payment.invoiceId` (saved at create time). */
  invoiceId: string;
  paidAt?: Date;
}) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true, name: true },
    });
    if (!user?.email) {
      console.warn("[purchase-receipt-email] no email for user", params.userId);
      return;
    }
    await sendPurchaseReceiptEmail({
      to: user.email,
      customerName: user.name,
      planName: params.planName,
      amountInr: params.amountInr,
      invoiceId: params.invoiceId,
      razorpayPaymentId: params.razorpayPaymentId,
      razorpayOrderId: params.razorpayOrderId,
      paidAt: params.paidAt ?? new Date(),
    });
  } catch (e) {
    console.error("[purchase-receipt-email]", e);
  }
}
