-- Nullable: no backfill; existing rows stay NULL; new payments set invoiceId in app code
ALTER TABLE "public"."payments" ADD COLUMN "invoiceId" TEXT;

CREATE UNIQUE INDEX "payments_invoiceId_key" ON "public"."payments"("invoiceId");
