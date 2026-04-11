-- Add discountPct column to plan_configs
-- discountPct: integer percentage e.g. 20 = "20% off"; null = no discount shown
-- priceInr is the FINAL (discounted) price; original is back-calculated as round(priceInr / (1 - discountPct/100))

ALTER TABLE "public"."plan_configs"
  ADD COLUMN IF NOT EXISTS "discountPct" INTEGER;
