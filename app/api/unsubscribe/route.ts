import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/unsubscribe?status=invalid", req.url));
  }

  const userId = verifyUnsubscribeToken(token);
  if (!userId) {
    return NextResponse.redirect(new URL("/unsubscribe?status=invalid", req.url));
  }

  await prisma.user.update({
    where: { id: userId },
    data: { emailUnsubscribed: true },
  });

  return NextResponse.redirect(new URL("/unsubscribe?status=done", req.url));
}
