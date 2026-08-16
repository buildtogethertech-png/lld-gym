import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getFreePlan } from "@/lib/plan-config";
import { normalizePhone } from "@/lib/phone";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, phone: rawPhone, utmSource, utmMedium, utmCampaign } =
      await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const phone = typeof rawPhone === "string" ? normalizePhone(rawPhone) : null;
    if (!phone) {
      return NextResponse.json(
        { error: "Enter a valid 10-digit Indian mobile number" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.provider === "google") {
        return NextResponse.json(
          { error: "This email is linked to Google. Sign in with Google instead." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const freePlan = await getFreePlan();
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashed,
        provider: "credentials",
        phone,
        planId: freePlan.id,
        utmSource: utmSource ?? null,
        utmMedium: utmMedium ?? null,
        utmCampaign: utmCampaign ?? null,
      },
    });

    return NextResponse.json({ id: user.id, email: user.email, phone }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
