import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const REMINDER_DELAY_MS = 24 * 60 * 60 * 1000;

type CommunityStatus = {
  phone: string | null;
  joinedAt: Date | null;
  reminderAt: Date | null;
};

export async function GET() {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await prisma.$queryRaw<CommunityStatus[]>`
    SELECT
      "phone",
      "discordCommunityJoinedAt" AS "joinedAt",
      "discordCommunityReminderAt" AS "reminderAt"
    FROM "users"
    WHERE "id" = ${uid}
    LIMIT 1
  `;

  const now = new Date();
  const shouldShow = Boolean(
      user?.phone &&
      !user.joinedAt &&
      (!user.reminderAt || user.reminderAt <= now)
  );

  return NextResponse.json({ shouldShow });
}

export async function POST(req: NextRequest) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = body.action;

  if (action === "joined") {
    await prisma.$executeRaw`
      UPDATE "users"
      SET "discordCommunityJoinedAt" = ${new Date()}, "discordCommunityReminderAt" = NULL
      WHERE "id" = ${uid}
    `;
    return NextResponse.json({ ok: true });
  }

  if (action === "not_joined") {
    await prisma.$executeRaw`
      UPDATE "users"
      SET "discordCommunityReminderAt" = ${new Date(Date.now() + REMINDER_DELAY_MS)}
      WHERE "id" = ${uid}
    `;
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
