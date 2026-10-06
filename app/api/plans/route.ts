import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveOffer, priceWithOffer } from "@/lib/offers";

export const dynamic = "force-dynamic";

/**
 * Returns all active purchasable plan configs from DB (with features),
 * plus a static free tier entry. Falls back to PLANS static config if DB is unavailable.
 */
export async function GET() {
  try {
    const [dbPlans, offer] = await Promise.all([
      prisma.planConfig.findMany({
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
      }),
      getActiveOffer(),
    ]);

    const plans = dbPlans.map((p) => ({
      id: p.slug.replace("plan_", ""),
      slug: p.slug,
      name: p.name,
      priceInr: priceWithOffer(p.priceInr, offer),
      // originalPrice: back-calculated from discountPct so priceInr is always the final price
      originalPriceInr: offer && p.priceInr
        ? p.priceInr
        : p.discountPct && p.priceInr
        ? Math.round(p.priceInr / (1 - p.discountPct / 100))
        : null,
      discountPct: offer?.discountPct ?? p.discountPct,
      offerName: offer?.name ?? null,
      offerEndsAt: offer?.endsAt.toISOString() ?? null,
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
