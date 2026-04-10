/**
 * Receipt invoice number stored on `Payment` and shown on the customer email.
 * Deterministic from Razorpay payment id so support can match gateway ↔ DB.
 */
export function paymentInvoiceId(razorpayPaymentId: string): string {
  const cleaned = razorpayPaymentId.replace(/[^a-zA-Z0-9]/g, "");
  const tail = (cleaned.length > 0 ? cleaned : razorpayPaymentId).slice(-10).toUpperCase();
  return `INV-${tail || "UNKNOWN"}`;
}
