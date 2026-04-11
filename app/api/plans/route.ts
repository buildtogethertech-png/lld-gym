import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Returns all active purchasable plan configs from DB (with features),
 * plus a static free tier entry. Falls back to PLANS static config if DB is unavailable.
 */
export async function GET() {
  try {
    const dbPlans = await prisma.planConfig.findMany({
      where: { active: true},
      orderBy: {
        months: {
          sort: "asc",
          nulls: "first"
        }
      },
 
      select: {
        id: true,
        slug: true,
        name: true,
        priceInr: true,
        discountPct: true,
        months: true,
        tag: true,
        features: true,
      },
    });

    const plans = dbPlans.map((p) => ({
      id: p.slug.replace("plan_", ""),
      slug: p.slug,
      name: p.name,
      priceInr: p.priceInr,
      // originalPrice: back-calculated from discountPct so priceInr is always the final price
      originalPriceInr: p.discountPct && p.priceInr
        ? Math.round(p.priceInr / (1 - p.discountPct / 100))
        : null,
      discountPct: p.discountPct,
      months: p.months,
      tag: p.tag,
      features: p.features,
      featureLabels: p.features,
    }));

    return NextResponse.json({ plans });
  } catch (e) {
    console.error("[api/plans] DB error, falling back to static", e);
  }
}
