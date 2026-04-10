-- DBs that already had payments from an older 20260417130000 (no invoiceId): add column + index.
-- Fresh installs get invoiceId from 20260417130000; these statements are no-ops there (IF NOT EXISTS).
ALTER TABLE "public"."payments" ADD COLUMN IF NOT EXISTS "invoiceId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "payments_invoiceId_key" ON "public"."payments"("invoiceId");
