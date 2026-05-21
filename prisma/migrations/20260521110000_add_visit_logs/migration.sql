CREATE TABLE IF NOT EXISTS "public"."visit_logs" (
  "id"          TEXT NOT NULL,
  "utmSource"   TEXT,
  "utmMedium"   TEXT,
  "utmCampaign" TEXT,
  "landingPage" TEXT,
  "userId"      TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "visit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "visit_logs_utmSource_idx" ON "public"."visit_logs"("utmSource");
CREATE INDEX IF NOT EXISTS "visit_logs_createdAt_idx" ON "public"."visit_logs"("createdAt");
