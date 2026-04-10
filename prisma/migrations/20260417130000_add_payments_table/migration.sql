-- Clean up User table: remove payment fields that now live in payments table
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "razorpayPaymentId";
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "razorpayOrderId";
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "planType";
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "paidAt";

-- Payments table: one row per payment, never overwritten
CREATE TABLE "public"."payments" (
    "id"                TEXT NOT NULL,
    "userId"            TEXT NOT NULL,
    "planConfigId"      TEXT NOT NULL,
    "razorpayOrderId"   TEXT NOT NULL,
    "razorpayPaymentId" TEXT NOT NULL,
    "invoiceId"         TEXT,
    "amountInr"         INTEGER NOT NULL,
    "paidAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_razorpayOrderId_key"   ON "public"."payments"("razorpayOrderId");
CREATE UNIQUE INDEX "payments_razorpayPaymentId_key" ON "public"."payments"("razorpayPaymentId");
CREATE UNIQUE INDEX "payments_invoiceId_key" ON "public"."payments"("invoiceId");

ALTER TABLE "public"."payments"
    ADD CONSTRAINT "payments_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."payments"
    ADD CONSTRAINT "payments_planConfigId_fkey"
    FOREIGN KEY ("planConfigId") REFERENCES "public"."plan_configs"("id") ON UPDATE CASCADE;
