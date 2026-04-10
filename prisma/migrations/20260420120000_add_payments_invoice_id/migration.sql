-- payments.invoiceId (nullable @unique in Prisma) — receipt / support lookup
ALTER TABLE "public"."payments" ADD COLUMN IF NOT EXISTS "invoiceId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "payments_invoiceId_key" ON "public"."payments"("invoiceId");
