import { NextResponse } from "next/server";
import { getActiveOffer } from "@/lib/offers";

export const dynamic = "force-dynamic";

export async function GET() {
  const offer = await getActiveOffer();
  return NextResponse.json({
    offer: offer
      ? { name: offer.name, discountPct: offer.discountPct, endsAt: offer.endsAt.toISOString() }
      : null,
  });
}
