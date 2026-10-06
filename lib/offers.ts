import { prisma } from "@/lib/prisma";

export type ActiveOffer = {
  name: string;
  discountPct: number;
  startsAt: Date;
  endsAt: Date;
};

/** Returns the current global offer only while it is enabled and inside its date window. */
export async function getActiveOffer(now = new Date()): Promise<ActiveOffer | null> {
  try {
    const [offer] = await prisma.$queryRaw<ActiveOffer[]>`
      SELECT "name", "discountPct", "startsAt", "endsAt"
      FROM "offer_configs"
      WHERE "active" = true
        AND "startsAt" <= ${now}
        AND "endsAt" > ${now}
      ORDER BY "startsAt" DESC
      LIMIT 1
    `;

    return offer ?? null;
  } catch (error) {
    // Keep regular pricing available until the offer migration is applied.
    console.warn("[offers] no active offer available", error);
    return null;
  }
}

export function priceWithOffer(regularPriceInr: number | null, offer: ActiveOffer | null): number | null {
  if (regularPriceInr == null || !offer) return regularPriceInr;
  return Math.max(1, Math.round(regularPriceInr * (1 - offer.discountPct / 100)));
}
