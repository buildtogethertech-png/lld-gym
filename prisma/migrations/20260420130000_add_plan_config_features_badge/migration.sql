-- plan_configs.features: TEXT[] of feature keys (optional; default empty)
-- plan_configs.badge: short label e.g. FREE / PRO (optional)
ALTER TABLE "public"."plan_configs"
  ADD COLUMN IF NOT EXISTS "features" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "badge" TEXT;
