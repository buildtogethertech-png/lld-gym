-- PlanConfig table — stores per-tier limits and pricing
CREATE TABLE "public"."plan_configs" (
    "id"            TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "slug"          TEXT NOT NULL,
    "evalTotal"     INTEGER,
    "evalHourly"    INTEGER,
    "evalDaily"     INTEGER,
    "evalMonthly"   INTEGER,
    "umlDiagrams"   INTEGER NOT NULL,
    "noteMaxLength" INTEGER NOT NULL,
    "problemsCount" INTEGER,
    "priceInr"      INTEGER,
    "months"        INTEGER,
    "tag"           TEXT,
    "active"        BOOLEAN NOT NULL DEFAULT true,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plan_configs_slug_key" ON "public"."plan_configs"("slug");

-- Add planId to users (nullable — null treated as free in code)
ALTER TABLE "public"."users" ADD COLUMN "planId" TEXT;

ALTER TABLE "public"."users"
    ADD CONSTRAINT "users_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "public"."plan_configs"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default plans
INSERT INTO "public"."plan_configs"
    ("id", "name", "slug", "evalTotal", "evalHourly", "evalDaily", "evalMonthly",
     "umlDiagrams", "noteMaxLength", "problemsCount", "priceInr", "months", "tag", "active", "updatedAt")
VALUES
    (gen_random_uuid()::text, 'Free',      'free',             2,    NULL, NULL, NULL,  2,   8000, 5,    NULL, NULL, NULL,          true, NOW()),
    (gen_random_uuid()::text, 'Pro',       'paid',             NULL, 2,    20,   100,   100, 8000, NULL, NULL, NULL, NULL,          true, NOW()),
    (gen_random_uuid()::text, '1 Month',   'plan_onemonth',    NULL, 2,    20,   100,   100, 8000, NULL, 299,  1,    NULL,          true, NOW()),
    (gen_random_uuid()::text, '3 Months',  'plan_threemonth',  NULL, 2,    20,   100,   100, 8000, NULL, 499,  3,    'RECOMMENDED', true, NOW()),
    (gen_random_uuid()::text, '12 Months', 'plan_twelvemonth', NULL, 2,    20,   100,   100, 8000, NULL, 999,  12,   NULL,          true, NOW());

-- Backfill existing paid users → paid plan
UPDATE "public"."users"
SET "planId" = (SELECT "id" FROM "public"."plan_configs" WHERE "slug" = 'paid')
WHERE "isPaid" = true AND "planId" IS NULL;

-- Backfill remaining users → free plan
UPDATE "public"."users"
SET "planId" = (SELECT "id" FROM "public"."plan_configs" WHERE "slug" = 'free')
WHERE "planId" IS NULL;
