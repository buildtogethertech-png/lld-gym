CREATE TABLE "offer_configs" (
  "id" TEXT NOT NULL DEFAULT 'global',
  "name" TEXT NOT NULL,
  "discountPct" INTEGER NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "offer_configs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "offer_configs_discountPct_check" CHECK ("discountPct" BETWEEN 1 AND 99),
  CONSTRAINT "offer_configs_dates_check" CHECK ("endsAt" > "startsAt")
);

-- One ready-to-edit row so offers can be controlled entirely in Prisma Studio.
INSERT INTO "offer_configs" ("id", "name", "discountPct", "startsAt", "endsAt", "active", "updatedAt")
VALUES ('global', 'Diwali Offer', 50, NOW(), NOW() + INTERVAL '1 day', false, NOW());
